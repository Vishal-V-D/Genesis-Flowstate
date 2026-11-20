import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string; stopId: string } }) {
    const authUser = await verifyToken(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify ownership via tour
    const tour = await prisma.codebaseTour.findFirst({ where: { id: params.id, userId: authUser.uid } });
    if (!tour) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();

    const stop = await prisma.tourStop.update({
        where: { id: params.stopId },
        data: {
            ...(body.title !== undefined && { title: body.title }),
            ...(body.filePath !== undefined && { filePath: body.filePath }),
            ...(body.narration !== undefined && { narration: body.narration }),
            ...(body.keyPoints !== undefined && { keyPoints: body.keyPoints }),
            ...(body.order !== undefined && { order: body.order }),
            ...(body.lineStart !== undefined && { lineStart: body.lineStart }),
            ...(body.lineEnd !== undefined && { lineEnd: body.lineEnd }),
        },
    });

    return NextResponse.json(stop);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string; stopId: string } }) {
    const authUser = await verifyToken(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tour = await prisma.codebaseTour.findFirst({ where: { id: params.id, userId: authUser.uid } });
    if (!tour) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.tourStop.delete({ where: { id: params.stopId } });
    return NextResponse.json({ ok: true });
}
