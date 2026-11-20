import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const authUser = await verifyToken(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const doc = await prisma.designDoc.findFirst({
        where: { id: params.id, userId: authUser.uid },
        include: { teamSignals: true },
    });

    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(doc);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const authUser = await verifyToken(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { title, status, summary, sections, drift, driftFiles, linkedCommits, linkedDocIds } = body;

    const doc = await prisma.designDoc.updateMany({
        where: { id: params.id, userId: authUser.uid },
        data: {
            ...(title !== undefined && { title }),
            ...(status !== undefined && { status }),
            ...(summary !== undefined && { summary }),
            ...(sections !== undefined && { sections }),
            ...(drift !== undefined && { drift }),
            ...(driftFiles !== undefined && { driftFiles }),
            ...(linkedCommits !== undefined && { linkedCommits }),
            ...(linkedDocIds !== undefined && { linkedDocIds }),
        },
    });

    if (doc.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.designDoc.findUnique({
        where: { id: params.id },
        include: { teamSignals: true },
    });
    return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const authUser = await verifyToken(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.designDoc.deleteMany({ where: { id: params.id, userId: authUser.uid } });
    return NextResponse.json({ ok: true });
}
