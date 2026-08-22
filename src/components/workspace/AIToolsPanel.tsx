"use client";

/**
 * AIToolsPanel — the FlowState AI feature hub.
 *
 * A slide-in panel with four tabs, each backed by the FlowState backend:
 *   • Generate  → POST /api/workspaces/{id}/generate     (prompt → full diagram)
 *   • Templates → one-click starter architectures (drawn locally, instant)
 *   • Review    → POST /api/workspaces/{id}/review        (risks + suggestions)
 *   • Cost      → POST /api/workspaces/{id}/cost-estimate (itemized monthly $)
 *
 * The panel never touches the canvas directly — it calls the `drawGraph`
 * callback so all rendering stays in ExcalidrawWrapper's draw engine.
 */

import React, { useState } from "react";
import {
    Sparkles, X, Wand2, LayoutTemplate, ShieldCheck, DollarSign,
    Loader2, AlertTriangle, CheckCircle2, Info, Download,
} from "lucide-react";

// Backend base URL, derived from the WS URL so we hit the same host over HTTPS.
const WS = process.env.NEXT_PUBLIC_BACKEND_WS_URL ?? "ws://localhost:8000";
const API_BASE = WS.replace(/^wss:/, "https:").replace(/^ws:/, "http:").replace(/\/+$/, "");

export type Graph = {
    title?: string;
    nodes: { name: string; type: string; layer?: number }[];
    edges: { from: string; to: string; label?: string }[];
};

interface AIToolsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    workspaceId: string;
    drawGraph: (graph: Graph) => void;
    // Returns the components currently on the canvas, for review/cost context.
    getCanvasNodes: () => { name: string; type: string }[];
    // Exports the current canvas as PNG or SVG.
    exportCanvas: (format: "png" | "svg") => void;
}

type Tab = "generate" | "templates" | "review" | "cost";

// ── Starter templates — full connected graphs, drawn instantly ────────────────
const TEMPLATES: { id: string; label: string; desc: string; graph: Graph }[] = [
    {
        id: "3tier",
        label: "3-Tier Web App",
        desc: "Classic web / app / database layering behind a load balancer.",
        graph: {
            title: "3-Tier Web App",
            nodes: [
                { name: "Users", type: "client", layer: 0 },
                { name: "Load Balancer", type: "loadbalancer", layer: 1 },
                { name: "Web Server", type: "server", layer: 2 },
                { name: "App Server", type: "server", layer: 2 },
                { name: "Primary DB", type: "database", layer: 3 },
            ],
            edges: [
                { from: "Users", to: "Load Balancer", label: "HTTPS" },
                { from: "Load Balancer", to: "Web Server" },
                { from: "Web Server", to: "App Server", label: "API" },
                { from: "App Server", to: "Primary DB", label: "SQL" },
            ],
        },
    },
    {
        id: "serverless",
        label: "Serverless API",
        desc: "API Gateway + functions + managed data, fully event-driven.",
        graph: {
            title: "Serverless API",
            nodes: [
                { name: "Client", type: "client", layer: 0 },
                { name: "API Gateway", type: "gateway", layer: 1 },
                { name: "Auth", type: "auth", layer: 1 },
                { name: "Function", type: "microservice", layer: 2 },
                { name: "NoSQL DB", type: "database", layer: 3 },
                { name: "Object Storage", type: "storage", layer: 3 },
            ],
            edges: [
                { from: "Client", to: "API Gateway", label: "HTTPS" },
                { from: "API Gateway", to: "Auth", label: "verify" },
                { from: "API Gateway", to: "Function", label: "invoke" },
                { from: "Function", to: "NoSQL DB" },
                { from: "Function", to: "Object Storage" },
            ],
        },
    },
    {
        id: "microservices",
        label: "Microservices",
        desc: "Gateway routing to independent services with a message queue.",
        graph: {
            title: "Microservices Platform",
            nodes: [
                { name: "Client", type: "client", layer: 0 },
                { name: "API Gateway", type: "gateway", layer: 1 },
                { name: "Orders Service", type: "microservice", layer: 2 },
                { name: "Payments Service", type: "microservice", layer: 2 },
                { name: "Message Queue", type: "queue", layer: 2 },
                { name: "Orders DB", type: "database", layer: 3 },
                { name: "Cache", type: "cache", layer: 3 },
            ],
            edges: [
                { from: "Client", to: "API Gateway" },
                { from: "API Gateway", to: "Orders Service" },
                { from: "API Gateway", to: "Payments Service" },
                { from: "Orders Service", to: "Message Queue", label: "publish" },
                { from: "Payments Service", to: "Message Queue", label: "subscribe" },
                { from: "Orders Service", to: "Orders DB" },
                { from: "Orders Service", to: "Cache" },
            ],
        },
    },
    {
        id: "eventdriven",
        label: "Event-Driven Pipeline",
        desc: "Ingest → queue → processors → storage, decoupled and scalable.",
        graph: {
            title: "Event-Driven Pipeline",
            nodes: [
                { name: "Producers", type: "client", layer: 0 },
                { name: "Ingest Gateway", type: "gateway", layer: 1 },
                { name: "Event Queue", type: "queue", layer: 2 },
                { name: "Processor", type: "microservice", layer: 2 },
                { name: "Analytics DB", type: "database", layer: 3 },
                { name: "Data Lake", type: "storage", layer: 3 },
            ],
            edges: [
                { from: "Producers", to: "Ingest Gateway" },
                { from: "Ingest Gateway", to: "Event Queue", label: "emit" },
                { from: "Event Queue", to: "Processor", label: "consume" },
                { from: "Processor", to: "Analytics DB" },
                { from: "Processor", to: "Data Lake" },
            ],
        },
    },
];

