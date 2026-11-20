import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SECTION_PROMPTS: Record<string, string[]> = {
    RFC: ["Problem Statement", "Proposed Solution", "Alternatives Considered", "Open Questions"],
    PRD: ["Goals", "User Stories", "Requirements", "Success Metrics"],
    ADR: ["Context", "Decision", "Consequences", "Alternatives"],
};

export async function POST(req: NextRequest) {
    const authUser = await verifyToken(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { transcript, type } = await req.json();
    if (!transcript || !type) return NextResponse.json({ error: "Missing transcript or type" }, { status: 400 });

    const sections = SECTION_PROMPTS[type as string] ?? SECTION_PROMPTS.RFC;

    const prompt = `You are a senior engineer writing a ${type} (${type === "RFC" ? "Request for Comments" : type === "PRD" ? "Product Requirements Doc" : "Architecture Decision Record"}) for an engineering team.

A team member recorded the following voice narration explaining a technical decision:

"""
${transcript}
"""

Extract and structure the content into these sections: ${sections.join(", ")}.

Respond ONLY with a valid JSON array, no markdown, no code fences:
[
  { "heading": "...", "body": "..." },
  ...
]

Write each body in clear, concise engineering prose. If the transcript doesn't cover a section, write a short placeholder noting it needs to be filled in. Keep each section 1-3 sentences.`;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();

        // Strip any accidental code fences
        const json = text.replace(/^```json?\s*/i, "").replace(/```\s*$/, "").trim();
        const structured = JSON.parse(json);

        // Also generate a 1-sentence summary
        const summaryModel = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });
        const summaryResult = await summaryModel.generateContent(
            `Summarize this engineering decision in one sentence (max 120 chars): "${transcript}"`
        );
        const summary = summaryResult.response.text().trim().replace(/^["']|["']$/g, "").slice(0, 160);

        return NextResponse.json({ sections: structured, summary });
    } catch (err: any) {
        console.error("Gemini structure error:", err);
        return NextResponse.json({ error: "AI structuring failed. Please try again." }, { status: 500 });
    }
}
