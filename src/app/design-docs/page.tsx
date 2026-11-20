"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft, FileText, Search, X, Mic,
    GitCommit, AlertTriangle, CheckCircle,
    ThumbsUp, MessageCircle, AlertCircle, GitBranch,
    Link2, ChevronDown, ChevronUp, Square,
    Github, Plus, ChevronRight, Trash2, PenLine
} from "lucide-react";
import NextLink from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getCurrentSession } from "@/lib/supabase-client";

type DocType = "RFC" | "PRD" | "ADR";
type DriftLevel = "clean" | "warn" | "violated";
type RecorderState = "idle" | "recording" | "processing" | "done";

interface TeamSignal { id: string; engineer: string; initial: string; signal: "approve" | "concern" | "question"; note: string }
interface DriftFile { path: string; reason: string; commits: number }
interface LinkedCommit { sha: string; message: string; author: string; ago: string }
interface Section { heading: string; body: string }

interface Doc {
    id: string; title: string; type: string; status: string;
    drift: DriftLevel; summary: string; updatedAt: string; createdAt: string;
    sections: Section[];
    driftFiles: DriftFile[];
    teamSignals: TeamSignal[];
    linkedCommits: LinkedCommit[];
    linkedDocIds: string[];
}

interface ConnectedRepo { id: string; repoUrl: string; repoName: string }

const TYPE_STYLES: Record<string, string> = {
    RFC: "bg-blue-50 text-blue-700",
    PRD: "bg-orange-50 text-orange-700",
    ADR: "bg-purple-50 text-purple-700",
};
const DRIFT_CFG: Record<DriftLevel, { label: string; badge: string; icon: React.ComponentType<{ className?: string }> }> = {
    clean: { label: "Code aligned", badge: "bg-emerald-50 text-emerald-700", icon: CheckCircle },
    warn: { label: "Partial drift", badge: "bg-amber-50 text-amber-700", icon: AlertCircle },
    violated: { label: "Decision violated", badge: "bg-red-50 text-red-700", icon: AlertTriangle },
};
const SIG_CFG = {
    approve: { color: "text-emerald-600", bg: "bg-emerald-50", icon: ThumbsUp },
    concern: { color: "text-amber-600", bg: "bg-amber-50", icon: AlertTriangle },
    question: { color: "text-blue-500", bg: "bg-blue-50", icon: MessageCircle },
};
const TEMPLATES = [
    { type: "RFC" as DocType, name: "Request for Comments", sections: ["Problem", "Solution", "Alternatives", "Open Questions"] },
    { type: "PRD" as DocType, name: "Product Requirements", sections: ["Goals", "User Stories", "Requirements", "Metrics"] },
    { type: "ADR" as DocType, name: "Architecture Decision", sections: ["Context", "Decision", "Consequences", "Alternatives"] },
];

function authHeaders(): Record<string, string> {
    const session = getCurrentSession();
    if (!session) return {};
    return { Authorization: `Bearer ${session.idToken}`, "Content-Type": "application/json" };
}

// Extend Window for SpeechRecognition
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

