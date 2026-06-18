"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Download, Copy, Zap, Loader2, ChevronRight,
  ChevronDown, File, Folder, FolderOpen, Check, X, Cpu,
  Layers, Database, GitBranch, FileText, Settings, Play,
  PanelLeftClose, PanelLeftOpen
} from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { prism } from "react-syntax-highlighter/dist/esm/styles/prism";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

// ── Types ──────────────────────────────────────────────────────────────────
interface GeneratedFile {
  path: string;
  content: string;
  isComplete: boolean;
}

interface FileTreeNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileTreeNode[];
}

interface LogEntry {
  id: number;
  message: string;
  type: "info" | "success" | "error" | "processing";
}

// ── File tree builder ──────────────────────────────────────────────────────
function buildFileTree(files: GeneratedFile[]): FileTreeNode[] {
  const root: FileTreeNode[] = [];
  files.forEach(({ path }) => {
    const parts = path.split("/");
    let current = root;
    parts.forEach((part, i) => {
      const isLast = i === parts.length - 1;
      let node = current.find((n) => n.name === part);
      if (!node) {
        node = { name: part, path: parts.slice(0, i + 1).join("/"), type: isLast ? "file" : "folder", children: isLast ? undefined : [] };
        current.push(node);
      }
      if (!isLast) current = node.children!;
    });
  });
  return root;
}

// ── Stream parser — extracts <file path="...">...</file> blocks ────────────
function parseStreamChunk(raw: string): { files: GeneratedFile[]; remainder: string } {
  const files: GeneratedFile[] = [];
  let remainder = raw;
  const fileRegex = /<file path="([^"]+)">([\s\S]*?)<\/file>/g;
  let match;
  while ((match = fileRegex.exec(raw)) !== null) {
    files.push({ path: match[1], content: match[2].trim(), isComplete: true });
  }
  // Check for an in-progress (open) tag at the end
  const openTag = remainder.match(/<file path="([^"]+)">([\s\S]*)$/);
  if (openTag && !remainder.includes("</file>")) {
    files.push({ path: openTag[1], content: openTag[2], isComplete: false });
    remainder = "";
  } else {
    remainder = "";
  }
  return { files, remainder };
}

function getLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    ts: "typescript", tsx: "tsx", js: "javascript", jsx: "jsx",
    py: "python", tf: "hcl", yaml: "yaml", yml: "yaml",
    json: "json", sql: "sql", sh: "bash", md: "markdown",
    go: "go", rs: "rust", java: "java", cs: "csharp",
    dockerfile: "docker", env: "bash", toml: "toml",
  };
  return map[ext] ?? "javascript"; // fallback to JS for unrecognised files
}

function getCategoryIcon(cat: string) {
  const icons: Record<string, React.ReactNode> = {
    Infrastructure: <Layers size={14} />, Database: <Database size={14} />,
    Workflow: <GitBranch size={14} />, Diagnostics: <FileText size={14} />,
    Architecture: <Layers size={14} />, Operations: <Settings size={14} />,
    Development: <Cpu size={14} />, Compliance: <FileText size={14} />,
  };
  return icons[cat] ?? <Cpu size={14} />;
}

const CODE_CATEGORIES = ["Infrastructure", "Database", "Workflow", "Diagnostics"];
const CODE_TARGETS: Record<string, string[]> = {
  Infrastructure: ["Terraform", "Kubernetes YAML", "Pulumi", "AWS CDK", "Ansible"],
  Database: ["PostgreSQL Schema", "MySQL Schema", "MongoDB Models", "Prisma Schema"],
  Workflow: ["GitHub Actions", "GitLab CI", "Jenkins Pipeline", "Zapier JSON Logic"],
  Diagnostics: ["Monitoring Script", "Logging Config", "Alert Rules"],
};

const DOCS_CATEGORIES = ["Architecture", "Operations", "Development", "Compliance"];
const DOCS_TARGETS: Record<string, string[]> = {
  Architecture: ["System Design Doc", "Threat Model", "API Specification", "Data Flow Diagram"],
  Operations: ["Runbook", "Deployment Guide", "Incident Response Plan", "SLA Definitions"],
  Development: ["Onboarding Guide", "Code Style Guidelines", "Release Notes"],
  Compliance: ["Security Audit Report", "Data Privacy Policy", "Compliance Checklist"],
};

