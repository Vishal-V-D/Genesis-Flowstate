import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const authUser = await verifyToken(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const repo = await prisma.connectedRepo.findFirst({ where: { id: params.id, userId: authUser.uid } });
    if (!repo) return NextResponse.json({ error: "Repo not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const path = searchParams.get("path");
    if (!path) return NextResponse.json({ error: "Missing path" }, { status: 400 });

    const headers: Record<string, string> = {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "FlowState-App",
    };
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

    try {
        const res = await fetch(`https://api.github.com/repos/${repo.repoName}/contents/${path}`, { headers });
        if (!res.ok) {
            if (res.status === 404) return NextResponse.json({ error: "File not found" }, { status: 404 });
            return NextResponse.json({ error: `GitHub API error ${res.status}` }, { status: res.status });
        }

        const data = await res.json();

        if (data.encoding === "base64" && data.content) {
            const content = Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf-8");
            return NextResponse.json({ content, path: data.path, sha: data.sha });
        }

        return NextResponse.json({ error: "Cannot decode file" }, { status: 422 });
    } catch (err: any) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