function VoiceRecorderSheet({ onClose, onSave }: { onClose: () => void; onSave: (doc: Doc) => void }) {
    const [state, setState] = useState<RecorderState>("idle");
    const [seconds, setSeconds] = useState(0);
    const [title, setTitle] = useState("");
    const [selectedType, setSelectedType] = useState<DocType>("RFC");
    const [transcript, setTranscript] = useState("");
    const [error, setError] = useState("");
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const recognitionRef = useRef<any>(null);

    const start = () => {
        setError(""); setTranscript("");
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) { setError("Your browser doesn't support speech recognition. Use Chrome or Edge."); return; }

        const recognition = new SR();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        let finalTranscript = "";
        recognition.onresult = (e: any) => {
            let interim = "";
            for (let i = e.resultIndex; i < e.results.length; i++) {
                if (e.results[i].isFinal) finalTranscript += e.results[i][0].transcript + " ";
                else interim += e.results[i][0].transcript;
            }
            setTranscript(finalTranscript + interim);
        };
        recognition.onerror = (e: any) => setError("Mic error: " + e.error);

        recognitionRef.current = recognition;
        recognition.start();
        setState("recording");
        intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    };

    const stop = () => {
        recognitionRef.current?.stop();
        if (intervalRef.current) clearInterval(intervalRef.current);
        setState("processing");
    };

    // Once processing, call Gemini to structure
    useEffect(() => {
        if (state !== "processing") return;
        const finalTranscript = transcript.trim();
        if (!finalTranscript) { setState("done"); return; }

        fetch("/api/design-docs/structure", {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ transcript: finalTranscript, type: selectedType }),
        })
            .then((r) => r.json())
            .then((data) => {
                if (data.error) throw new Error(data.error);
                // Temporarily store structured result to use in save
                recognitionRef.current = { structured: data };
                setState("done");
            })
            .catch((e) => { setError(e.message); setState("done"); });
    }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

    const save = async () => {
        const structured = recognitionRef.current?.structured;
        const sections = structured?.sections ?? TEMPLATES.find((t) => t.type === selectedType)!.sections.map((h: string) => ({ heading: h, body: "" }));
        const summary = structured?.summary ?? "";
        try {
            const res = await fetch("/api/design-docs", {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({ title: title || "Untitled decision", type: selectedType, sections, summary }),
            });
            if (!res.ok) throw new Error(await res.text());
            onSave(await res.json());
            onClose();
        } catch (e: any) { setError(e.message); }
    };

    useEffect(() => () => { recognitionRef.current?.stop?.(); if (intervalRef.current) clearInterval(intervalRef.current); }, []);
    const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center pb-10 px-6">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={state === "idle" ? onClose : undefined} />
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
                className="relative w-full max-w-lg bg-white dark:bg-dark-card rounded-3xl shadow-2xl border border-gray-100 dark:border-dark-border p-6 z-10">

                {state === "processing" && (
                    <div className="flex flex-col items-center py-10 gap-3">
                        <div className="w-9 h-9 border-2 border-[#2d8b6e] border-t-transparent rounded-full animate-spin" />
                        <p className="text-[13px] font-semibold text-gray-700 dark:text-dark-text">Structuring your decision with Genesis…</p>
                        <p className="text-[11px] text-gray-400 dark:text-dark-subtle text-center max-w-[260px]">{transcript.slice(0, 100)}{transcript.length > 100 ? "…" : ""}</p>
                    </div>
                )}

                {state === "done" && (
                    <div className="flex flex-col items-center py-8 gap-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="text-center">
                            <p className="text-[14px] font-semibold text-gray-900 dark:text-dark-text mb-1">Doc structured by AI</p>
                            <p className="text-[12px] text-gray-400 dark:text-dark-subtle">Sections filled from your voice — ready to review</p>
                        </div>
                        {error && <p className="text-[11px] text-red-500 text-center">{error}</p>}
                        <div className="flex gap-2 w-full">
                            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-100 dark:border-dark-border text-[12px] font-semibold text-gray-500 dark:text-dark-muted hover:bg-gray-50 dark:hover:bg-dark-border">Discard</button>
                            <button onClick={save} className="flex-1 py-2.5 rounded-xl bg-[#2d8b6e] hover:bg-[#236b55] text-white text-[12px] font-semibold">Save to docs</button>
                        </div>
                    </div>
                )}

                {(state === "idle" || state === "recording") && (
                    <>
                        <div className="flex items-center justify-between mb-5">
                            <p className="text-[14px] font-semibold text-gray-900 dark:text-dark-text">Record a decision</p>
                            <button onClick={onClose}><X className="w-4 h-4 text-gray-400 dark:text-dark-subtle hover:text-gray-600 dark:hover:text-dark-muted" /></button>
                        </div>
                        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What decision are you documenting?"
                            className="w-full text-[13px] text-gray-800 dark:text-dark-text placeholder-gray-300 dark:placeholder-dark-subtle bg-gray-50 dark:bg-dark-border border border-gray-100 dark:border-dark-border rounded-xl px-4 py-2.5 mb-4 outline-none focus:border-[#2d8b6e]/30" />
                        <div className="flex gap-2 mb-4">
                            {TEMPLATES.map((t) => (
                                <button key={t.type} onClick={() => setSelectedType(t.type)}
                                    className={`flex-1 py-2 rounded-xl text-[11px] font-semibold uppercase tracking-wide border transition-all ${selectedType === t.type ? "bg-[#2d8b6e] text-white border-[#2d8b6e]" : "bg-white dark:bg-dark-bg text-gray-500 dark:text-dark-muted border-gray-100 dark:border-dark-border hover:border-gray-200 dark:hover:border-dark-subtle"}`}>
                                    {t.type}
                                </button>
                            ))}
                        </div>

                        {/* Live transcript */}
                        {state === "recording" && (
                            <div className="bg-gray-50 dark:bg-dark-border rounded-xl p-3 mb-4 min-h-[48px]">
                                <p className="text-[11px] text-gray-500 dark:text-dark-muted leading-relaxed">
                                    {transcript || <span className="text-gray-300 italic">Listening…</span>}
                                </p>
                            </div>
                        )}

                        {error && <p className="text-[11px] text-red-500 mb-3">{error}</p>}

                        {state === "idle" ? (
                            <button onClick={start} className="w-full flex items-center justify-center gap-2 bg-[#2d8b6e] hover:bg-[#236b55] text-white py-3 rounded-xl text-[13px] font-semibold">
                                <Mic className="w-4 h-4" /> Start recording
                            </button>
                        ) : (
                            <div className="flex items-center gap-3">
                                <div className="flex-1 flex items-end gap-0.5 h-9 bg-[#2d8b6e]/6 rounded-xl px-3 overflow-hidden">
                                    {Array.from({ length: 32 }).map((_, i) => (
                                        <motion.div key={i} className="flex-1 bg-[#2d8b6e] rounded-full"
                                            animate={{ scaleY: [0.15, Math.random() * 0.9 + 0.1, 0.15] }}
                                            transition={{ duration: 0.4 + Math.random() * 0.4, repeat: Infinity, delay: i * 0.025 }}
                                            style={{ transformOrigin: "bottom" }} />
                                    ))}
                                </div>
                                <span className="text-[13px] font-mono font-semibold text-[#2d8b6e] w-10 text-right tabular-nums">{fmt(seconds)}</span>
                                <button onClick={stop} className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-[12px] font-semibold">
                                    <Square className="w-3 h-3 fill-current" /> Stop
                                </button>
                            </div>
                        )}
                    </>
                )}
            </motion.div>
        </div>
    );
}

