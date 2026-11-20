import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const authUser = await verifyToken(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const progress = await prisma.tourProgress.findUnique({
        where: { tourId_userId: { tourId: params.id, userId: authUser.uid } },
    });

    return NextResponse.json(progress ?? { completedStops: [], completedAt: null });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const authUser = await verifyToken(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { completedStops } = await req.json();
    if (!Array.isArray(completedStops)) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    // Determine if fully completed
    const tour = await prisma.codebaseTour.findFirst({
        where: { id: params.id },
        include: { stops: true },
    });

    const totalStops = tour?.stops.length ?? 0;
    const isComplete = completedStops.length >= totalStops && totalStops > 0;

    const progress = await prisma.tourProgress.upsert({
        where: { tourId_userId: { tourId: params.id, userId: authUser.uid } },
        create: {
            tourId: params.id,
            userId: authUser.uid,
            completedStops,
            completedAt: isComplete ? new Date() : null,
        },
        update: {
            completedStops,
            completedAt: isComplete ? new Date() : null,
        },
    });

    return NextResponse.json(progress);
}