const SEVERITY_STYLES: Record<string, { color: string; icon: React.ReactNode }> = {
    high: { color: "text-red-600 bg-red-50 border-red-200", icon: <AlertTriangle size={15} /> },
    medium: { color: "text-amber-600 bg-amber-50 border-amber-200", icon: <Info size={15} /> },
    low: { color: "text-blue-600 bg-blue-50 border-blue-200", icon: <CheckCircle2 size={15} /> },
};

export default function AIToolsPanel({
    isOpen, onClose, workspaceId, drawGraph, getCanvasNodes, exportCanvas,
}: AIToolsPanelProps) {
    const [tab, setTab] = useState<Tab>("generate");
    const [prompt, setPrompt] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [review, setReview] = useState<{ summary: string; findings: any[] } | null>(null);
    const [cost, setCost] = useState<any | null>(null);

    if (!isOpen) return null;

    const authHeaders = (): Record<string, string> => ({ "Content-Type": "application/json" });

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setBusy(true); setError(null);
        try {
            const res = await fetch(`${API_BASE}/api/workspaces/${workspaceId}/generate`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({ prompt: prompt.trim() }),
            });
            if (!res.ok) throw new Error(`Generation failed (${res.status})`);
            const graph: Graph = await res.json();
            if (!graph.nodes?.length) throw new Error("No components generated. Try rephrasing.");
            drawGraph(graph);
            onClose();
        } catch (e: any) {
            setError(e.message || "Generation failed");
        } finally {
            setBusy(false);
        }
    };

    const handleTemplate = (graph: Graph) => {
        drawGraph(graph);
        onClose();
    };

    const handleReview = async () => {
        setBusy(true); setError(null); setReview(null);
        try {
            const res = await fetch(`${API_BASE}/api/workspaces/${workspaceId}/review`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({ nodes: getCanvasNodes() }),
            });
            if (!res.ok) throw new Error(`Review failed (${res.status})`);
            setReview(await res.json());
        } catch (e: any) {
            setError(e.message || "Review failed");
        } finally {
            setBusy(false);
        }
    };

    const handleCost = async () => {
        setBusy(true); setError(null); setCost(null);
        try {
            const res = await fetch(`${API_BASE}/api/workspaces/${workspaceId}/cost-estimate`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({ nodes: getCanvasNodes() }),
            });
            if (!res.ok) throw new Error(`Cost estimate failed (${res.status})`);
            setCost(await res.json());
        } catch (e: any) {
            setError(e.message || "Cost estimate failed");
        } finally {
            setBusy(false);
        }
    };

    const TabButton = ({ id, icon, label }: { id: Tab; icon: React.ReactNode; label: string }) => (
        <button
            onClick={() => { setTab(id); setError(null); }}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${tab === id ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-500 hover:text-gray-700 border-b-2 border-transparent"}`}
        >
            {icon}
            {label}
        </button>
    );

    return (
        <div className="fixed inset-0 z-[2000] flex justify-end" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="w-full max-w-[420px] h-full bg-white shadow-2xl flex flex-col animate-slide-in-right">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                            <Sparkles size={17} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-[15px] font-semibold text-gray-900">AI Tools</h2>
                            <p className="text-[11px] text-gray-500">Design, review & estimate</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                        <X size={18} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100">
                    <TabButton id="generate" icon={<Wand2 size={16} />} label="Generate" />
                    <TabButton id="templates" icon={<LayoutTemplate size={16} />} label="Templates" />
                    <TabButton id="review" icon={<ShieldCheck size={16} />} label="Review" />
                    <TabButton id="cost" icon={<DollarSign size={16} />} label="Cost" />
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5">
                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[12px] flex items-start gap-2">
                            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                            {error}
                        </div>
                    )}

                    {/* GENERATE */}
                    {tab === "generate" && (
                        <div>
                            <label className="block text-[13px] font-medium text-gray-700 mb-2">
                                Describe the system you want to build
                            </label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g. A scalable e-commerce backend for 100k users with search, payments and order tracking"
                                rows={4}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-[13px] text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
                            />
                            <button
                                onClick={handleGenerate}
                                disabled={busy || !prompt.trim()}
                                className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-white text-[13px] font-medium bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-600 disabled:opacity-50 transition-all"
                            >
                                {busy ? <><Loader2 size={16} className="animate-spin" /> Generating…</> : <><Wand2 size={16} /> Generate Architecture</>}
                            </button>
                            <p className="mt-3 text-[11px] text-gray-400 leading-relaxed">
                                The AI designs a complete, connected diagram and streams it onto your canvas live.
                            </p>
                        </div>
                    )}

                    {/* TEMPLATES */}
                    {tab === "templates" && (
                        <div className="space-y-2.5">
                            {TEMPLATES.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => handleTemplate(t.graph)}
                                    className="w-full text-left p-3.5 rounded-lg border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition-all group"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-[13px] font-semibold text-gray-900">{t.label}</span>
                                        <span className="text-[11px] text-gray-400 group-hover:text-indigo-600">
                                            {t.graph.nodes.length} nodes
                                        </span>
                                    </div>
                                    <p className="text-[12px] text-gray-500 mt-1">{t.desc}</p>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* REVIEW */}
                    {tab === "review" && (
                        <div>
                            <button
                                onClick={handleReview}
                                disabled={busy}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-white text-[13px] font-medium bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 disabled:opacity-50 transition-all"
                            >
                                {busy ? <><Loader2 size={16} className="animate-spin" /> Analyzing…</> : <><ShieldCheck size={16} /> Review My Architecture</>}
                            </button>
                            {review && (
                                <div className="mt-4">
                                    <p className="text-[12px] text-gray-600 leading-relaxed mb-3 p-3 bg-gray-50 rounded-lg">
                                        {review.summary}
                                    </p>
                                    <div className="space-y-2">
                                        {review.findings.map((f, i) => {
                                            const s = SEVERITY_STYLES[f.severity] ?? SEVERITY_STYLES.low;
                                            return (
                                                <div key={i} className={`p-3 rounded-lg border text-[12px] ${s.color}`}>
                                                    <div className="flex items-center gap-1.5 font-semibold">
                                                        {s.icon}
                                                        <span className="uppercase text-[10px] tracking-wide">{f.severity}</span>
                                                        <span className="text-gray-900">· {f.title}</span>
                                                    </div>
                                                    <p className="text-gray-600 mt-1">{f.detail}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* COST */}
                    {tab === "cost" && (
                        <div>
                            <button
                                onClick={handleCost}
                                disabled={busy}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-white text-[13px] font-medium bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-90 disabled:opacity-50 transition-all"
                            >
                                {busy ? <><Loader2 size={16} className="animate-spin" /> Estimating…</> : <><DollarSign size={16} /> Estimate Monthly Cost</>}
                            </button>
                            {cost && (
                                <div className="mt-4">
                                    <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100">
                                        <p className="text-[11px] text-gray-500">Estimated monthly cost</p>
                                        <p className="text-[28px] font-bold text-gray-900">
                                            ${cost.monthly_total?.toLocaleString()}
                                            <span className="text-[13px] font-normal text-gray-500"> {cost.currency}/mo</span>
                                        </p>
                                    </div>
                                    {cost.assumptions && (
                                        <p className="text-[11px] text-gray-400 mt-2 italic">{cost.assumptions}</p>
                                    )}
                                    <div className="mt-3 space-y-1.5">
                                        {cost.line_items?.map((it: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 text-[12px]">
                                                <div className="min-w-0">
                                                    <p className="font-medium text-gray-900 truncate">{it.component}</p>
                                                    <p className="text-gray-400 text-[11px] truncate">{it.service}</p>
                                                </div>
                                                <span className="font-semibold text-gray-900 shrink-0 ml-2">${it.monthly_cost}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer — canvas export */}
                <div className="border-t border-gray-100 px-5 py-3 flex items-center gap-2">
                    <span className="text-[11px] text-gray-400 mr-auto">Export canvas</span>
                    <button
                        onClick={() => exportCanvas("png")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-[12px] font-medium text-gray-700 hover:bg-gray-50"
                    >
                        <Download size={14} /> PNG
                    </button>
                    <button
                        onClick={() => exportCanvas("svg")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-[12px] font-medium text-gray-700 hover:bg-gray-50"
                    >
                        <Download size={14} /> SVG
                    </button>
                </div>
            </div>
        </div>
    );
}
