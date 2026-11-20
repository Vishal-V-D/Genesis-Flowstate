import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
    const authUser = await verifyToken(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const owned = await prisma.workspace.findMany({
            where: { userId: authUser.uid },
        });

        const memberships = await prisma.workspaceMember.findMany({
            where: { userId: authUser.uid },
            select: { workspaceId: true },
        });

        const ownedIds = new Set(owned.map((w) => w.workspaceId));
        const joinedIds = memberships
            .map((m) => m.workspaceId)
            .filter((id) => !ownedIds.has(id));

        const joined =
            joinedIds.length > 0
                ? await prisma.workspace.findMany({ where: { workspaceId: { in: joinedIds } } })
                : [];

        const all = [...owned, ...joined].sort(
            (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
        );

        return NextResponse.json(all);
    } catch (error: any) {
        console.error("Error listing workspaces:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const authUser = await verifyToken(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { workspaceId, title, subtitle } = body;
        if (!workspaceId) return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });

        // Ensure user record exists before creating workspace (FK constraint)
        await prisma.user.upsert({
            where: { userId: authUser.uid },
            update: {},
            create: { userId: authUser.uid, email: authUser.email },
        });

        const workspace = await prisma.workspace.create({
            data: {
                workspaceId,
                userId: authUser.uid,
                title: title || "Untitled Architecture",
                subtitle: subtitle || "Personal Workspace",
            },
        });

        await prisma.workspaceMember.create({
            data: {
                userId: authUser.uid,
                workspaceId,
                role: "owner",
                title: workspace.title,
            },
        });

        return NextResponse.json(workspace);
    } catch (error: any) {
        console.error("Error creating workspace:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
