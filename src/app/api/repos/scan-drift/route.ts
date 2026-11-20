import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
    return Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error("Request timed out")), ms))]);
}

async function getRecentCommits(repoName: string, token?: string) {
    const headers: Record<string, string> = { Accept: "application/vnd.github.v3+json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`https://api.github.com/repos/${repoName}/commits?per_page=20`, { headers });
    if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
    return res.json() as Promise<any[]>;
}

async function getCommitFiles(repoName: string, sha: string, token?: string) {
    const headers: Record<string, string> = { Accept: "application/vnd.github.v3+json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`https://api.github.com/repos/${repoName}/commits/${sha}`, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.files ?? []) as { filename: string; status: string; additions: number; deletions: number }[];
}

export async function POST(req: NextRequest) {
    const authUser = await verifyToken(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { repoId } = await req.json();
    if (!repoId) return NextResponse.json({ error: "Missing repoId" }, { status: 400 });

    const repo = await prisma.connectedRepo.findFirst({ where: { id: repoId, userId: authUser.uid } });
    if (!repo) return NextResponse.json({ error: "Repo not found" }, { status: 404 });

    const docs = await prisma.designDoc.findMany({
        where: { userId: authUser.uid, status: "Approved" },
    });

    if (docs.length === 0) return NextResponse.json({ scanned: 0, results: [] });

    // Fetch recent commits from GitHub (public repo — no token needed; private needs GITHUB_TOKEN)
    let commits: any[];
    try {
        commits = await getRecentCommits(repo.repoName, process.env.GITHUB_TOKEN);
    } catch (err: any) {
        return NextResponse.json({ error: "Internal server error" }, { status: 422 });
    }

    // Get changed files for last 5 commits
    const recentFiles: { sha: string; message: string; files: string[] }[] = [];
    for (const c of commits.slice(0, 5)) {
        const files = await getCommitFiles(repo.repoName, c.sha, process.env.GITHUB_TOKEN);
        recentFiles.push({ sha: c.sha.slice(0, 7), message: c.commit.message.split("\n")[0], files: files.map((f) => f.filename) });
    }

    const changedFiles = [...new Set(recentFiles.flatMap((c) => c.files))];
    if (changedFiles.length === 0) return NextResponse.json({ scanned: 0, results: [] });

    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });
    const results: { docId: string; drift: string; driftFiles: any[]; linkedCommits: any[] }[] = [];

    for (const doc of docs) {
        const sections = (doc.sections as any[]).map((s: any) => `${s.heading}: ${s.body}`).join("\n");

        const prompt = `You are a code review assistant. An engineering team has an approved decision document:

TITLE: ${doc.title}
CONTENT:
${sections}

Recent commits changed these files:
${changedFiles.join("\n")}

For each file, determine if it might violate or drift from the documented decision. Be conservative — only flag files that are clearly related to what the decision governs.

Respond ONLY with valid JSON (no markdown):
{
  "drift": "clean" | "warn" | "violated",
  "driftFiles": [
    { "path": "...", "reason": "one sentence why this file drifts from the decision" }
  ]
}

If no files are related, respond with { "drift": "clean", "driftFiles": [] }.`;

        try {
            const result = await withTimeout(model.generateContent(prompt), 20000);
            const text = result.response.text().trim().replace(/^```json?\s*/i, "").replace(/```\s*$/, "").trim();
            const analysis = JSON.parse(text);

            // Link commits that touched drifting files
            const driftPaths = new Set((analysis.driftFiles ?? []).map((f: any) => f.path));
            const linked = recentFiles
                .filter((c) => c.files.some((f) => driftPaths.has(f)))
                .map((c) => ({ sha: c.sha, message: c.message, author: "git", ago: "recent" }));

            results.push({ docId: doc.id, drift: analysis.drift ?? "clean", driftFiles: analysis.driftFiles ?? [], linkedCommits: linked });

            await prisma.designDoc.update({
                where: { id: doc.id },
                data: { drift: analysis.drift ?? "clean", driftFiles: analysis.driftFiles ?? [], linkedCommits: linked },
            });
        } catch (err) {
            // Skip this doc if Gemini fails
        }
    }

    return NextResponse.json({ scanned: docs.length, results });
}
