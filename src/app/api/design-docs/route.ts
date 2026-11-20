import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
    const authUser = await verifyToken(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const docs = await prisma.designDoc.findMany({
        where: { userId: authUser.uid },
        include: { teamSignals: true },
        orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(docs);
}

export async function POST(req: NextRequest) {
    const authUser = await verifyToken(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { title, type, status, summary, sections } = body;

    if (!title || !type) return NextResponse.json({ error: "Missing title or type" }, { status: 400 });

    const doc = await prisma.designDoc.create({
        data: {
            userId: authUser.uid,
            title,
            type,
            status: status ?? "Draft",
            summary: summary ?? "",
            sections: sections ?? [],
            drift: "clean",
            driftFiles: [],
            linkedCommits: [],
            linkedDocIds: [],
        },
        include: { teamSignals: true },
    });

    return NextResponse.json(doc);
}
