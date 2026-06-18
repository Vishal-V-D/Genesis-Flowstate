import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-server";
import { ddbDocClient } from "@/lib/aws-server";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const USERS_TABLE = "FlowstateUsers";

export async function GET(req: NextRequest) {
    const authUser = await verifyToken(req);
    if (!authUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const command = new GetCommand({
            TableName: USERS_TABLE,
            Key: { userId: authUser.uid },
        });

        const response = await ddbDocClient.send(command);
        if (!response.Item) {
            // Document doesn't exist yet, return a fallback with status 200 or 404.
            // Returning 200 with default fields is safer for automatic signup onboarding.
            return NextResponse.json({ userId: authUser.uid, email: authUser.email });
        }

        return NextResponse.json(response.Item);
    } catch (error: any) {
        console.error("Error reading user profile from DynamoDB:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    const authUser = await verifyToken(req);
    if (!authUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();

        // Ensure user is updating their own record
        const userData = {
            ...body,
            userId: authUser.uid,
            email: authUser.email, // enforce email verification integrity
            updatedAt: new Date().toISOString(),
        };

        const command = new PutCommand({
            TableName: USERS_TABLE,
            Item: userData,
        });

        await ddbDocClient.send(command);
        return NextResponse.json(userData);
    } catch (error: any) {
        console.error("Error writing user profile to DynamoDB:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
