"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Excalidraw, MainMenu, convertToExcalidrawElements } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import Joyride, { STATUS, Step, CallBackProps } from "react-joyride";
import { ArrowLeft, Mic, MicOff, Loader2, Sparkles, X, Trash2, History, Bot, User, Send, Play, Pause, Square, Cloud, CloudUpload, CloudOff, Share2, Users, Wifi, Copy, Code2, Zap } from "lucide-react";
import type { LibraryItems, ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

import { useAISession, type AddNodePayload, type SessionStatus } from "@/hooks/useAISession";
import { useAuth } from "@/hooks/useAuth";
import { getCurrentSession } from "@/lib/aws-client";
import { useRouter } from "next/navigation";
import InviteModal from "@/components/workspace/InviteModal";

const BACKEND_WS = process.env.NEXT_PUBLIC_BACKEND_WS_URL ?? "ws://localhost:8080";

// ═══════════════════════════════════════════════════════════════════════════
// VISUAL DESIGN SYSTEM — rich per-type colours, shapes, strokes, arrows
// ═══════════════════════════════════════════════════════════════════════════

interface NodeStyle {
    bg: string;           // fill colour
    stroke: string;       // border colour
    strokeWidth: number;  // border thickness
    strokeStyle: "solid" | "dashed" | "dotted";
    fillStyle: "solid" | "hachure" | "cross-hatch";
    shape: "rectangle" | "ellipse" | "diamond";
    roundness: any;       // null = sharp, {type,value} = rounded
    labelColor: string;
    labelSize: number;
    arrowColor: string;         // arrow FROM this node
    arrowStyle: "solid" | "dashed" | "dotted";
    arrowEnd: "arrow" | "triangle" | "dot" | "bar" | "none";
    arrowStart: "arrow" | "triangle" | "dot" | "bar" | "none";
    w: number; h: number;       // default size
}

const NODE_STYLES: Record<string, NodeStyle> = {
    // ── Flowchart ──────────────────────────────────────────────────────────
    start_end: {
        bg: "#d1fae5", stroke: "#059669", strokeWidth: 2.5, strokeStyle: "solid",
        fillStyle: "solid", shape: "ellipse", roundness: null,
        labelColor: "#064e3b", labelSize: 14,
        arrowColor: "#059669", arrowStyle: "solid", arrowEnd: "arrow", arrowStart: "none",
        w: 160, h: 56,
    },
    process: {
        bg: "#dbeafe", stroke: "#2563eb", strokeWidth: 2, strokeStyle: "solid",
        fillStyle: "solid", shape: "rectangle", roundness: { type: 3, value: 12 },
        labelColor: "#1e3a8a", labelSize: 14,
        arrowColor: "#3b82f6", arrowStyle: "solid", arrowEnd: "arrow", arrowStart: "none",
        w: 190, h: 66,
    },
    decision: {
        bg: "#fef9c3", stroke: "#ca8a04", strokeWidth: 2.5, strokeStyle: "solid",
        fillStyle: "solid", shape: "diamond", roundness: null,
        labelColor: "#713f12", labelSize: 13,
        arrowColor: "#d97706", arrowStyle: "solid", arrowEnd: "arrow", arrowStart: "none",
        w: 190, h: 110,
    },
    io: {
        bg: "#f3e8ff", stroke: "#7c3aed", strokeWidth: 2, strokeStyle: "solid",
        fillStyle: "solid", shape: "rectangle", roundness: { type: 3, value: 6 },
        labelColor: "#4c1d95", labelSize: 14,
        arrowColor: "#8b5cf6", arrowStyle: "solid", arrowEnd: "arrow", arrowStart: "none",
        w: 190, h: 66,
    },
    // ── Architecture ───────────────────────────────────────────────────────
    client: {
        bg: "#eff6ff", stroke: "#2563eb", strokeWidth: 2, strokeStyle: "solid",
        fillStyle: "solid", shape: "rectangle", roundness: { type: 3, value: 16 },
        labelColor: "#1e3a8a", labelSize: 13,
        arrowColor: "#3b82f6", arrowStyle: "solid", arrowEnd: "arrow", arrowStart: "none",
        w: 190, h: 66,
    },
    server: {
        bg: "#f0fdf4", stroke: "#16a34a", strokeWidth: 2, strokeStyle: "solid",
        fillStyle: "solid", shape: "rectangle", roundness: { type: 3, value: 10 },
        labelColor: "#14532d", labelSize: 13,
        arrowColor: "#22c55e", arrowStyle: "solid", arrowEnd: "arrow", arrowStart: "none",
        w: 190, h: 66,
    },
    database: {
        bg: "#fefce8", stroke: "#ca8a04", strokeWidth: 2.5, strokeStyle: "solid",
        fillStyle: "hachure", shape: "ellipse", roundness: null,
        labelColor: "#713f12", labelSize: 13,
        arrowColor: "#eab308", arrowStyle: "dashed", arrowEnd: "arrow", arrowStart: "none",
        w: 170, h: 80,
    },
    cache: {
        bg: "#fdf4ff", stroke: "#a21caf", strokeWidth: 2, strokeStyle: "dashed",
        fillStyle: "solid", shape: "rectangle", roundness: { type: 3, value: 20 },
        labelColor: "#701a75", labelSize: 13,
        arrowColor: "#c026d3", arrowStyle: "dashed", arrowEnd: "dot", arrowStart: "none",
        w: 180, h: 62,
    },
    queue: {
        bg: "#f5f3ff", stroke: "#6d28d9", strokeWidth: 2, strokeStyle: "solid",
        fillStyle: "solid", shape: "rectangle", roundness: { type: 3, value: 4 },
        labelColor: "#3b0764", labelSize: 13,
        arrowColor: "#7c3aed", arrowStyle: "solid", arrowEnd: "arrow", arrowStart: "none",
        w: 190, h: 66,
    },
    gateway: {
        bg: "#fff7ed", stroke: "#ea580c", strokeWidth: 2.5, strokeStyle: "solid",
        fillStyle: "solid", shape: "diamond", roundness: null,
        labelColor: "#7c2d12", labelSize: 13,
        arrowColor: "#f97316", arrowStyle: "solid", arrowEnd: "triangle", arrowStart: "none",
        w: 180, h: 100,
    },
    loadbalancer: {
        bg: "#ecfdf5", stroke: "#059669", strokeWidth: 2, strokeStyle: "solid",
        fillStyle: "solid", shape: "rectangle", roundness: { type: 3, value: 8 },
        labelColor: "#064e3b", labelSize: 13,
        arrowColor: "#10b981", arrowStyle: "solid", arrowEnd: "arrow", arrowStart: "none",
        w: 200, h: 66,
    },
    cdn: {
        bg: "#e0f2fe", stroke: "#0284c7", strokeWidth: 2, strokeStyle: "dotted",
        fillStyle: "solid", shape: "rectangle", roundness: { type: 3, value: 24 },
        labelColor: "#0c4a6e", labelSize: 13,
        arrowColor: "#0ea5e9", arrowStyle: "dotted", arrowEnd: "arrow", arrowStart: "none",
        w: 180, h: 62,
    },
    auth: {
        bg: "#fef2f2", stroke: "#dc2626", strokeWidth: 2.5, strokeStyle: "solid",
        fillStyle: "solid", shape: "rectangle", roundness: { type: 3, value: 10 },
        labelColor: "#7f1d1d", labelSize: 13,
        arrowColor: "#ef4444", arrowStyle: "solid", arrowEnd: "arrow", arrowStart: "none",
        w: 180, h: 66,
    },
    storage: {
        bg: "#f5f3ff", stroke: "#7c3aed", strokeWidth: 2, strokeStyle: "dashed",
        fillStyle: "hachure", shape: "ellipse", roundness: null,
        labelColor: "#3b0764", labelSize: 13,
        arrowColor: "#8b5cf6", arrowStyle: "dashed", arrowEnd: "dot", arrowStart: "none",
        w: 170, h: 76,
    },
    microservice: {
        bg: "#f0fdf4", stroke: "#15803d", strokeWidth: 2, strokeStyle: "solid",
        fillStyle: "solid", shape: "rectangle", roundness: { type: 3, value: 6 },
        labelColor: "#14532d", labelSize: 12,
        arrowColor: "#16a34a", arrowStyle: "solid", arrowEnd: "arrow", arrowStart: "none",
        w: 180, h: 62,
    },
    external_api: {
        bg: "#fff7ed", stroke: "#c2410c", strokeWidth: 2, strokeStyle: "dashed",
        fillStyle: "solid", shape: "rectangle", roundness: { type: 3, value: 8 },
        labelColor: "#7c2d12", labelSize: 13,
        arrowColor: "#f97316", arrowStyle: "dashed", arrowEnd: "triangle", arrowStart: "none",
        w: 190, h: 66,
    },
    firewall: {
        bg: "#fef2f2", stroke: "#b91c1c", strokeWidth: 3, strokeStyle: "solid",
        fillStyle: "solid", shape: "rectangle", roundness: null,
        labelColor: "#7f1d1d", labelSize: 13,
        arrowColor: "#dc2626", arrowStyle: "solid", arrowEnd: "bar", arrowStart: "none",
        w: 180, h: 62,
    },
    dns: {
        bg: "#e0f2fe", stroke: "#0369a1", strokeWidth: 2, strokeStyle: "solid",
        fillStyle: "solid", shape: "rectangle", roundness: { type: 3, value: 14 },
        labelColor: "#0c4a6e", labelSize: 13,
        arrowColor: "#0284c7", arrowStyle: "solid", arrowEnd: "arrow", arrowStart: "none",
        w: 170, h: 62,
    },
    // ── UML / ER ───────────────────────────────────────────────────────────
    actor: {
        bg: "#f0f9ff", stroke: "#0369a1", strokeWidth: 2, strokeStyle: "solid",
        fillStyle: "solid", shape: "ellipse", roundness: null,
        labelColor: "#0c4a6e", labelSize: 13,
        arrowColor: "#0284c7", arrowStyle: "solid", arrowEnd: "arrow", arrowStart: "none",
        w: 150, h: 60,
    },
    entity: {
        bg: "#faf5ff", stroke: "#6d28d9", strokeWidth: 2, strokeStyle: "solid",
        fillStyle: "solid", shape: "rectangle", roundness: null,
        labelColor: "#3b0764", labelSize: 13,
        arrowColor: "#7c3aed", arrowStyle: "solid", arrowEnd: "none", arrowStart: "none",
        w: 190, h: 66,
    },
    note: {
        bg: "#fefce8", stroke: "#a16207", strokeWidth: 1.5, strokeStyle: "dashed",
        fillStyle: "solid", shape: "rectangle", roundness: { type: 3, value: 4 },
        labelColor: "#713f12", labelSize: 12,
        arrowColor: "#ca8a04", arrowStyle: "dotted", arrowEnd: "none", arrowStart: "none",
        w: 190, h: 60,
    },
};

// Fallback style for unknown types
const DEFAULT_STYLE: NodeStyle = {
    bg: "#f1f5f9", stroke: "#475569", strokeWidth: 2, strokeStyle: "solid",
    fillStyle: "solid", shape: "rectangle", roundness: { type: 3, value: 10 },
    labelColor: "#0f172a", labelSize: 14,
    arrowColor: "#64748b", arrowStyle: "solid", arrowEnd: "arrow", arrowStart: "none",
    w: 190, h: 66,
};

const getStyle = (type: string): NodeStyle => NODE_STYLES[type] ?? DEFAULT_STYLE;

// ── Distinct vibrant hex color palette mapped deterministically from uid ──────
const COLLAB_COLORS = [
    { background: '#FF4B4B', stroke: '#CC0000' },
    { background: '#FF6D00', stroke: '#C43C00' },
    { background: '#FFD600', stroke: '#C8A000' },
    { background: '#00C853', stroke: '#007A2F' },
    { background: '#00B0FF', stroke: '#0059B2' },
    { background: '#AA00FF', stroke: '#6200CA' },
    { background: '#FF4081', stroke: '#C60055' },
    { background: '#00BCD4', stroke: '#006978' },
    { background: '#7C4DFF', stroke: '#4615B2' },
    { background: '#FF6E40', stroke: '#C43D00' },
    { background: '#1DE9B6', stroke: '#00A07A' },
    { background: '#F50057', stroke: '#AB003C' },
    { background: '#AEEA00', stroke: '#6D9100' },
    { background: '#00E5FF', stroke: '#00A3B4' },
    { background: '#FF9100', stroke: '#C56200' },
    { background: '#E040FB', stroke: '#A100C2' },
    { background: '#69F0AE', stroke: '#1DA462' },
    { background: '#40C4FF', stroke: '#0070C0' },
    { background: '#FF80AB', stroke: '#C94B7B' },
    { background: '#B2FF59', stroke: '#6ABF00' },
];

function uidToColor(uid: string): { background: string; stroke: string } {
    let hash = 0;
    for (let i = 0; i < uid.length; i++) {
        hash = uid.charCodeAt(i) + ((hash << 5) - hash);
    }
    return COLLAB_COLORS[Math.abs(hash) % COLLAB_COLORS.length];
}

// ── History Panel ─────────────────────────────────────────────────────────────
interface HistoryPanelProps {
    isOpen: boolean;
    onClose: () => void;
    history: any[];
    onClear: () => void;
    onSend: (text: string) => void;
}

function VoiceMessage({ url }: { url: string }) {
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [duration, setDuration] = React.useState(0);
    const [currentTime, setCurrentTime] = React.useState(0);
    const audioRef = React.useRef<HTMLAudioElement | null>(null);

    React.useEffect(() => {
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onloadedmetadata = () => setDuration(audio.duration);
        audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
        audio.onended = () => { setIsPlaying(false); setCurrentTime(0); };
        return () => { audio.pause(); audio.src = ""; };
    }, [url]);

    const toggle = () => {
        if (!audioRef.current) return;
        if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
        else { audioRef.current.play(); setIsPlaying(true); }
    };

    const formatTime = (time: number) => {
        if (!time || isNaN(time)) return "0:00";
        const m = Math.floor(time / 60);
        const s = Math.floor(time % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="mt-1 flex items-center gap-3 p-1 transition-all w-full min-w-[200px]">
            <button onClick={toggle} className="flex-shrink-0 flex items-center justify-center w-[36px] h-[36px] rounded-full transition-all shadow-sm active:scale-95 bg-gradient-to-br from-indigo-500 to-purple-600 text-white border border-white/20">
                {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
            </button>
            <div className="flex-1 flex flex-col justify-center gap-1.5">
                <div className="relative flex items-center gap-[2px] h-[20px] w-full">
                    {[...Array(32)].map((_, i) => {
                        const isPlayed = progress > (i / 32) * 100;
                        const height = 25 + (Math.sin(i * 0.4) * 45 + 30) * (i % 3 === 0 ? 0.6 : 1); 
                        return (
                            <div key={i} className={`flex-1 rounded-full transition-colors duration-200 ${isPlayed ? 'bg-indigo-500' : 'bg-gray-300'}`}
                                style={{ height: `${Math.min(100, Math.max(20, height))}%`, opacity: isPlayed ? 1 : 0.7 }} />
                        );
                    })}
                </div>
                <div className="flex justify-between items-center w-full px-0.5">
                    <span className="text-[10px] font-medium text-gray-400 tracking-tight" style={{ color: "rgba(0,0,0,0.4)" }}>
                        {isPlaying ? formatTime(currentTime) : formatTime(duration)}
                    </span>
                    <Sparkles size={11} className="text-gray-400" />
                </div>
            </div>
        </div>
    );
}

function HistoryPanel({ isOpen, onClose, history, onClear, onSend }: HistoryPanelProps) {
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const [input, setInput] = React.useState("");

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [history]);

    const handleSend = () => {
        if (!input.trim()) return;
        onSend(input);
        setInput("");
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: "fixed", top: "1.5rem", right: "1.5rem", bottom: "5.5rem", width: "24rem",
            background: "rgba(255, 255, 255, 0.75)", backdropFilter: "blur(20px)",
            borderRadius: "1.5rem", border: "1px solid rgba(0,0,0,0.08)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.12)", zIndex: 1100,
            display: "flex", flexDirection: "column", overflow: "hidden",
            animation: "slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
        }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-black/5 bg-white/40">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    <span className="font-semibold text-sm text-gray-800 tracking-tight">Speak History</span>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={onClear} className="p-2 hover:bg-black/5 rounded-full transition-colors group" title="Clear History">
                        <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-500" />
                    </button>
                    <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 py-2 space-y-4 scroll-smooth custom-scrollbar">
                {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3 opacity-60">
                        <History size={32} strokeWidth={1} />
                        <p className="text-xs font-medium">No conversation history yet</p>
                    </div>
                ) : (
                    history.map((msg, i) => (
                        <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className="flex items-center gap-1.5 mb-1 px-1">
                                {msg.role === 'user' ? (
                                    <><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">You</span><User size={10} className="text-gray-400" /></>
                                ) : (
                                    <><Sparkles size={10} className="text-blue-500" /><span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Friday</span></>
                                )}
                            </div>
                            <div style={{
                                maxWidth: "85%", padding: "0.75rem 1rem", fontSize: "0.875rem", lineHeight: "1.4",
                                borderRadius: msg.role === 'user' ? "1.25rem 1.25rem 0.25rem 1.25rem" : "1.25rem 1.25rem 1.25rem 0.25rem",
                                background: msg.role === 'user' ? "#F3F4F6" : "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
                                color: msg.role === 'user' ? "#1F2937" : "#1E40AF",
                                border: "1px solid rgba(0,0,0,0.03)", boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
                            }}>
                                {msg.text}
                                {msg.audioUrl && <VoiceMessage url={msg.audioUrl} />}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-4 border-t border-black/5 bg-white/40">
                <div className="relative flex items-center">
                    <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type a message to Friday..."
                        className="w-full bg-black/5 border-none rounded-xl py-2.5 pl-4 pr-12 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400" />
                    <button onClick={handleSend} disabled={!input.trim()}
                        className="absolute right-1.5 p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-blue-500 transition-all">
                        <Send size={16} />
                    </button>
                </div>
            </div>

            <style jsx>{`
                @keyframes slideIn { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.1); }
            `}</style>
        </div>
    );
}

// ── Collaborator Tooltip Popup ─────────────────────────────────────────────────
function CollaboratorStack({ collaborators, currentUid }: { collaborators: any[]; currentUid: string | undefined }) {
    const [showPopup, setShowPopup] = React.useState(false);
    const others = collaborators.filter(c => c.id !== currentUid);
    if (others.length === 0) return null;
    const visible = others.slice(0, 4);
    const overflow = others.length - 4;

    return (
        <div className="relative flex items-center">
            <button onClick={() => setShowPopup(v => !v)} className="flex -space-x-2 items-center focus:outline-none" title="Active collaborators">
                {visible.map((collab) => (
                    <div key={collab.id}
                        className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[11px] font-bold text-white shadow-md ring-1 ring-black/5 transition-transform hover:scale-110 hover:z-10 relative"
                        style={{ backgroundColor: collab.color?.background || uidToColor(collab.id || '').background }}
                        title={collab.username}>
                        {(collab.username || '?').charAt(0).toUpperCase()}
                    </div>
                ))}
                {overflow > 0 && (
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500 shadow-md ring-1 ring-black/5">+{overflow}</div>
                )}
            </button>
            {showPopup && (
                <>
                    <div className="fixed inset-0 z-[1199]" onClick={() => setShowPopup(false)} />
                    <div className="absolute top-full right-0 mt-2 z-[1200] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden min-w-[200px]"
                        style={{ animation: "popIn 0.15s ease-out" }}>
                        <div className="px-4 py-3 border-b border-gray-50">
                            <div className="flex items-center gap-2">
                                <Users size={13} className="text-gray-400" />
                                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{others.length} Active Now</span>
                            </div>
                        </div>
                        <div className="p-2 space-y-0.5 max-h-[200px] overflow-y-auto">
                            {others.map(collab => (
                                <div key={collab.id} className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors">
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-sm flex-shrink-0"
                                        style={{ backgroundColor: collab.color?.background || uidToColor(collab.id || '').background }}>
                                        {(collab.username || '?').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[13px] font-semibold text-gray-800 truncate">{collab.username || 'Anonymous'}</span>
                                        <span className="text-[10px] text-gray-400">Collaborating</span>
                                    </div>
                                    <div className="w-2 h-2 rounded-full bg-green-400 ml-auto flex-shrink-0 animate-pulse" />
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
            <style jsx>{`
                @keyframes popIn { from { transform: scale(0.92) translateY(-4px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
            `}</style>
        </div>
    );
}

// ── Floating AI status badge ──────────────────────────────────────────────────
function AIBadge({ status, transcript, isMuted, toggleMute, start, stop }: { status: SessionStatus; transcript: string; isMuted: boolean; toggleMute: () => void; start: () => void; stop: () => void; }) {
    const labels: Record<SessionStatus, string> = {
        idle: "AI Offline", requesting_permissions: "Requesting permissions…",
        connecting: "Connecting to FlowState AI…", ai_ready: "Listening",
        ai_done: "Speaking", error: "Connection error", stopped: "AI Disconnected",
    };
    const colors: Record<SessionStatus, string> = {
        idle: "bg-gray-100 text-gray-500", requesting_permissions: "bg-yellow-50 text-yellow-600",
        connecting: "bg-blue-50 text-blue-600", ai_ready: "bg-white text-gray-700",
        ai_done: "bg-white text-gray-700", error: "bg-red-50 text-red-600", stopped: "bg-gray-100 text-gray-500",
    };
    const isListening = status === "ai_ready" || status === "ai_done";
    const googleColors = ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#4285F4'];

    const renderVisualizer = () => (
        <div className="flex items-center justify-center gap-[3px] h-4 mx-1">
            {googleColors.map((color, i) => (
                <div key={i} className="w-[3px] rounded-full"
                    style={{ backgroundColor: color, animation: `audioPulse 0.4s ease-in-out infinite alternate`, animationDelay: `${[0, 0.2, 0.4, 0.2, 0][i]}s`, height: '6px' }} />
            ))}
        </div>
    );

    return (
        <div style={{ position: "fixed", bottom: "1.5rem", left: "50%", transform: "translateX(-50%)", zIndex: 1000, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", pointerEvents: "none" }}>
            <style jsx>{`
                @keyframes audioPulse { 0% { height: 6px; opacity: 0.7; } 100% { height: 16px; opacity: 1; } }
            `}</style>
            {/* Transcript is shown in sidebar chat only — not on canvas */}
            <div className="flex items-center gap-2 pointer-events-auto">
                <div id="tour-ai-badge"
                    className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-medium transition-all duration-300 ${colors[status]}`}
                    style={{ border: "1px solid rgba(0,0,0,0.06)", backdropFilter: "blur(8px)", minWidth: isListening ? "160px" : "auto", justifyContent: "center" }}>
                    {(status === "connecting" || status === "requesting_permissions") && <Loader2 className="w-3 h-3 animate-spin" />}
                    {isListening && renderVisualizer()}
                    <span className={isListening ? "tracking-widest uppercase text-[11px] font-bold mx-2" : ""}>{labels[status]}</span>
                    {isListening && renderVisualizer()}
                </div>
                <div className="flex items-center gap-1.5">
                    {isListening && (
                        <button id="tour-mute-button" onClick={toggleMute}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-all shadow-sm border ${isMuted ? 'bg-red-50/95 text-red-600 border-red-200 hover:bg-red-100' : 'bg-white/95 text-gray-700 border-black/5 hover:bg-gray-50'}`}
                            style={{ backdropFilter: "blur(8px)" }} title={isMuted ? "Unmute AI Session" : "Mute AI Session"}>
                            {isMuted ? <MicOff size={14} strokeWidth={2.5} /> : <Mic size={14} strokeWidth={2.5} />}
                            <span className="uppercase tracking-widest text-[10px] pr-1">{isMuted ? "Unmute" : "Mute"}</span>
                        </button>
                    )}

                    {isListening || status === "connecting" || status === "requesting_permissions" ? (
                        <button onClick={stop}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-all shadow-sm border bg-white/95 text-gray-700 border-black/5 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                            style={{ backdropFilter: "blur(8px)" }} title="Stop AI Session">
                            <Square size={13} fill="currentColor" />
                            <span className="uppercase tracking-widest text-[10px] pr-1">Stop</span>
                        </button>
                    ) : (status === "stopped" || status === "idle" || status === "error") ? (
                        <button onClick={start}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-all shadow-sm border bg-white/95 text-gray-700 border-black/5 hover:bg-green-50 hover:text-green-600 hover:border-green-200"
                            style={{ backdropFilter: "blur(8px)" }} title="Start AI Session">
                            <Play size={13} fill="currentColor" />
                            <span className="uppercase tracking-widest text-[10px] pr-1">Start</span>
                        </button>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

// ── Selection Name Labels Overlay ─────────────────────────────────────────────
function SelectionNameLabels({ collaborators, excalidrawRef, currentUid }: { collaborators: any[]; excalidrawRef: React.MutableRefObject<any>; currentUid?: string; }) {
    type Label = { uid: string; name: string; bgColor: string; x: number; y: number };
    const [labels, setLabels] = React.useState<Label[]>([]);
    const rafRef = React.useRef<number | null>(null);

    const activeSelectors = collaborators.filter(c => {
        if (c.id === currentUid) return false;
        const ids = c.selectedElementIds || {};
        return Object.values(ids).some(Boolean);
    });

    React.useEffect(() => {
        const compute = () => {
            const api = excalidrawRef.current;
            if (!api || activeSelectors.length === 0) { setLabels([]); return; }
            const elements = api.getSceneElements();
            const appState = api.getAppState();
            const { scrollX, scrollY, zoom } = appState;
            const z = zoom?.value ?? 1;
            const next: Label[] = [];
            for (const collab of activeSelectors) {
                const selectedIds = Object.keys(collab.selectedElementIds || {}).filter(id => collab.selectedElementIds[id]);
                if (!selectedIds.length) continue;
                const selected = elements.filter((el: any) => selectedIds.includes(el.id));
                if (!selected.length) continue;
                const minX = Math.min(...selected.map((e: any) => e.x));
                const minY = Math.min(...selected.map((e: any) => e.y));
                const maxX = Math.max(...selected.map((e: any) => e.x + (e.width ?? 0)));
                const screenX = minX * z + scrollX;
                const screenY = minY * z + scrollY;
                const screenW = (maxX - minX) * z;
                next.push({ uid: collab.id, name: collab.username || 'Anonymous', bgColor: collab.color?.background || '#3b82f6', x: screenX + screenW / 2, y: screenY + 1 });
            }
            setLabels(next);
            rafRef.current = requestAnimationFrame(compute);
        };
        rafRef.current = requestAnimationFrame(compute);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [activeSelectors, excalidrawRef]);

    if (labels.length === 0) return null;
    return (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 200, overflow: 'hidden' }}>
            {labels.map(label => (
                <div key={label.uid} style={{
                    position: 'absolute', left: label.x, top: label.y, transform: 'translate(-50%, -100%)',
                    backgroundColor: label.bgColor, color: '#fff', padding: '2px 8px 3px', borderRadius: '6px',
                    fontSize: '11px', fontWeight: 700, fontFamily: 'Inter, system-ui, sans-serif', whiteSpace: 'nowrap',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.25)', letterSpacing: '0.01em', borderBottom: `3px solid ${label.bgColor}`,
                }}>{label.name}</div>
            ))}
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ExcalidrawWrapper({
    excalidrawRef, savedLibraryItems, initialElements, initialAppState,
    onLibraryChange, onBack, workspaceId, workspaceTitle, isOwner = false, canEdit = true,
    isAssisted = false,
}: {
    excalidrawRef: React.MutableRefObject<ExcalidrawImperativeAPI | null>;
    savedLibraryItems: LibraryItems;
    initialElements: any[] | null;
    initialAppState: any | null;
    onLibraryChange: (items: LibraryItems) => void;
    onBack: () => void;
    workspaceId: string;
    workspaceTitle?: string;
    isOwner?: boolean;
    canEdit?: boolean;
    isAssisted?: boolean;
}) {
    const [isInviteModalOpen, setIsInviteModalOpen] = React.useState(false);
    const [workspaceShareMode, setWorkspaceShareMode] = React.useState<'editor' | 'viewer'>('editor');
    const [activeCollaborators, setActiveCollaborators] = React.useState<any[]>([]);

    // ═══════════════════════════════════════════════════════════════════════════
    // DRAW ENGINE — persistent registry, queued draws, no canvas jumping
    // ═══════════════════════════════════════════════════════════════════════════

    // node_name → excalidraw shape element id
    const nodeIdRegistry = useRef<Map<string, string>>(new Map());
    // names already on canvas — dedup guard, never reset mid-session
    const drawnNamesRef = useRef<Set<string>>(new Set());
    // pending nodes waiting to be drawn one at a time
    const drawQueueRef = useRef<AddNodePayload[]>([]);
    // lock — prevents concurrent draws
    const isDrawingRef = useRef(false);
    // ── On reconnect: scan canvas and pre-fill registry so we never redraw ───
    const rebuildRegistryFromCanvas = useCallback(() => {
        const api = excalidrawRef.current;
        if (!api) return;
        const els = api.getSceneElements() as any[];

        // convertToExcalidrawElements produces bound text elements with containerId
        // Shapes also have a label property in the source spec but get split into
        // shape + bound text in the scene. We scan both patterns.
        els.forEach((el) => {
            if (el.type === "text" && el.containerId && el.text) {
                const name = el.text.trim();
                nodeIdRegistry.current.set(name, el.containerId);
                drawnNamesRef.current.add(name);
            }
        });

        console.log("[FlowState] Registry rebuilt:", drawnNamesRef.current.size, "nodes");
    }, [excalidrawRef]);

    // ── Track which element IDs belong to the current draw batch ─────────────
    // When a new diagram starts (root node with no parent), we reset this set.
    // After all nodes drawn, we fit the view to only the current diagram.
    const currentDiagramIdsRef = useRef<Set<string>>(new Set());

    // ── Track AI generated nodes locally for instant 0-latency collision detection 
    const drawnBoxesRef = useRef<Array<{ x: number, y: number, width: number, height: number, type: string, isDeleted: boolean }>>([]);

    // ── Last draw timestamp — block Firebase overwrites for 8s after any draw ─
    // This covers the inter-node gaps (400ms) where isDrawingRef is briefly false
    const lastDrawTimeRef = useRef<number>(0);

    // ── Core draw — rich per-type styles via NODE_STYLES design system ──────────
    const _drawNodeNow = useCallback((node: AddNodePayload) => {
        const api = excalidrawRef.current;
        if (!api) return;

        const name = (node.node_name || "Node").trim();
        const type = (node.node_type || "process").toLowerCase();
        const S = getStyle(type);

        if (drawnNamesRef.current.has(name)) {
            console.log(`[FlowState] ⏭ Skip dup "${name}"`);
            return;
        }

        const { w, h } = S;

        // ── Spacing: generous gaps so shapes never overlap ────────────────────
        // Vertical: max child height + 80px breathing room
        // Horizontal: max sibling width + 120px breathing room
        const GAP_V = 100;   // px between bottom of parent and top of child
        const GAP_H = 160;   // px between right of parent and left of sibling

        // ── Find parent shape in live canvas ──────────────────────────────────
        let px = 300, py = 60;
        let parentElId: string | null = null;
        let pX = 0, pY = 0, pW = 0, pH = 0, pCX = 0, pCY = 0;

        const liveEls = api.getSceneElements().filter((e: any) => !e.isDeleted) as any[];

        if (node.connected_to) {
            const connName = node.connected_to.trim();
            const regId = nodeIdRegistry.current.get(connName);

            // Primary lookup: registry id → shape element
            let parentEl: any = regId
                ? liveEls.find((e: any) => e.id === regId && e.type !== "arrow" && e.type !== "text")
                : null;

            // Fallback: search bound text elements by label content
            if (!parentEl) {
                const lower = connName.toLowerCase();
                const textEl = liveEls.find(
                    (e: any) => e.type === "text" && e.containerId &&
                        (e.text ?? "").toLowerCase().trim() === lower
                );
                if (textEl?.containerId) {
                    parentEl = liveEls.find(
                        (e: any) => e.id === textEl.containerId && e.type !== "arrow"
                    );
                }
            }

            if (parentEl) {
                parentElId = parentEl.id;
                // Use actual rendered dimensions from the element
                pX = parentEl.x ?? 0;
                pY = parentEl.y ?? 0;
                pW = parentEl.width ?? w;
                pH = parentEl.height ?? h;
                pCX = pX + pW / 2;
                pCY = pY + pH / 2;

                const dir = (node.placement || "bottom").toLowerCase();
                if (dir === "bottom") { px = pCX - w / 2; py = pY + pH + GAP_V; }
                else if (dir === "top") { px = pCX - w / 2; py = pY - h - GAP_V; }
                else if (dir === "right") { px = pX + pW + GAP_H; py = pCY - h / 2; }
                else  /* left */ { px = pX - w - GAP_H; py = pCY - h / 2; }
            } else {
                console.warn(`[FlowState] ⚠️ parent "${connName}" not found — placing at default`);
            }
        }

        // No parent (root node of a new diagram) →
        // Place it to the RIGHT of all existing content with a clear margin.
        // This ensures each new diagram starts in its own fresh column,
        // never drawing on top of or tangled with a previous diagram.
        if (!parentElId && !node.connected_to) {
            // NEW DIAGRAM STARTING — reset the current diagram ID tracker
            currentDiagramIdsRef.current = new Set();

            const shapes = liveEls.filter(
                (e: any) => e.type !== "arrow" && e.type !== "text"
            );
            if (shapes.length > 0) {
                // Find the rightmost edge of ALL existing shapes
                const maxX = Math.max(...shapes.map((e: any) => (e.x ?? 0) + (e.width ?? 0)));
                // Find the vertical midpoint of existing content to centre the new diagram
                const minY = Math.min(...shapes.map((e: any) => e.y ?? 0));
                const maxY = Math.max(...shapes.map((e: any) => (e.y ?? 0) + (e.height ?? 0)));
                const midY = (minY + maxY) / 2;
                // Start new diagram 300px to the right — clear visual separation
                px = maxX + 300;
                py = midY - h / 2;
            } else {
                // Very first node ever — place at a comfortable starting position
                px = 300;
                py = 200;
            }
        }

        // Round to nearest pixel to avoid sub-pixel blurriness
        px = Math.round(px);
        py = Math.round(py);

        // ── Build shape via convertToExcalidrawElements ───────────────────────
        // We pass our own nodeId so the registry stays consistent.
        // convertToExcalidrawElements preserves the id on the shape element.
        const nodeId = crypto.randomUUID();

        const converted = convertToExcalidrawElements([{
            type: S.shape as any,
            id: nodeId,
            x: px, y: py,
            width: w, height: h,
            strokeColor: S.stroke,
            backgroundColor: S.bg,
            fillStyle: S.fillStyle as any,
            strokeWidth: S.strokeWidth,
            strokeStyle: S.strokeStyle as any,
            roughness: 0,
            roundness: S.roundness,
            label: {
                text: name,
                fontSize: S.labelSize,
                fontFamily: 2,
                textAlign: "center" as const,
                verticalAlign: "middle" as const,
                strokeColor: S.labelColor,
            },
        }]);

        // Register BEFORE pushing so arrow lookup works immediately
        nodeIdRegistry.current.set(name, nodeId);
        drawnNamesRef.current.add(name);

        const newElementsToAppend = [...converted];

        // Track this node as part of the current diagram
        currentDiagramIdsRef.current.add(nodeId);

        // ── Arrow — use Excalidraw binding, not manual coordinates ────────────
        // We let Excalidraw compute the exact edge-midpoint by using
        // startBinding + endBinding. The arrow x/y/points just need to be
        // roughly correct — Excalidraw snaps them to the shape edges.
        if (parentElId) {
            const dir = (node.placement || "bottom").toLowerCase();

            // Midpoints of the relevant edges for start and end
            let sx: number, sy: number, ex: number, ey: number;
            if (dir === "bottom") {
                sx = pCX; sy = pY + pH;      // bottom-center of parent
                ex = px + w / 2; ey = py;           // top-center of child
            } else if (dir === "top") {
                sx = pCX; sy = pY;           // top-center of parent
                ex = px + w / 2; ey = py + h;       // bottom-center of child
            } else if (dir === "right") {
                sx = pX + pW; sy = pCY;          // right-center of parent
                ex = px; ey = py + h / 2;   // left-center of child
            } else {
                sx = pX; sy = pCY;          // left-center of parent
                ex = px + w; ey = py + h / 2;   // right-center of child
            }

            const edgeLabel = ((node as any).edge_label || "").trim();
            const arrowColor = S.arrowColor;
            const arrowStyle = S.arrowStyle;
            const arrowEnd = S.arrowEnd as any;
            const arrowStart = S.arrowStart as any;

            const arrowConverted = convertToExcalidrawElements([{
                type: "arrow" as const,
                id: crypto.randomUUID(),
                // Place arrow at start point; points are relative offsets
                x: sx, y: sy,
                width: ex - sx,
                height: ey - sy,
                points: [[0, 0], [ex - sx, ey - sy]] as any,
                strokeColor: arrowColor,
                strokeWidth: 2,
                strokeStyle: arrowStyle as any,
                roughness: 0,
                // Binding tells Excalidraw to snap arrow ends to shape edges
                startBinding: { elementId: parentElId, focus: 0, gap: 6 },
                endBinding: { elementId: nodeId, focus: 0, gap: 6 },
                startArrowhead: arrowStart === "none" ? null : arrowStart,
                endArrowhead: arrowEnd === "none" ? null : arrowEnd,
                ...(edgeLabel ? {
                    label: {
                        text: edgeLabel,
                        fontSize: 11,
                        fontFamily: 2,
                        strokeColor: arrowColor,
                    }
                } : {}),
            }]);
            newElementsToAppend.push(...arrowConverted);
            // Track arrow as part of current diagram too
            arrowConverted.forEach((el: any) => currentDiagramIdsRef.current.add(el.id));
        }

        api.updateScene({ elements: [...liveEls, ...newElementsToAppend] });
        
        // Push the newly drawn node to our instant local tracker so the very next 
        // node generated a fraction of a second from now won't overlap it!
        drawnBoxesRef.current.push({ x: px, y: py, width: w, height: h, type: "rectangle", isDeleted: false });
        
        lastDrawTimeRef.current = Date.now();  // mark draw time — suppress Firebase overwrites
        console.log(`[FlowState] ✅ "${name}" (${type}) @ (${px},${py}) parent=${node.connected_to || "none"}`);
    }, [excalidrawRef]);

    // ── Draw queue ─────────────────────────────────────────────────────────────
    // Strictly one node at a time. No scroll during drawing.
    // After ALL nodes drawn: single smooth fitToContent.
    const drainDrawQueue = useCallback(() => {
        if (isDrawingRef.current) return;
        if (drawQueueRef.current.length === 0) return;

        isDrawingRef.current = true;
        const next = drawQueueRef.current.shift()!;
        _drawNodeNow(next);

        // First node: 0ms delay so it appears instantly
        // Subsequent nodes: 400ms gap — visible one by one without feeling slow
        const isFirst = drawQueueRef.current.length === 0;
        setTimeout(() => {
            isDrawingRef.current = false;
            if (drawQueueRef.current.length > 0) {
                drainDrawQueue(); // draw next node — NO scroll until all done
            } else {
                // All nodes drawn — fit view, then force-save immediately
                setTimeout(() => {
                    try {
                        const api = excalidrawRef.current;
                        if (!api) return;
                        const allEls = api.getSceneElements().filter((e: any) => !e.isDeleted);
                        // Prefer to fit only the newly drawn diagram
                        const diagramIds = currentDiagramIdsRef.current;
                        const diagramEls = diagramIds.size > 0
                            ? allEls.filter((e: any) => diagramIds.has(e.id))
                            : allEls;
                        const targetEls = diagramEls.length > 0 ? diagramEls : allEls;
                        if (targetEls.length > 0) {
                            api.scrollToContent(targetEls as any, { animate: true, fitToContent: true });
                        }
                    } catch (_) { }
                    // Force-save immediately after AI finishes — bypasses the 3s debounce
                    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
                    forceSaveRef.current?.();
                }, 400);
            }
        }, isFirst ? 0 : 400); // first node instant, rest 400ms apart
    }, [_drawNodeNow, excalidrawRef]);

    // ── Public: push a node onto the queue ────────────────────────────────────
    const handleAddNode = useCallback((node: AddNodePayload) => {
        drawQueueRef.current.push(node);
        drainDrawQueue();
    }, [drainDrawQueue]);

    // ── Keyboard scroll: PgUp / PgDn / arrow keys pan the canvas ─────────────
    useEffect(() => {
        const STEP = 200;
        const onKey = (e: KeyboardEvent) => {
            const api = excalidrawRef.current;
            if (!api) return;
            // Don't hijack when user is typing in an input/textarea
            const tag = (e.target as HTMLElement)?.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;

            const appState = api.getAppState() as any;
            const zoom = appState.zoom?.value ?? 1;
            const scrollX = appState.scrollX ?? 0;
            const scrollY = appState.scrollY ?? 0;
            const step = STEP / zoom;

            let dx = 0, dy = 0;
            if (e.key === "PageDown") { dy = -step; }
            else if (e.key === "PageUp") { dy = step; }
            else if (e.key === "ArrowDown" && e.altKey) { dy = -step / 2; }
            else if (e.key === "ArrowUp" && e.altKey) { dy = step / 2; }
            else if (e.key === "ArrowRight" && e.altKey) { dx = -step / 2; }
            else if (e.key === "ArrowLeft" && e.altKey) { dx = step / 2; }
            else return;

            e.preventDefault();
            api.updateScene({ appState: { scrollX: scrollX + dx, scrollY: scrollY + dy } });
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [excalidrawRef]);

    const [transcript, setTranscript] = React.useState("");
    const [micActive, setMicActive] = React.useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);

    const getCanvasBlob = useCallback(async (): Promise<Blob | null> => {
        const api = excalidrawRef.current;
        if (!api) return null;
        try {
            const { exportToBlob } = await import("@excalidraw/excalidraw");
            return await exportToBlob({ elements: api.getSceneElements(), appState: api.getAppState(), files: api.getFiles(), mimeType: "image/jpeg", quality: 0.6 });
        } catch (e) {
            console.warn("[FlowState] exportToBlob failed:", e);
            return null;
        }
    }, [excalidrawRef]);

    const ai = useAISession({
        workspaceId, getCanvasBlob, onAddNode: handleAddNode,
        onTranscript: (text) => setTranscript(text),
        libraryItems: savedLibraryItems,
    });

    useEffect(() => {
        if (!isAssisted) return;
        // Auto-start on load (idle) or auto-reconnect on error.
        // DO NOT auto-reconnect if user explicitly stopped it or connection closed cleanly.
        if (ai.status === "idle" || ai.status === "error") {
            // On session start/restart: rebuild registry from existing canvas
            // This prevents duplicates on reconnect and seeds batchEls correctly
            nodeIdRegistry.current.clear();
            drawnNamesRef.current.clear();
            drawQueueRef.current = [];
            isDrawingRef.current = false;
            currentDiagramIdsRef.current = new Set();
            rebuildRegistryFromCanvas(); // also seeds batchEls from current canvas
            const delayMs = ai.status === "idle" ? 0 : 3000;
            const t = setTimeout(() => ai.start().catch((err) => console.warn("AI Start Failed:", err)), delayMs);
            return () => clearTimeout(t);
        }
    }, [isAssisted, ai.status, ai.start]); // eslint-disable-line

    useEffect(() => {
        const api = excalidrawRef.current;
        if (api) {
            api.updateScene({
                appState: {
                    currentItemRoughness: 0,
                    currentItemFontFamily: 2,   // default new items to clean font
                    zoom: { value: 1.0 as any }, // comfortable starting zoom
                    scrollX: 0,
                    scrollY: 0,
                }
            });
        }
    }, [excalidrawRef.current]); // eslint-disable-line

    const { user } = useAuth();
    const [runTour, setRunTour] = React.useState(false);

    useEffect(() => {
        if (!isAssisted || !user) return;
        if (!user.hasSeenTour) {
            setTimeout(() => setRunTour(true), 1000);
        }
    }, [isAssisted, workspaceId, user]);

    const handleJoyrideCallback = async (data: CallBackProps) => {
        const { status } = data;
        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
            setRunTour(false);
            if (user) {
                try {
                    const session = getCurrentSession();
                    if (!session) return;
                    await fetch("/api/users/profile", {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${session.idToken}`
                        },
                        body: JSON.stringify({
                            ...user,
                            hasSeenTour: true
                        })
                    });
                } catch (e) { console.warn("Failed to save tour status:", e); }
            }
        }
    };

    const tourSteps: Step[] = [
        { target: ".excalidraw", content: "Welcome to FlowState AI! This is your infinite canvas where you can draw architectures, flowcharts, and brainstorm ideas.", disableBeacon: true, placement: "center" },
        { target: "button[aria-label*='Library' i], .layer-ui__library-button, .sidebar-trigger", content: "Here is your component Library. You can find pre-made architecture nodes here or save your own custom components.", disableBeacon: true },
        { target: "[data-testid='main-menu-button'], [aria-label*='Main menu' i], .App-menu_top__left", content: "Click this menu to access workspace actions like exporting your canvas as an image, saving, toggling dark mode, or starting your AI Assistant.", disableBeacon: true },
        { target: "#tour-ai-badge", content: "Once you start the AI session from the menu, your AI becomes active! This badge tells you if the AI is listening or speaking.", disableBeacon: true },
        { target: "#tour-mute-button", content: "Need some privacy? Click here to quickly mute your microphone so the AI stops listening temporarily.", disableBeacon: true },
        { target: "#tour-history-button", content: "Want to review the conversation? Click the sparkles to open the prompt history and voice playbacks.", disableBeacon: true }
    ];

    const toggleMic = async () => {
        if (ai.isRunning) { ai.stop(); setMicActive(false); }
        else { await ai.start(); setMicActive(true); }
    };

    // ── Document Syncing ─────────────────────────────────────────────────────
    const syncTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    const [syncStatus, setSyncStatus] = React.useState<'saved' | 'saving' | 'error'>('saved');
    const lastSavedElementsStringRef = React.useRef<string | null>(null);

    // ── Force-save: used after AI finishes a draw batch to persist immediately ─
    const forceSaveRef = React.useRef<(() => Promise<void>) | null>(null);

    // ── Guard: block saves until the canvas has been properly restored ────────
    const canSaveRef = React.useRef(false);
    
    const roomWsRef = React.useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!workspaceId || !user) return;
        
        let ws: WebSocket | null = null;
        let retryCount = 0;
        let isStopped = false;

        const connectRoomWs = () => {
            if (isStopped) return;
            const session = getCurrentSession();
            const tokenParam = session?.idToken ? `?token=${encodeURIComponent(session.idToken)}` : "";
            const wsProto = window.location.protocol === "https:" ? "wss:" : "ws:";
            const host = BACKEND_WS.replace(/^https?:/, "").replace(/^\/\//, "");
            const url = `${wsProto}//${host}/ws/room/${encodeURIComponent(workspaceId)}/${user.uid}${tokenParam}`;
            
            ws = new WebSocket(url);
            roomWsRef.current = ws;

            ws.onopen = () => {
                console.log("[FlowState] Room WebSocket connected.");
                retryCount = 0;
            };

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.type === "collaborator_update") {
                        setActiveCollaborators((prev) => {
                            const filtered = prev.filter(c => c.id !== msg.id);
                            const updatedList = [...filtered, msg];
                            
                            const collaboratorsMap = new Map<string, any>();
                            updatedList.forEach((collab) => {
                                if (collab.id !== user.uid) {
                                    collaboratorsMap.set(collab.id, {
                                        ...collab,
                                        color: collab.color || { background: '#3b82f6', stroke: '#1d4ed8' },
                                        selectedElementIds: collab.selectedElementIds || {},
                                        username: collab.username || 'Anonymous',
                                    });
                                }
                            });
                            if (excalidrawRef.current) {
                                excalidrawRef.current.updateScene({ collaborators: collaboratorsMap as any });
                            }
                            return updatedList;
                        });
                    } else if (msg.type === "collaborator_left") {
                        setActiveCollaborators((prev) => {
                            const updatedList = prev.filter(c => c.id !== msg.id);
                            const collaboratorsMap = new Map<string, any>();
                            updatedList.forEach((collab) => {
                                if (collab.id !== user.uid) {
                                    collaboratorsMap.set(collab.id, {
                                        ...collab,
                                        color: collab.color || { background: '#3b82f6', stroke: '#1d4ed8' },
                                        selectedElementIds: collab.selectedElementIds || {},
                                        username: collab.username || 'Anonymous',
                                    });
                                }
                            });
                            if (excalidrawRef.current) {
                                excalidrawRef.current.updateScene({ collaborators: collaboratorsMap as any });
                            }
                            return updatedList;
                        });
                    } else if (msg.type === "canvas_update") {
                        const aiIsDrawing = isDrawingRef.current || drawQueueRef.current.length > 0;
                        const recentlyDrawn = (Date.now() - lastDrawTimeRef.current) < 8000;
                        
                        if (!aiIsDrawing && !recentlyDrawn && msg.elements) {
                            const api = excalidrawRef.current;
                            if (api) {
                                api.updateScene({ elements: msg.elements });
                                lastSavedElementsStringRef.current = JSON.stringify(msg.elements);
                            }
                        }
                    }
                } catch (e) {
                    console.error("Error parsing room websocket message:", e);
                }
            };

            ws.onclose = () => {
                console.log("[FlowState] Room WebSocket closed.");
                if (!isStopped) {
                    const delay = Math.min(1000 * Math.pow(2, retryCount), 15000);
                    retryCount++;
                    setTimeout(connectRoomWs, delay);
                }
            };

            ws.onerror = (e) => {
                console.error("[FlowState] Room WebSocket error:", e);
                ws?.close();
            };
        };

        connectRoomWs();

        return () => {
            isStopped = true;
            if (ws) ws.close();
            roomWsRef.current = null;
        };
    }, [workspaceId, user]);

    const selectedElementsRef = React.useRef<Record<string, boolean>>({});

    const handlePointerUpdate = (payload: any) => {
        if (!user || !workspaceId) return;
        const { pointer, button, key } = payload;
        if (!pointer) return;
        const userColor = uidToColor(user.uid);
        
        if (roomWsRef.current && roomWsRef.current.readyState === WebSocket.OPEN) {
            roomWsRef.current.send(JSON.stringify({
                type: "collaborator_update",
                id: user.uid,
                username: user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : (user.email?.split('@')[0] || "Anonymous"),
                pointer,
                button: button || null,
                key: key || null,
                color: userColor,
                selectedElementIds: selectedElementsRef.current,
                lastSeen: Date.now(),
            }));
        }
    };

    // ── Core save function — always reads fresh from API, never a stale closure ─
    const doSave = React.useCallback(async () => {
        if (!canSaveRef.current) {
            console.log("[FlowState] 🛑 doSave() aborted: canvas not yet restored.");
            return;
        }
        if (!user || !workspaceId) return;
        const api = excalidrawRef.current;
        if (!api) return;
        try {
            const liveElements = api.getSceneElements().filter((e: any) => !e.isDeleted);
            const liveAppState = api.getAppState() as any;
            const elementsString = JSON.stringify(liveElements);
            
            if (elementsString === lastSavedElementsStringRef.current) return;
            
            console.log(`[FlowState] 💾 Saving ${liveElements.length} elements to AWS...`);
            setSyncStatus('saving');
            const { collaborators, currentHoveredGroupId, selectedElementIds: _sel, ...safeAppState } = liveAppState;
            
            const session = getCurrentSession();
            if (!session) return;

            const res = await fetch(`/api/workspaces/${workspaceId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.idToken}`
                },
                body: JSON.stringify({
                    elements: elementsString,
                    appState: JSON.stringify(safeAppState),
                    updatedAt: new Date().toISOString()
                })
            });

            if (!res.ok) throw new Error("API request failed");
            
            lastSavedElementsStringRef.current = elementsString;
            setSyncStatus('saved');
            
            if (roomWsRef.current && roomWsRef.current.readyState === WebSocket.OPEN) {
                roomWsRef.current.send(JSON.stringify({
                    type: "canvas_update",
                    elements: liveElements,
                    appState: safeAppState
                }));
            }

            try {
                localStorage.setItem(`workspace_elements_${workspaceId}`, elementsString);
                localStorage.setItem(`workspace_appstate_${workspaceId}`, JSON.stringify(safeAppState));
            } catch (e) { }
            console.log('[FlowState] ✅ Saved', liveElements.length, 'elements to AWS + localStorage.');
        } catch (e) {
            console.error("[FlowState] ❌ Failed to sync workspace canvas:", e);
            setSyncStatus('error');
        }
    }, [user, workspaceId, isOwner, excalidrawRef]); // eslint-disable-line

    React.useEffect(() => { forceSaveRef.current = doSave; }, [doSave]);

    const handleSceneChange = (elements: readonly any[], appState: any) => {
        if (!user || !workspaceId) return;
        if (!canSaveRef.current) return;
        if (appState.selectedElementIds) selectedElementsRef.current = appState.selectedElementIds;
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = setTimeout(() => doSave(), 3000);
    };

    const otherCollaborators = activeCollaborators.filter(c => c.id !== user?.uid);
    const router = useRouter();

    const handleGenerateArtifact = async () => {
        const api = excalidrawRef.current;
        if (!api) return;

        const elements = api.getSceneElements().filter((e: any) => !e.isDeleted);
        if (elements.length === 0) {
            alert("Canvas is empty. Draw something first before generating code!");
            return;
        }

        try {
            const { exportToBlob } = await import("@excalidraw/excalidraw");
            // 1. Export Thumbnail
            const blob = await exportToBlob({
                elements,
                appState: { ...api.getAppState(), exportWithDarkMode: false },
                files: api.getFiles(),
                mimeType: "image/jpeg",
                quality: 0.8,
            });

            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                const base64data = reader.result;

                // 2. Build Semantic Graph
                const nodes: any[] = elements.filter((e: any) => e.type !== "arrow" && e.type !== "text");
                const texts: any[] = elements.filter((e: any) => e.type === "text" && e.containerId);
                const arrows: any[] = elements.filter((e: any) => e.type === "arrow");

                const graph = nodes.map((node: any) => {
                    const label = texts.find((t: any) => t.containerId === node.id)?.text || "Unknown";
                    
                    const outgoingArrows = arrows.filter((a: any) => a.startBinding?.elementId === node.id);
                    const connectedTo = outgoingArrows.map((a: any) => {
                        const targetId = a.endBinding?.elementId;
                        const targetNode = nodes.find((n: any) => n.id === targetId);
                        const targetLabel = texts.find((t: any) => t.containerId === targetId)?.text || "Unknown";
                        
                        // Find text bound to the arrow itself
                        let edgeLabelText = "";
                        if (a.boundElements) {
                            const boundTextEl = a.boundElements.find((b: any) => b.type === "text");
                            if (boundTextEl) {
                                edgeLabelText = texts.find((t: any) => t.id === boundTextEl.id)?.text || "";
                            } else {
                                // Excalidraw text might not be a container text for arrows in some versions, but rather a direct text element.
                                const rawText: any = elements.find((e: any) => e.id === boundTextEl?.id);
                                if (rawText) edgeLabelText = rawText.text;
                            }
                        }

                        return {
                            targetId,
                            targetLabel,
                            edgeLabel: edgeLabelText
                        };
                    });

                    return {
                        id: node.id,
                        type: node.type,
                        shape: node.shape || "box",
                        label,
                        connections: connectedTo
                    };
                });

                // Store in sessionStorage to pass to the next page
                sessionStorage.setItem(`generationData_${workspaceId}`, JSON.stringify({
                    thumbnail: base64data,
                    graph: graph,
                    workspaceTitle: workspaceTitle || "Untitled"
                }));

                router.push(`/workspace/${workspaceId}/generate`);
            };
        } catch (e) {
            console.error("[FlowState] Failed to prepare generation:", e);
            alert("Failed to prepare generation.");
        }
    };

    const handleSaveACopy = async () => {
        if (!user || !excalidrawRef.current) return;
        try {
            const newId = Math.random().toString(36).substring(2, 10);
            const api = excalidrawRef.current;
            const elements = api.getSceneElements();
            const appState = api.getAppState();
            const { collaborators: _c, currentHoveredGroupId: _h, selectedElementIds: _s, ...safeAppState } = appState as any;
            const title = `${workspaceTitle || 'Untitled'} (copy)`;
            
            const session = getCurrentSession();
            if (!session) return;
            
            const createRes = await fetch("/api/workspaces", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.idToken}`
                },
                body: JSON.stringify({
                    workspaceId: newId,
                    title,
                    subtitle: "Personal Workspace Copy"
                })
            });
            
            if (!createRes.ok) throw new Error("Failed to create copy");
            
            const updateRes = await fetch(`/api/workspaces/${newId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.idToken}`
                },
                body: JSON.stringify({
                    elements: JSON.stringify(elements),
                    appState: JSON.stringify(safeAppState)
                })
            });
            
            if (!updateRes.ok) throw new Error("Failed to update copy content");
            
            router.push(`/workspace/${newId}`);
        } catch (e) {
            console.error("[FlowState] Failed to save a copy:", e);
            alert("Failed to save a copy.");
        }
    };

    return (
        <div style={{ height: "100%", width: "100%", position: "relative" }}>
            <Excalidraw
                excalidrawAPI={(api) => {
                  excalidrawRef.current = api;
                  if (initialElements && initialElements.length > 0) {
                    // Restore saved canvas — then enable saves
                    setTimeout(() => {
                      try {
                        api.updateScene({ elements: initialElements });
                        lastSavedElementsStringRef.current = JSON.stringify(initialElements);
                        api.scrollToContent(api.getSceneElements(), { animate: false, fitToContent: true });
                        console.log(`[FlowState] 🖼️ Restored ${initialElements.length} elements. Saves now enabled.`);
                      } catch (e) {
                        console.warn("[FlowState] onMount updateScene failed:", e);
                      } finally {
                        canSaveRef.current = true;
                      }
                    }, 300);
                  } else {
                    // Fresh/empty canvas — enable saves immediately
                    canSaveRef.current = true;
                    console.log("[FlowState] 🆕 Fresh canvas. Saves enabled.");
                  }
                }}
                viewModeEnabled={!canEdit}
                initialData={{
                    elements: initialElements || [],
                    appState: { viewBackgroundColor: "#f8fafc", currentItemFontFamily: 2, currentItemRoughness: 0, currentItemStrokeWidth: 2, theme: "light", ...(initialAppState || {}) },
                    libraryItems: savedLibraryItems,
                }}
                onChange={handleSceneChange}
                onLibraryChange={onLibraryChange}
                onPointerUpdate={handlePointerUpdate}
                renderTopRightUI={() => (
                    <div className="flex gap-1.5 sm:gap-3 items-center mr-1 sm:mr-2 pointer-events-auto">
                        <CollaboratorStack collaborators={activeCollaborators} currentUid={user?.uid} />
                        
                        {/* Sync + Share pill */}
                        <div className="flex items-center bg-[#ececf4] rounded-lg shadow-sm border border-transparent translate-y-[2px] overflow-hidden">
                            {syncStatus && (
                                <>
                                    <div className="flex items-center gap-1.5 px-2 sm:px-3 py-2 text-[#1b1b1f] text-[13px] font-medium transition-all duration-300">
                                        {syncStatus === 'saving' && <CloudUpload size={15} className="animate-pulse text-blue-500 shrink-0" />}
                                        {syncStatus === 'saved'  && <Cloud size={15} className="text-green-500 shrink-0" />}
                                        {syncStatus === 'error'  && <CloudOff size={15} className="text-red-500 shrink-0" />}
                                        <span className="hidden sm:inline whitespace-nowrap text-[12px]">
                                            {syncStatus === 'saving' ? 'Syncing…' : syncStatus === 'saved' ? 'Saved' : 'Error'}
                                        </span>
                                    </div>
                                    <div className="w-[1px] h-4 bg-gray-400/30" />
                                </>
                            )}
                            {otherCollaborators.length > 0 && !syncStatus && (
                                <>
                                    <div className="flex items-center gap-1.5 px-2 sm:px-3 py-2 text-[12px] font-medium text-green-600">
                                        <Wifi size={13} className="text-green-500 shrink-0" />
                                        <span className="hidden sm:inline">Live</span>
                                    </div>
                                    <div className="w-[1px] h-4 bg-gray-400/30" />
                                </>
                            )}
                            <button onClick={() => setIsInviteModalOpen(true)}
                                className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 text-[#1b1b1f] text-[13px] font-medium hover:bg-[#e4e4f0] transition-all active:scale-95 ${!syncStatus && otherCollaborators.length === 0 ? 'rounded-lg' : ''}`}
                                title="Share workspace">
                                <Share2 size={15} strokeWidth={2} className="shrink-0" />
                                <span className="hidden sm:inline">Share</span>
                            </button>
                        </div>

                        {/* Generate Artifact button */}
                        <button
                            onClick={handleGenerateArtifact}
                            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 ml-0.5 sm:ml-1 rounded-lg text-white font-medium text-[13px] transition-all active:scale-95 border border-white/20 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-600"
                            title="Generate Code & Documentation"
                        >
                            <Zap size={15} className="text-indigo-100 shrink-0" />
                            <span className="hidden sm:inline whitespace-nowrap">Generate Artifact</span>
                        </button>
                    </div>
                )}
            >
                <MainMenu>
                    <MainMenu.Item icon={<ArrowLeft size={16} />} onSelect={() => { if (window.confirm("Are you sure you want to exit? Unsaved changes may be lost.")) onBack(); }}>
                        Back to Library
                    </MainMenu.Item>
                    <MainMenu.Separator />
                    {isAssisted && (
                        <MainMenu.Item icon={ai.isRunning ? <MicOff size={16} /> : <Mic size={16} />} onSelect={toggleMic}>
                            {ai.isRunning ? "Stop AI Session" : "Start AI Session"}
                        </MainMenu.Item>
                    )}
                    <MainMenu.Separator />
                    <MainMenu.Item icon={<Copy size={16} />} onSelect={handleSaveACopy}>Save a copy</MainMenu.Item>
                    <MainMenu.Separator />
                    <MainMenu.DefaultItems.LoadScene />
                    <MainMenu.DefaultItems.SaveToActiveFile />
                    <MainMenu.DefaultItems.Export />
                    <MainMenu.DefaultItems.SaveAsImage />
                    <MainMenu.Separator />
                    <MainMenu.DefaultItems.Help />
                    <MainMenu.DefaultItems.ClearCanvas />
                    <MainMenu.Separator />
                    <MainMenu.DefaultItems.ToggleTheme />
                    <MainMenu.DefaultItems.ChangeCanvasBackground />
                </MainMenu>
            </Excalidraw>

            {isAssisted && <AIBadge status={ai.status} transcript={transcript} isMuted={ai.isMuted} toggleMute={ai.toggleMute} start={ai.start} stop={ai.stop} />}

            {isAssisted && (
                <div style={{ position: "fixed", bottom: "1.05rem", right: "4.5rem", zIndex: 1000, pointerEvents: "auto" }}>
                    <button id="tour-history-button" onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                        className={`group relative flex items-center justify-center w-9 h-9 rounded-md border transition-all duration-200 ${isHistoryOpen ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-[#f1f3f5] border-transparent hover:bg-[#e9ecef] text-[#495057]'}`}
                        style={{ boxShadow: isHistoryOpen ? "0 2px 8px rgba(59,130,246,0.15)" : "none" }} title="Conversation History">
                        <Sparkles size={20} className={isHistoryOpen ? "animate-pulse" : "group-hover:scale-110 transition-transform"} />
                        <div className="absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-bold text-white shadow-sm ring-1 ring-white">
                            {ai.history.length}
                        </div>
                    </button>
                </div>
            )}

            <HistoryPanel isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} history={ai.history} onClear={ai.clearHistory} onSend={ai.sendText} />
            <InviteModal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} workspaceId={workspaceId} workspaceTitle={workspaceTitle} />

            {isAssisted && (
                <Joyride steps={tourSteps} run={runTour} continuous showProgress showSkipButton callback={handleJoyrideCallback}
                    styles={{
                        options: { primaryColor: '#4285F4', zIndex: 10000 },
                        tooltip: { borderRadius: '12px', fontFamily: 'inherit', padding: '16px' },
                        buttonNext: { borderRadius: '8px', padding: '8px 16px', fontWeight: 'bold' },
                        buttonBack: { marginRight: 10, color: '#6b7280' },
                        buttonSkip: { color: '#6b7280', fontWeight: 'bold' }
                    }} />
            )}
        </div>
    );
}