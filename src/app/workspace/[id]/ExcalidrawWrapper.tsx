"use client";

import React, { useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Excalidraw, MainMenu, convertToExcalidrawElements } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import Joyride, { STATUS, Step, CallBackProps } from "react-joyride";
import { ArrowLeft, Mic, MicOff, Wifi, WifiOff, Loader2, Sparkles, X, Trash2, History, Bot, User, Send, Play, Pause } from "lucide-react";
import type { LibraryItems, ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

import { useAISession, type AddNodePayload, type SessionStatus } from "@/hooks/useAISession";

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
                            style={{
                                height: `${30 + (Math.sin(i * 0.8) * 30 + 30)}%`,
                                animationDelay: `${i * 0.05}s`
                            }}
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
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
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
                                border: "1px solid rgba(0,0,0,0.03)",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
                            }}>
                                {msg.text}

                                {msg.audioUrl && (
                                    <VoiceMessage url={msg.audioUrl} />
                                )}
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
                <div id="tour-ai-badge" className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-medium transition-all duration-300 ${colors[status]}`} style={{ border: "1px solid rgba(0,0,0,0.06)", backdropFilter: "blur(8px)", minWidth: isListening ? "160px" : "auto", justifyContent: "center" }}>
                    {status === "connecting" || status === "requesting_permissions"
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : null
                    }

                    {isListening && renderVisualizer()}
                    <span className={isListening ? "tracking-widest uppercase text-[11px] font-bold mx-2" : ""}>
                        {labels[status]}
                    </span>
                    {isListening && renderVisualizer()}

                    {!isListening && status !== "connecting" && status !== "requesting_permissions" && (
                        <span className="ml-[2px]">{/* to balance layout if needed */}</span>
                    )}
                </div>

                {(status === "ai_ready" || status === "ai_done") && (
                    <button
                        id="tour-mute-button"
                        onClick={toggleMute}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-all shadow-sm border ${isMuted
                            ? 'bg-red-50/95 text-red-600 border-red-200 hover:bg-red-100'
                            : 'bg-white/95 text-gray-700 border-black/5 hover:bg-gray-50'
                            }`}
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

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ExcalidrawWrapper({
    excalidrawRef,
    savedLibraryItems,
    onLibraryChange,
    onBack,
    workspaceId,
}: {
    excalidrawRef: React.MutableRefObject<ExcalidrawImperativeAPI | null>;
    savedLibraryItems: LibraryItems;
    onLibraryChange: (items: LibraryItems) => void;
    onBack: () => void;
    workspaceId: string;
}) {
    const searchParams = useSearchParams();
    const mode = searchParams?.get("mode") ?? "personal";
    const isAssisted = mode === "assisted";

    // ── ADD_NODE → Excalidraw element ─────────────────────────────────────────
    const handleAddNode = useCallback((node: AddNodePayload) => {
        const api = excalidrawRef.current;
        if (!api) return;

        const currentElements = api.getSceneElements();

        // 1. Library Search
        let srcElements: any[] = [];
        const requestedType = (node.node_type || "").toLowerCase();
        const requestedName = (node.node_name || "").toLowerCase();

        const matchedLibItem = savedLibraryItems.find((item: any) =>
            (item.name || "").toLowerCase() === requestedType ||
            (item.name || "").toLowerCase() === requestedName
        );

        if (matchedLibItem && matchedLibItem.elements) {
            // Remap IDs to avoid collisions when inserting duplicates of library items
            const mapOldToNewId = new Map<string, string>();
            const getNewId = (oldId: string) => {
                if (!mapOldToNewId.has(oldId)) mapOldToNewId.set(oldId, crypto.randomUUID());
                return mapOldToNewId.get(oldId)!;
            };

            srcElements = matchedLibItem.elements.map((el: any) => {
                const newEl = { ...el, id: getNewId(el.id) };
                if (newEl.groupIds && Array.isArray(newEl.groupIds)) {
                    newEl.groupIds = newEl.groupIds.map(getNewId);
                }
                if (newEl.boundElements && Array.isArray(newEl.boundElements)) {
                    newEl.boundElements = newEl.boundElements.map((be: any) => ({ ...be, id: getNewId(be.id) }));
                }
                return newEl;
            });
        } else {
            // Fallback rectangle
            srcElements = convertToExcalidrawElements([
                {
                    type: "rectangle",
                    x: 0, y: 0, width: 200, height: 80,
                    backgroundColor: BG[node.node_type] ?? "#f3f4f6",
                    strokeColor: STROKE[node.node_type] ?? "#6b7280",
                    strokeWidth: 2,
                    roughness: 0,
                    roundness: { type: 3 },
                    label: { text: node.node_name, fontSize: 14, fontFamily: 2 },
                } as any,
            ]);
        }

        // 2. Intelligent Placement & Collision Avoidance
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
        let startX = 50;
        let startY = 50;

        let targetBBox: ReturnType<typeof getBBox> | null = null;
        let targetNodeId: string | null = null;

        if (node.connected_to) {
            const connectNameLower = node.connected_to.toLowerCase();
            const targetTextEl: any = currentElements.find(e => e.type === "text" && (e as any).text.toLowerCase().includes(connectNameLower));

            if (targetTextEl) {
                targetNodeId = targetTextEl.containerId || targetTextEl.id;
                // Try to find the container or group to get full bounding box
                let targetEls: any[] = [targetTextEl];
                if (targetTextEl.containerId) {
                    const container = currentElements.find(e => e.id === targetTextEl.containerId);
                    if (container) targetEls.push(container);
                } else if (targetTextEl.groupIds && targetTextEl.groupIds.length > 0) {
                    const gId = targetTextEl.groupIds[0];
                    targetEls = currentElements.filter(e => e.groupIds?.includes(gId)) as any[];
                }

                targetBBox = getBBox(targetEls);

                // Base positioning based on `placement`
                const placement = (node.placement || "right").toLowerCase();
                if (placement === "right") {
                    startX = targetBBox.maxX + SPACING;
                    startY = targetBBox.minY + (targetBBox.h / 2) - (srcBBox.h / 2);
                } else if (placement === "left") {
                    startX = targetBBox.minX - srcBBox.w - SPACING;
                    startY = targetBBox.minY + (targetBBox.h / 2) - (srcBBox.h / 2);
                } else if (placement === "top") {
                    startX = targetBBox.minX + (targetBBox.w / 2) - (srcBBox.w / 2);
                    startY = targetBBox.minY - srcBBox.h - SPACING;
                } else if (placement === "bottom") {
                    startX = targetBBox.minX + (targetBBox.w / 2) - (srcBBox.w / 2);
                    startY = targetBBox.maxY + SPACING;
                }
            }
        }

        if (!targetBBox) {
            const allBBox = getBBox(currentElements);
            if (allBBox.w > 0 || allBBox.h > 0) {
                startX = allBBox.minX;
                startY = allBBox.maxY + SPACING;
            }
        }

        // Apply shift
        const dx = startX - srcBBox.minX;
        const dy = startY - srcBBox.minY;
        const newEls = srcElements.map(e => ({ ...e, x: e.x + dx, y: e.y + dy }));

        // 3. Arrow Binding
        const additions = [...currentElements, ...newEls];

        if (targetNodeId && targetBBox) {
            // Pick a primary element from newEls to bind to (find a rectangle, diamond, or just the first element)
            const newBindableEl = newEls.find(e => ["rectangle", "diamond", "ellipse", "image"].includes(e.type)) || newEls[0];
            const targetBindableEl = currentElements.find(e => e.id === targetNodeId);

            if (newBindableEl && targetBindableEl) {
                const arrowEls = convertToExcalidrawElements([{
                    type: "arrow",
                    x: targetBBox.minX + targetBBox.w / 2,
                    y: targetBBox.minY + targetBBox.h / 2,
                    width: Math.abs(startX - targetBBox.maxX),
                    height: Math.abs(startY - targetBBox.maxY),
                    points: [[0, 0], [startX - (targetBBox.minX + targetBBox.w / 2), startY - (targetBBox.minY + targetBBox.h / 2)]],
                    strokeColor: "#9ca3af",
                    strokeWidth: 2,
                    roughness: 0,
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

    // ── Canvas blob via Excalidraw API — no screen share required ────────────
    const getCanvasBlob = useCallback(async (): Promise<Blob | null> => {
        const api = excalidrawRef.current;
        if (!api) return null;
        try {
            const { exportToBlob } = await import("@excalidraw/excalidraw");
            return await exportToBlob({
                elements: api.getSceneElements(),
                appState: api.getAppState(),
                files: api.getFiles(),
                mimeType: "image/jpeg",
                quality: 0.6,
            });
        } catch (e) {
            console.warn("[FlowState] exportToBlob failed:", e);
            return null;
        }
    }, [excalidrawRef]);

    const ai = useAISession({
        workspaceId,
        getCanvasBlob,
        onAddNode: handleAddNode,
        onTranscript: (text) => setTranscript(text),
    });

    // AI Session Lifecycle: Auto-start if assisted
    useEffect(() => {
        if (!isAssisted) return;

        if (ai.status === "idle" || ai.status === "error" || ai.status === "stopped") {
            console.log(`[FlowState] 🚀 Starting (or reconnecting) AI session... (status: ${ai.status})`);

            // Add a small delay for reconnects to prevent tight looping on crash
            const delayMs = ai.status === "idle" ? 0 : 2000;
            const t = setTimeout(() => {
                ai.start().catch((err) => console.warn("AI Start Failed:", err));
            }, delayMs);

            return () => clearTimeout(t);
        }
    }, [isAssisted, ai.status, ai.start]); // eslint-disable-line react-hooks/exhaustive-deps

    // Ensure Architect mode (0 roughness) is applied once API is ready
    useEffect(() => {
        const api = excalidrawRef.current;
        if (api) {
            api.updateScene({ appState: { currentItemRoughness: 0 } });
        }
    }, [excalidrawRef.current]); // eslint-disable-line react-hooks/exhaustive-deps

    const [runTour, setRunTour] = React.useState(false);

    useEffect(() => {
        if (!isAssisted) return;
        const hasSeenTour = localStorage.getItem(`fs-tour-${workspaceId}`);
        if (!hasSeenTour) {
            // Slight delay so canvas is ready
            setTimeout(() => setRunTour(true), 1000);
        }
    }, [isAssisted, workspaceId]);

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status } = data;
        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
        if (finishedStatuses.includes(status)) {
            setRunTour(false);
            localStorage.setItem(`fs-tour-${workspaceId}`, "true");
        }
    };

    const tourSteps: Step[] = [
        {
            target: ".excalidraw",
            content: "Welcome to FlowState AI! This is your infinite canvas where you can draw architectures, flowcharts, and brainstorm ideas.",
            disableBeacon: true,
            placement: "center",
        },
        {
            target: "button[aria-label*='Library' i], .layer-ui__library-button, .sidebar-trigger",
            content: "Here is your component Library. You can find pre-made architecture nodes (like servers, databases) here or save your own custom components.",
            disableBeacon: true,
        },
        {
            target: "[data-testid='main-menu-button'], [aria-label*='Main menu' i], .App-menu_top__left",
            content: "Click this menu to access workspace actions like exporting your canvas as an image, saving, toggling dark mode, or starting your AI Assstant.",
            disableBeacon: true,
        },
        {
            target: "#tour-ai-badge",
            content: "Once you start the AI session from the menu, your AI becomes active! This badge tells you if the AI is currently listening to you or speaking its response.",
            disableBeacon: true,
        },
        {
            target: "#tour-mute-button",
            content: "Need some privacy? Click here to quickly mute your microphone so the AI stops listening temporarily.",
            disableBeacon: true,
        },
        {
            target: "#tour-history-button",
            content: "Want to review the conversation? Click the sparkles to open the prompt history and voice playbacks.",
            disableBeacon: true,
        }
    ];

    const toggleMic = async () => {
        // mic is managed inside useAISession — just reconnect/disconnect
        if (ai.isRunning) {
            ai.stop();
            setMicActive(false);
        } else {
            await ai.start();
            setMicActive(true);
        }
    };

    return (
        <>
            <Excalidraw
                excalidrawAPI={(api) => {
                    excalidrawRef.current = api;
                }}
                initialData={{
                    appState: {
                        viewBackgroundColor: "#ffffff",
                        currentItemFontFamily: 2,
                        currentItemRoughness: 0,
                    },
                    libraryItems: savedLibraryItems,
                }}
                onLibraryChange={onLibraryChange}
            >
                <MainMenu>
                    <MainMenu.Item
                        icon={<ArrowLeft size={16} />}
                        onSelect={() => {
                            if (window.confirm("Are you sure you want to exit? Unsaved changes may be lost.")) {
                                onBack();
                            }
                        }}
                    >
                        Back to Library
                    </MainMenu.Item>
                    <MainMenu.Separator />

                    {isAssisted && (
                        <MainMenu.Item
                            icon={ai.isRunning ? <MicOff size={16} /> : <Mic size={16} />}
                            onSelect={toggleMic}
                        >
                            {ai.isRunning ? "Stop AI Session" : "Start AI Session"}
                        </MainMenu.Item>
                    )}

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

            {/* Only show AI badge in assisted mode */}
            {isAssisted && <AIBadge status={ai.status} transcript={transcript} isMuted={ai.isMuted} toggleMute={ai.toggleMute} />}

            {/* Sparkles Button (History Toggle) */}
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

            <HistoryPanel
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                history={ai.history}
                onClear={ai.clearHistory}
                onSend={ai.sendText}
            />

            {isAssisted && (
                <Joyride
                    steps={tourSteps}
                    run={runTour}
                    continuous
                    showProgress
                    showSkipButton
                    callback={handleJoyrideCallback}
                    styles={{
                        options: {
                            primaryColor: '#4285F4',
                            zIndex: 10000,
                        },
                        tooltip: {
                            borderRadius: '12px',
                            fontFamily: 'inherit',
                            padding: '16px',
                        },
                        buttonNext: {
                            borderRadius: '8px',
                            padding: '8px 16px',
                            fontWeight: 'bold',
                        },
                        buttonBack: {
                            marginRight: 10,
                            color: '#6b7280',
                        },
                        buttonSkip: {
                            color: '#6b7280',
                            fontWeight: 'bold',
                        }
                    }}
                />
            )}
        </>
    );
}
