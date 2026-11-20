import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const authUser = await verifyToken(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tour = await prisma.codebaseTour.findFirst({
        where: { id: params.id, userId: authUser.uid },
        include: { stops: { orderBy: { order: "asc" } }, progress: { where: { userId: authUser.uid } } },
    });

    if (!tour) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(tour);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const authUser = await verifyToken(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    const tour = await prisma.codebaseTour.updateMany({
        where: { id: params.id, userId: authUser.uid },
        data: {
            ...(body.title !== undefined && { title: body.title }),
            ...(body.description !== undefined && { description: body.description }),
            ...(body.area !== undefined && { area: body.area }),
            ...(body.difficulty !== undefined && { difficulty: body.difficulty }),
            ...(body.status !== undefined && { status: body.status }),
            ...(body.repoId !== undefined && { repoId: body.repoId }),
        },
    });

    if (!tour.count) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.codebaseTour.findFirst({
        where: { id: params.id },
        include: { stops: { orderBy: { order: "asc" } }, progress: { where: { userId: authUser.uid } } },
    });

    return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const authUser = await verifyToken(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.codebaseTour.deleteMany({ where: { id: params.id, userId: authUser.uid } });
    return NextResponse.json({ ok: true });
}
