import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
    const authUser = await verifyToken(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const user = await prisma.user.findUnique({ where: { userId: authUser.uid } });
        if (!user) return NextResponse.json({ userId: authUser.uid, email: authUser.email });
        return NextResponse.json(user);
    } catch (error: any) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    const authUser = await verifyToken(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { userId: _id, createdAt: _ca, ...updateData } = body;

        const user = await prisma.user.upsert({
            where: { userId: authUser.uid },
            update: { ...updateData, email: authUser.email },
            create: { userId: authUser.uid, email: authUser.email, ...updateData },
        });

        return NextResponse.json(user);
    } catch (error: any) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
