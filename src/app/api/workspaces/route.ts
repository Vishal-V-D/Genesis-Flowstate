import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-server";
import { ddbDocClient } from "@/lib/aws-server";
import { QueryCommand, PutCommand, BatchGetCommand } from "@aws-sdk/lib-dynamodb";

const WORKSPACES_TABLE = "FlowstateWorkspaces";
const COLLABS_TABLE = "FlowstateUserWorkspaces";

export async function GET(req: NextRequest) {
    const authUser = await verifyToken(req);
    if (!authUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // 1. Fetch workspaces owned by the user (using GSI UserWorkspacesIndex)
        const ownerCommand = new QueryCommand({
            TableName: WORKSPACES_TABLE,
            IndexName: "UserWorkspacesIndex",
            KeyConditionExpression: "userId = :uid",
            ExpressionAttributeValues: {
                ":uid": authUser.uid,
            },
        });

        const ownerRes = await ddbDocClient.send(ownerCommand);
        const ownedWorkspaces = ownerRes.Items || [];

        // 2. Fetch workspaces where user is a collaborator
        const collabCommand = new QueryCommand({
            TableName: COLLABS_TABLE,
            KeyConditionExpression: "userId = :uid",
            ExpressionAttributeValues: {
                ":uid": authUser.uid,
            },
        });

        const collabRes = await ddbDocClient.send(collabCommand);
        const collabItems = collabRes.Items || [];

        // Exclude those the user already owns to avoid duplicates
        const joinedWorkspaceIds = collabItems
            .map((item) => item.workspaceId)
            .filter((id) => !ownedWorkspaces.some((w) => w.workspaceId === id));

        let joinedWorkspaces: any[] = [];

        // 3. Batch fetch details for joined workspaces if any exist
        if (joinedWorkspaceIds.length > 0) {
            // DynamoDB BatchGet limits to 100 items per call, which is plenty for list page pagination
            const keys = joinedWorkspaceIds.slice(0, 100).map((id) => ({ workspaceId: id }));
            const batchCommand = new BatchGetCommand({
                RequestItems: {
                    [WORKSPACES_TABLE]: {
                        Keys: keys,
                    },
                },
            });

            const batchRes = await ddbDocClient.send(batchCommand);
            joinedWorkspaces = batchRes.Responses?.[WORKSPACES_TABLE] || [];
        }

        // Combine all workspaces
        const allWorkspaces = [...ownedWorkspaces, ...joinedWorkspaces];

        // Sort by updatedAt descending
        allWorkspaces.sort((a, b) => {
            const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
            const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
            return timeB - timeA;
        });

        return NextResponse.json(allWorkspaces);
    } catch (error: any) {
        console.error("Error listing workspaces:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const authUser = await verifyToken(req);
    if (!authUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { workspaceId, title, subtitle } = body;

        if (!workspaceId) {
            return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });
        }

        const now = new Date().toISOString();
        const workspaceItem = {
            workspaceId,
            userId: authUser.uid,
            title: title || "Untitled Architecture",
            subtitle: subtitle || "Personal Workspace",
            elements: "[]",
            appState: "{}",
            shareMode: "public",
            editTokens: [],
            viewTokens: [],
            chats: [],
            createdAt: now,
            updatedAt: now,
        };

        // 1. Create the workspace in FlowstateWorkspaces
        const putWorkspace = new PutCommand({
            TableName: WORKSPACES_TABLE,
            Item: workspaceItem,
        });
        await ddbDocClient.send(putWorkspace);

        // 2. Also register the owner role in FlowstateUserWorkspaces join index
        const putCollab = new PutCommand({
            TableName: COLLABS_TABLE,
            Item: {
                userId: authUser.uid,
                workspaceId,
                role: "owner",
                title: title || "Untitled Architecture",
                updatedAt: now,
            },
        });
        await ddbDocClient.send(putCollab);

        return NextResponse.json(workspaceItem);
    } catch (error: any) {
        console.error("Error creating workspace:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
