import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ── GitHub helpers ────────────────────────────────────────────────────────────

function ghHeaders(): Record<string, string> {
    const h: Record<string, string> = { Accept: "application/vnd.github.v3+json", "User-Agent": "FlowState-App" };
    if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    return h;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
        ),
    ]);
}

async function getFileTree(repoName: string): Promise<string[]> {
    const res = await withTimeout(
        fetch(`https://api.github.com/repos/${repoName}/git/trees/HEAD?recursive=1`, { headers: ghHeaders() }),
        10000, "GitHub file tree"
    );
    if (!res.ok) throw new Error(`GitHub ${res.status}`);
    const data = await res.json();
    return (data.tree ?? [])
        .filter((f: any) => f.type === "blob")
        .map((f: any) => f.path as string);
}

async function getFileContent(repoName: string, path: string): Promise<string | null> {
    try {
        const res = await withTimeout(
            fetch(`https://api.github.com/repos/${repoName}/contents/${path}`, { headers: ghHeaders() }),
            8000, "GitHub file content"
        );
        if (!res.ok) return null;
        const data = await res.json();
        if (data.encoding === "base64" && data.content)
            return Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf-8");
    } catch { /* timeout or fetch error — skip file */ }
    return null;
}

// Priority files to always fetch regardless of filter
const PRIORITY_FILENAMES = [
    "README.md", "readme.md", "README.txt",
    "pubspec.yaml", "package.json", "Cargo.toml", "go.mod", "requirements.txt",
    "pyproject.toml", "build.gradle", "pom.xml", "Gemfile",
    "app/build.gradle", "android/app/build.gradle",
];

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    const authUser = await verifyToken(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tourId, repoName } = await req.json();
    if (!tourId || !repoName) return NextResponse.json({ error: "Missing tourId or repoName" }, { status: 400 });

    const tour = await prisma.codebaseTour.findFirst({ where: { id: tourId, userId: authUser.uid } });
    if (!tour) return NextResponse.json({ error: "Tour not found" }, { status: 404 });

    console.log(`[analyze-repo] START repo=${repoName} tourId=${tourId}`);

    // 1. Get file tree
    let allFiles: string[];
    try {
        allFiles = await getFileTree(repoName);
        console.log(`[analyze-repo] file tree fetched: ${allFiles.length} total files`);
    } catch (err: any) {
        console.error("[analyze-repo] getFileTree failed:", err.message);
        const msg = err.message?.includes("timed out") ? "GitHub timed out. Try again." : `Could not reach repo "${repoName}". Check it's public and the name is correct.`;
        return NextResponse.json({ error: msg }, { status: 422 });
    }

    // Filter to meaningful source files only
    const sourceFiles = allFiles.filter((f) =>
        /\.(ts|tsx|js|jsx|py|go|rs|java|rb|cs|php|swift|kt|vue|svelte)$/.test(f) &&
        !f.includes("node_modules") && !f.includes(".next") && !f.includes("dist/") &&
        !f.includes("build/") && !f.includes("vendor/") && !f.includes("__pycache__")
    ).slice(0, 100);
    console.log(`[analyze-repo] source files after filter: ${sourceFiles.length}`);

    // 2. Always fetch priority files (README, pubspec.yaml, package.json, etc.)
    const priorityFiles = PRIORITY_FILENAMES.filter(f => allFiles.includes(f));
    console.log(`[analyze-repo] priority files found:`, priorityFiles);

    // Also sample entry points and shallow source files
    const entryFiles = sourceFiles.filter((f) =>
        /^(index|main|app|server|api|main_app)\.(ts|tsx|js|jsx|py|go|dart)$/.test(f.split("/").pop() ?? "") ||
        f.split("/").length <= 2
    ).slice(0, 6);

    // For sparse repos: also grab files from key subdirectories
    const keyDirFiles = sourceFiles.filter((f) =>
        /\/(screens?|pages?|views?|components?|services?|models?|providers?|blocs?|repositories?|api|auth|home|feed|profile|widgets?|controllers?|routes?|middleware|utils?|hooks?|store|state|config)\//i.test(f)
    ).slice(0, 25);

    const filesToFetch = [...new Set([...priorityFiles, ...entryFiles, ...keyDirFiles])].slice(0, 35);
    console.log(`[analyze-repo] sampling ${filesToFetch.length} files:`, filesToFetch);

    const sampledEntries = await Promise.all(
        filesToFetch.map(async (f) => {
            const content = await getFileContent(repoName, f);
            if (content) console.log(`[analyze-repo]   fetched ${f} (${content.length} chars)`);
            else console.log(`[analyze-repo]   skipped ${f} (null)`);
            return content ? ([f, content.slice(0, 1200)] as [string, string]) : null;
        })
    );
    const sampledContent = Object.fromEntries(sampledEntries.filter(Boolean) as [string, string][]);
    console.log(`[analyze-repo] sampled ${Object.keys(sampledContent).length} files, sending to Gemini`);

    // 3. Ask Gemini to build the graph
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

    const treeText = allFiles.join("\n");
    const contentText = Object.entries(sampledContent)
        .map(([f, c]) => `=== ${f} ===\n${c}`)
        .join("\n\n");

    const prompt = `You are a senior software architect. Your job: given a code repository's file tree and key file contents, produce a RICH, DETAILED codebase map that teaches a new engineer the full architecture in one view — like a NotebookLM deep-dive, not a surface summary.

Repository: ${repoName}

ALL files in the repo:
${treeText}

Sampled file contents:
${contentText}

CRITICAL INSTRUCTIONS:
1. Use the FULL file tree above (not just sampled files) to infer the complete architecture
2. If you see lib/screens/, lib/services/, lib/models/, lib/providers/ — those ARE separate architectural layers even if you didn't read them
3. If you see pubspec.yaml content — extract ALL dependencies (firebase_*, provider, bloc, dio, http, etc.)
4. For sparse repos: infer from folder names what each layer does. A folder called "auth" means authentication. "feed" means a social feed. "connections" means friend/connection management.
5. For Flutter apps specifically: ALWAYS create nodes for: Mobile UI Layer, State Management (if provider/bloc/riverpod visible), Auth Service, Data/Network Layer, Platform Bridge (Android), Platform Bridge (iOS) — even if you only see 2-3 actual files. The architecture is standard.
6. Descriptions must be SPECIFIC: not "handles data" but "manages student profile data using Firebase Firestore, including connection lists and profile photos"
7. keyFlows must list ACTUAL user scenarios visible from filenames: if you see login_screen.dart, connection_screen.dart, feed_screen.dart → list "Student Login", "Browse Connections", "View Feed"
8. For level2: list 5-8 REAL files/modules per level1 component, not just 1-2. Scan the full file tree for files that logically belong to each component (e.g. all files under lib/screens/ belong to the UI layer, all files under lib/services/ belong to the service layer). Use real file paths from the tree. If a component only has 1-2 actual files, say so, but most components in a real app have many more — look harder in the tree before settling for a short list.
9. Each level2 module description must explain WHAT specific feature or screen it implements, not a generic restatement of the parent's purpose.

Return ONLY valid JSON (no markdown, no code fences):
{
  "projectSummary": "2-3 sentences: what this product IS, who uses it, what it helps them do. Name the product. E.g. 'Students Connect is a Flutter mobile app that helps university students find and connect with peers...'",
  "techStack": ["Flutter", "Dart", "Kotlin", "Swift", "Firebase", "...all deps you can find"],
  "architecturePattern": "e.g. 'Flutter + Firebase Mobile App' or 'Next.js Full-Stack with Supabase'",
  "dataFlow": "2-3 sentences: exact data path. E.g. 'User taps in Flutter UI → Dart service calls Firebase Auth → on success, Firestore query fetches profile → Provider/Bloc updates app state → UI rebuilds'",
  "userFlows": [
    {
      "name": "Student Login",
      "steps": [
        { "label": "Login Screen", "detail": "user enters email + password" },
        { "label": "Firebase Auth", "detail": "validates credentials" },
        { "label": "Profile Load", "detail": "Firestore fetches student record" },
        { "label": "Home Feed", "detail": "app navigates to feed screen" }
      ]
    },
    {
      "name": "Send Connection Request",
      "steps": [
        { "label": "Browse Students", "detail": "search/discover other profiles" },
        { "label": "Request Sent", "detail": "writes to connections collection" },
        { "label": "Notification", "detail": "push notification to recipient" },
        { "label": "Connected", "detail": "both see each other in connections list" }
      ]
    }
  ],
  "level1": [
    {
      "id": "mobile-ui",
      "label": "Mobile UI",
      "type": "frontend",
      "description": "All Flutter screens and widgets — login, feed, profile, connection browser. This is what students see and tap.",
      "role": "What students see and interact with",
      "keyFlows": ["Login", "View Feed", "Browse Profiles", "Send Connection Request", "Edit Profile"],
      "techUsed": "Flutter + Dart",
      "color": "#4285F4",
      "directory": "lib/screens"
    }
  ],
  "level2": [
    {
      "id": "mobile-ui-login",
      "parentId": "mobile-ui",
      "label": "Login Screen",
      "filePath": "lib/screens/login_screen.dart",
      "description": "Email/password form that authenticates the student"
    },
    {
      "id": "mobile-ui-feed",
      "parentId": "mobile-ui",
      "label": "Student Feed",
      "filePath": "lib/screens/feed_screen.dart",
      "description": "Shows posts and activity from connected students"
    },
    {
      "id": "mobile-ui-profile",
      "parentId": "mobile-ui",
      "label": "Profile Editor",
      "filePath": "lib/screens/profile_edit_screen.dart",
      "description": "Lets students update their bio, major, and profile photo"
    }
  ],
  "level3": [],
  "connections": [
    { "from": "mobile-ui", "to": "auth-service", "label": "sends login requests" },
    { "from": "mobile-ui", "to": "data-layer", "label": "reads student profiles" },
    { "from": "auth-service", "to": "data-layer", "label": "reads/writes user records" }
  ],
  "replay": {
    "name": "Student Login Flow",
    "description": "Full path from login tap to seeing the feed",
    "steps": [
      { "nodeId": "mobile-ui", "action": "Student enters credentials", "detail": "Login screen collects email + password" },
      { "nodeId": "auth-service", "action": "Firebase Auth validates", "detail": "Checks credentials, returns user token" },
      { "nodeId": "data-layer", "action": "Firestore loads profile", "detail": "Fetches student record and connections" },
      { "nodeId": "mobile-ui", "action": "Feed renders", "detail": "App state updates, home screen shows" }
    ]
  },
  "summary": "One paragraph technical summary covering the full architecture"
}`;

    let rawText = "";
    try {
        const result = await withTimeout(model.generateContent(prompt), 35000, "Gemini analysis");
        rawText = result.response.text().trim().replace(/^```json?\s*/i, "").replace(/```\s*$/, "").trim();
        console.log("[analyze-repo] Gemini response length:", rawText.length, "first 100:", rawText.slice(0, 100));
        const graph = JSON.parse(rawText);

        await prisma.codebaseTour.update({ where: { id: tourId }, data: { graph } });
        return NextResponse.json({ graph });
    } catch (err: any) {
        console.error("[analyze-repo] Error:", err.message, "rawText snippet:", rawText.slice(0, 200));
        const isTimeout = err.message?.includes("timed out");
        const isJson = err.message?.includes("JSON") || err instanceof SyntaxError;
        return NextResponse.json(
            { error: isTimeout ? "Analysis timed out. Try a smaller repo." : isJson ? "AI returned malformed response. Try again." : "AI analysis failed. Please try again." },
            { status: isTimeout ? 504 : 500 }
        );
    }
}
