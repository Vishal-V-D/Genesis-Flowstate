import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const authUser = await verifyToken(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const doc = await prisma.designDoc.findFirst({ where: { id: params.id } });
    if (!doc) return NextResponse.json({ error: "Doc not found" }, { status: 404 });

    const body = await req.json();
    const { signal, note } = body;

    if (!["approve", "concern", "question"].includes(signal)) {
        return NextResponse.json({ error: "Invalid signal" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { userId: authUser.uid } });
    const engineer = user?.firstName || authUser.email?.split("@")[0] || "Unknown";
    const initial = engineer.charAt(0).toUpperCase();

    // Replace existing signal from this user on this doc
    await prisma.teamSignal.deleteMany({ where: { docId: params.id, userId: authUser.uid } });

    const teamSignal = await prisma.teamSignal.create({
        data: {
            docId: params.id,
            userId: authUser.uid,
            engineer,
            initial,
            signal,
            note: note ?? "",
        },
    });

    return NextResponse.json(teamSignal);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const authUser = await verifyToken(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.teamSignal.deleteMany({ where: { docId: params.id, userId: authUser.uid } });
    return NextResponse.json({ ok: true });
}
