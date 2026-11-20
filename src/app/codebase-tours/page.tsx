"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft, Plus, Mic, BookOpen, Play,
    ChevronRight, ChevronLeft, Check, FileCode, Trash2,
    Loader2, AlertCircle, GitBranch, Users, Trophy, X,
    StopCircle, Sparkles, Layers, Zap, Eye, RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getCurrentSession } from "@/lib/supabase-client";

declare global {
    interface Window { SpeechRecognition: any; webkitSpeechRecognition: any; }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface TourStop {
    id: string; tourId: string; order: number; title: string; filePath: string;
    lineStart?: number | null; lineEnd?: number | null; narration: string; keyPoints: string[];
}
interface TourProgress { completedStops: string[]; completedAt?: string | null; }
interface Tour {
    id: string; title: string; description: string; area: string; difficulty: string;
    status: string; repoId?: string | null; stops: TourStop[]; progress: TourProgress[];
    graph: GraphData; createdAt: string; updatedAt: string;
}
interface ConnectedRepo { id: string; repoName: string; repoUrl: string; }

interface L1Node {
    id: string; label: string; type: string; description: string;
    color: string; directory: string; role?: string;
    techUsed?: string | string[];
    keyFlows?: string[];
}
interface L2Node { id: string; parentId: string; label: string; filePath: string; description: string; }
interface L3Node { id: string; parentId: string; label: string; signature: string; description: string; }
interface Connection { from: string; to: string; label: string; }
interface ReplayStep { nodeId: string; action: string; detail: string; }
interface UserFlowStep { label: string; detail: string; }
interface UserFlow { name: string; steps: UserFlowStep[]; }
interface GraphData {
    projectSummary?: string;
    techStack?: string[] | { languages: string[]; frameworks: string[]; databases: string[]; tools: string[] };
    architecturePattern?: string;
    level1?: L1Node[]; level2?: L2Node[]; level3?: L3Node[];
    connections?: Connection[];
    dataFlow?: string;
    userFlows?: UserFlow[];
    replay?: { name: string; description: string; steps: ReplayStep[] };
    summary?: string;
}

type ViewMode = "list" | "detail" | "diagram" | "playback" | "create" | "add-stop";
type DiagramLevel = 1 | 2 | 3;

const AREAS = ["general", "auth", "database", "api", "frontend", "infrastructure", "testing"];
const DIFFICULTIES = ["beginner", "intermediate", "advanced"];

const AREA_COLORS: Record<string, string> = {
    general: "bg-gray-100 dark:bg-dark-border text-gray-700 dark:text-dark-muted",
    auth: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400",
    database: "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400",
    api: "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400",
    frontend: "bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400",
    infrastructure: "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400",
    testing: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400",
};
const DIFF_COLORS: Record<string, string> = {
    beginner: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400",
    intermediate: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400",
    advanced: "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400",
};

function authHeaders(): Record<string, string> {
    const s = getCurrentSession();
    if (!s?.idToken) return {};
    return { Authorization: `Bearer ${s.idToken}`, "Content-Type": "application/json" };
}


// ─── Analysis Road Progress ───────────────────────────────────────────────────

interface AnalysisStep { icon: string; label: string; detail: string; }

function AnalysisRoadProgress({ steps, currentStep }: { steps: AnalysisStep[]; currentStep: number }) {
    // Layout: road runs down the center (x=160), stops alternate right/left
    // Each step occupies STEP_H px of vertical space
    const STEP_H = 88;
    const W = 320;
    const CX = W / 2; // road center x = 160
    const R = 20;     // circle radius

    // x-center of each circle node (alternates right / left of center)
    const nodeX = (i: number) => i % 2 === 0 ? CX + 72 : CX - 72;
    const nodeY = (i: number) => i * STEP_H + STEP_H / 2;
    const totalH = steps.length * STEP_H;

    return (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-start bg-white/98 dark:bg-dark-bg/98 backdrop-blur-sm rounded-xl overflow-y-auto py-6 px-4">
            {/* Header */}
            <div className="text-center mb-4 shrink-0">
                <p className="text-xs font-semibold uppercase tracking-widest text-violet-500 mb-1">Genesis at work</p>
                <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text">Mapping your codebase</h3>
            </div>

            {/* Road diagram */}
            <div className="relative shrink-0" style={{ width: W, height: totalH }}>
                <svg className="absolute inset-0 pointer-events-none" width={W} height={totalH}>
                    {/* Road segments between nodes */}
                    {steps.map((_, i) => {
                        if (i === steps.length - 1) return null;
                        const x1 = nodeX(i);
                        const y1 = nodeY(i);
                        const x2 = nodeX(i + 1);
                        const y2 = nodeY(i + 1);
                        const done = i < currentStep;
                        // Cubic bezier: curves gently back to center then out to next node
                        return (
                            <path
                                key={i}
                                d={`M${x1},${y1} C${CX},${y1 + 20} ${CX},${y2 - 20} ${x2},${y2}`}
                                fill="none"
                                stroke={done ? "#7c3aed" : "#d1d5db"}
                                strokeWidth={done ? 3 : 2}
                                strokeDasharray={done ? undefined : "6 4"}
                                strokeLinecap="round"
                                style={{ transition: "stroke 0.4s ease" }}
                            />
                        );
                    })}

                    {/* Circle nodes */}
                    {steps.map((step, i) => {
                        const isDone = i < currentStep;
                        const isCurrent = i === currentStep;
                        const cx = nodeX(i);
                        const cy = nodeY(i);
                        return (
                            <g key={i}>
                                {/* Outer pulse ring for current */}
                                {isCurrent && (
                                    <circle cx={cx} cy={cy} r={R + 8} fill="none" stroke="#8b5cf6" strokeWidth="2" opacity="0.4">
                                        <animate attributeName="r" values={`${R + 4};${R + 14};${R + 4}`} dur="1.6s" repeatCount="indefinite" />
                                        <animate attributeName="opacity" values="0.5;0;0.5" dur="1.6s" repeatCount="indefinite" />
                                    </circle>
                                )}
                                {/* Main circle */}
                                <circle
                                    cx={cx} cy={cy} r={R}
                                    fill={isDone ? "#7c3aed" : isCurrent ? "#ede9fe" : "#f3f4f6"}
                                    stroke={isDone || isCurrent ? "#7c3aed" : "#d1d5db"}
                                    strokeWidth="2"
                                    style={{ transition: "fill 0.4s ease, stroke 0.4s ease" }}
                                />
                                {/* Icon / checkmark text */}
                                <text
                                    x={cx} y={cy + 1}
                                    textAnchor="middle" dominantBaseline="middle"
                                    fontSize={isDone ? "14" : "16"}
                                    style={{ userSelect: "none" }}
                                >
                                    {isDone ? "✓" : step.icon}
                                </text>
                            </g>
                        );
                    })}
                </svg>

                {/* Text labels — absolutely positioned beside each node */}
                {steps.map((step, i) => {
                    const isDone = i < currentStep;
                    const isCurrent = i === currentStep;
                    const isRight = i % 2 === 0; // node is on right → label on left
                    const cy = nodeY(i);
                    const labelW = CX - R - 20; // available width for label

                    const style: React.CSSProperties = isRight
                        ? { position: "absolute", top: cy - 24, right: W - (CX - R - 12), width: labelW, textAlign: "right" }
                        : { position: "absolute", top: cy - 24, left: CX + R + 12, width: labelW, textAlign: "left" };

                    return (
                        <div key={`lbl-${i}`} style={style}>
                            <p className={`text-sm font-semibold leading-tight ${
                                isDone ? "text-violet-700 dark:text-violet-400"
                                : isCurrent ? "text-gray-900 dark:text-dark-text"
                                : "text-gray-300 dark:text-dark-subtle"
                            }`}>
                                {step.label}
                            </p>
                            {(isDone || isCurrent) && (
                                <p className={`text-xs mt-0.5 leading-snug ${isDone ? "text-gray-400 dark:text-dark-muted" : "text-violet-500"}`}>
                                    {step.detail}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Progress dots */}
            <div className="flex justify-center mt-4 gap-1.5 shrink-0">
                {steps.map((_, i) => (
                    <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${
                        i < currentStep ? "bg-violet-600 w-5"
                        : i === currentStep ? "bg-violet-400 w-5 animate-pulse"
                        : "bg-gray-200 dark:bg-dark-border w-1.5"
                    }`} />
                ))}
            </div>
            <p className="text-xs text-gray-400 dark:text-dark-subtle mt-2 shrink-0">
                Step {Math.max(currentStep + 1, 1)} of {steps.length}
            </p>
        </div>
    );
}

// ─── Architecture Diagram (L1) ───────────────────────────────────────────────

const ARCH_ICONS: Record<string, string> = {
    service: "⚙️", api: "🔌", frontend: "🏛️", database: "🗄️", library: "📚", config: "🔧", infrastructure: "🏗️",
};

function MindMapDetailPopover({ selected, onClose }: { selected: { kind: "l1" | "l2"; node: any; color: string } | null; onClose: () => void }) {
    return (
        <AnimatePresence>
            {selected && (
                <motion.div
                    initial={{ opacity: 0, y: 24, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 24, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    className="fixed bottom-6 right-6 z-40 w-80 rounded-2xl border-2 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden"
                    style={{ borderColor: selected.color + "66" }}
                >
                    <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${selected.color}, ${selected.color}60)` }} />
                    <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: selected.color }}>
                                {selected.kind === "l1" ? selected.node.type : "module"}
                            </span>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-white -mt-1"><X className="w-3.5 h-3.5" /></button>
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight mb-1.5">{selected.node.label}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{selected.node.description}</p>
                        {selected.kind === "l1" && selected.node.techUsed && (
                            <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full border"
                                style={{ borderColor: selected.color + "44", color: selected.color, background: selected.color + "10" }}>
                                {Array.isArray(selected.node.techUsed) ? selected.node.techUsed.join(", ") : selected.node.techUsed}
                            </span>
                        )}
                        {selected.kind === "l1" && selected.node.keyFlows && selected.node.keyFlows.length > 0 && (
                            <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-800">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Key Flows</p>
                                <div className="flex flex-wrap gap-1">
                                    {selected.node.keyFlows.map((f: string, i: number) => (
                                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">{f}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {selected.kind === "l2" && selected.node.filePath && (
                            <code className="block mt-2 text-[10px] text-gray-400 dark:text-gray-600 truncate">{selected.node.filePath}</code>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function VisualRoadmap({ graph, replayActive, replayStep, replaySteps }: {
    graph: GraphData;
    replayActive: boolean;
    replayStep: number;
    replaySteps: Array<{ nodeId: string; action: string; detail: string }>;
}) {
    const nodes = graph.level1 ?? [];
    const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());
    const [selected, setSelected] = React.useState<{ kind: "l1" | "l2"; node: any; color: string } | null>(null);

    const techList: string[] = Array.isArray(graph.techStack)
        ? graph.techStack as string[]
        : graph.techStack
            ? [...((graph.techStack as any).languages ?? []), ...((graph.techStack as any).frameworks ?? []), ...((graph.techStack as any).databases ?? []), ...((graph.techStack as any).tools ?? [])]
            : [];

    // ── Radial layout ──
    const SIZE = 980;
    const CENTER = { x: SIZE / 2, y: SIZE / 2 };
    const R1 = 230;
    const R2 = 190;

    const l1Points = nodes.map((n, i) => {
        const angle = (2 * Math.PI * i) / Math.max(nodes.length, 1) - Math.PI / 2;
        return { node: n, angle, x: CENTER.x + R1 * Math.cos(angle), y: CENTER.y + R1 * Math.sin(angle) };
    });

    function l2PointsFor(l1: typeof l1Points[number]) {
        const children = graph.level2?.filter(m => m.parentId === l1.node.id) ?? [];
        if (children.length === 0) return [];
        const spread = Math.min(Math.PI / 2.2, 0.5 + 0.22 * children.length);
        return children.map((m, i) => {
            const t = children.length === 1 ? 0 : i / (children.length - 1) - 0.5;
            const angle = l1.angle + t * spread;
            const r = R1 + R2;
            return { node: m, x: CENTER.x + r * Math.cos(angle), y: CENTER.y + r * Math.sin(angle) };
        });
    }

    const projectLabel = (graph.architecturePattern ?? "Project").split(" ").slice(0, 3).join(" ");

    return (
        <div className="overflow-auto h-full bg-[#f7f8fa] dark:bg-[#0a0a0b]">
            {/* Project overview banner */}
            {(graph.projectSummary || graph.summary) && (
                <div className="max-w-4xl mx-auto px-6 pt-6 pb-4">
                    <div className="rounded-2xl border border-violet-200 dark:border-violet-900/40 bg-white dark:bg-gray-900 p-5 shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-widest text-violet-500 mb-1.5">Project Overview</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{graph.projectSummary ?? graph.summary}</p>
                        {techList.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                                {techList.map((tech: string) => (
                                    <span key={tech} className="text-xs px-2.5 py-1 rounded-full font-medium bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 border border-violet-100 dark:border-violet-900/40">
                                        {tech}
                                    </span>
                                ))}
                            </div>
                        )}
                        {graph.architecturePattern && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                Pattern: <span className="font-semibold text-violet-600 dark:text-violet-400">{graph.architecturePattern}</span>
                            </p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">💡 Click any node on the map below to expand its modules and see details.</p>
                    </div>
                </div>
            )}

            {/* Radial mind map */}
            <div className="mx-auto pb-6" style={{ width: SIZE, maxWidth: "100%" }}>
                <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width="100%" style={{ aspectRatio: "1 / 1" }}>
                    {/* Lines: center → L1 */}
                    {l1Points.map((p, i) => (
                        <motion.line
                            key={`l-${p.node.id}`}
                            x1={CENTER.x} y1={CENTER.y} x2={p.x} y2={p.y}
                            stroke={p.node.color} strokeWidth={1.5} strokeOpacity={0.35}
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 0.35 }}
                            transition={{ delay: 0.15 + i * 0.12, duration: 0.5, ease: "easeOut" }}
                        />
                    ))}

                    {/* Lines: L1 → L2 (only when expanded) */}
                    <AnimatePresence>
                        {l1Points.flatMap((p) => {
                            if (!expandedIds.has(p.node.id)) return [];
                            return l2PointsFor(p).map((lp, j) => (
                                <motion.line
                                    key={`l2-${lp.node.id}`}
                                    x1={p.x} y1={p.y} x2={lp.x} y2={lp.y}
                                    stroke={p.node.color} strokeWidth={1} strokeOpacity={0.3} strokeDasharray="4 4"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 0.3 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ delay: j * 0.06, duration: 0.3 }}
                                />
                            ));
                        })}
                    </AnimatePresence>

                    {/* Central node */}
                    <motion.g
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, ease: "backOut" }}
                    >
                        <circle cx={CENTER.x} cy={CENTER.y} r={56} fill="#7c5cbf" />
                        <circle cx={CENTER.x} cy={CENTER.y} r={56} fill="none" stroke="#7c5cbf" strokeWidth={2} strokeOpacity={0.3}>
                            <animate attributeName="r" values="56;68;56" dur="3s" repeatCount="indefinite" />
                            <animate attributeName="stroke-opacity" values="0.3;0;0.3" dur="3s" repeatCount="indefinite" />
                        </circle>
                        <foreignObject x={CENTER.x - 50} y={CENTER.y - 28} width={100} height={56} style={{ pointerEvents: "none" }}>
                            <div className="w-full h-full flex items-center justify-center text-center text-white text-[11px] font-bold leading-tight px-1">
                                {projectLabel}
                            </div>
                        </foreignObject>
                    </motion.g>

                    {/* L1 nodes */}
                    {l1Points.map((p, i) => {
                        const isLeft = p.x < CENTER.x - 4;
                        const isExpanded = expandedIds.has(p.node.id);
                        const isActive = replayActive && replaySteps[replayStep]?.nodeId === p.node.id;
                        const hasChildren = (graph.level2?.filter(m => m.parentId === p.node.id).length ?? 0) > 0;
                        return (
                            <motion.g
                                key={p.node.id}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.25 + i * 0.12, duration: 0.35, ease: "backOut" }}
                                style={{ cursor: "pointer" }}
                                onClick={() => {
                                    setSelected({ kind: "l1", node: p.node, color: p.node.color });
                                    if (hasChildren) {
                                        setExpandedIds(prev => {
                                            const next = new Set(prev);
                                            next.has(p.node.id) ? next.delete(p.node.id) : next.add(p.node.id);
                                            return next;
                                        });
                                    }
                                }}
                            >
                                {isActive && (
                                    <circle cx={p.x} cy={p.y} r={18} fill="none" stroke={p.node.color} strokeWidth={2} opacity={0.5}>
                                        <animate attributeName="r" values="14;22;14" dur="1.4s" repeatCount="indefinite" />
                                        <animate attributeName="opacity" values="0.5;0;0.5" dur="1.4s" repeatCount="indefinite" />
                                    </circle>
                                )}
                                <circle cx={p.x} cy={p.y} r={12} fill={isExpanded ? p.node.color : "white"} stroke={p.node.color} strokeWidth={2.5} className="dark:fill-gray-900" />
                                <text x={p.x} y={p.y + 1} textAnchor="middle" dominantBaseline="middle" fontSize={11} style={{ userSelect: "none" }}>
                                    {ARCH_ICONS[p.node.type] ?? "📦"}
                                </text>
                                <text
                                    x={p.x + (isLeft ? -20 : 20)} y={p.y}
                                    textAnchor={isLeft ? "end" : "start"} dominantBaseline="middle"
                                    fontSize={13} fontWeight={700}
                                    className="fill-gray-800 dark:fill-white"
                                    style={{ userSelect: "none" }}
                                >
                                    {p.node.label}
                                </text>
                                {hasChildren && (
                                    <text
                                        x={p.x + (isLeft ? -20 : 20)} y={p.y + 15}
                                        textAnchor={isLeft ? "end" : "start"} dominantBaseline="middle"
                                        fontSize={9} className="fill-gray-400 dark:fill-gray-500"
                                        style={{ userSelect: "none" }}
                                    >
                                        {isExpanded ? "▲ collapse" : `▼ ${graph.level2?.filter(m => m.parentId === p.node.id).length} modules`}
                                    </text>
                                )}
                            </motion.g>
                        );
                    })}

                    {/* L2 nodes (only when expanded) */}
                    <AnimatePresence>
                        {l1Points.flatMap((p) => {
                            if (!expandedIds.has(p.node.id)) return [];
                            return l2PointsFor(p).map((lp, j) => {
                                const isLeft = lp.x < CENTER.x - 4;
                                return (
                                    <motion.g
                                        key={lp.node.id}
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0 }}
                                        transition={{ delay: j * 0.06, duration: 0.25, ease: "backOut" }}
                                        style={{ cursor: "pointer" }}
                                        onClick={(e) => { e.stopPropagation(); setSelected({ kind: "l2", node: lp.node, color: p.node.color }); }}
                                    >
                                        <circle cx={lp.x} cy={lp.y} r={6} fill={p.node.color} fillOpacity={0.75} />
                                        <text
                                            x={lp.x + (isLeft ? -11 : 11)} y={lp.y}
                                            textAnchor={isLeft ? "end" : "start"} dominantBaseline="middle"
                                            fontSize={10.5} fontWeight={500}
                                            className="fill-gray-600 dark:fill-gray-300"
                                            style={{ userSelect: "none" }}
                                        >
                                            {lp.node.label}
                                        </text>
                                    </motion.g>
                                );
                            });
                        })}
                    </AnimatePresence>
                </svg>
            </div>

            <MindMapDetailPopover selected={selected} onClose={() => setSelected(null)} />

            {/* User flows section */}
            {graph.userFlows && graph.userFlows.length > 0 && (
                <div className="max-w-4xl mx-auto px-6 pb-10">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Key User Journeys</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {graph.userFlows.map((flow, fi) => (
                            <div key={fi} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
                                <p className="text-sm font-semibold text-gray-800 dark:text-white mb-2">{flow.name}</p>
                                <div className="space-y-1.5">
                                    {flow.steps.map((step, si) => (
                                        <div key={si} className="flex items-start gap-2">
                                            <span className="text-[10px] font-bold text-violet-400 mt-0.5 w-4 shrink-0">{si + 1}.</span>
                                            <div>
                                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{step.label}</span>
                                                {step.detail && <span className="text-[10px] text-gray-400 ml-1">— {step.detail}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Data flow footer */}
            {graph.dataFlow && (
                <div className="max-w-4xl mx-auto px-6 pb-10">
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Data Flow</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{graph.dataFlow}</p>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Modules View (L2/L3) ────────────────────────────────────────────────────

function ModulesView({ graph, drillTarget, activeNodeId, setActiveNodeId, setInfoPanel, diagramLevel, setDiagramLevel, replayActive, replayStep, replaySteps }: {
    graph: GraphData;
    drillTarget: string | null;
    activeNodeId: string | null;
    setActiveNodeId: (id: string | null) => void;
    setInfoPanel: (node: any) => void;
    diagramLevel: number;
    setDiagramLevel: (l: any) => void;
    replayActive: boolean;
    replayStep: number;
    replaySteps: Array<{ nodeId: string; action: string; detail: string }>;
}) {
    const parentNode = graph.level1?.find(n => n.id === drillTarget);
    const modules = (graph.level2 ?? []).filter(m => m.parentId === drillTarget);
    const color = parentNode?.color ?? "#7c5cbf";

    if (diagramLevel === 3 && activeNodeId) {
        const parentModule = modules.find(m => m.id === activeNodeId);
        const fns = (graph.level3 ?? []).filter(f => f.parentId === activeNodeId);
        return (
            <div className="h-full overflow-y-auto bg-gray-950 p-6">
                <button onClick={() => { setDiagramLevel(2); setActiveNodeId(null); }}
                    className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-6 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                    Back to {parentModule?.label ?? "modules"}
                </button>
                <h2 className="text-lg font-semibold text-white mb-1">{parentModule?.label}</h2>
                <p className="text-sm text-gray-400 mb-6">{parentModule?.description}</p>
                {fns.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                        <p className="text-sm">No function-level detail available for this module.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {fns.map(fn => (
                            <div key={fn.id} className="rounded-xl border border-gray-800 bg-gray-900 p-4">
                                <div className="font-mono text-emerald-400 text-sm font-medium">{fn.label}()</div>
                                {fn.signature && <div className="font-mono text-xs text-gray-500 mt-1">{fn.signature}</div>}
                                <p className="text-xs text-gray-400 mt-2 leading-relaxed">{fn.description}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto bg-gray-950 p-6">
            {parentNode && (
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                        style={{ background: color + "22", border: `2px solid ${color}44` }}>
                        {({ frontend: "🖥️", api: "⚡", database: "🗄️", service: "⚙️", library: "📚", config: "🔧", infrastructure: "🏗️" } as Record<string, string>)[parentNode.type] ?? "📦"}
                    </div>
                    <div>
                        <div className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{ color }}>{parentNode.type}</div>
                        <h2 className="text-lg font-semibold text-white leading-tight">{parentNode.label}</h2>
                    </div>
                </div>
            )}
            {parentNode?.description && (
                <p className="text-sm text-gray-400 mb-6 leading-relaxed border-l-2 pl-3" style={{ borderColor: color + "66" }}>
                    {parentNode.description}
                </p>
            )}
            {modules.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                    <p className="text-sm">No module-level detail available for this component.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {modules.map(mod => {
                        const isActive = replayActive && replaySteps[replayStep]?.nodeId === drillTarget;
                        const hasFunctions = (graph.level3 ?? []).some(f => f.parentId === mod.id);
                        return (
                            <div
                                key={mod.id}
                                onClick={() => { setActiveNodeId(mod.id); setInfoPanel(mod); if (hasFunctions) setDiagramLevel(3); }}
                                className={`rounded-xl border p-4 transition-all cursor-pointer
                                    ${hasFunctions ? "hover:border-violet-500 hover:shadow-lg hover:shadow-violet-900/20" : "hover:border-gray-600"}
                                    ${isActive ? "border-violet-500 bg-violet-900/10" : "border-gray-800 bg-gray-900"}`}
                            >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <span className="text-sm font-semibold text-white leading-snug">{mod.label}</span>
                                    {mod.filePath && (
                                        <span className="text-xs font-mono text-gray-500 shrink-0">{mod.filePath.split("/").pop()}</span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-400 leading-relaxed mb-3">{mod.description}</p>
                                {mod.filePath && (
                                    <p className="text-xs font-mono text-violet-400/70 truncate">{mod.filePath}</p>
                                )}
                                {hasFunctions && (
                                    <div className="mt-2 text-xs text-gray-500">
                                        {(graph.level3 ?? []).filter(f => f.parentId === mod.id).length} functions · click to explore →
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
            {replayActive && replaySteps[replayStep] && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 border border-emerald-800 rounded-xl px-5 py-3 shadow-xl z-10 max-w-md">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-emerald-400">{replaySteps[replayStep].action}</span>
                        <span className="text-xs text-gray-500 ml-auto">{replayStep + 1}/{replaySteps.length}</span>
                    </div>
                    <p className="text-xs text-gray-300">{replaySteps[replayStep].detail}</p>
                </div>
            )}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CodebaseToursPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [tours, setTours] = useState<Tour[]>([]);
    const [repos, setRepos] = useState<ConnectedRepo[]>([]);
    const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>("list");
    const [playbackIdx, setPlaybackIdx] = useState(0);
    const [fileContent, setFileContent] = useState<string | null>(null);
    const [fileLoading, setFileLoading] = useState(false);
    const [filterArea, setFilterArea] = useState("all");
    const [loading, setLoading] = useState(true);

    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Diagram state
    const [diagramLevel, setDiagramLevel] = useState<DiagramLevel>(1);
    const [drillTarget, setDrillTarget] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [analysisStep, setAnalysisStep] = useState(-1); // -1 = not running, 0-7 = step index
    const [replayActive, setReplayActive] = useState(false);
    const [replayStep, setReplayStep] = useState(0);
    const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
    const [infoPanel, setInfoPanel] = useState<L1Node | L2Node | null>(null);

    const [newRepoUrl, setNewRepoUrl] = useState("");
    const [addingRepo, setAddingRepo] = useState(false);

    // Create / add-stop form state
    const [createForm, setCreateForm] = useState({ title: "", description: "", area: "general", difficulty: "beginner", repoId: "" });
    const [createLoading, setCreateLoading] = useState(false);
    const [stopForm, setStopForm] = useState({ title: "", filePath: "", narration: "", keyPoints: [] as string[], lineStart: "", lineEnd: "" });
    const [stopLoading, setStopLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [narrateLoading, setNarrateLoading] = useState(false);
    const [autoGenLoading, setAutoGenLoading] = useState(false);
    const recognitionRef = useRef<any>(null);

    // ── Fetch ─────────────────────────────────────────────────────────────────

    const fetchTours = useCallback(async () => {
        const h = authHeaders();
        if (!h.Authorization) return;
        const r = await fetch("/api/tours", { headers: h });
        if (r.ok) setTours(await r.json());
        setLoading(false);
    }, []);

    const fetchRepos = useCallback(async () => {
        const h = authHeaders();
        if (!h.Authorization) return;
        const r = await fetch("/api/repos", { headers: h });
        if (r.ok) setRepos(await r.json());
    }, []);

    useEffect(() => {
        if (!authLoading && user) { fetchTours(); fetchRepos(); }
    }, [authLoading, user, fetchTours, fetchRepos]);

    useEffect(() => {
        if (selectedTour) {
            const u = tours.find((t) => t.id === selectedTour.id);
            if (u) setSelectedTour(u);
        }
    }, [tours]);


    // ── Analyze repo ──────────────────────────────────────────────────────────

    const ANALYSIS_STEPS = [
        { icon: "🔗", label: "Connecting to GitHub", detail: "Authenticating and reaching the repository" },
        { icon: "🌳", label: "Fetching file tree", detail: "Scanning all source files recursively" },
        { icon: "📄", label: "Reading key files", detail: "Sampling entry points and core modules" },
        { icon: "🧠", label: "Genesis analyzing structure", detail: "AI is understanding the architecture" },
        { icon: "🗺️", label: "Building system map", detail: "Identifying services, APIs, and databases" },
        { icon: "🔗", label: "Mapping connections", detail: "Tracing how modules communicate" },
        { icon: "⚡", label: "Creating replay flow", detail: "Designing a request walkthrough animation" },
        { icon: "💾", label: "Saving architecture", detail: "Persisting the visual map to your tour" },
    ];

    async function runAnalysis(tourId: string, repoName: string) {
        setAnalyzing(true);
        setAnalysisStep(0);

        // Advance steps while the API call runs
        const stepInterval = setInterval(() => {
            setAnalysisStep((s) => (s < ANALYSIS_STEPS.length - 2 ? s + 1 : s));
        }, 1400);

        const h = authHeaders();
        try {
            const res = await fetch("/api/tours/analyze-repo", {
                method: "POST", headers: h,
                body: JSON.stringify({ tourId, repoName }),
            });
            clearInterval(stepInterval);
            if (res.ok) {
                setAnalysisStep(ANALYSIS_STEPS.length - 1); // final step
                await new Promise((r) => setTimeout(r, 600)); // brief pause on "Saving"
                await fetchTours();
                toast.success("Architecture map generated! Opening visual diagram…");
                setDiagramLevel(1); setDrillTarget(null); setActiveNodeId(null);
                setViewMode("diagram");
            } else {
                const errData = await res.json().catch(() => ({}));
                toast.error(errData.error ?? "Analysis failed. Check your repo URL and try again.");
            }
        } catch (e: any) {
            clearInterval(stepInterval);
            toast.error("Analysis failed — check your network and try again.");
        } finally {
            setAnalyzing(false);
            setAnalysisStep(-1);
        }
    }

    async function handleAnalyze() {
        if (!selectedTour) return;
        const repo = repos.find((r) => r.id === selectedTour.repoId);
        if (!repo) { toast.warning("No repo connected. Add a GitHub repo to this tour first."); return; }
        await runAnalysis(selectedTour.id, repo.repoName);
    }

    // ── Replay ────────────────────────────────────────────────────────────────

    function startReplay() {
        setReplayActive(true);
        setReplayStep(0);
        setDiagramLevel(1);
    }

    function replayNext() {
        const g = selectedTour?.graph as GraphData;
        const steps = g?.replay?.steps ?? [];
        if (replayStep < steps.length - 1) setReplayStep((s) => s + 1);
        else { setReplayActive(false); setReplayStep(0); }
    }

    // ── Playback ──────────────────────────────────────────────────────────────

    const loadFile = useCallback(async (stop: TourStop, repoId: string | null | undefined) => {
        if (!repoId || !stop.filePath) { setFileContent(null); return; }
        setFileLoading(true);
        try {
            const h = authHeaders();
            const r = await fetch(`/api/repos/${repoId}/file?path=${encodeURIComponent(stop.filePath)}`, { headers: h });
            setFileContent(r.ok ? (await r.json()).content ?? null : null);
        } catch { setFileContent(null); } finally { setFileLoading(false); }
    }, []);

    useEffect(() => {
        if (viewMode === "playback" && selectedTour)
            loadFile(selectedTour.stops[playbackIdx], selectedTour.repoId);
    }, [viewMode, playbackIdx, selectedTour, loadFile]);

    // ── Auto-generate stop from GitHub URL ────────────────────────────────────

    function isGitHubUrl(s: string) { return s.startsWith("https://github.com/") && s.includes("/blob/"); }

    async function handleAutoGenerate() {
        const input = stopForm.filePath.trim();
        if (!input) return;
        setAutoGenLoading(true);
        try {
            const h = authHeaders();
            let body: Record<string, string> = {};

            if (isGitHubUrl(input)) {
                body = { githubUrl: input };
            } else {
                const repoId = selectedTour?.repoId;
                if (!repoId) { toast.warning("No repo connected. Paste a full GitHub file URL instead."); return; }
                const fr = await fetch(`/api/repos/${repoId}/file?path=${encodeURIComponent(input)}`, { headers: h });
                if (!fr.ok) { toast.error("File not found in repo. Check the path and try again."); return; }
                const { content } = await fr.json();
                body = { filePath: input, fileContent: content };
            }

            const r = await fetch("/api/tours/narrate", { method: "POST", headers: h, body: JSON.stringify(body) });
            if (!r.ok) { toast.error("Genesis couldn't generate narration. Try again."); return; }
            const { title, narration, keyPoints, filePath: extractedPath } = await r.json();
            setStopForm((f) => ({
                ...f,
                title: title ?? f.title,
                narration: narration ?? f.narration,
                keyPoints: keyPoints ?? [],
                filePath: extractedPath ?? (isGitHubUrl(input) ? input.split("/blob/").pop()?.split("/").slice(1).join("/") ?? input : f.filePath),
            }));
            toast.success("Genesis generated the narration!");
        } finally { setAutoGenLoading(false); }
    }

    // ── CRUD helpers ──────────────────────────────────────────────────────────

    async function handleConnectAndLink() {
        if (!selectedTour || !newRepoUrl.trim()) return;
        setAddingRepo(true);
        const h = authHeaders();
        const r = await fetch("/api/repos", {
            method: "POST", headers: h, body: JSON.stringify({ repoUrl: newRepoUrl.trim() }),
        });
        if (!r.ok) { toast.error("Couldn't connect repo. Make sure the URL is a valid public GitHub repo."); setAddingRepo(false); return; }
        const repo = await r.json();
        toast.success(`Connected ${repo.repoName} — starting analysis…`);
        await fetchRepos();
        // Link to tour
        await fetch(`/api/tours/${selectedTour.id}`, {
            method: "PATCH", headers: h, body: JSON.stringify({ repoId: repo.id }),
        });
        await fetchTours();
        setNewRepoUrl("");
        setAddingRepo(false);
        await runAnalysis(selectedTour.id, repo.repoName);
    }

    async function handleConnectRepo() {
        if (!newRepoUrl.trim()) return;
        setAddingRepo(true);
        const h = authHeaders();
        const r = await fetch("/api/repos", {
            method: "POST", headers: h, body: JSON.stringify({ repoUrl: newRepoUrl.trim() }),
        });
        if (r.ok) {
            const repo = await r.json();
            await fetchRepos();
            setCreateForm((f) => ({ ...f, repoId: repo.id }));
            setNewRepoUrl("");
            toast.success(`Repo connected: ${repo.repoName}`);
        } else {
            toast.error("Couldn't connect repo. Make sure the URL is a valid public GitHub repo.");
        }
        setAddingRepo(false);
    }

    async function handleCreateTour() {
        if (!createForm.title.trim()) return;
        setCreateLoading(true);
        const h = authHeaders();
        const r = await fetch("/api/tours", {
            method: "POST", headers: h,
            body: JSON.stringify({ ...createForm, repoId: createForm.repoId || null }),
        });
        if (r.ok) {
            const tour = await r.json();
            await fetchTours();
            setSelectedTour(tour);
            setViewMode("detail");
            setCreateForm({ title: "", description: "", area: "general", difficulty: "beginner", repoId: "" });
            toast.success("Tour created!");
        } else {
            toast.error("Failed to create tour. Try again.");
        }
        setCreateLoading(false);
    }

    async function handleDeleteTour(id: string) {
        await fetch(`/api/tours/${id}`, { method: "DELETE", headers: authHeaders() });
        setSelectedTour(null); setViewMode("list"); await fetchTours();
        toast.success("Tour deleted.");
    }

    async function handleAddStop() {
        if (!selectedTour || !stopForm.filePath.trim()) return;
        const title = stopForm.title.trim() || stopForm.filePath.split("/").pop() || stopForm.filePath;
        setStopLoading(true);
        const h = authHeaders();
        const r = await fetch(`/api/tours/${selectedTour.id}/stops`, {
            method: "POST", headers: h,
            body: JSON.stringify({
                title, filePath: stopForm.filePath,
                narration: stopForm.narration, keyPoints: stopForm.keyPoints,
                lineStart: stopForm.lineStart ? parseInt(stopForm.lineStart) : null,
                lineEnd: stopForm.lineEnd ? parseInt(stopForm.lineEnd) : null,
            }),
        });
        if (r.ok) {
            await fetchTours(); setViewMode("detail");
            setStopForm({ title: "", filePath: "", narration: "", keyPoints: [], lineStart: "", lineEnd: "" });
            setTranscript("");
            toast.success("Stop added to tour!");
        } else {
            toast.error("Failed to add stop. Try again.");
        }
        setStopLoading(false);
    }

    async function handleDeleteStop(stopId: string) {
        if (!selectedTour) return;
        await fetch(`/api/tours/${selectedTour.id}/stops/${stopId}`, { method: "DELETE", headers: authHeaders() });
        await fetchTours();
        toast.success("Stop removed.");
    }

    async function markStopComplete(stopId: string) {
        if (!selectedTour) return;
        const already = selectedTour.progress[0]?.completedStops ?? [];
        if (already.includes(stopId)) return;
        const updated = [...already, stopId];
        await fetch(`/api/tours/${selectedTour.id}/progress`, {
            method: "POST", headers: authHeaders(), body: JSON.stringify({ completedStops: updated }),
        });
        await fetchTours();
    }

    async function goToNextStop() {
        if (!selectedTour) return;
        const stop = selectedTour.stops[playbackIdx];
        if (stop) await markStopComplete(stop.id);
        if (playbackIdx < selectedTour.stops.length - 1) setPlaybackIdx((i) => i + 1);
        else setViewMode("detail");
    }

    async function handlePublishToggle() {
        if (!selectedTour) return;
        const s = selectedTour.status === "Published" ? "Draft" : "Published";
        await fetch(`/api/tours/${selectedTour.id}`, {
            method: "PATCH", headers: authHeaders(), body: JSON.stringify({ status: s }),
        });
        await fetchTours();
        toast.success(s === "Published" ? "Tour published — now visible to others." : "Tour moved back to draft.");
    }

    // Voice recording
    function startRecording() {
        const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
        if (!SR) { toast.warning("Voice recording requires Chrome or Edge."); return; }
        const rec = new SR(); rec.continuous = true; rec.interimResults = true; rec.lang = "en-US";
        let final = "";
        rec.onresult = (e: any) => {
            let interim = "";
            for (let i = e.resultIndex; i < e.results.length; i++) {
                const t = e.results[i][0].transcript;
                if (e.results[i].isFinal) final += t + " "; else interim += t;
            }
            setTranscript(final + interim);
        };
        rec.onerror = () => setIsRecording(false);
        rec.onend = () => setIsRecording(false);
        recognitionRef.current = rec; rec.start(); setIsRecording(true); setTranscript("");
    }

    function stopRecording() {
        recognitionRef.current?.stop(); setIsRecording(false);
        if (transcript.trim()) setStopForm((f) => ({ ...f, narration: transcript.trim() }));
    }

    async function handleExtractKeyPoints() {
        const narr = stopForm.narration || transcript;
        if (!narr.trim()) return;
        setNarrateLoading(true);
        const r = await fetch("/api/tours/narrate", {
            method: "POST", headers: authHeaders(), body: JSON.stringify({ narration: narr, filePath: stopForm.filePath }),
        });
        if (r.ok) { const { keyPoints } = await r.json(); setStopForm((f) => ({ ...f, keyPoints: keyPoints ?? [] })); }
        setNarrateLoading(false);
    }

    // ── Computed ──────────────────────────────────────────────────────────────

    const filteredTours = filterArea === "all" ? tours : tours.filter((t) => t.area === filterArea);
    const myProgress = selectedTour?.progress[0];
    const completedCount = myProgress?.completedStops.length ?? 0;
    const totalStops = selectedTour?.stops.length ?? 0;
    const pct = totalStops > 0 ? Math.round((completedCount / totalStops) * 100) : 0;
    const graph = selectedTour?.graph as GraphData;
    const hasGraph = !!(graph?.level1?.length);
    const replaySteps = graph?.replay?.steps ?? [];

    if (authLoading) return null;
    if (!user) { router.push("/auth"); return null; }

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-[#f7f8fa] dark:bg-dark-bg flex flex-col">
            {/* Header */}
            <header className="h-14 flex items-center px-6 border-b border-gray-100 dark:border-dark-border bg-white dark:bg-dark-card shrink-0">
                <Link href="/home" className="flex items-center gap-2 text-sm text-gray-500 dark:text-dark-subtle hover:text-gray-900 dark:hover:text-dark-text transition-colors mr-6">
                    <ArrowLeft className="w-4 h-4" /> Back
                </Link>
                <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    <span className="font-semibold text-gray-900 dark:text-dark-text">Codebase Tours</span>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <select value={filterArea} onChange={(e) => setFilterArea(e.target.value)}
                        className="text-sm border border-gray-200 dark:border-dark-border rounded-lg px-3 py-1.5 bg-white dark:bg-dark-card text-gray-700 dark:text-dark-muted">
                        <option value="all">All areas</option>
                        {AREAS.map((a) => <option key={a}>{a}</option>)}
                    </select>
                    <button onClick={() => { setSelectedTour(null); setViewMode("create"); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 transition-colors">
                        <Plus className="w-4 h-4" /> New Tour
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <aside className={`border-r border-gray-100 dark:border-dark-border bg-white dark:bg-dark-card flex flex-col overflow-hidden shrink-0 transition-all duration-300 ${sidebarOpen ? "w-72" : "w-10"}`}>
                    {/* Sidebar toggle */}
                    <div className={`flex items-center border-b border-gray-100 dark:border-dark-border shrink-0 ${sidebarOpen ? "px-3 py-2 justify-between" : "py-2 justify-center"}`}>
                        {sidebarOpen && <span className="text-xs font-semibold text-gray-500 dark:text-dark-subtle uppercase tracking-wider">Tours</span>}
                        <button onClick={() => setSidebarOpen((v) => !v)}
                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-dark-border text-gray-400 dark:text-dark-subtle transition-colors">
                            {sidebarOpen ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </button>
                    </div>
                    {sidebarOpen && (loading ? (
                        <div className="flex items-center justify-center h-32"><Loader2 className="w-5 h-5 animate-spin text-violet-500" /></div>
                    ) : filteredTours.length === 0 ? (
                        <div className="p-6 text-center">
                            <BookOpen className="w-8 h-8 text-gray-300 dark:text-dark-border mx-auto mb-2" />
                            <p className="text-sm text-gray-500 dark:text-dark-subtle">No tours yet</p>
                            <button onClick={() => { setSelectedTour(null); setViewMode("create"); }}
                                className="mt-3 text-xs text-violet-600 dark:text-violet-400 hover:underline">
                                Create your first tour →
                            </button>
                        </div>
                    ) : (
                        <ul className="p-2 space-y-1 overflow-y-auto flex-1">
                            {filteredTours.map((tour) => {
                                const prog = tour.progress[0];
                                const done = prog?.completedStops.length ?? 0;
                                const total = tour.stops.length;
                                const isSelected = selectedTour?.id === tour.id;
                                const hasG = !!(tour.graph as GraphData)?.level1?.length;
                                return (
                                    <li key={tour.id}>
                                        <button onClick={() => { setSelectedTour(tour); setViewMode("detail"); }}
                                            className={`w-full text-left rounded-lg p-3 transition-colors ${isSelected
                                                ? "bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800"
                                                : "hover:bg-gray-50 dark:hover:bg-dark-border"}`}>
                                            <div className="flex items-start justify-between gap-2">
                                                <span className="text-sm font-medium text-gray-900 dark:text-dark-text leading-snug">{tour.title}</span>
                                                <div className="flex gap-1 shrink-0">
                                                    {prog?.completedAt && <Trophy className="w-3.5 h-3.5 text-amber-500" />}
                                                    {hasG && <Layers className="w-3.5 h-3.5 text-violet-400" />}
                                                </div>
                                            </div>
                                            <div className="flex gap-1.5 mt-1.5 flex-wrap">
                                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${AREA_COLORS[tour.area] ?? AREA_COLORS.general}`}>{tour.area}</span>
                                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${DIFF_COLORS[tour.difficulty] ?? DIFF_COLORS.beginner}`}>{tour.difficulty}</span>
                                            </div>
                                            {total > 0 && (
                                                <div className="mt-2">
                                                    <div className="flex justify-between text-xs text-gray-400 dark:text-dark-subtle mb-1">
                                                        <span>{done}/{total} stops</span><span>{Math.round((done / total) * 100)}%</span>
                                                    </div>
                                                    <div className="h-1 bg-gray-100 dark:bg-dark-border rounded-full overflow-hidden">
                                                        <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${Math.round((done / total) * 100)}%` }} />
                                                    </div>
                                                </div>
                                            )}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    ))}
                </aside>

                {/* Main */}
                <main className="flex-1 overflow-hidden relative">
                    <AnimatePresence mode="wait">

                        {/* ── Empty ── */}
                        {viewMode === "list" && (
                            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="h-full flex flex-col items-center justify-center text-center px-8">
                                <div className="w-16 h-16 rounded-2xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center mb-4">
                                    <Layers className="w-7 h-7 text-violet-500" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text mb-2">Visual Codebase Tours</h2>
                                <p className="text-sm text-gray-500 dark:text-dark-subtle max-w-sm mb-6">
                                    Connect a repo → Genesis builds a 3-level visual map (system → modules → functions) with animated request replay.
                                </p>
                                <button onClick={() => setViewMode("create")}
                                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm transition-colors">
                                    <Plus className="w-4 h-4" /> Create your first tour
                                </button>
                            </motion.div>
                        )}

                        {/* ── Create ── */}
                        {viewMode === "create" && (
                            <motion.div key="create" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                className="max-w-lg mx-auto py-10 px-6 overflow-y-auto h-full">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text mb-1">New Codebase Tour</h2>
                                <p className="text-sm text-gray-500 dark:text-dark-subtle mb-6">Create a guided walkthrough linked to real files and a visual architecture map.</p>
                                <div className="space-y-4">
                                    <Fld label="Tour title *">
                                        <input type="text" placeholder="e.g. How Auth Works End-to-End"
                                            value={createForm.title} onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
                                            className={INPUT} />
                                    </Fld>
                                    <Fld label="Description">
                                        <textarea placeholder="What will engineers learn?" rows={2}
                                            value={createForm.description} onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                                            className={INPUT + " resize-none"} />
                                    </Fld>
                                    <div className="flex gap-3">
                                        <Fld label="Area" className="flex-1">
                                            <select value={createForm.area} onChange={(e) => setCreateForm((f) => ({ ...f, area: e.target.value }))} className={SELECT}>
                                                {AREAS.map((a) => <option key={a}>{a}</option>)}
                                            </select>
                                        </Fld>
                                        <Fld label="Difficulty" className="flex-1">
                                            <select value={createForm.difficulty} onChange={(e) => setCreateForm((f) => ({ ...f, difficulty: e.target.value }))} className={SELECT}>
                                                {DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}
                                            </select>
                                        </Fld>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-dark-muted mb-1">
                                            GitHub repo <span className="text-violet-500 font-normal">(required for visual architecture map)</span>
                                        </label>
                                        {repos.length > 0 ? (
                                            <select value={createForm.repoId} onChange={(e) => setCreateForm((f) => ({ ...f, repoId: e.target.value }))} className={SELECT}>
                                                <option value="">Select a repo…</option>
                                                {repos.map((r) => <option key={r.id} value={r.id}>{r.repoName}</option>)}
                                            </select>
                                        ) : null}
                                        {/* Inline repo connect */}
                                        {(!createForm.repoId) && (
                                            <div className={`${repos.length > 0 ? "mt-2" : ""}`}>
                                                <div className="flex gap-2">
                                                    <input type="text"
                                                        placeholder="https://github.com/owner/repo"
                                                        value={newRepoUrl}
                                                        onChange={(e) => setNewRepoUrl(e.target.value)}
                                                        className={INPUT + " flex-1 font-mono text-xs"}
                                                        onKeyDown={(e) => e.key === "Enter" && handleConnectRepo()}
                                                    />
                                                    <button onClick={handleConnectRepo} disabled={!newRepoUrl.trim() || addingRepo}
                                                        className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 dark:bg-dark-border text-white text-xs rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors whitespace-nowrap">
                                                        {addingRepo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                                                        Connect
                                                    </button>
                                                </div>
                                                <p className="text-xs text-gray-400 dark:text-dark-subtle mt-1">
                                                    Paste any public GitHub repo URL to connect it and enable the visual map.
                                                </p>
                                            </div>
                                        )}
                                        {createForm.repoId && repos.find(r => r.id === createForm.repoId) && (
                                            <div className="flex items-center gap-2 mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                                                <Check className="w-3.5 h-3.5" />
                                                {repos.find(r => r.id === createForm.repoId)?.repoName} connected
                                                <button onClick={() => setCreateForm((f) => ({ ...f, repoId: "" }))} className="text-gray-400 hover:text-gray-600 ml-auto"><X className="w-3.5 h-3.5" /></button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button onClick={() => setViewMode("list")} className={BTN_SECONDARY}>Cancel</button>
                                        <button onClick={handleCreateTour} disabled={!createForm.title.trim() || createLoading} className={BTN_PRIMARY}>
                                            {createLoading && <Loader2 className="w-4 h-4 animate-spin" />} Create Tour
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ── Detail ── */}
                        {viewMode === "detail" && selectedTour && (
                            <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                className="p-6 overflow-y-auto h-full relative">
                                {/* Visual road progress overlay during analysis */}
                                {analyzing && (
                                    <AnalysisRoadProgress steps={ANALYSIS_STEPS} currentStep={analysisStep} />
                                )}
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <div className="flex gap-2 mb-1 flex-wrap">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${AREA_COLORS[selectedTour.area] ?? AREA_COLORS.general}`}>{selectedTour.area}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFF_COLORS[selectedTour.difficulty] ?? DIFF_COLORS.beginner}`}>{selectedTour.difficulty}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${selectedTour.status === "Published" ? "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400" : "bg-gray-100 dark:bg-dark-border text-gray-600 dark:text-dark-subtle"}`}>{selectedTour.status}</span>
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text">{selectedTour.title}</h2>
                                        {selectedTour.description && <p className="text-sm text-gray-500 dark:text-dark-subtle mt-1">{selectedTour.description}</p>}
                                        {selectedTour.repoId && repos.find(r => r.id === selectedTour.repoId) && (
                                            <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500 dark:text-dark-subtle">
                                                <GitBranch className="w-3.5 h-3.5" />{repos.find(r => r.id === selectedTour.repoId)?.repoName}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <button onClick={handlePublishToggle}
                                            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${selectedTour.status === "Published" ? "border-gray-200 dark:border-dark-border text-gray-600 dark:text-dark-muted hover:bg-gray-50 dark:hover:bg-dark-border" : "border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20"}`}>
                                            {selectedTour.status === "Published" ? "Unpublish" : "Publish"}
                                        </button>
                                        <button onClick={() => handleDeleteTour(selectedTour.id)}
                                            className="text-xs px-3 py-1.5 rounded-lg border border-red-100 dark:border-red-900/40 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                            Delete
                                        </button>
                                    </div>
                                </div>

                                {/* Visual Map card */}
                                <div className={`rounded-xl border p-4 mb-5 ${hasGraph ? "border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-900/10" : "border-gray-100 dark:border-dark-border bg-white dark:bg-dark-card"}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Layers className={`w-5 h-5 ${hasGraph ? "text-violet-600 dark:text-violet-400" : "text-gray-400"}`} />
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-dark-text">
                                                    {hasGraph ? "Visual Architecture Map" : "Generate Visual Map"}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-dark-subtle mt-0.5">
                                                    {hasGraph ? graph.summary?.slice(0, 100) + "…" : "Genesis analyzes the full repo → 3-level visual map + request replay animation"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            {hasGraph && (
                                                <button onClick={() => { setDiagramLevel(1); setDrillTarget(null); setActiveNodeId(null); setViewMode("diagram"); }}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 transition-colors">
                                                    <Eye className="w-4 h-4" /> View Map
                                                </button>
                                            )}
                                            {selectedTour.repoId && (
                                                <button onClick={handleAnalyze} disabled={analyzing}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors disabled:opacity-50 ${hasGraph ? "border border-gray-200 dark:border-dark-border text-gray-600 dark:text-dark-muted hover:bg-gray-50 dark:hover:bg-dark-border" : "bg-violet-600 text-white hover:bg-violet-700"}`}>
                                                    {analyzing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</> : hasGraph ? <><RefreshCw className="w-4 h-4" /> Re-analyze</> : <><Sparkles className="w-4 h-4" /> Analyze Repo</>}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {/* Inline repo connect if not set */}
                                    {!selectedTour.repoId && (
                                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-dark-border">
                                            <p className="text-xs text-gray-500 dark:text-dark-subtle mb-2">Connect a GitHub repo to generate the visual map:</p>
                                            <div className="flex gap-2">
                                                <input type="text" placeholder="https://github.com/owner/repo"
                                                    value={newRepoUrl} onChange={(e) => setNewRepoUrl(e.target.value)}
                                                    className="flex-1 px-3 py-1.5 border border-gray-200 dark:border-dark-border rounded-lg text-xs font-mono bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
                                                    onKeyDown={(e) => e.key === "Enter" && handleConnectAndLink()} />
                                                <button onClick={handleConnectAndLink} disabled={!newRepoUrl.trim() || addingRepo}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white text-xs rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors whitespace-nowrap">
                                                    {addingRepo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Connect & Analyze
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Progress */}
                                {totalStops > 0 && (
                                    <div className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-xl p-4 mb-5">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Users className="w-4 h-4 text-violet-500" />
                                                <span className="text-sm font-medium text-gray-700 dark:text-dark-muted">Your progress</span>
                                            </div>
                                            <span className="text-sm font-semibold text-violet-700 dark:text-violet-400">{completedCount}/{totalStops} · {pct}%</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 dark:bg-dark-border rounded-full overflow-hidden">
                                            <div className="h-full bg-violet-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                                        </div>
                                        {myProgress?.completedAt && <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-600 dark:text-amber-400"><Trophy className="w-3.5 h-3.5" /> Tour completed!</div>}
                                    </div>
                                )}

                                {totalStops > 0 && (
                                    <button onClick={() => { const n = selectedTour.stops.findIndex(s => !(myProgress?.completedStops ?? []).includes(s.id)); setPlaybackIdx(n >= 0 ? n : 0); setFileContent(null); setViewMode("playback"); }}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors mb-6 font-medium">
                                        <Play className="w-4 h-4 fill-white" />
                                        {completedCount > 0 && completedCount < totalStops ? "Resume Tour" : "Start Tour"}
                                    </button>
                                )}

                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-gray-800 dark:text-dark-text">File Stops ({totalStops})</h3>
                                    <button onClick={() => { setStopForm({ title: "", filePath: "", narration: "", keyPoints: [], lineStart: "", lineEnd: "" }); setTranscript(""); setViewMode("add-stop"); }}
                                        className="flex items-center gap-1.5 text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 transition-colors">
                                        <Plus className="w-4 h-4" /> Add stop
                                    </button>
                                </div>

                                {totalStops === 0 ? (
                                    <div className="border-2 border-dashed border-gray-200 dark:border-dark-border rounded-xl p-8 text-center">
                                        <FileCode className="w-8 h-8 text-gray-300 dark:text-dark-border mx-auto mb-2" />
                                        <p className="text-sm text-gray-500 dark:text-dark-subtle mb-2">No file stops yet.</p>
                                        <button onClick={() => { setStopForm({ title: "", filePath: "", narration: "", keyPoints: [], lineStart: "", lineEnd: "" }); setTranscript(""); setViewMode("add-stop"); }}
                                            className="text-sm text-violet-600 dark:text-violet-400 hover:underline">+ Add first stop</button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {selectedTour.stops.map((stop, i) => {
                                            const done = (myProgress?.completedStops ?? []).includes(stop.id);
                                            return (
                                                <div key={stop.id} className={`bg-white dark:bg-dark-card border rounded-xl p-4 flex gap-4 transition-colors ${done ? "border-violet-200 dark:border-violet-800" : "border-gray-100 dark:border-dark-border"}`}>
                                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${done ? "bg-violet-600" : "bg-gray-100 dark:bg-dark-border"}`}>
                                                        {done ? <Check className="w-3.5 h-3.5 text-white" /> : <span className="text-xs font-semibold text-gray-500 dark:text-dark-subtle">{i + 1}</span>}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-gray-900 dark:text-dark-text text-sm">{stop.title}</p>
                                                        <p className="text-xs text-gray-500 dark:text-dark-subtle font-mono mt-0.5 truncate">{stop.filePath}</p>
                                                        {stop.narration && <p className="text-xs text-gray-500 dark:text-dark-muted mt-1 line-clamp-2">{stop.narration}</p>}
                                                    </div>
                                                    <button onClick={() => handleDeleteStop(stop.id)} className="text-gray-300 dark:text-dark-border hover:text-red-400 shrink-0"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* ── DIAGRAM VIEW ── */}
                        {viewMode === "diagram" && selectedTour && (
                            <motion.div key="diagram" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="h-full flex flex-col bg-gray-950">
                                {/* Diagram toolbar */}
                                <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-800 bg-dark-card shrink-0">
                                    <button onClick={() => { if (diagramLevel > 1) { setDiagramLevel(1); setDrillTarget(null); setActiveNodeId(null); } else { setViewMode("detail"); } }} className="text-gray-400 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
                                    <span className="text-sm font-medium text-white">{selectedTour.title}</span>

                                    {/* Level breadcrumb */}
                                    <div className="flex items-center gap-1 ml-2 text-xs">
                                        <button onClick={() => { setDiagramLevel(1); setDrillTarget(null); setActiveNodeId(null); setInfoPanel(null); }}
                                            className={`px-2 py-1 rounded transition-colors ${diagramLevel === 1 ? "bg-violet-600 text-white" : "text-gray-400 hover:text-white"}`}>
                                            L1 · System
                                        </button>
                                        {diagramLevel >= 2 && drillTarget && (
                                            <>
                                                <ChevronRight className="w-3 h-3 text-gray-600" />
                                                <button onClick={() => { setDiagramLevel(2); setActiveNodeId(null); }}
                                                    className={`px-2 py-1 rounded transition-colors ${diagramLevel === 2 ? "bg-violet-600 text-white" : "text-gray-400 hover:text-white"}`}>
                                                    L2 · {graph?.level1?.find(n => n.id === drillTarget)?.label ?? "Modules"}
                                                </button>
                                            </>
                                        )}
                                        {diagramLevel === 3 && activeNodeId && (
                                            <>
                                                <ChevronRight className="w-3 h-3 text-gray-600" />
                                                <span className="px-2 py-1 rounded bg-violet-600 text-white">L3 · Functions</span>
                                            </>
                                        )}
                                    </div>

                                    <div className="ml-auto flex items-center gap-2">
                                        {graph?.replay && !replayActive && (
                                            <button onClick={startReplay}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700 transition-colors">
                                                <Zap className="w-3.5 h-3.5" /> Replay: {graph.replay.name}
                                            </button>
                                        )}
                                        {replayActive && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-emerald-400">{replaySteps[replayStep]?.action}</span>
                                                <button onClick={replayNext}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700 transition-colors">
                                                    {replayStep < replaySteps.length - 1 ? <><ChevronRight className="w-3.5 h-3.5" /> Next step</> : <><Check className="w-3.5 h-3.5" /> Done</>}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Canvas: Roadmap (L1) or Modules (L2/L3) */}
                                <div className="flex-1 flex overflow-hidden">
                                    <div className="flex-1 relative overflow-hidden">
                                        {diagramLevel === 1 && graph ? (
                                            <VisualRoadmap
                                                graph={graph}
                                                replayActive={replayActive}
                                                replayStep={replayStep}
                                                replaySteps={replaySteps}
                                            />
                                        ) : graph ? (
                                            <ModulesView
                                                graph={graph}
                                                drillTarget={drillTarget}
                                                activeNodeId={activeNodeId}
                                                setActiveNodeId={setActiveNodeId}
                                                setInfoPanel={setInfoPanel}
                                                diagramLevel={diagramLevel}
                                                setDiagramLevel={setDiagramLevel}
                                                replayActive={replayActive}
                                                replayStep={replayStep}
                                                replaySteps={replaySteps}
                                            />
                                        ) : null}
                                    </div>
                                </div>

                                {/* Architecture summary footer — L2/L3 only (L1 shows it inline) */}
                                {graph?.summary && diagramLevel > 1 && !replayActive && (
                                    <div className="px-4 py-2 border-t border-gray-800 bg-dark-card text-xs text-gray-400 shrink-0 line-clamp-2">
                                        {graph.summary}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* ── Add Stop ── */}
                        {viewMode === "add-stop" && selectedTour && (
                            <motion.div key="add-stop" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                className="max-w-lg mx-auto py-10 px-6 overflow-y-auto h-full">
                                <button onClick={() => setViewMode("detail")}
                                    className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-dark-subtle hover:text-gray-700 dark:hover:text-dark-muted mb-5 transition-colors">
                                    <ChevronLeft className="w-4 h-4" /> Back
                                </button>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text mb-1">Add a Stop</h2>
                                <p className="text-sm text-gray-500 dark:text-dark-subtle mb-6">
                                    Paste a GitHub file URL — Genesis reads it and writes everything automatically.
                                </p>
                                <div className="space-y-4">
                                    <Fld label="GitHub file URL or file path *">
                                        <div className="flex gap-2">
                                            <input type="text" placeholder="https://github.com/owner/repo/blob/main/src/lib/auth.ts"
                                                value={stopForm.filePath} onChange={(e) => setStopForm((f) => ({ ...f, filePath: e.target.value }))}
                                                className={INPUT + " font-mono flex-1"} />
                                            <button onClick={handleAutoGenerate} disabled={!stopForm.filePath.trim() || autoGenLoading}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors whitespace-nowrap">
                                                {autoGenLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <><Sparkles className="w-4 h-4" /> Generate</>}
                                            </button>
                                        </div>
                                        {!autoGenLoading && !stopForm.narration && (
                                            <p className="text-xs text-violet-500 dark:text-violet-400 mt-1.5">
                                                Paste any GitHub file URL and hit Generate — Genesis writes everything automatically.
                                            </p>
                                        )}
                                    </Fld>

                                    {autoGenLoading && (
                                        <div className="flex items-center gap-3 p-4 bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-900/30 rounded-xl">
                                            <Loader2 className="w-5 h-5 text-violet-500 animate-spin shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium text-violet-700 dark:text-violet-400">Reading file from GitHub…</p>
                                                <p className="text-xs text-violet-500 mt-0.5">Genesis is analyzing the file</p>
                                            </div>
                                        </div>
                                    )}

                                    {stopForm.title && (
                                        <Fld label="Stop title (auto-generated)">
                                            <input type="text" value={stopForm.title} onChange={(e) => setStopForm((f) => ({ ...f, title: e.target.value }))} className={INPUT} />
                                        </Fld>
                                    )}

                                    <div className="flex gap-3">
                                        <Fld label="Line start" className="flex-1">
                                            <input type="number" placeholder="1" value={stopForm.lineStart} onChange={(e) => setStopForm((f) => ({ ...f, lineStart: e.target.value }))} className={INPUT} />
                                        </Fld>
                                        <Fld label="Line end" className="flex-1">
                                            <input type="number" placeholder="50" value={stopForm.lineEnd} onChange={(e) => setStopForm((f) => ({ ...f, lineEnd: e.target.value }))} className={INPUT} />
                                        </Fld>
                                    </div>

                                    {stopForm.narration && (
                                        <Fld label="Narration (AI-generated)">
                                            <textarea value={stopForm.narration} onChange={(e) => setStopForm((f) => ({ ...f, narration: e.target.value }))} rows={5} className={INPUT + " resize-none"} />
                                        </Fld>
                                    )}

                                    {!stopForm.narration && !autoGenLoading && (
                                        <div>
                                            <label className="block text-xs text-gray-400 dark:text-dark-subtle mb-2">Or record a voice narration</label>
                                            <div className="flex gap-2 mb-2">
                                                {!isRecording
                                                    ? <button onClick={startRecording} className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800 rounded-lg text-sm transition-colors"><Mic className="w-4 h-4" /> Record voice</button>
                                                    : <button onClick={stopRecording} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 rounded-lg text-sm animate-pulse transition-colors"><StopCircle className="w-4 h-4" /> Stop recording</button>}
                                            </div>
                                            {isRecording && transcript && <div className="bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-900/40 rounded-lg p-3 mb-2 text-xs italic text-gray-600 dark:text-dark-muted">{transcript}</div>}
                                            {transcript && !isRecording && (
                                                <button onClick={handleExtractKeyPoints} disabled={narrateLoading} className="flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 disabled:opacity-40 transition-colors">
                                                    {narrateLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Extract key points with AI →
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {stopForm.keyPoints.length > 0 && (
                                        <div className="bg-gray-50 dark:bg-dark-border border border-gray-100 dark:border-dark-border rounded-lg p-3">
                                            <p className="text-xs font-medium text-gray-600 dark:text-dark-muted mb-2">Key points</p>
                                            <ul className="space-y-1">
                                                {stopForm.keyPoints.map((kp, i) => (
                                                    <li key={i} className="text-xs text-gray-700 dark:text-dark-text flex items-start gap-2">
                                                        <span className="text-violet-500 mt-0.5">•</span>{kp}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <div className="flex gap-3 pt-2">
                                        <button onClick={() => setViewMode("detail")} className={BTN_SECONDARY}>Cancel</button>
                                        <button onClick={handleAddStop} disabled={!stopForm.filePath.trim() || stopLoading} className={BTN_PRIMARY}>
                                            {stopLoading && <Loader2 className="w-4 h-4 animate-spin" />} Add Stop
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ── Playback ── */}
                        {viewMode === "playback" && selectedTour && selectedTour.stops[playbackIdx] && (
                            <motion.div key={`pb-${playbackIdx}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                className="h-full flex flex-col">
                                <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-dark-border bg-white dark:bg-dark-card shrink-0">
                                    <button onClick={() => setViewMode("detail")} className="text-gray-400 hover:text-gray-700 dark:hover:text-dark-muted transition-colors"><X className="w-4 h-4" /></button>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-400 dark:text-dark-subtle">{selectedTour.title}</p>
                                        <h3 className="font-semibold text-gray-900 dark:text-dark-text">{selectedTour.stops[playbackIdx].title}</h3>
                                    </div>
                                    <span className="text-sm text-gray-400 dark:text-dark-subtle shrink-0">{playbackIdx + 1}/{selectedTour.stops.length}</span>
                                </div>
                                <div className="h-1 bg-gray-100 dark:bg-dark-border shrink-0">
                                    <div className="h-full bg-violet-500 transition-all duration-500" style={{ width: `${((playbackIdx + 1) / selectedTour.stops.length) * 100}%` }} />
                                </div>
                                <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2">
                                    <div className="bg-gray-950 overflow-auto p-5 border-r border-gray-800">
                                        <div className="flex items-center gap-2 mb-3">
                                            <FileCode className="w-4 h-4 text-gray-500" />
                                            <span className="text-xs text-gray-500 font-mono">{selectedTour.stops[playbackIdx].filePath}</span>
                                        </div>
                                        {fileLoading
                                            ? <div className="flex items-center gap-2 text-gray-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
                                            : fileContent
                                                ? <FileContentDisplay content={fileContent} lineStart={selectedTour.stops[playbackIdx].lineStart} lineEnd={selectedTour.stops[playbackIdx].lineEnd} />
                                                : <div className="text-gray-500 text-sm flex items-start gap-2"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{selectedTour.repoId ? "File not found in repo." : "No repo connected."}</div>}
                                    </div>
                                    <div className="p-6 overflow-y-auto bg-white dark:bg-dark-card">
                                        <h4 className="text-xs uppercase tracking-wide text-gray-400 dark:text-dark-subtle font-semibold mb-2">Narration</h4>
                                        <p className="text-sm text-gray-700 dark:text-dark-muted leading-relaxed mb-5">
                                            {selectedTour.stops[playbackIdx].narration || <span className="italic text-gray-400 dark:text-dark-subtle">No narration for this stop.</span>}
                                        </p>
                                        {(selectedTour.stops[playbackIdx].keyPoints as string[]).length > 0 && (
                                            <>
                                                <h4 className="text-xs uppercase tracking-wide text-gray-400 dark:text-dark-subtle font-semibold mb-2">Key Points</h4>
                                                <ul className="space-y-2.5">
                                                    {(selectedTour.stops[playbackIdx].keyPoints as string[]).map((kp, i) => (
                                                        <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-dark-muted">
                                                            <div className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0 mt-0.5">
                                                                <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">{i + 1}</span>
                                                            </div>{kp}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-dark-border bg-white dark:bg-dark-card shrink-0">
                                    <button disabled={playbackIdx === 0} onClick={() => setPlaybackIdx((i) => i - 1)}
                                        className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 dark:border-dark-border rounded-lg text-sm text-gray-600 dark:text-dark-muted hover:bg-gray-50 dark:hover:bg-dark-border disabled:opacity-40 transition-colors">
                                        <ChevronLeft className="w-4 h-4" /> Previous
                                    </button>
                                    <div className="flex gap-1.5">
                                        {selectedTour.stops.map((s, i) => {
                                            const done = (myProgress?.completedStops ?? []).includes(s.id);
                                            return <button key={s.id} onClick={() => setPlaybackIdx(i)}
                                                className={`h-2 rounded-full transition-all ${i === playbackIdx ? "bg-violet-600 w-5" : done ? "bg-violet-300 dark:bg-violet-700 w-2" : "bg-gray-200 dark:bg-dark-border w-2"}`} />;
                                        })}
                                    </div>
                                    <button onClick={goToNextStop}
                                        className="flex items-center gap-1.5 px-5 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700 transition-colors">
                                        {playbackIdx === selectedTour.stops.length - 1 ? <><Check className="w-4 h-4" /> Complete</> : <>Next <ChevronRight className="w-4 h-4" /></>}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}

// ─── Shared style constants ───────────────────────────────────────────────────

const INPUT = "w-full px-3 py-2 border border-gray-200 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text placeholder-gray-400 dark:placeholder-dark-subtle focus:outline-none focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-900";
const SELECT = "w-full px-3 py-2 border border-gray-200 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text";
const BTN_PRIMARY = "flex items-center gap-2 px-5 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700 disabled:opacity-50 transition-colors";
const BTN_SECONDARY = "px-4 py-2 border border-gray-200 dark:border-dark-border rounded-lg text-sm text-gray-600 dark:text-dark-muted hover:bg-gray-50 dark:hover:bg-dark-border transition-colors";

function Fld({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
    return (
        <div className={className}>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-muted mb-1">{label}</label>
            {children}
        </div>
    );
}

function FileContentDisplay({ content, lineStart, lineEnd }: { content: string; lineStart?: number | null; lineEnd?: number | null }) {
    return (
        <pre className="text-xs font-mono text-gray-300 overflow-auto leading-5 max-h-[60vh]">
            {content.split("\n").map((line, i) => {
                const n = i + 1;
                const hl = lineStart && lineEnd ? n >= lineStart && n <= lineEnd : lineStart ? n === lineStart : false;
                return (
                    <div key={i} className={`flex gap-3 px-1 ${hl ? "bg-violet-900/40 rounded" : ""}`}>
                        <span className="text-gray-600 select-none w-8 shrink-0 text-right">{n}</span>
                        <span className={hl ? "text-violet-200" : ""}>{line}</span>
                    </div>
                );
            })}
        </pre>
    );
}
