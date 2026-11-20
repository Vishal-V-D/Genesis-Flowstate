import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
    const authUser = await verifyToken(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const repos = await prisma.connectedRepo.findMany({
        where: { userId: authUser.uid },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(repos);
}

export async function POST(req: NextRequest) {
    const authUser = await verifyToken(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { repoUrl } = body;

    if (!repoUrl) return NextResponse.json({ error: "Missing repoUrl" }, { status: 400 });

    // Extract repo name from URL (github.com/org/repo → org/repo)
    const repoName = repoUrl.replace(/https?:\/\/(www\.)?github\.com\//, "").replace(/\.git$/, "").trim() || repoUrl;

    // Avoid duplicates
    const existing = await prisma.connectedRepo.findFirst({ where: { userId: authUser.uid, repoUrl } });
    if (existing) return NextResponse.json(existing);

    const repo = await prisma.connectedRepo.create({
        data: { userId: authUser.uid, repoUrl, repoName },
    });

    return NextResponse.json(repo);
}

export async function DELETE(req: NextRequest) {
    const authUser = await verifyToken(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await prisma.connectedRepo.deleteMany({ where: { id, userId: authUser.uid } });
    return NextResponse.json({ ok: true });
}
