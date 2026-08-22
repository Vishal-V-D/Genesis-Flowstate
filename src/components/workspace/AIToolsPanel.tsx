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

import React, { useState, useMemo } from "react";
import {
    Sparkles, X, Wand2, LayoutTemplate, ShieldCheck, DollarSign,
    Loader2, AlertTriangle, CheckCircle2, Info, Download, Search, Layers,
} from "lucide-react";
import {
    ARCHITECTURE_TEMPLATES, TEMPLATE_CATEGORIES, searchTemplates,
    type Template,
} from "./architectureTemplates";

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

// Format a number as localized currency using the browser's Intl support.
function formatMoney(amount: number, currency: string): string {
    try {
        return new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: currency || "USD",
            maximumFractionDigits: 2,
        }).format(amount ?? 0);
    } catch {
        return `${(amount ?? 0).toLocaleString()} ${currency}`;
    }
}

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

    // Template search + optional category filter.
    const [templateQuery, setTemplateQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    // Cost estimate target currency.
    const [currency, setCurrency] = useState("USD");

    // Filter templates by search text, then by category. Group the result by
    // category for a clean sectioned list.
    const groupedTemplates = useMemo(() => {
        let list = searchTemplates(templateQuery);
        if (activeCategory) list = list.filter((t) => t.category === activeCategory);
        const groups: Record<string, Template[]> = {};
        for (const t of list) (groups[t.category] ??= []).push(t);
        return groups;
    }, [templateQuery, activeCategory]);

    const totalMatches = useMemo(
        () => Object.values(groupedTemplates).reduce((s, arr) => s + arr.length, 0),
        [groupedTemplates],
    );

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
                body: JSON.stringify({ nodes: getCanvasNodes(), currency }),
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
                        <div>
                            {/* Search */}
                            <div className="relative mb-3">
                                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    value={templateQuery}
                                    onChange={(e) => setTemplateQuery(e.target.value)}
                                    placeholder="Search templates — netflix, payments, chat…"
                                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 text-[13px] text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Category chips */}
                            <div className="flex flex-wrap gap-1.5 mb-4">
                                <button
                                    onClick={() => setActiveCategory(null)}
                                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${activeCategory === null ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
                                >
                                    All
                                </button>
                                {TEMPLATE_CATEGORIES.map((c) => (
                                    <button
                                        key={c}
                                        onClick={() => setActiveCategory(activeCategory === c ? null : c)}
                                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${activeCategory === c ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>

                            <p className="text-[11px] text-gray-400 mb-2">{totalMatches} templates</p>

                            {totalMatches === 0 && (
                                <p className="text-[12px] text-gray-500 py-6 text-center">No templates match “{templateQuery}”.</p>
                            )}

                            {/* Grouped, searchable list */}
                            <div className="space-y-4">
                                {Object.entries(groupedTemplates).map(([category, items]) => (
                                    <div key={category}>
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <Layers size={13} className="text-gray-400" />
                                            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{category}</span>
                                        </div>
                                        <div className="space-y-2">
                                            {items.map((t) => (
                                                <button
                                                    key={t.id}
                                                    onClick={() => handleTemplate(t.graph)}
                                                    className="w-full text-left p-3.5 rounded-lg border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition-all group"
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-[13px] font-semibold text-gray-900">{t.label}</span>
                                                        <span className="flex items-center gap-1.5 shrink-0">
                                                            {t.scale === "large" && (
                                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-fuchsia-100 text-fuchsia-700 font-medium">Large</span>
                                                            )}
                                                            <span className="text-[11px] text-gray-400 group-hover:text-indigo-600">{t.graph.nodes.length} nodes</span>
                                                        </span>
                                                    </div>
                                                    <p className="text-[12px] text-gray-500 mt-1">{t.desc}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
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
                            {/* Currency selector */}
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-[12px] text-gray-500">Currency</span>
                                <select
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                    className="flex-1 border border-gray-300 rounded-lg px-2.5 py-2 text-[13px] text-gray-900 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white"
                                >
                                    <option value="USD">USD — US Dollar ($)</option>
                                    <option value="INR">INR — Indian Rupee (₹)</option>
                                    <option value="EUR">EUR — Euro (€)</option>
                                    <option value="GBP">GBP — British Pound (£)</option>
                                    <option value="JPY">JPY — Japanese Yen (¥)</option>
                                    <option value="AUD">AUD — Australian Dollar</option>
                                    <option value="CAD">CAD — Canadian Dollar</option>
                                    <option value="SGD">SGD — Singapore Dollar</option>
                                    <option value="AED">AED — UAE Dirham</option>
                                    <option value="BRL">BRL — Brazilian Real</option>
                                    <option value="CNY">CNY — Chinese Yuan</option>
                                </select>
                            </div>
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
                                            {formatMoney(cost.monthly_total, cost.currency)}
                                            <span className="text-[13px] font-normal text-gray-500"> {cost.currency}/mo</span>
                                        </p>
                                        <p className="text-[10px] text-gray-400 mt-1">Based on current AWS pricing · live FX</p>
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
                                                <span className="font-semibold text-gray-900 shrink-0 ml-2">{formatMoney(it.monthly_cost, cost.currency)}</span>
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
