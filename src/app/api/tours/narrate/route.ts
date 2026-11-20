import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
    return Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error("Request timed out")), ms))]);
}

function parseGitHubUrl(url: string): { repoName: string; filePath: string; branch: string } | null {
    // https://github.com/owner/repo/blob/main/src/lib/auth.ts
    const match = url.match(/github\.com\/([^/]+\/[^/]+)\/blob\/([^/]+)\/(.+)/);
    if (!match) return null;
    return { repoName: match[1], branch: match[2], filePath: match[3] };
}

async function fetchGitHubFile(repoName: string, filePath: string, branch: string, token?: string): Promise<string | null> {
    const headers: Record<string, string> = { Accept: "application/vnd.github.v3+json", "User-Agent": "FlowState-App" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`https://api.github.com/repos/${repoName}/contents/${filePath}?ref=${branch}`, { headers });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.encoding === "base64" && data.content)
        return Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf-8");
    return null;
}

export async function POST(req: NextRequest) {
    const authUser = await verifyToken(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let { narration, filePath, fileContent, githubUrl } = await req.json();

    // Auto-fetch from GitHub URL if provided directly
    if (githubUrl && !fileContent) {
        const parsed = parseGitHubUrl(githubUrl);
        if (!parsed) return NextResponse.json({ error: "Invalid GitHub URL" }, { status: 400 });
        const content = await fetchGitHubFile(parsed.repoName, parsed.filePath, parsed.branch, process.env.GITHUB_TOKEN);
        if (!content) return NextResponse.json({ error: "File not found on GitHub. Check the URL or make the repo public." }, { status: 404 });
        fileContent = content;
        filePath = parsed.filePath;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

    // If file content provided: auto-generate title + narrative + key points — no manual input needed
    if (fileContent && !narration) {
        const storyPrompt = `You are a senior engineer giving a guided codebase tour to a new team member.

The file being explained is: ${filePath ?? "unknown"}

Here is the file content:
\`\`\`
${fileContent.slice(0, 4000)}
\`\`\`

Generate three things:

1. **title**: A short, specific stop title (5-8 words) describing what this file does. NOT generic like "Auth File" — be specific like "JWT token validation and refresh logic".

2. **narration**: A story-style explanation (like a chapter in a technical book) written in first person as if speaking to the engineer. Explain what this file does, why it exists, the key design decisions visible in the code, and what they must understand to work with it confidently. Reference actual function names, constants, and patterns you see. Under 200 words.

3. **keyPoints**: 3-5 specific, actionable insights a new engineer should take away. Not generic — reference actual things in the code.

Respond ONLY with valid JSON (no markdown):
{
  "title": "...",
  "narration": "...",
  "keyPoints": ["...", "..."]
}`;

        try {
            const result = await withTimeout(model.generateContent(storyPrompt), 20000);
            const text = result.response.text().trim().replace(/^```json?\s*/i, "").replace(/```\s*$/, "").trim();
            const parsed = JSON.parse(text);
            return NextResponse.json({ title: parsed.title, narration: parsed.narration, keyPoints: parsed.keyPoints ?? [], filePath });
        } catch (err: any) {
            console.error("Narrate error:", err.message);
            const isTimeout = err.message?.includes("timed out");
            return NextResponse.json({ error: isTimeout ? "AI took too long. Try again." : "AI generation failed. Please try again." }, { status: isTimeout ? 504 : 500 });
        }
    }

    // If narration provided: extract key points from it
    if (!narration) return NextResponse.json({ error: "Missing narration or fileContent" }, { status: 400 });

    const extractPrompt = `You are helping engineers document a codebase tour stop.

An engineer recorded the following narration about the file "${filePath ?? "a file"}":

"""
${narration}
"""

Extract 3-5 key points that a new engineer reading this stop should take away. These should be specific, actionable insights — not generic summaries.

Respond ONLY with a JSON array of strings, no markdown:
["key point 1", "key point 2", "key point 3"]`;

    try {
        const result = await withTimeout(model.generateContent(extractPrompt), 15000);
        const text = result.response.text().trim().replace(/^```json?\s*/i, "").replace(/```\s*$/, "").trim();
        const keyPoints = JSON.parse(text);
        return NextResponse.json({ keyPoints });
    } catch (err: any) {
        console.error("Extract error:", err.message);
        const isTimeout = err.message?.includes("timed out");
        return NextResponse.json({ error: isTimeout ? "AI took too long. Try again." : "AI extraction failed. Please try again." }, { status: isTimeout ? 504 : 500 });
    }
}