function WriteDocSheet({ onClose, onSave }: { onClose: () => void; onSave: (doc: Doc) => void }) {
    const [title, setTitle] = useState("");
    const [selectedType, setSelectedType] = useState<DocType>("RFC");
    const [sections, setSections] = useState<Section[]>(
        TEMPLATES[0].sections.map((h) => ({ heading: h, body: "" }))
    );
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const switchType = (type: DocType) => {
        setSelectedType(type);
        setSections(TEMPLATES.find((t) => t.type === type)!.sections.map((h) => ({ heading: h, body: "" })));
    };

    const save = async () => {
        if (!title.trim()) { setError("Title is required."); return; }
        setSaving(true); setError("");
        try {
            const res = await fetch("/api/design-docs", {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({ title: title.trim(), type: selectedType, sections, summary: sections[0]?.body?.slice(0, 120) || "" }),
            });
            if (!res.ok) throw new Error(await res.text());
            const doc = await res.json();
            onSave(doc);
            onClose();
        } catch (e: any) {
            setError(e.message);
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
                className="relative w-full max-w-2xl bg-white dark:bg-dark-card rounded-xl shadow-2xl border border-gray-100 dark:border-dark-border z-10 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-dark-border flex-shrink-0">
                    <p className="text-[14px] font-semibold text-gray-900 dark:text-dark-text">Write a decision doc</p>
                    <button onClick={onClose}><X className="w-4 h-4 text-gray-400 dark:text-dark-subtle hover:text-gray-600 dark:hover:text-dark-muted" /></button>
                </div>

                <div className="overflow-y-auto flex-1 p-6 space-y-4">
                    {/* Title */}
                    <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Decision title…"
                        className="w-full text-[15px] font-semibold text-gray-900 dark:text-dark-text placeholder-gray-300 dark:placeholder-dark-subtle bg-transparent border-b border-gray-100 dark:border-dark-border pb-3 outline-none focus:border-[#2d8b6e]/40" />

                    {/* Type picker */}
                    <div className="flex gap-2">
                        {TEMPLATES.map((t) => (
                            <button key={t.type} onClick={() => switchType(t.type)}
                                className={`flex-1 py-2 rounded-xl text-[11px] font-semibold uppercase tracking-wide border transition-all ${selectedType === t.type ? "bg-[#2d8b6e] text-white border-[#2d8b6e]" : "bg-white dark:bg-dark-bg text-gray-500 dark:text-dark-muted border-gray-100 dark:border-dark-border hover:border-gray-200 dark:hover:border-dark-subtle"}`}>
                                {t.type}
                            </button>
                        ))}
                    </div>

                    {/* Sections */}
                    <div className="space-y-3">
                        {sections.map((s, i) => (
                            <div key={s.heading} className="bg-gray-50 dark:bg-dark-border rounded-xl p-4">
                                <p className="text-[11px] font-semibold text-gray-500 dark:text-dark-subtle uppercase tracking-widest mb-2">{s.heading}</p>
                                <textarea
                                    value={s.body}
                                    onChange={(e) => setSections((prev) => prev.map((sec, idx) => idx === i ? { ...sec, body: e.target.value } : sec))}
                                    placeholder={`Write your ${s.heading.toLowerCase()}…`}
                                    rows={3}
                                    className="w-full bg-transparent text-[12px] text-gray-700 dark:text-dark-text placeholder-gray-300 dark:placeholder-dark-subtle outline-none resize-none leading-relaxed"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-dark-border flex-shrink-0">
                    {error ? <p className="text-[11px] text-red-500">{error}</p> : <span />}
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-100 dark:border-dark-border text-[12px] font-semibold text-gray-500 dark:text-dark-muted hover:bg-gray-50 dark:hover:bg-dark-border">Cancel</button>
                        <button onClick={save} disabled={saving}
                            className="px-5 py-2 rounded-xl bg-[#2d8b6e] hover:bg-[#236b55] text-white text-[12px] font-semibold disabled:opacity-50 flex items-center gap-2">
                            {saving && <div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />}
                            Save doc
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

function RepoConnectPanel({ repos, onConnect, onDisconnect, onDriftScanned }: {
    repos: ConnectedRepo[];
    onConnect: (repo: ConnectedRepo) => void;
    onDisconnect: (id: string) => void;
    onDriftScanned: () => void;
}) {
    const [repoUrl, setRepoUrl] = useState("");
    const [connecting, setConnecting] = useState(false);
    const [scanning, setScanning] = useState<string | null>(null);
    const [scanResult, setScanResult] = useState<string>("");
    const [error, setError] = useState("");

    const scanDrift = async (repoId: string) => {
        setScanning(repoId); setScanResult(""); setError("");
        try {
            const res = await fetch("/api/repos/scan-drift", {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({ repoId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setScanResult(`Scanned ${data.scanned} approved docs.`);
            onDriftScanned();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setScanning(null);
        }
    };

    const connect = async () => {
        if (!repoUrl.trim()) return;
        setConnecting(true); setError("");
        try {
            const res = await fetch("/api/repos", {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({ repoUrl: repoUrl.trim() }),
            });
            if (!res.ok) throw new Error(await res.text());
            const repo = await res.json();
            onConnect(repo);
            setRepoUrl("");
        } catch (e: any) {
            setError("Could not connect. Check the URL and try again.");
        } finally {
            setConnecting(false);
        }
    };

    const disconnect = async (id: string) => {
        await fetch(`/api/repos?id=${id}`, { method: "DELETE", headers: authHeaders() });
        onDisconnect(id);
    };

    return (
        <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
                <GitBranch className="w-4 h-4 text-[#2d8b6e]" />
                <p className="text-[13px] font-semibold text-gray-900 dark:text-dark-text">Connected repositories</p>
            </div>

            {repos.length > 0 && (
                <div className="mb-4 space-y-2">
                    {repos.map((r) => (
                        <div key={r.id} className="flex items-center gap-3 bg-gray-50 dark:bg-dark-border rounded-xl px-3 py-2.5">
                            <Github className="w-3.5 h-3.5 text-gray-500 dark:text-dark-muted flex-shrink-0" />
                            <span className="text-[12px] font-semibold text-gray-800 dark:text-dark-text flex-1 truncate">{r.repoName}</span>
                            <button onClick={() => scanDrift(r.id)} disabled={scanning === r.id}
                                className="text-[10px] font-semibold text-[#2d8b6e] bg-[#2d8b6e]/8 hover:bg-[#2d8b6e]/15 px-2 py-0.5 rounded flex items-center gap-1 disabled:opacity-50 transition-all">
                                {scanning === r.id ? <div className="w-2.5 h-2.5 border border-[#2d8b6e]/40 border-t-[#2d8b6e] rounded-full animate-spin" /> : null}
                                {scanning === r.id ? "Scanning…" : "Scan drift"}
                            </button>
                            <button onClick={() => disconnect(r.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                    {scanResult && <p className="text-[11px] text-emerald-600 font-medium">{scanResult}</p>}
                    {error && <p className="text-[11px] text-red-500">{error}</p>}
                </div>
            )}

            <div className="flex gap-2 mb-2">
                <div className="relative flex-1">
                    <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && connect()}
                        placeholder="https://github.com/org/repo"
                        className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[12px] text-gray-700 placeholder-gray-300 outline-none focus:border-[#2d8b6e]/30" />
                </div>
                <button onClick={connect} disabled={!repoUrl.trim() || connecting}
                    className="px-4 py-2.5 rounded-xl bg-[#2d8b6e] hover:bg-[#236b55] disabled:opacity-40 text-white text-[12px] font-semibold flex items-center gap-2">
                    {connecting ? <div className="w-3.5 h-3.5 border border-white/40 border-t-white rounded-full animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                    Connect
                </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                    { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20", title: "Drift alerts", desc: "Commits that violate an approved decision trigger an alert" },
                    { icon: GitCommit, color: "text-[#2d8b6e]", bg: "bg-[#2d8b6e]/6", title: "Commit linking", desc: "Docs auto-link to the commits that implement them" },
                    { icon: CheckCircle, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20", title: "Live verification", desc: "Decisions stay accurate as the codebase evolves" },
                ].map((f) => (
                    <div key={f.title} className={`${f.bg} rounded-xl p-3`}>
                        <f.icon className={`w-3.5 h-3.5 ${f.color} mb-2`} />
                        <p className="text-[11px] font-semibold text-gray-800 dark:text-dark-text mb-0.5">{f.title}</p>
                        <p className="text-[10px] text-gray-500 dark:text-dark-subtle leading-snug">{f.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function DesignDocsPage() {
    const router = useRouter();
    const { user, logout } = useAuth(true);
    const [docs, setDocs] = useState<Doc[]>([]);
    const [repos, setRepos] = useState<ConnectedRepo[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");
    const [filterType, setFilterType] = useState<"All" | DocType>("All");
    const [filterDrift, setFilterDrift] = useState<"All" | DriftLevel>("All");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [openSection, setOpenSection] = useState<string | null>(null);
    const [showRecorder, setShowRecorder] = useState(false);
    const [showWriter, setShowWriter] = useState(false);
    const [signalLoading, setSignalLoading] = useState(false);

    const selectedDoc = docs.find((d) => d.id === selectedId) ?? null;
    const violated = docs.filter((d) => d.drift === "violated").length;

    const load = useCallback(async () => {
        const [docsRes, reposRes] = await Promise.all([
            fetch("/api/design-docs", { headers: authHeaders() }),
            fetch("/api/repos", { headers: authHeaders() }),
        ]);
        if (docsRes.ok) setDocs(await docsRes.json());
        if (reposRes.ok) setRepos(await reposRes.json());
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleSave = (doc: Doc) => setDocs((prev) => [doc, ...prev]);

    const handleSignal = async (signal: "approve" | "concern" | "question") => {
        if (!selectedDoc) return;
        setSignalLoading(true);
        const res = await fetch(`/api/design-docs/${selectedDoc.id}/signals`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ signal, note: "" }),
        });
        if (res.ok) {
            const updated = await fetch(`/api/design-docs/${selectedDoc.id}`, { headers: authHeaders() });
            if (updated.ok) {
                const doc = await updated.json();
                setDocs((prev) => prev.map((d) => d.id === doc.id ? doc : d));
            }
        }
        setSignalLoading(false);
    };

    const handleDelete = async (id: string) => {
        await fetch(`/api/design-docs/${id}`, { method: "DELETE", headers: authHeaders() });
        setDocs((prev) => prev.filter((d) => d.id !== id));
        if (selectedId === id) setSelectedId(null);
    };

    const filtered = docs.filter((d) => {
        const q = query.toLowerCase();
        const matchQ = !q || d.title.toLowerCase().includes(q) || d.summary.toLowerCase().includes(q);
        const matchT = filterType === "All" || d.type === filterType;
        const matchD = filterDrift === "All" || d.drift === filterDrift;
        return matchQ && matchT && matchD;
    });

    return (
        <main className="relative w-full min-h-screen bg-[#f7f8fa] dark:bg-dark-bg">

            {/* Header */}
            <header className="sticky top-0 z-20 w-full bg-white/80 dark:bg-dark-bg/95 backdrop-blur-md border-b border-gray-100 dark:border-dark-border">
                <div className="w-full px-6 h-14 flex items-center gap-4">
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <NextLink href="/home" className="flex items-center gap-1.5 text-gray-400 dark:text-dark-subtle hover:text-gray-700 dark:hover:text-dark-muted transition-colors group">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                            <span className="text-[13px] font-medium">Back</span>
                        </NextLink>
                        <span className="text-gray-200 dark:text-dark-subtle">|</span>
                        <div className="flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-[#2d8b6e]" />
                            <span className="font-semibold text-gray-900 dark:text-dark-text text-[14px]">Design Docs</span>
                        </div>
                    </div>
                    <div className="flex-1 max-w-xs relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 dark:text-dark-subtle" />
                        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search decisions…"
                            className="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-dark-border border border-gray-100 dark:border-dark-border rounded-lg text-[12px] text-gray-700 dark:text-dark-text placeholder-gray-300 dark:placeholder-dark-subtle outline-none focus:border-[#2d8b6e]/30" />
                        {query && <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2"><X className="w-3 h-3 text-gray-300 dark:text-dark-subtle" /></button>}
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                        {["Library", "Settings"].map((item) => (
                            <button key={item} onClick={() => router.push(`/${item.toLowerCase()}`)}
                                className="text-[13px] text-gray-500 dark:text-dark-muted hover:text-gray-900 dark:hover:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-border px-3 py-1.5 rounded-lg transition-colors font-medium hidden md:block">
                                {item}
                            </button>
                        ))}
                        <button onClick={logout} className="text-[13px] text-gray-400 dark:text-dark-subtle hover:text-gray-600 dark:hover:text-dark-muted font-medium">Sign out</button>
                        <div className="w-8 h-8 rounded-full bg-google-blue flex items-center justify-center shadow-sm">
                            <span className="text-white font-semibold uppercase text-[12px]">{user?.firstName?.charAt(0) || user?.email?.charAt(0) || "?"}</span>
                        </div>
                    </div>
                </div>
            </header>

            {violated > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-800/30 px-6 py-2.5">
                    <div className="w-full flex items-center gap-3">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                        <p className="text-[12px] font-semibold text-red-700 dark:text-red-400">{violated} decision{violated !== 1 ? "s" : ""} violated by recent commits</p>
                        <button onClick={() => setFilterDrift("violated")} className="ml-auto text-[11px] font-semibold text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline">Show only violated</button>
                    </div>
                </div>
            )}

            <div className="w-full px-6 pt-6 pb-20 flex gap-5">

                {/* Left: doc list */}
                <div className="w-[300px] flex-shrink-0 space-y-3">
                    {docs.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {(["All", "RFC", "PRD", "ADR"] as const).map((t) => (
                                <button key={t} onClick={() => setFilterType(t)}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${filterType === t ? "bg-[#2d8b6e] text-white" : "bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border text-gray-500 dark:text-dark-muted hover:border-gray-200 dark:hover:border-dark-subtle"}`}>
                                    {t}
                                </button>
                            ))}
                            <div className="w-px h-4 bg-gray-200 dark:bg-dark-border mx-0.5" />
                            {(["All", "violated", "warn", "clean"] as const).map((d) => (
                                <button key={d} onClick={() => setFilterDrift(d)}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${filterDrift === d ? "bg-gray-800 dark:bg-dark-text dark:text-dark-bg text-white" : "bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border text-gray-500 dark:text-dark-muted hover:border-gray-200 dark:hover:border-dark-subtle"}`}>
                                    {d === "violated" ? "🔴" : d === "warn" ? "🟡" : d === "clean" ? "🟢" : "All"}
                                </button>
                            ))}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex items-center justify-center py-10">
                            <div className="w-5 h-5 border-2 border-[#2d8b6e] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            {filtered.map((doc) => {
                                const DriftIcon = DRIFT_CFG[doc.drift as DriftLevel]?.icon ?? CheckCircle;
                                const isSelected = selectedId === doc.id;
                                return (
                                    <motion.div key={doc.id} layout className={`rounded-xl border transition-all ${isSelected ? "bg-white dark:bg-dark-card border-[#2d8b6e]/30 shadow-md" : "bg-white dark:bg-dark-card border-gray-100 dark:border-dark-border hover:border-gray-200 dark:hover:border-dark-subtle hover:shadow-sm"}`}>
                                        <button onClick={() => { setSelectedId(doc.id); setOpenSection(null); }} className="w-full text-left p-4">
                                            <div className="flex items-start gap-2 mb-2">
                                                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 ${TYPE_STYLES[doc.type] ?? "bg-gray-100 text-gray-600"}`}>{doc.type}</span>
                                                <p className="text-[12px] font-semibold text-gray-900 dark:text-dark-text leading-snug flex-1">{doc.title}</p>
                                            </div>
                                            <p className="text-[11px] text-gray-400 dark:text-dark-subtle leading-snug mb-3 line-clamp-2">{doc.summary}</p>
                                            <div className="flex items-center justify-between">
                                                <div className={`flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${DRIFT_CFG[doc.drift as DriftLevel]?.badge ?? "bg-gray-100 text-gray-500"}`}>
                                                    <DriftIcon className="w-2.5 h-2.5" />
                                                    {DRIFT_CFG[doc.drift as DriftLevel]?.label}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                                    {doc.teamSignals?.length > 0 && <span className="flex items-center gap-0.5"><MessageCircle className="w-2.5 h-2.5" />{doc.teamSignals.length}</span>}
                                                    <span>{new Date(doc.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                                                </div>
                                            </div>
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button onClick={() => setShowRecorder(true)}
                            className="flex-1 flex items-center justify-center gap-1.5 border border-dashed border-[#2d8b6e]/30 hover:border-[#2d8b6e]/60 rounded-xl py-2.5 text-[12px] font-semibold text-[#2d8b6e] hover:bg-[#2d8b6e]/4 transition-all">
                            <Mic className="w-3.5 h-3.5" />
                            Record
                        </button>
                        <button onClick={() => setShowWriter(true)}
                            className="flex-1 flex items-center justify-center gap-1.5 border border-dashed border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-subtle rounded-xl py-2.5 text-[12px] font-semibold text-gray-500 dark:text-dark-muted hover:bg-gray-50 dark:hover:bg-dark-border transition-all">
                            <PenLine className="w-3.5 h-3.5" />
                            Write
                        </button>
                    </div>
                </div>

                {/* Right */}
                <div className="flex-1 min-w-0 space-y-4">
                    {!selectedDoc ? (
                        <AnimatePresence mode="wait">
                            <motion.div key="onboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                                <RepoConnectPanel repos={repos}
                                    onConnect={(r) => setRepos((prev) => [r, ...prev])}
                                    onDisconnect={(id) => setRepos((prev) => prev.filter((r) => r.id !== id))}
                                    onDriftScanned={load} />

                                <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border shadow-sm p-6">
                                    <p className="text-[13px] font-semibold text-gray-900 dark:text-dark-text mb-1">Record your first decision</p>
                                    <p className="text-[12px] text-gray-400 dark:text-dark-subtle mb-5 leading-relaxed">
                                        Speak for 60 seconds about a decision your team is debating. Genesis structures it into an RFC, PRD, or ADR and routes it to the right reviewers — no calendar invite needed.
                                    </p>
                                    <div className="grid grid-cols-3 gap-3 mb-5">
                                        {TEMPLATES.map((t) => (
                                            <button key={t.type} onClick={() => setShowRecorder(true)}
                                                className="flex flex-col items-start gap-2 bg-gray-50 dark:bg-dark-border hover:bg-white dark:hover:bg-dark-card border border-gray-100 dark:border-dark-border hover:border-[#2d8b6e]/20 hover:shadow-sm rounded-xl p-4 text-left transition-all group">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${TYPE_STYLES[t.type]}`}>{t.type}</span>
                                                <p className="text-[11px] font-semibold text-gray-800 dark:text-dark-text">{t.name}</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {t.sections.map((s) => (
                                                        <span key={s} className="text-[9px] text-gray-400 dark:text-dark-subtle bg-white dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded px-1.5 py-0.5">{s}</span>
                                                    ))}
                                                </div>
                                                <span className="text-[10px] font-semibold text-[#2d8b6e] flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Record <ChevronRight className="w-3 h-3" />
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setShowRecorder(true)}
                                            className="flex items-center gap-2 bg-[#2d8b6e] hover:bg-[#236b55] text-white px-5 py-2.5 rounded-xl text-[13px] font-semibold">
                                            <Mic className="w-4 h-4" /> Start recording
                                        </button>
                                        <button onClick={() => setShowWriter(true)}
                                            className="flex items-center gap-2 border border-gray-200 hover:border-gray-300 text-gray-600 px-5 py-2.5 rounded-xl text-[13px] font-semibold hover:bg-gray-50 transition-all">
                                            <PenLine className="w-4 h-4" /> Write manually
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div key={selectedDoc.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-4">

                                <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border shadow-sm p-6">
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${TYPE_STYLES[selectedDoc.type] ?? "bg-gray-100 text-gray-600"}`}>{selectedDoc.type}</span>
                                            <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1 ${DRIFT_CFG[selectedDoc.drift as DriftLevel]?.badge}`}>
                                                {React.createElement(DRIFT_CFG[selectedDoc.drift as DriftLevel]?.icon ?? CheckCircle, { className: "w-3 h-3" })}
                                                {DRIFT_CFG[selectedDoc.drift as DriftLevel]?.label}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] text-gray-400">{new Date(selectedDoc.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                                            <button onClick={() => handleDelete(selectedDoc.id)} className="text-gray-200 hover:text-red-400 transition-colors ml-1">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                    <h2 className="text-[18px] font-semibold text-gray-900 dark:text-dark-text mb-1.5">{selectedDoc.title}</h2>
                                    <p className="text-[13px] text-gray-500 dark:text-dark-muted leading-relaxed">{selectedDoc.summary}</p>
                                </div>

                                {/* Code drift */}
                                <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border shadow-sm p-5">
                                    <div className="flex items-center gap-2 mb-4">
                                        <GitBranch className="w-3.5 h-3.5 text-gray-500 dark:text-dark-subtle" />
                                        <p className="text-[12px] font-semibold text-gray-700 dark:text-dark-text">Code drift</p>
                                        <span className="text-[10px] text-gray-400 dark:text-dark-subtle">— does your codebase still follow this decision?</span>
                                    </div>
                                    {(selectedDoc.driftFiles as DriftFile[]).length === 0 ? (
                                        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                            <p className="text-[12px] font-medium text-emerald-700">
                                                {repos.length > 0 ? "Codebase aligned with this decision." : "Connect a repository above to enable drift monitoring."}
                                            </p>
                                        </div>
                                    ) : (selectedDoc.driftFiles as DriftFile[]).map((f) => (
                                        <div key={f.path} className="bg-red-50 border border-red-100 rounded-xl p-3 mb-2">
                                            <div className="flex items-start gap-2">
                                                <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                                                <div className="min-w-0">
                                                    <code className="text-[11px] font-mono font-semibold text-red-700 break-all">{f.path}</code>
                                                    <p className="text-[11px] text-red-600 mt-0.5 leading-snug">{f.reason}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Sections */}
                                <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border shadow-sm overflow-hidden divide-y divide-gray-50 dark:divide-dark-border">
                                    {(selectedDoc.sections as Section[]).map((s) => (
                                        <div key={s.heading}>
                                            <button onClick={() => setOpenSection(openSection === s.heading ? null : s.heading)}
                                                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/60 dark:hover:bg-dark-border/40 text-left">
                                                <span className="text-[12px] font-semibold text-gray-800 dark:text-dark-text">{s.heading}</span>
                                                {openSection === s.heading ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                                            </button>
                                            <AnimatePresence>
                                                {openSection === s.heading && (
                                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                        <p className="px-5 pb-4 text-[12px] text-gray-500 dark:text-dark-muted leading-relaxed">
                                                            {s.body || <span className="italic text-gray-300">No content yet — edit this section.</span>}
                                                        </p>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}
                                </div>

                                {/* Team signals */}
                                <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border shadow-sm p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <MessageCircle className="w-3.5 h-3.5 text-gray-500 dark:text-dark-subtle" />
                                            <p className="text-[12px] font-semibold text-gray-700 dark:text-dark-text">Team signals</p>
                                        </div>
                                        <div className="flex gap-2">
                                            {(["approve", "concern", "question"] as const).map((sig) => {
                                                const count = selectedDoc.teamSignals?.filter((s) => s.signal === sig).length ?? 0;
                                                const cfg = SIG_CFG[sig];
                                                return (
                                                    <button key={sig} onClick={() => handleSignal(sig)} disabled={signalLoading}
                                                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${cfg.bg} ${cfg.color} border border-transparent hover:border-current/20 transition-all disabled:opacity-50`}>
                                                        {React.createElement(cfg.icon, { className: "w-3 h-3" })}
                                                        {count}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    {!selectedDoc.teamSignals?.length ? (
                                        <p className="text-[12px] text-gray-400 dark:text-dark-subtle">No signals yet. Be the first to approve or raise a concern.</p>
                                    ) : selectedDoc.teamSignals.map((sig, i) => {
                                        const cfg = SIG_CFG[sig.signal as keyof typeof SIG_CFG];
                                        return (
                                            <div key={i} className="flex items-start gap-2.5 mb-2.5">
                                                <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-dark-border flex items-center justify-center flex-shrink-0">
                                                    <span className="text-[9px] font-bold text-gray-600 dark:text-dark-muted">{sig.initial}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5 mb-0.5">
                                                        <span className="text-[11px] font-semibold text-gray-800 dark:text-dark-text">{sig.engineer}</span>
                                                        <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${cfg?.color}`}>
                                                            {cfg && React.createElement(cfg.icon, { className: "w-2.5 h-2.5" })} {sig.signal}
                                                        </span>
                                                    </div>
                                                    {sig.note && <p className="text-[11px] text-gray-500">{sig.note}</p>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {showRecorder && <VoiceRecorderSheet onClose={() => setShowRecorder(false)} onSave={handleSave} />}
                {showWriter && <WriteDocSheet onClose={() => setShowWriter(false)} onSave={handleSave} />}
            </AnimatePresence>
        </main>
    );
}
