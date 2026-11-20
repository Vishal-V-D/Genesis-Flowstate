import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const authUser = await verifyToken(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tour = await prisma.codebaseTour.findFirst({ where: { id: params.id, userId: authUser.uid } });
    if (!tour) return NextResponse.json({ error: "Tour not found" }, { status: 404 });

    const body = await req.json();
    const { title, filePath, narration, keyPoints, lineStart, lineEnd } = body;

    if (!title || !filePath) return NextResponse.json({ error: "Missing title or filePath" }, { status: 400 });

    // Get the next order index
    const lastStop = await prisma.tourStop.findFirst({
        where: { tourId: params.id },
        orderBy: { order: "desc" },
    });
    const order = (lastStop?.order ?? 0) + 1;

    const stop = await prisma.tourStop.create({
        data: {
            tourId: params.id,
            order,
            title,
            filePath,
            narration: narration ?? "",
            keyPoints: keyPoints ?? [],
            lineStart: lineStart ?? null,
            lineEnd: lineEnd ?? null,
        },
    });

    return NextResponse.json(stop);
}
