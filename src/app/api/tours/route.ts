import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
    const authUser = await verifyToken(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tours = await prisma.codebaseTour.findMany({
        where: { userId: authUser.uid },
        include: { stops: { orderBy: { order: "asc" } }, progress: { where: { userId: authUser.uid } } },
        orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(tours);
}

export async function POST(req: NextRequest) {
    const authUser = await verifyToken(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title, description, area, difficulty, repoId } = await req.json();
    if (!title) return NextResponse.json({ error: "Missing title" }, { status: 400 });

    const tour = await prisma.codebaseTour.create({
        data: {
            userId: authUser.uid,
            title,
            description: description ?? "",
            area: area ?? "general",
            difficulty: difficulty ?? "beginner",
            repoId: repoId ?? null,
        },
        include: { stops: true, progress: true },
    });

    return NextResponse.json(tour);
}