// ── File Tree Component ────────────────────────────────────────────────────
function FileTree({ nodes, selectedPath, onSelect, files }: {
  nodes: FileTreeNode[]; selectedPath: string; onSelect: (path: string) => void; files: GeneratedFile[];
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (path: string) => setExpanded(prev => {
    const s = new Set(prev);
    s.has(path) ? s.delete(path) : s.add(path);
    return s;
  });

  const renderNode = (node: FileTreeNode, depth = 0) => {
    const isFolder = node.type === "folder";
    const isOpen = expanded.has(node.path);
    const isSelected = selectedPath === node.path;
    const file = files.find(f => f.path === node.path);
    const isStreaming = file && !file.isComplete;

    return (
      <div key={node.path}>
        <button
          onClick={() => isFolder ? toggle(node.path) : onSelect(node.path)}
          className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left text-[12.5px] transition-colors ${isSelected ? "bg-indigo-50 text-indigo-700 font-medium" : "text-slate-600 hover:bg-slate-100"}`}
          style={{ paddingLeft: `${8 + depth * 12}px` }}
        >
          {isFolder ? (
            isOpen ? <><ChevronDown size={14} className="shrink-0 text-slate-400" /><FolderOpen size={14} className="shrink-0 text-indigo-400" /></> :
              <><ChevronRight size={14} className="shrink-0 text-slate-400" /><Folder size={14} className="shrink-0 text-indigo-400" /></>
          ) : (
            <><span className="w-3.5 shrink-0" /><File size={13} className="shrink-0 text-slate-400" /></>
          )}
          <span className="truncate">{node.name}</span>
          {isStreaming && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse shrink-0" />}
          {file?.isComplete && <Check size={12} className="ml-auto text-emerald-500 shrink-0" />}
        </button>
        {isFolder && isOpen && node.children?.map(child => renderNode(child, depth + 1))}
      </div>
    );
  };

  return <div className="py-1 space-y-0.5">{nodes.map(n => renderNode(n))}</div>;
}

// ── Strip XML file tags from content (cleanup streamed AI responses) ───────
function stripFileTags(content: string): string {
  return content
    .replace(/^<file path="[^"]*">\s*/m, "")
    .replace(/<\/file>\s*$/m, "")
    .trim();
}

// ── Log Console ───────────────────────────────────────────────────────────
function LogConsole({ logs }: { logs: LogEntry[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [logs]);

  const colors: Record<LogEntry["type"], string> = {
    info: "text-slate-600", success: "text-emerald-600",
    error: "text-red-500", processing: "text-indigo-500",
  };

  return (
    <div ref={ref} className="h-full overflow-y-auto font-mono text-[12px] leading-relaxed px-4 py-3 space-y-1">
      {logs.map(log => (
        <div key={log.id} className={`flex gap-2 ${colors[log.type]}`}>
          <span className="text-slate-300 shrink-0">&gt;</span>
          <span>{log.message}</span>
          {log.type === "processing" && <span className="animate-pulse">_</span>}
        </div>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function GeneratePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData] = useState<{ thumbnail: string; graph: any[]; workspaceTitle: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Layout State
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFileExplorerOpen, setIsFileExplorerOpen] = useState(true);
  const [isPreviewMode, setIsPreviewMode] = useState(true);

  const handleDownloadMD = () => {
    const file = files.find(f => f.path === selectedPath);
    if (!file) return;
    const blob = new Blob([file.content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.path.split("/").pop() || "document.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById("markdown-preview-container");
    if (!element) {
      alert("Please switch to preview mode to export as PDF.");
      return;
    }
    
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const opt = {
        margin:       0.5,
        filename:     selectedPath.split("/").pop()?.replace(".md", ".pdf") || "document.pdf",
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'in' as const, format: 'letter' as const, orientation: 'portrait' as const }
      };
      
      const styledElement = element.cloneNode(true) as HTMLElement;
      styledElement.style.padding = "40px";
      styledElement.style.fontFamily = "system-ui, -apple-system, sans-serif";
      styledElement.style.color = "#1e293b";
      styledElement.className = "prose prose-slate max-w-none text-slate-800 bg-white";
      
      html2pdf().from(styledElement).set(opt).save();
    } catch (e) {
      console.error("PDF generation failed:", e);
      alert("Failed to export PDF.");
    }
  };

  // Advanced Config
  const [advancedConfig, setAdvancedConfig] = useState({
     model: "gemini-2.5-flash",
     temperature: 0.7,
     maxTokens: 8192,
     apiKey: "",
     customInstructions: ""
  });

  // Config
  const [outputMode, setOutputMode] = useState<"code" | "docs">("code");
  const [category, setCategory] = useState("Infrastructure");
  const [target, setTarget] = useState("Terraform");

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [selectedPath, setSelectedPath] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [rawBuffer, setRawBuffer] = useState("");
  const logIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const addLog = useCallback((message: string, type: LogEntry["type"] = "info") => {
    setLogs(prev => [...prev, { id: logIdRef.current++, message, type }]);
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem(`generationData_${params.id}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      setData(parsed);
      autoDetect(parsed.graph, parsed.thumbnail);
    } else {
      router.push(`/workspace/${params.id}`);
    }
  }, [params.id]);

  const autoDetect = async (graph: any[], thumbnail?: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/generation/detect-diagram`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ graph, image: thumbnail }),
      });
      if (res.ok) {
        const detected = await res.json();
        if (detected.category) setCategory(detected.category);
        if (detected.target) setTarget(detected.target);
        addLog(`Auto-detected: ${detected.category} → ${detected.target}`, "success");
      }
    } catch { addLog("Auto-detection failed, using defaults", "error"); }
    finally { setLoading(false); }
  };

  const handleGenerate = async () => {
    if (!data) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setIsGenerating(true);
    setFiles([]);
    setSelectedPath("");
    setRawBuffer("");
    setLogs([]);
    addLog(`Starting ${outputMode === "code" ? "code" : "docs"} generation...`, "processing");
    addLog(`Target: ${target} | Category: ${category}`, "info");

    try {
      const res = await fetch(`${BACKEND_URL}/api/generation/generate-artifact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ graph: data.graph, category, target, output_type: outputMode, advanced_config: advancedConfig }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) { addLog("Generation request failed.", "error"); return; }

      addLog("Streaming response...", "info");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Parse complete <file> blocks from buffer
        const fileRegex = /<file path="([^"]+)">([\s\S]*?)<\/file>/g;
        let match;
        const found: GeneratedFile[] = [];
        while ((match = fileRegex.exec(buffer)) !== null) {
          found.push({ path: match[1], content: stripFileTags(match[2].trim()), isComplete: true });
        }

        if (found.length > 0) {
          setFiles(prev => {
            const newFiles = [...prev];
            found.forEach(f => {
              const existingIdx = newFiles.findIndex(e => e.path === f.path);
              if (existingIdx >= 0) newFiles[existingIdx] = f;
              else {
                addLog(`Generated: ${f.path}`, "success");
                newFiles.push(f);
                if (!selectedPath) setSelectedPath(f.path);
              }
            });
            return newFiles;
          });
        }

        // Check for in-progress file (open tag without close)
        const openMatch = buffer.match(/<file path="([^"]+)">([\s\S]*)$/);
        if (openMatch && !buffer.substring(openMatch.index!).includes("</file>")) {
          const inProgressPath = openMatch[1];
          const inProgressContent = openMatch[2];
          setSelectedPath(inProgressPath);
          setFiles(prev => {
            const newFiles = [...prev];
            const existingIdx = newFiles.findIndex(e => e.path === inProgressPath);
            if (existingIdx >= 0) {
              newFiles[existingIdx] = { path: inProgressPath, content: stripFileTags(inProgressContent), isComplete: false };
            } else {
              addLog(`Generating: ${inProgressPath}`, "processing");
              newFiles.push({ path: inProgressPath, content: stripFileTags(inProgressContent), isComplete: false });
            }
            return newFiles;
          });
        }
      }

      // Handle docs mode (no <file> tags)
      if (files.length === 0 && buffer.trim() && outputMode === "docs") {
        const cleanContent = buffer.trim();
        setFiles([{ path: "DOCUMENTATION.md", content: cleanContent, isComplete: true }]);
        setSelectedPath("DOCUMENTATION.md");
      }

      addLog("Generation complete!", "success");
    } catch (e: any) {
      if (e.name !== "AbortError") { addLog(`Error: ${e.message}`, "error"); }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    try {
        const JSZip = (await import("jszip")).default;
        const zip = new JSZip();

        files.forEach(file => {
            zip.file(file.path, file.content);
        });

        const blob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${data?.workspaceTitle.replace(/\s+/g, "_") || "artifact"}_export.zip`;
        a.click();
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error("Error creating zip:", e);
        alert("Failed to create ZIP file.");
    }
  };

  const handleCopy = () => {
    const file = files.find(f => f.path === selectedPath);
    if (file) { navigator.clipboard.writeText(file.content); }
  };

  const selectedFile = files.find(f => f.path === selectedPath);
  const fileTree = buildFileTree(files.filter(f => f.isComplete || !f.isComplete));
  const completedCount = files.filter(f => f.isComplete).length;

  const currentCategories = outputMode === "code" ? CODE_CATEGORIES : DOCS_CATEGORIES;
  const currentTargets = outputMode === "code" ? CODE_TARGETS : DOCS_TARGETS;

  const handleModeChange = (mode: "code" | "docs") => {
    setOutputMode(mode);
    const newCats = mode === "code" ? CODE_CATEGORIES : DOCS_CATEGORIES;
    const newTargets = mode === "code" ? CODE_TARGETS : DOCS_TARGETS;
    setCategory(newCats[0]);
    setTarget(newTargets[newCats[0]][0]);
  };

  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#f0f4f9]">
      <Loader2 className="animate-spin text-indigo-500" size={32} />
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-[#f0f4f9] overflow-hidden font-sans text-slate-800">

      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 shrink-0 z-30">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push(`/workspace/${params.id}`)}
            className="flex items-center gap-1.5 text-black hover:text-slate-800 transition-colors font-medium text-[13px]">
            <ArrowLeft size={16} /> Back
          </button>
          <div className="h-4 w-[1px] bg-slate-300" />
          {data?.thumbnail && <img src={data.thumbnail} alt="" className="h-7 rounded border border-slate-200 object-contain bg-white" />}
          <span className="text-[14px] font-semibold text-slate-700">{data?.workspaceTitle || "Generation Hub"}</span>
          
          {isGenerating && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[11px] font-medium ml-2 shadow-sm">
              <Loader2 size={12} className="animate-spin" /> Generating...
            </div>
          )}
          {!isGenerating && completedCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full  border-2 border-emerald-200 text-emerald-600 text-[11px] font-medium ml-2 shadow-sm">
              <Check size={12} /> {completedCount} files generated
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {files.length > 0 && !isGenerating && (
            outputMode === "docs" ? (
              <div className="flex gap-2">
                <button onClick={handleDownloadMD}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold text-slate-800 hover:text-black bg-white hover:bg-slate-50 transition-all border border-slate-300 shadow-sm">
                  <FileText size={14} /> Download MD
                </button>
                <button onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold text-white hover:bg-slate-850 bg-slate-900 transition-all shadow-sm">
                  <File size={14} /> Export PDF
                </button>
              </div>
            ) : (
              <button onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold text-slate-800 hover:text-black bg-white hover:bg-slate-50 transition-all border border-slate-300 shadow-sm">
                <Download size={14} /> Download ZIP
              </button>
            )
          )}
          {files.length > 0 && (
            <button onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold text-slate-800 hover:text-black bg-white hover:bg-slate-50 transition-all border border-slate-300 shadow-sm">
              <Copy size={14} /> Copy Content
            </button>
          )}
          <button onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold text-slate-800 hover:text-black bg-white hover:bg-slate-50 transition-all border border-slate-300 shadow-sm">
            <Settings size={14} /> Settings
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden px-6 pb-6 gap-6">

        {/* Left Panel: Sources (Config) */}
        {isLeftPanelOpen ? (
          <div className="w-[380px] bg-white rounded-3xl flex flex-col shrink-0 overflow-hidden shadow-sm border-4 border-slate-200/60 transition-all duration-300">
            
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
              <span className="text-[14px] font-bold text-slate-900">Sources</span>
              <button onClick={() => setIsLeftPanelOpen(false)} className="text-slate-500 hover:text-slate-900 transition-colors bg-slate-100 hover:bg-slate-200 p-1.5 rounded-lg">
                <PanelLeftClose size={16} />
              </button>
            </div>

            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                {/* Mode */}
                <div>
                  <label className="block text-[12px] font-bold text-slate-800 uppercase tracking-wider mb-3">Output Mode</label>
                  <div className="flex gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                    {(["code", "docs"] as const).map(m => (
                      <button key={m} onClick={() => handleModeChange(m)}
                        className={`flex-1 py-2 rounded-lg text-[13px] font-semibold capitalize transition-all ${outputMode === m ? "bg-white text-slate-900 shadow-sm border border-slate-300" : "text-slate-600 hover:text-slate-900"}`}>
                        {m === "code" ? "Code" : "Docs"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[12px] font-bold text-slate-800 uppercase tracking-wider mb-3">Category</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {currentCategories.map(c => (
                      <button key={c} onClick={() => { setCategory(c); setTarget(currentTargets[c][0]); }}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-semibold transition-all border ${category === c ? "bg-indigo-100 border-indigo-300 text-indigo-900" : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"}`}>
                        {getCategoryIcon(c)} {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target */}
                <div>
                  <label className="block text-[12px] font-bold text-slate-800 uppercase tracking-wider mb-3">Target Framework</label>
                  <select value={target} onChange={e => setTarget(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-3 text-[13px] font-semibold text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all cursor-pointer shadow-sm">
                    {(currentTargets[category] || []).map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
            </div>

            <div className="p-5 shrink-0 border-t border-slate-200 bg-white">
                <button onClick={handleGenerate} disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full text-white font-bold text-[14px] transition-all bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-slate-900/20">
                  {isGenerating ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : <><Zap size={16} className="fill-current" /> Generate Artifact</>}
                </button>
            </div>
          </div>
        ) : (
          <div className="w-[68px] bg-white rounded-[24px] flex flex-col items-center py-5 shrink-0 shadow-sm border border-slate-200/60 transition-all duration-300">
             <button onClick={() => setIsLeftPanelOpen(true)} className="p-2 text-slate-600 hover:text-black transition-all" title="Open Sources">
                <PanelLeftOpen size={20} />
             </button>
             <div className="w-8 h-[1px] bg-slate-200 my-4" />
             
             {/* Decorative icons to match NotebookLM collapsed bar aesthetic */}
             <div className="flex flex-col gap-3 w-full items-center">
                <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500"><Layers size={20} /></div>
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500"><Database size={20} /></div>
                <div className="w-11 h-11 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500"><Cpu size={20} /></div>
             </div>
          </div>
        )}

        {/* Right Panel: Chat/Content Area (File Explorer + Code Viewer + Logs) */}
        <div className="flex-1 bg-white rounded-3xl flex flex-col overflow-hidden shadow-sm border-4 border-slate-200/60 relative">
          
          <div className="flex-1 flex overflow-hidden">
            
            {/* File Explorer side (Only visible if generated files exist) */}
            {(files.length > 0 || isGenerating) && isFileExplorerOpen && (
              <div className="w-[260px] border-r border-slate-100 flex flex-col bg-slate-50/30 shrink-0 transition-all duration-300">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-semibold text-slate-600 uppercase tracking-wider">Explorer</span>
                    {files.length > 0 && <span className="text-[11px] font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{files.length}</span>}
                  </div>
                  <button onClick={() => setIsFileExplorerOpen(false)} className="text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-lg transition-colors" title="Collapse Explorer">
                    <PanelLeftClose size={16} />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto px-3 py-3">
                  {files.length === 0 && isGenerating && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 text-[12px] text-center px-4 gap-3">
                      <Loader2 size={24} className="animate-spin text-indigo-400" />
                      <span>Discovering files...</span>
                    </div>
                  )}
                  {files.length > 0 && (
                    <FileTree nodes={fileTree} selectedPath={selectedPath} onSelect={setSelectedPath} files={files} />
                  )}
                </div>
              </div>
            )}

            {/* Collapsed File Explorer Bar */}
            {(files.length > 0 || isGenerating) && !isFileExplorerOpen && (
              <div className="w-14 border-r border-slate-100 flex flex-col items-center py-4 bg-white shrink-0 transition-all duration-300">
                <button onClick={() => setIsFileExplorerOpen(true)} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-lg transition-all" title="Expand Explorer">
                  <PanelLeftOpen size={18} />
                </button>
              </div>
            )}

            {/* Code Viewer Side */}
            <div className="flex-1 flex flex-col overflow-hidden relative bg-white">
              {/* Tab bar */}
              {selectedFile ? (
                <div className="flex items-center justify-between bg-white border-b border-slate-100 h-14 shrink-0 px-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-[13px] text-indigo-800 shadow-sm font-medium">
                    <File size={14} className="text-indigo-500" />
                    <span>{selectedFile.path.split("/").pop()}</span>
                    {!selectedFile.isComplete && <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse ml-1" />}
                  </div>
                  {selectedFile.path.endsWith('.md') && (
                    <div className="flex gap-1 p-0.5 bg-slate-100 rounded-full border border-slate-200 shadow-sm">
                      <button onClick={() => setIsPreviewMode(false)}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold capitalize transition-all ${!isPreviewMode ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                        Code
                      </button>
                      <button onClick={() => setIsPreviewMode(true)}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold capitalize transition-all ${isPreviewMode ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                        Preview
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-14 border-b border-slate-100 bg-white shrink-0 flex items-center px-6">
                  <span className="text-[13px] font-medium text-black">Content Viewer</span>
                </div>
              )}

              {/* Viewer Content */}
              <div className="flex-1 overflow-hidden relative">
                {!selectedFile && !isGenerating && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-black gap-4 bg-slate-50/50">
                    <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                      <Layers size={28} className="text-black" />
                    </div>
                    <p className="text-[14px] font-medium">Select your configuration on the left and generate</p>
                  </div>
                )}
                {isGenerating && !selectedFile && (
                  <div className="absolute inset-0 p-6 flex flex-col gap-4 overflow-hidden bg-white">
                    {/* Skeleton loader - animated shimmer lines */}
                    <div className="flex flex-col gap-3">
                      <div className="h-5 rounded-lg bg-slate-200 animate-pulse w-3/4" />
                      <div className="h-4 rounded-lg bg-slate-100 animate-pulse w-full" />
                      <div className="h-4 rounded-lg bg-slate-100 animate-pulse w-5/6" />
                      <div className="h-4 rounded-lg bg-slate-100 animate-pulse w-full" />
                    </div>
                    <div className="flex flex-col gap-3 mt-2">
                      <div className="h-5 rounded-lg bg-slate-200 animate-pulse w-1/2" />
                      <div className="h-4 rounded-lg bg-slate-100 animate-pulse w-full" />
                      <div className="h-4 rounded-lg bg-slate-100 animate-pulse w-4/5" />
                      <div className="h-4 rounded-lg bg-slate-100 animate-pulse w-full" />
                      <div className="h-4 rounded-lg bg-slate-100 animate-pulse w-3/5" />
                    </div>
                    <div className="flex flex-col gap-3 mt-2">
                      <div className="h-5 rounded-lg bg-slate-200 animate-pulse w-2/3" />
                      <div className="h-20 rounded-xl bg-slate-100 animate-pulse w-full" />
                    </div>
                    <div className="flex flex-col gap-3 mt-2">
                      <div className="h-4 rounded-lg bg-slate-100 animate-pulse w-full" />
                      <div className="h-4 rounded-lg bg-slate-100 animate-pulse w-3/4" />
                    </div>
                  </div>
                )}
                {selectedFile && (
                  <div className="h-full overflow-auto custom-scrollbar bg-white">
                    {selectedFile.path.endsWith('.md') && isPreviewMode ? (
                      <div id="markdown-preview-container" className="prose prose-slate max-w-none p-8 overflow-y-auto h-full text-slate-800 bg-white">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({node, ...props}) => <h1 className="text-3xl font-extrabold text-slate-900 border-b border-slate-200 pb-3 mb-6 mt-8 first:mt-0" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-2xl font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4 mt-8" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-xl font-semibold text-slate-800 mb-3 mt-6" {...props} />,
                            p: ({node, ...props}) => <p className="leading-7 text-slate-700 mb-4 text-[14px]" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 space-y-2 text-slate-700 text-[14px]" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4 space-y-2 text-slate-700 text-[14px]" {...props} />,
                            li: ({node, ...props}) => <li className="leading-6" {...props} />,
                            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-slate-300 pl-4 italic text-slate-600 my-4" {...props} />,
                            code: ({node, inline, className, children, ...props}: any) => {
                              const match = /language-(\w+)/.exec(className || '');
                              return !inline && match ? (
                                <pre className="bg-slate-50 p-4 rounded-xl border border-slate-200 my-4 overflow-x-auto">
                                  <code className="text-slate-800 text-[13px] font-mono" {...props}>{children}</code>
                                </pre>
                              ) : (
                                <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 text-[13px] font-mono font-semibold" {...props}>{children}</code>
                              );
                            },
                            table: ({node, ...props}) => <table className="min-w-full divide-y divide-slate-200 my-6 border border-slate-200 rounded-xl overflow-hidden shadow-sm" {...props} />,
                            thead: ({node, ...props}) => <thead className="bg-slate-50" {...props} />,
                            th: ({node, ...props}) => <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200" {...props} />,
                            td: ({node, ...props}) => <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 border-b border-slate-100" {...props} />,
                          }}
                        >
                          {selectedFile.content || ""}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <SyntaxHighlighter
                        language={getLanguage(selectedFile.path)}
                        style={prism}
                        customStyle={{ margin: 0, minHeight: "100%", fontSize: "13.5px", borderRadius: 0, background: "transparent", padding: "1.5rem" }}
                        showLineNumbers
                      >
                        {selectedFile.content || ""}
                      </SyntaxHighlighter>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Log Console (Bottom of right panel) */}
          <div className="h-44 bg-slate-50 border-t border-slate-100 flex flex-col shrink-0">
            <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-white">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
              <span className="text-[11px] font-bold text-black uppercase tracking-widest">Generation Logs</span>
            </div>
            <div className="flex-1 overflow-hidden p-2">
              <LogConsole logs={logs} />
            </div>
          </div>

        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] w-[420px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <span className="text-[15px] font-bold text-slate-900 flex items-center gap-2"><Settings size={18} className="text-slate-500" /> Advanced Settings</span>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-900 hover:bg-slate-100 p-2 rounded-full transition-all">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-6">
               <div>
                  <label className="block text-[12px] font-bold text-slate-800 uppercase tracking-wider mb-2.5">AI Engine</label>
                  <select value={advancedConfig.model} onChange={e => setAdvancedConfig({...advancedConfig, model: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[13px] font-semibold text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer">
                     <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fast)</option>
                     <option value="gemini-2.5-pro">Gemini 2.5 Pro (Powerful)</option>
                     <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                  </select>
               </div>
               <div>
                  <label className="block text-[12px] font-bold text-slate-800 uppercase tracking-wider mb-2.5">Custom System Instructions</label>
                  <textarea value={advancedConfig.customInstructions} onChange={e => setAdvancedConfig({...advancedConfig, customInstructions: e.target.value})} placeholder="E.g., Always use TypeScript, prefer functional components..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[13px] text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all h-20 resize-none"></textarea>
               </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
               <button onClick={() => setIsSettingsOpen(false)} className="px-6 py-2.5 bg-slate-900 text-white font-bold text-[13px] rounded-full hover:bg-black transition-all shadow-md shadow-slate-900/10">Save Configuration</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
