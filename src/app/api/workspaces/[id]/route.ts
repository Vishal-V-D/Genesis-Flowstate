import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-server";
import { ddbDocClient } from "@/lib/aws-server";
import { GetCommand, PutCommand, DeleteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const WORKSPACES_TABLE = "FlowstateWorkspaces";
const COLLABS_TABLE = "FlowstateUserWorkspaces";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const authUser = await verifyToken(req);
    if (!authUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const shareToken = searchParams.get("token");

    try {
        // Fetch workspace
        const getWorkspace = new GetCommand({
            TableName: WORKSPACES_TABLE,
            Key: { workspaceId: params.id },
        });
        const wsRes = await ddbDocClient.send(getWorkspace);
        const workspace = wsRes.Item;

        if (!workspace) {
            return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
        }

        // Determine user access
        let hasAccess = false;
        let role: 'owner' | 'editor' | 'viewer' = 'viewer';

        if (workspace.userId === authUser.uid) {
            hasAccess = true;
            role = 'owner';
        } else {
            // Check if user is an existing collaborator
            const getCollab = new GetCommand({
                TableName: COLLABS_TABLE,
                Key: { userId: authUser.uid, workspaceId: params.id },
            });
            const collabRes = await ddbDocClient.send(getCollab);
            const collab = collabRes.Item;

            if (collab) {
                hasAccess = true;
                role = collab.role;
            } else if (shareToken) {
                // Validate share token
                const editTokens: string[] = workspace.editTokens || [];
                const viewTokens: string[] = workspace.viewTokens || [];

                if (editTokens.includes(shareToken)) {
                    hasAccess = true;
                    role = 'editor';
                    // Auto-join the user as collaborator
                    await ddbDocClient.send(new PutCommand({
                        TableName: COLLABS_TABLE,
                        Item: {
                            userId: authUser.uid,
                            workspaceId: params.id,
                            role: 'editor',
                            title: workspace.title,
                            updatedAt: new Date().toISOString(),
                        }
                    }));
                } else if (viewTokens.includes(shareToken)) {
                    hasAccess = true;
                    role = 'viewer';
                    // Auto-join the user as collaborator
                    await ddbDocClient.send(new PutCommand({
                        TableName: COLLABS_TABLE,
                        Item: {
                            userId: authUser.uid,
                            workspaceId: params.id,
                            role: 'viewer',
                            title: workspace.title,
                            updatedAt: new Date().toISOString(),
                        }
                    }));
                }
            }
        }

        if (!hasAccess) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        return NextResponse.json({
            ...workspace,
            userRole: role,
            isOwner: role === 'owner',
        });
    } catch (error: any) {
        console.error("Error fetching workspace details:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const authUser = await verifyToken(req);
    if (!authUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();

        // 1. Verify user's permission to update this workspace
        const getWorkspace = new GetCommand({
            TableName: WORKSPACES_TABLE,
            Key: { workspaceId: params.id },
        });
        const wsRes = await ddbDocClient.send(getWorkspace);
        const workspace = wsRes.Item;

        if (!workspace) {
            return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
        }

        let canWrite = workspace.userId === authUser.uid;
        if (!canWrite) {
            const getCollab = new GetCommand({
                TableName: COLLABS_TABLE,
                Key: { userId: authUser.uid, workspaceId: params.id },
            });
            const collabRes = await ddbDocClient.send(getCollab);
            canWrite = collabRes.Item?.role === 'owner' || collabRes.Item?.role === 'editor';
        }

        if (!canWrite) {
            return NextResponse.json({ error: "Write permission denied" }, { status: 403 });
        }

        // 2. Perform a partial update using UpdateExpression
        const updateFields: string[] = [];
        const expressionAttributeNames: Record<string, string> = {};
        const expressionAttributeValues: Record<string, any> = {};

        const allowedKeys = ["elements", "appState", "title", "subtitle", "shareMode", "editTokens", "viewTokens", "chats"];

        allowedKeys.forEach((key) => {
            if (body[key] !== undefined) {
                updateFields.push(`#${key} = :${key}`);
                expressionAttributeNames[`#${key}`] = key;
                expressionAttributeValues[`:${key}`] = body[key];
            }
        });

        if (updateFields.length === 0) {
            return NextResponse.json({ message: "No updates provided" });
        }

        // Always update the updatedAt timestamp
        updateFields.push("#updatedAt = :updatedAt");
        expressionAttributeNames["#updatedAt"] = "updatedAt";
        expressionAttributeValues[":updatedAt"] = new Date().toISOString();

        const updateCommand = new UpdateCommand({
            TableName: WORKSPACES_TABLE,
            Key: { workspaceId: params.id },
            UpdateExpression: `SET ${updateFields.join(", ")}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: "ALL_NEW",
        });

        const updateRes = await ddbDocClient.send(updateCommand);

        // 3. If title changed, sync it to FlowstateUserWorkspaces join table
        if (body.title && workspace.title !== body.title) {
            await ddbDocClient.send(new UpdateCommand({
                TableName: COLLABS_TABLE,
                Key: { userId: authUser.uid, workspaceId: params.id },
                UpdateExpression: "SET title = :title, updatedAt = :updatedAt",
                ExpressionAttributeValues: {
                    ":title": body.title,
                    ":updatedAt": new Date().toISOString(),
                }
            }));
        }

        return NextResponse.json(updateRes.Attributes);
    } catch (error: any) {
        console.error("Error updating workspace:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const authUser = await verifyToken(req);
    if (!authUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Fetch workspace to check ownership
        const getWorkspace = new GetCommand({
            TableName: WORKSPACES_TABLE,
            Key: { workspaceId: params.id },
        });
        const wsRes = await ddbDocClient.send(getWorkspace);
        const workspace = wsRes.Item;

        if (!workspace) {
            return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
        }

        if (workspace.userId !== authUser.uid) {
            return NextResponse.json({ error: "Delete permission denied" }, { status: 403 });
        }

        // Delete workspace
        await ddbDocClient.send(new DeleteCommand({
            TableName: WORKSPACES_TABLE,
            Key: { workspaceId: params.id },
        }));

        // Delete collab record for the owner
        await ddbDocClient.send(new DeleteCommand({
            TableName: COLLABS_TABLE,
            Key: { userId: authUser.uid, workspaceId: params.id },
        }));

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting workspace:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
