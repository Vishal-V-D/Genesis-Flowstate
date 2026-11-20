import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

async function resolveAccess(
    workspaceId: string,
    uid: string,
    shareToken: string | null
): Promise<{ workspace: any; role: "owner" | "editor" | "viewer" } | null> {
    const workspace = await prisma.workspace.findUnique({ where: { workspaceId } });
    if (!workspace) return null;

    if (workspace.userId === uid) return { workspace, role: "owner" };

    const collab = await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId: uid, workspaceId } },
    });
    if (collab) return { workspace, role: collab.role as any };

    if (shareToken) {
        const editTokens = workspace.editTokens as string[];
        const viewTokens = workspace.viewTokens as string[];
        let role: "editor" | "viewer" | null = null;
        if (editTokens.includes(shareToken)) role = "editor";
        else if (viewTokens.includes(shareToken)) role = "viewer";

        if (role) {
            await prisma.workspaceMember.upsert({
                where: { userId_workspaceId: { userId: uid, workspaceId } },
                update: { role, title: workspace.title },
                create: { userId: uid, workspaceId, role, title: workspace.title },
            });
            return { workspace, role };
        }
    }

    return null;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const authUser = await verifyToken(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const shareToken = new URL(req.url).searchParams.get("token");

    try {
        const result = await resolveAccess(params.id, authUser.uid, shareToken);
        if (!result) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

        return NextResponse.json({
            ...result.workspace,
            userRole: result.role,
            isOwner: result.role === "owner",
        });
    } catch (error: any) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const authUser = await verifyToken(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const result = await resolveAccess(params.id, authUser.uid, null);
        if (!result) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
        if (result.role === "viewer") return NextResponse.json({ error: "Write permission denied" }, { status: 403 });

        const allowedKeys = ["elements", "appState", "title", "subtitle", "shareMode", "editTokens", "viewTokens", "chats"] as const;
        const updates: Record<string, any> = {};
        allowedKeys.forEach((key) => { if (body[key] !== undefined) updates[key] = body[key]; });

        if (Object.keys(updates).length === 0) return NextResponse.json({ message: "No updates provided" });

        const updated = await prisma.workspace.update({
            where: { workspaceId: params.id },
            data: updates,
        });

        if (body.title && result.workspace.title !== body.title) {
            await prisma.workspaceMember.updateMany({
                where: { userId: authUser.uid, workspaceId: params.id },
                data: { title: body.title },
            });
        }

        return NextResponse.json(updated);
    } catch (error: any) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const authUser = await verifyToken(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const workspace = await prisma.workspace.findUnique({ where: { workspaceId: params.id } });
        if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
        if (workspace.userId !== authUser.uid) return NextResponse.json({ error: "Delete permission denied" }, { status: 403 });

        await prisma.workspace.delete({ where: { workspaceId: params.id } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
