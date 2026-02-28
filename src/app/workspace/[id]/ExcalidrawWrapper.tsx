"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Excalidraw, MainMenu, convertToExcalidrawElements } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import Joyride, { STATUS, Step, CallBackProps } from "react-joyride";
import { ArrowLeft, Mic, MicOff, Loader2, Sparkles, X, Trash2, History, Bot, User, Send, Play, Pause, Cloud, CloudUpload, CloudOff, Share2, Users, Wifi, Copy } from "lucide-react";
import type { LibraryItems, ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

import { useAISession, type AddNodePayload, type SessionStatus } from "@/hooks/useAISession";
import { useAuth } from "@/hooks/useAuth";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { ref, onValue, set, onDisconnect } from "firebase/database";
import { db, rtdb } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import InviteModal from "@/components/workspace/InviteModal";

// ── Node colour palette by type ───────────────────────────────────────────────
const BG: Record<string, string> = {
    client: "#dbeafe", server: "#dcfce7", database: "#fef9c3",
    cache: "#fce7f3", queue: "#ede9fe", gateway: "#ffedd5",
    cdn: "#e0f2fe", loadbalancer: "#f0fdf4", auth: "#fef2f2",
    storage: "#f5f3ff", microservice: "#ecfdf5", external_api: "#fff7ed",
    firewall: "#fef2f2", dns: "#e0f2fe",
};
const STROKE: Record<string, string> = {
    client: "#3b82f6", server: "#22c55e", database: "#eab308",
    cache: "#ec4899", queue: "#8b5cf6", gateway: "#f97316",
    cdn: "#0ea5e9", loadbalancer: "#16a34a", auth: "#ef4444",
    storage: "#7c3aed", microservice: "#10b981", external_api: "#f97316",
    firewall: "#dc2626", dns: "#0284c7",
};

// ── Distinct vibrant hex color palette mapped deterministically from uid ──────
const COLLAB_COLORS = [
    { background: '#FF4B4B', stroke: '#CC0000' }, // vivid red
    { background: '#FF6D00', stroke: '#C43C00' }, // orange
    { background: '#FFD600', stroke: '#C8A000' }, // yellow
    { background: '#00C853', stroke: '#007A2F' }, // green
    { background: '#00B0FF', stroke: '#0059B2' }, // sky blue
    { background: '#AA00FF', stroke: '#6200CA' }, // purple
    { background: '#FF4081', stroke: '#C60055' }, // pink
    { background: '#00BCD4', stroke: '#006978' }, // teal
    { background: '#7C4DFF', stroke: '#4615B2' }, // deep violet
    { background: '#FF6E40', stroke: '#C43D00' }, // deep orange
    { background: '#1DE9B6', stroke: '#00A07A' }, // mint
    { background: '#F50057', stroke: '#AB003C' }, // accent red
    { background: '#AEEA00', stroke: '#6D9100' }, // lime
    { background: '#00E5FF', stroke: '#00A3B4' }, // cyan
    { background: '#FF9100', stroke: '#C56200' }, // amber
    { background: '#E040FB', stroke: '#A100C2' }, // magenta
    { background: '#69F0AE', stroke: '#1DA462' }, // light green
    { background: '#40C4FF', stroke: '#0070C0' }, // light blue
    { background: '#FF80AB', stroke: '#C94B7B' }, // light pink
    { background: '#B2FF59', stroke: '#6ABF00' }, // light lime
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
    const audioRef = React.useRef<HTMLAudioElement | null>(null);

    const toggle = () => {
        if (!audioRef.current) {
            audioRef.current = new Audio(url);
            audioRef.current.onended = () => setIsPlaying(false);
        }
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    return (
        <div className="mt-3 flex items-center gap-3 bg-white/40 backdrop-blur-sm rounded-xl p-2.5 border border-blue-200/50 shadow-sm transition-all hover:bg-white/60">
            <button
                onClick={toggle}
                className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-all shadow-sm active:scale-95"
            >
                {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
            </button>
            <div className="flex-1 flex flex-col gap-1.5">
                <div className="flex items-end gap-[2px] h-4">
                    {[...Array(16)].map((_, i) => (
                        <div
                            key={i}
                            className={`w-1 rounded-full transition-all duration-300 ${isPlaying ? 'bg-blue-500 animate-pulse' : 'bg-blue-300'}`}
                            style={{ height: `${30 + (Math.sin(i * 0.8) * 30 + 30)}%`, animationDelay: `${i * 0.05}s` }}
                        />
                    ))}
                </div>
                <div className="flex justify-between items-center px-0.5">
                    <span className="text-[9px] font-bold text-blue-500/60 uppercase tracking-tighter">Voice Note</span>
                    <div className="w-[30px] h-[1px] bg-blue-200/50" />
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
                                    <>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">You</span>
                                        <User size={10} className="text-gray-400" />
                                    </>
                                ) : (
                                    <>
                                        <Bot size={10} className="text-blue-500" />
                                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Gemini</span>
                                    </>
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
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type a message to Gemini..."
                        className="w-full bg-black/5 border-none rounded-xl py-2.5 pl-4 pr-12 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className="absolute right-1.5 p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-blue-500 transition-all"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>

            <style jsx>{`
                @keyframes slideIn {
                    from { transform: translateX(20px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
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
            <button
                onClick={() => setShowPopup(v => !v)}
                className="flex -space-x-2 items-center focus:outline-none"
                title="Active collaborators"
            >
                {visible.map((collab) => (
                    <div
                        key={collab.id}
                        className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[11px] font-bold text-white shadow-md ring-1 ring-black/5 transition-transform hover:scale-110 hover:z-10 relative"
                        style={{ backgroundColor: collab.color?.background || uidToColor(collab.id || '').background }}
                        title={collab.username}
                    >
                        {(collab.username || '?').charAt(0).toUpperCase()}
                    </div>
                ))}
                {overflow > 0 && (
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500 shadow-md ring-1 ring-black/5">
                        +{overflow}
                    </div>
                )}
            </button>

            {showPopup && (
                <>
                    <div className="fixed inset-0 z-[1199]" onClick={() => setShowPopup(false)} />
                    <div
                        className="absolute top-full right-0 mt-2 z-[1200] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden min-w-[200px]"
                        style={{ animation: "popIn 0.15s ease-out" }}
                    >
                        <div className="px-4 py-3 border-b border-gray-50">
                            <div className="flex items-center gap-2">
                                <Users size={13} className="text-gray-400" />
                                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                    {others.length} Active Now
                                </span>
                            </div>
                        </div>
                        <div className="p-2 space-y-0.5 max-h-[200px] overflow-y-auto">
                            {others.map(collab => (
                                <div key={collab.id} className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors">
                                    <div
                                        className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-sm flex-shrink-0"
                                        style={{ backgroundColor: collab.color?.background || uidToColor(collab.id || '').background }}
                                    >
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
                @keyframes popIn {
                    from { transform: scale(0.92) translateY(-4px); opacity: 0; }
                    to { transform: scale(1) translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}

// ── Floating AI status badge ──────────────────────────────────────────────────
function AIBadge({ status, transcript, isMuted, toggleMute }: { status: SessionStatus; transcript: string; isMuted: boolean; toggleMute: () => void }) {
    const labels: Record<SessionStatus, string> = {
        idle: "AI Offline",
        requesting_permissions: "Requesting permissions…",
        connecting: "Connecting to FlowState AI…",
        ai_ready: "Listening",
        ai_done: "Speaking",
        error: "Connection error",
        stopped: "AI Disconnected",
    };
    const colors: Record<SessionStatus, string> = {
        idle: "bg-gray-100 text-gray-500",
        requesting_permissions: "bg-yellow-50 text-yellow-600",
        connecting: "bg-blue-50 text-blue-600",
        ai_ready: "bg-white text-gray-700",
        ai_done: "bg-white text-gray-700",
        error: "bg-red-50 text-red-600",
        stopped: "bg-gray-100 text-gray-500",
    };
    const isListening = status === "ai_ready" || status === "ai_done";
    const googleColors = ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#4285F4'];

    const renderVisualizer = () => (
        <div className="flex items-center justify-center gap-[3px] h-4 mx-1">
            {googleColors.map((color, i) => (
                <div
                    key={i}
                    className="w-[3px] rounded-full"
                    style={{
                        backgroundColor: color,
                        animation: `audioPulse 0.4s ease-in-out infinite alternate`,
                        animationDelay: `${[0, 0.2, 0.4, 0.2, 0][i]}s`,
                        height: '6px'
                    }}
                />
            ))}
        </div>
    );

    return (
        <div style={{ position: "fixed", bottom: "1.5rem", left: "50%", transform: "translateX(-50%)", zIndex: 1000, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", pointerEvents: "none" }}>
            <style jsx>{`
                @keyframes audioPulse {
                    0% { height: 6px; opacity: 0.7; }
                    100% { height: 16px; opacity: 1; }
                }
            `}</style>

            {transcript && (
                <div style={{ background: "rgba(255,255,255,0.94)", backdropFilter: "blur(14px)", borderRadius: "1rem", padding: "0.5rem 1.25rem", maxWidth: "32rem", fontSize: "0.8125rem", color: "#374151", boxShadow: "0 4px 24px rgba(0,0,0,0.1)", border: "1px solid rgba(0,0,0,0.06)", textAlign: "center", transition: "all 0.3s ease" }}>
                    {transcript}
                </div>
            )}

            <div className="flex items-center gap-2 pointer-events-auto">
                <div
                    id="tour-ai-badge"
                    className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-medium transition-all duration-300 ${colors[status]}`}
                    style={{ border: "1px solid rgba(0,0,0,0.06)", backdropFilter: "blur(8px)", minWidth: isListening ? "160px" : "auto", justifyContent: "center" }}
                >
                    {(status === "connecting" || status === "requesting_permissions") && <Loader2 className="w-3 h-3 animate-spin" />}
                    {isListening && renderVisualizer()}
                    <span className={isListening ? "tracking-widest uppercase text-[11px] font-bold mx-2" : ""}>{labels[status]}</span>
                    {isListening && renderVisualizer()}
                </div>

                {(status === "ai_ready" || status === "ai_done") && (
                    <button
                        id="tour-mute-button"
                        onClick={toggleMute}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-all shadow-sm border ${isMuted
                            ? 'bg-red-50/95 text-red-600 border-red-200 hover:bg-red-100'
                            : 'bg-white/95 text-gray-700 border-black/5 hover:bg-gray-50'}`}
                        style={{ backdropFilter: "blur(8px)" }}
                        title={isMuted ? "Unmute AI Session" : "Mute AI Session"}
                    >
                        {isMuted ? <MicOff size={14} strokeWidth={2.5} /> : <Mic size={14} strokeWidth={2.5} />}
                        <span className="uppercase tracking-widest text-[10px] pr-1">{isMuted ? "Unmute" : "Mute"}</span>
                    </button>
                )}
            </div>
        </div>
    );
}

// ── Selection Name Labels Overlay ─────────────────────────────────────────────
// Shows a floating name chip above whatever a remote collaborator has selected,
// tracking the canvas viewport in real-time via requestAnimationFrame.
function SelectionNameLabels({
    collaborators,
    excalidrawRef,
    currentUid,
}: {
    collaborators: any[];
    excalidrawRef: React.MutableRefObject<any>;
    currentUid?: string;
}) {
    type Label = { uid: string; name: string; bgColor: string; x: number; y: number };
    const [labels, setLabels] = React.useState<Label[]>([]);
    const rafRef = React.useRef<number | null>(null);

    // Collaborators who have something selected (excluding self)
    const activeSelectors = collaborators.filter(c => {
        if (c.id === currentUid) return false;
        const ids = c.selectedElementIds || {};
        return Object.values(ids).some(Boolean);
    });

    React.useEffect(() => {
        const compute = () => {
            const api = excalidrawRef.current;
            if (!api || activeSelectors.length === 0) {
                setLabels([]);
                return;
            }

            const elements = api.getSceneElements();
            const appState = api.getAppState();
            const { scrollX, scrollY, zoom } = appState;
            const z = zoom?.value ?? 1;

            const next: Label[] = [];
            for (const collab of activeSelectors) {
                const selectedIds = Object.keys(collab.selectedElementIds || {}).filter(
                    id => collab.selectedElementIds[id]
                );
                if (!selectedIds.length) continue;

                const selected = elements.filter((el: any) => selectedIds.includes(el.id));
                if (!selected.length) continue;

                // Bounding box in scene space
                const minX = Math.min(...selected.map((e: any) => e.x));
                const minY = Math.min(...selected.map((e: any) => e.y));
                const maxX = Math.max(...selected.map((e: any) => e.x + (e.width ?? 0)));

                // Convert to screen coords
                const screenX = minX * z + scrollX;
                const screenY = minY * z + scrollY;
                const screenW = (maxX - minX) * z;

                next.push({
                    uid: collab.id,
                    name: collab.username || 'Anonymous',
                    bgColor: collab.color?.background || '#3b82f6',
                    x: screenX + screenW / 2, // center horizontally over selection
                    y: screenY + 1,           // stick to the top border of the selection
                });
            }
            setLabels(next);
            rafRef.current = requestAnimationFrame(compute);
        };

        rafRef.current = requestAnimationFrame(compute);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [activeSelectors, excalidrawRef]); // re-runs when active selectors change

    if (labels.length === 0) return null;

    return (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 200, overflow: 'hidden' }}>
            {labels.map(label => (
                <div
                    key={label.uid}
                    style={{
                        position: 'absolute',
                        left: label.x,
                        top: label.y,
                        transform: 'translate(-50%, -100%)',
                        backgroundColor: label.bgColor,
                        color: '#fff',
                        padding: '2px 8px 3px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        fontFamily: 'Inter, system-ui, sans-serif',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                        letterSpacing: '0.01em',
                        // small triangle pointer below the label
                        borderBottom: `3px solid ${label.bgColor}`,
                    }}
                >
                    {label.name}
                </div>
            ))}
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ExcalidrawWrapper({
    excalidrawRef,
    savedLibraryItems,
    initialElements,
    initialAppState,
    onLibraryChange,
    onBack,
    workspaceId,
    workspaceTitle,
    isOwner = false,
    canEdit = true,
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
}) {
    const searchParams = useSearchParams();
    const mode = searchParams?.get("mode") ?? "personal";
    const isAssisted = mode === "assisted";

    const [isInviteModalOpen, setIsInviteModalOpen] = React.useState(false);
    const [workspaceShareMode, setWorkspaceShareMode] = React.useState<'editor' | 'viewer'>('editor');
    const [activeCollaborators, setActiveCollaborators] = React.useState<any[]>([]);

    const handleAddNode = useCallback((node: AddNodePayload) => {
        const api = excalidrawRef.current;
        if (!api) return;

        const currentElements = api.getSceneElements();

        let srcElements: any[] = [];
        const requestedType = (node.node_type || "").toLowerCase();
        const requestedName = (node.node_name || "").toLowerCase();

        const getLibraryItemName = (item: any) => {
            if (item.name) return item.name;
            const textElement = item.elements?.find((el: any) => el.type === "text");
            return textElement?.text || "";
        };

        // 1. Exact match by name
        let matchedLibItem = savedLibraryItems.find((item: any) => {
            const itemName = getLibraryItemName(item).toLowerCase();
            return itemName === requestedType || itemName === requestedName;
        });

        // 2. Fuzzy/Keyword match if no exact match
        if (!matchedLibItem) {
            const keywords = [...requestedType.split(/[\s_-]+/), ...requestedName.split(/[\s_-]+/)].filter(k => k.length > 2);
            matchedLibItem = savedLibraryItems.find((item: any) => {
                const itemName = getLibraryItemName(item).toLowerCase();
                return keywords.some(k => itemName.includes(k));
            });
        }

        if (matchedLibItem && matchedLibItem.elements) {
            const mapOldToNewId = new Map<string, string>();
            const getNewId = (oldId: string) => {
                if (!mapOldToNewId.has(oldId)) mapOldToNewId.set(oldId, crypto.randomUUID());
                return mapOldToNewId.get(oldId)!;
            };

            srcElements = matchedLibItem.elements.map((el: any) => {
                const newEl = { ...el, id: getNewId(el.id) };
                if (newEl.groupIds && Array.isArray(newEl.groupIds)) newEl.groupIds = newEl.groupIds.map(getNewId);
                if (newEl.boundElements && Array.isArray(newEl.boundElements)) newEl.boundElements = newEl.boundElements.map((be: any) => ({ ...be, id: getNewId(be.id) }));
                return newEl;
            });
        } else {
            srcElements = convertToExcalidrawElements([{
                type: "rectangle",
                x: 0, y: 0, width: 200, height: 80,
                backgroundColor: BG[node.node_type] ?? "#f3f4f6",
                strokeColor: STROKE[node.node_type] ?? "#6b7280",
                strokeWidth: 2, roughness: 0, roundness: { type: 3 },
                label: { text: node.node_name, fontSize: 14, fontFamily: 2 },
            } as any]);
        }

        const getBBox = (els: readonly any[]) => {
            if (!els.length) return { minX: 0, minY: 0, maxX: 0, maxY: 0, w: 0, h: 0 };
            const minX = Math.min(...els.map(e => e.x));
            const minY = Math.min(...els.map(e => e.y));
            const maxX = Math.max(...els.map(e => e.x + (e.width || 0)));
            const maxY = Math.max(...els.map(e => e.y + (e.height || 0)));
            return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
        };

        const srcBBox = getBBox(srcElements);
        const SPACING = 150;
        let startX = 50, startY = 50;
        let targetBBox: ReturnType<typeof getBBox> | null = null;
        let targetNodeId: string | null = null;

        if (node.connected_to) {
            const connectNameLower = node.connected_to.toLowerCase();
            const targetTextEl: any = currentElements.find(e => e.type === "text" && (e as any).text.toLowerCase().includes(connectNameLower));
            if (targetTextEl) {
                targetNodeId = targetTextEl.containerId || targetTextEl.id;
                let targetEls: any[] = [targetTextEl];
                if (targetTextEl.containerId) {
                    const container = currentElements.find(e => e.id === targetTextEl.containerId);
                    if (container) targetEls.push(container);
                } else if (targetTextEl.groupIds?.length > 0) {
                    const gId = targetTextEl.groupIds[0];
                    targetEls = currentElements.filter(e => e.groupIds?.includes(gId)) as any[];
                }
                targetBBox = getBBox(targetEls);
                const placement = (node.placement || "right").toLowerCase();
                if (placement === "right") { startX = targetBBox.maxX + SPACING; startY = targetBBox.minY + (targetBBox.h / 2) - (srcBBox.h / 2); }
                else if (placement === "left") { startX = targetBBox.minX - srcBBox.w - SPACING; startY = targetBBox.minY + (targetBBox.h / 2) - (srcBBox.h / 2); }
                else if (placement === "top") { startX = targetBBox.minX + (targetBBox.w / 2) - (srcBBox.w / 2); startY = targetBBox.minY - srcBBox.h - SPACING; }
                else if (placement === "bottom") { startX = targetBBox.minX + (targetBBox.w / 2) - (srcBBox.w / 2); startY = targetBBox.maxY + SPACING; }
            }
        }

        if (!targetBBox) {
            const allBBox = getBBox(currentElements);
            if (allBBox.w > 0 || allBBox.h > 0) { startX = allBBox.minX; startY = allBBox.maxY + SPACING; }
        }

        const dx = startX - srcBBox.minX, dy = startY - srcBBox.minY;
        const newEls = srcElements.map(e => ({ ...e, x: e.x + dx, y: e.y + dy }));
        const additions = [...currentElements, ...newEls];

        if (targetNodeId && targetBBox) {
            const newBindableEl = newEls.find(e => ["rectangle", "diamond", "ellipse", "image"].includes(e.type)) || newEls[0];
            const targetBindableEl = currentElements.find(e => e.id === targetNodeId);
            if (newBindableEl && targetBindableEl) {
                const arrowEls = convertToExcalidrawElements([{
                    type: "arrow",
                    x: targetBBox.minX + targetBBox.w / 2, y: targetBBox.minY + targetBBox.h / 2,
                    width: Math.abs(startX - targetBBox.maxX), height: Math.abs(startY - targetBBox.maxY),
                    points: [[0, 0], [startX - (targetBBox.minX + targetBBox.w / 2), startY - (targetBBox.minY + targetBBox.h / 2)]],
                    strokeColor: "#9ca3af", strokeWidth: 2, roughness: 0,
                    startBinding: { elementId: targetBindableEl.id, focus: 0, gap: 10 },
                    endBinding: { elementId: newBindableEl.id, focus: 0, gap: 10 },
                } as any]);
                additions.push(...arrowEls);
            }
        }

        api.updateScene({ elements: additions });
    }, [excalidrawRef, savedLibraryItems]);

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
        if (ai.status === "idle" || ai.status === "error" || ai.status === "stopped") {
            const delayMs = ai.status === "idle" ? 0 : 2000;
            const t = setTimeout(() => ai.start().catch((err) => console.warn("AI Start Failed:", err)), delayMs);
            return () => clearTimeout(t);
        }
    }, [isAssisted, ai.status, ai.start]); // eslint-disable-line

    useEffect(() => {
        const api = excalidrawRef.current;
        if (api) api.updateScene({ appState: { currentItemRoughness: 0 } });
    }, [excalidrawRef.current]); // eslint-disable-line

    const { user } = useAuth();
    const [runTour, setRunTour] = React.useState(false);

    useEffect(() => {
        if (!isAssisted || !user) return;
        const checkTour = async () => {
            try {
                const docSnap = await getDoc(doc(db, "users", user.uid));
                const hasSeenTour = docSnap.data()?.hasSeenTour;
                if (!hasSeenTour) setTimeout(() => setRunTour(true), 1000);
            } catch (e) { console.warn("Failed to check tour status:", e); }
        };
        checkTour();
    }, [isAssisted, workspaceId, user]);

    const handleJoyrideCallback = async (data: CallBackProps) => {
        const { status } = data;
        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
            setRunTour(false);
            if (user) {
                try {
                    await setDoc(doc(db, "users", user.uid), { hasSeenTour: true }, { merge: true });
                } catch (e) { console.warn("Failed to save tour status:", e); }
            }
        }
    };

    const tourSteps: Step[] = [
        { target: ".excalidraw", content: "Welcome to FlowState AI! This is your infinite canvas where you can draw architectures, flowcharts, and brainstorm ideas.", disableBeacon: true, placement: "center" },
        { target: "button[aria-label*='Library' i], .layer-ui__library-button, .sidebar-trigger", content: "Here is your component Library. You can find pre-made architecture nodes here or save your own custom components.", disableBeacon: true },
        { target: "[data-testid='main-menu-button'], [aria-label*='Main menu' i], .App-menu_top__left", content: "Click this menu to access workspace actions like exporting your canvas as an image, saving, toggling dark mode, or starting your AI Assstant.", disableBeacon: true },
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
    const hideTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    const [syncStatus, setSyncStatus] = React.useState<'saved' | 'saving' | 'error' | null>(null);
    const isRemoteUpdateRef = React.useRef(false);

    // 0+1. Single Firestore listener — handles both shareMode metadata AND element sync.
    //      Having two listeners on the same doc caused isRemoteUpdateRef to be reset
    //      by the first listener before the second one had a chance to check it.
    useEffect(() => {
        if (!workspaceId) return;
        const unsub = onSnapshot(doc(db, "workspaces", workspaceId), (snap) => {
            if (!snap.exists()) return;
            const data = snap.data();

            // Always update shareMode metadata
            if (data.shareMode) {
                setWorkspaceShareMode(data.shareMode as 'editor' | 'viewer');
            }

            // Only apply remote elements if we didn't write this update
            if (!isRemoteUpdateRef.current && data.elements) {
                const parsedElements = JSON.parse(data.elements);
                const api = excalidrawRef.current;
                if (api) {
                    const currentEls = api.getSceneElements();
                    // Deep equality check to avoid infinite update loops
                    if (JSON.stringify(currentEls) !== JSON.stringify(parsedElements)) {
                        api.updateScene({ elements: parsedElements });
                    }
                }
            }

            // Reset the flag AFTER processing so both branches can check it
            isRemoteUpdateRef.current = false;
        });
        return () => unsub();
    }, [workspaceId]);


    // 2. Track selected elements in a ref — written to RTDB on pointer update for zero-delay selection sync
    const selectedElementsRef = React.useRef<Record<string, boolean>>({});

    // 3. Sync own pointer/cursor + color + selectedElementIds to RTDB
    const handlePointerUpdate = (payload: any) => {
        if (!user || !workspaceId || !rtdb) return;
        const { pointer, button, key } = payload;
        if (!pointer) return;

        const userColor = uidToColor(user.uid);
        const presenceRef = ref(rtdb, `rooms/${workspaceId}/collaborators/${user.uid}`);
        set(presenceRef, {
            id: user.uid,
            username: user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : (user.email?.split('@')[0] || "Anonymous"),
            pointer,
            button: button || null,
            key: key || null,
            color: userColor,
            // Include live selection so other users see what this user has selected
            selectedElementIds: selectedElementsRef.current,
            lastSeen: Date.now(),
        });
    };

    // 3. Listen for other users' cursors from RTDB
    useEffect(() => {
        if (!workspaceId || !rtdb) return;

        const collaboratorsRef = ref(rtdb, `rooms/${workspaceId}/collaborators`);
        const unsub = onValue(collaboratorsRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const collaboratorsMap = new Map<string, any>();
                const collaboratorsList: any[] = [];

                Object.entries(data).forEach(([uid, collab]: [string, any]) => {
                    collaboratorsList.push(collab);
                    if (uid !== user?.uid) {
                        // Build full Excalidraw collaborator object including selection
                        collaboratorsMap.set(uid, {
                            ...collab,
                            color: collab.color || { background: '#3b82f6', stroke: '#1d4ed8' },
                            // selectedElementIds lets Excalidraw render colored selection overlays
                            selectedElementIds: collab.selectedElementIds || {},
                            username: collab.username || 'Anonymous',
                        });
                    }
                });

                setActiveCollaborators(collaboratorsList);

                if (excalidrawRef.current) {
                    excalidrawRef.current.updateScene({ collaborators: collaboratorsMap as any });
                }
            } else {
                setActiveCollaborators([]);
                if (excalidrawRef.current) {
                    excalidrawRef.current.updateScene({ collaborators: new Map() });
                }
            }
        });

        // Remove presence on disconnect
        if (user?.uid) {
            const myPresenceRef = ref(rtdb, `rooms/${workspaceId}/collaborators/${user.uid}`);
            onDisconnect(myPresenceRef).remove();
        }

        return () => unsub();
    }, [workspaceId, user?.uid]);

    // 4. Persist canvas changes to Firestore (throttled) + capture live selections
    const handleSceneChange = (elements: readonly any[], appState: any) => {
        if (!user || !workspaceId) return;

        // Instantly capture selected element ids so pointer updates carry them — no debounce
        if (appState.selectedElementIds) {
            selectedElementsRef.current = appState.selectedElementIds;
        }

        setSyncStatus('saving');
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

        syncTimeoutRef.current = setTimeout(async () => {
            try {
                isRemoteUpdateRef.current = true;
                const { collaborators, currentHoveredGroupId, selectedElementIds: _sel, ...safeAppState } = appState;
                await setDoc(doc(db, "workspaces", workspaceId), {
                    elements: JSON.stringify(elements),
                    appState: JSON.stringify(safeAppState),
                    // IMPORTANT: Only write userId when current user is the owner.
                    // If a collaborator saves, we must NOT overwrite the owner's userId —
                    // the library page queries workspaces by userId to show the owner's list.
                    ...(isOwner ? { userId: user.uid } : {}),
                    updatedAt: new Date().toISOString(),
                }, { merge: true });

                setSyncStatus('saved');
                hideTimeoutRef.current = setTimeout(() => setSyncStatus(null), 2000);
            } catch (e) {
                console.warn("[FlowState] Failed to sync workspace canvas:", e);
                setSyncStatus('error');
            }
        }, 1500);
    };

    const otherCollaborators = activeCollaborators.filter(c => c.id !== user?.uid);
    const router = useRouter();

    // ── Save a Copy (Fork) ───────────────────────────────────────────────────
    // Creates a brand-new workspace with the current elements under the user's
    // own UID, writes a userWorkspaces join entry, then navigates to the fork.
    const handleSaveACopy = async () => {
        if (!user || !excalidrawRef.current) return;
        try {
            const newId = Math.random().toString(36).substring(2, 9);
            const api = excalidrawRef.current;
            const elements = api.getSceneElements();
            const appState = api.getAppState();
            const { collaborators: _c, currentHoveredGroupId: _h, selectedElementIds: _s, ...safeAppState } = appState as any;

            const title = `${workspaceTitle || 'Untitled'} (copy)`;

            // 1. Create the forked workspace doc
            await setDoc(doc(db, "workspaces", newId), {
                userId: user.uid,
                title,
                elements: JSON.stringify(elements),
                appState: JSON.stringify(safeAppState),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                shareMode: 'editor',
                editTokens: [],
                viewTokens: [],
                forkedFrom: workspaceId,   // keeps provenance
            });

            // 2. Write userWorkspaces join entry so it appears in the library
            await setDoc(
                doc(db, "userWorkspaces", user.uid, "items", newId),
                {
                    workspaceId: newId,
                    role: 'owner',
                    title,
                    updatedAt: new Date().toISOString(),
                },
                { merge: true }
            );

            // 3. Navigate to the fork
            router.push(`/workspace/${newId}`);
        } catch (e) {
            console.error("[FlowState] Failed to save a copy:", e);
        }
    };

    return (
        <div style={{ height: "100%", width: "100%", position: "relative" }}>
            <Excalidraw
                excalidrawAPI={(api) => { excalidrawRef.current = api; }}
                viewModeEnabled={!canEdit}
                initialData={{
                    elements: initialElements || [],
                    appState: {
                        viewBackgroundColor: "#ffffff",
                        currentItemFontFamily: 2,
                        currentItemRoughness: 0,
                        ...(initialAppState || {}),
                    },
                    libraryItems: savedLibraryItems,
                }}
                onChange={handleSceneChange}
                onLibraryChange={onLibraryChange}
                onPointerUpdate={handlePointerUpdate}
                renderTopRightUI={() => (
                    <div className="flex gap-3 items-center mr-2 pointer-events-auto">
                        {/* Collaborator Avatar Stack */}
                        <CollaboratorStack collaborators={activeCollaborators} currentUid={user?.uid} />

                        {/* Unified Sync & Share Pill */}
                        <div className="flex items-center bg-[#ececf4] rounded-lg shadow-sm border border-transparent translate-y-[2px] overflow-hidden">
                            {syncStatus && (
                                <>
                                    <div className="flex items-center gap-2 px-3 py-2 text-[#1b1b1f] text-[13px] font-medium transition-all duration-300">
                                        {syncStatus === 'saving' && <CloudUpload size={15} className="animate-pulse text-blue-500" />}
                                        {syncStatus === 'saved' && <Cloud size={15} className="text-green-500" />}
                                        {syncStatus === 'error' && <CloudOff size={15} className="text-red-500" />}
                                        <span className="whitespace-nowrap text-[12px]">
                                            {syncStatus === 'saving' ? 'Syncing…' : syncStatus === 'saved' ? 'Saved' : 'Sync Error'}
                                        </span>
                                    </div>
                                    {isOwner && <div className="w-[1px] h-4 bg-gray-400/30" />}
                                </>
                            )}
                            {/* Always show live sync dot when collaborators are online */}
                            {otherCollaborators.length > 0 && !syncStatus && (
                                <>
                                    <div className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium text-green-600">
                                        <Wifi size={13} className="text-green-500" />
                                        <span>Live</span>
                                    </div>
                                    {isOwner && <div className="w-[1px] h-4 bg-gray-400/30" />}
                                </>
                            )}
                            {isOwner && (
                                <button
                                    onClick={() => setIsInviteModalOpen(true)}
                                    className={`flex items-center gap-2 px-3 py-2 text-[#1b1b1f] text-[13px] font-medium hover:bg-[#e4e4f0] transition-all active:scale-95 ${!syncStatus && otherCollaborators.length === 0 ? 'rounded-lg' : ''}`}
                                    title="Share workspace"
                                >
                                    <Share2 size={15} strokeWidth={2} />
                                    <span>Share</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}
            >
                <MainMenu>
                    <MainMenu.Item
                        icon={<ArrowLeft size={16} />}
                        onSelect={() => {
                            if (window.confirm("Are you sure you want to exit? Unsaved changes may be lost.")) onBack();
                        }}
                    >
                        Back to Library
                    </MainMenu.Item>
                    <MainMenu.Separator />

                    {isAssisted && (
                        <MainMenu.Item icon={ai.isRunning ? <MicOff size={16} /> : <Mic size={16} />} onSelect={toggleMic}>
                            {ai.isRunning ? "Stop AI Session" : "Start AI Session"}
                        </MainMenu.Item>
                    )}

                    {/* Save a Copy — available to everyone (fork) */}
                    <MainMenu.Separator />
                    <MainMenu.Item
                        icon={<Copy size={16} />}
                        onSelect={handleSaveACopy}
                    >
                        Save a copy
                    </MainMenu.Item>

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

            {/* AI Badge */}
            {isAssisted && <AIBadge status={ai.status} transcript={transcript} isMuted={ai.isMuted} toggleMute={ai.toggleMute} />}

            {/* History Toggle Button */}
            {isAssisted && (
                <div style={{ position: "fixed", bottom: "1.05rem", right: "4.5rem", zIndex: 1000, pointerEvents: "auto" }}>
                    <button
                        id="tour-history-button"
                        onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                        className={`group relative flex items-center justify-center w-9 h-9 rounded-md border transition-all duration-200 ${isHistoryOpen ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-[#f1f3f5] border-transparent hover:bg-[#e9ecef] text-[#495057]'}`}
                        style={{ boxShadow: isHistoryOpen ? "0 2px 8px rgba(59,130,246,0.15)" : "none" }}
                        title="Conversation History"
                    >
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
                <Joyride
                    steps={tourSteps}
                    run={runTour}
                    continuous
                    showProgress
                    showSkipButton
                    callback={handleJoyrideCallback}
                    styles={{
                        options: { primaryColor: '#4285F4', zIndex: 10000 },
                        tooltip: { borderRadius: '12px', fontFamily: 'inherit', padding: '16px' },
                        buttonNext: { borderRadius: '8px', padding: '8px 16px', fontWeight: 'bold' },
                        buttonBack: { marginRight: 10, color: '#6b7280' },
                        buttonSkip: { color: '#6b7280', fontWeight: 'bold' }
                    }}
                />
            )}
        </div>
    );
}
