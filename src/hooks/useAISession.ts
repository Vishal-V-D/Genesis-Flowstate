"use client";
/**
 * useAISession.ts
 *
 * Manages the FlowState AI session for a workspace.
 *
 * NO SCREEN SHARE REQUIRED — we capture the Excalidraw canvas directly
 * using the getCanvasBlob callback (exportToBlob from Excalidraw API).
 *
 * Permissions needed:
 *   ✅  Microphone only
 *
 * What it does:
 *  1. Opens a WebSocket to ws://localhost:8000/ws/session/{workspaceId}
 *  2. Captures mic audio at 16kHz → streams as PCM binary (tag 0x01)
 *  3. Calls getCanvasBlob() every 20s → sends JPEG as binary (tag 0x02)
 *  4. Receives AI voice (PCM 24kHz) → plays through AudioContext
 *  5. Receives ADD_NODE JSON → calls onAddNode callback
 *  6. Receives transcript JSON → calls onTranscript callback
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";

const BACKEND_WS = process.env.NEXT_PUBLIC_BACKEND_WS_URL ?? "ws://localhost:8000";

const TAG_AUDIO = 0x01;
const TAG_IMAGE = 0x02;
const TAG_TEXT = 0x03;

const MIC_SAMPLE_RATE = 16_000;
const CANVAS_INTERVAL_MS = 20_000;   // ← every 20 seconds
const JPEG_QUALITY = 0.6;
const PCM_CHUNK_SAMPLES = 1024;

export interface AddNodePayload {
    action: "ADD_NODE";
    node_name: string;
    node_type: string;
    reasoning: string;
    connected_to?: string;
    placement?: string;
}

export interface HistoryMessage {
    role: "user" | "model";
    text: string;
    timestamp: number;
    audioUrl?: string; // WhatsApp-style voice message
}

export type SessionStatus =
    | "idle"
    | "requesting_permissions"
    | "connecting"
    | "ai_ready"
    | "ai_done"
    | "error"
    | "stopped";

export interface AISessionOptions {
    workspaceId: string;
    /** Called every 20s to get the current canvas as a JPEG blob */
    getCanvasBlob: () => Promise<Blob | null>;
    onAddNode?: (node: AddNodePayload) => void;
    onTranscript?: (text: string, role: "model" | "user") => void;
    onStatus?: (s: SessionStatus) => void;
}

export interface AISessionHandle {
    status: SessionStatus;
    transcript: string;
    history: HistoryMessage[];
    start: () => Promise<void>;
    stop: () => void;
    sendText: (msg: string) => void;
    clearHistory: () => void;
    isRunning: boolean;
    isMuted: boolean;
    toggleMute: () => void;
}

export function useAISession({
    workspaceId,
    getCanvasBlob,
    onAddNode,
    onTranscript,
    onStatus,
}: AISessionOptions): AISessionHandle {

    const [status, setStatus] = useState<SessionStatus>("idle");
    const [transcript, setTranscript] = useState("");
    const [history, setHistory] = useState<HistoryMessage[]>([]);

    const [isMuted, setIsMuted] = useState(false);
    const isMutedRef = useRef(false);

    const toggleMute = useCallback(() => {
        setIsMuted(prev => {
            const next = !prev;
            isMutedRef.current = next;
            return next;
        });
    }, []);

    const { user } = useAuth();

    // ── Persistence (Firestore) ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!user) return;
        const fetchHistory = async () => {
            try {
                const docRef = doc(db, "workspaces", workspaceId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists() && docSnap.data().chats) {
                    setHistory(docSnap.data().chats);
                }
            } catch (e) {
                console.warn("[FlowState] failed to load history from Firestore:", e);
            }
        };
        fetchHistory();
    }, [workspaceId, user]);

    useEffect(() => {
        if (!user || history.length === 0) return;
        const saveHistory = async () => {
            try {
                const docRef = doc(db, "workspaces", workspaceId);
                // Use setDoc with merge instead of updateDoc in case the workspace doc doesn't exist yet
                await setDoc(docRef, { chats: history }, { merge: true });
            } catch (e) {
                console.warn("[FlowState] failed to save history to Firestore:", e);
            }
        };
        saveHistory();
    }, [history, workspaceId, user]);

    const clearHistory = useCallback(async () => {
        setHistory([]);
        if (user) {
            try {
                await updateDoc(doc(db, "workspaces", workspaceId), { chats: [] });
            } catch (e) {
                console.warn("[FlowState] failed to clear history in Firestore:", e);
            }
        }
    }, [workspaceId, user]);

    const wsRef = useRef<WebSocket | null>(null);
    const micCtxRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const micStreamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const canvasTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const playCtxRef = useRef<AudioContext | null>(null);

    const sessionIDRef = useRef(0);
    const connectingRef = useRef(false);
    const lastSnapshotSizeRef = useRef<number>(0);
    const lastSnapshotTimeRef = useRef<number>(0);

    // Buffers for WhatsApp-style voice messages
    const pcmBufferRef = useRef<Int16Array[]>([]);

    const updateStatus = useCallback((s: SessionStatus) => {
        setStatus(s);
        onStatus?.(s);
    }, [onStatus]);

    // ── Send binary frame ─────────────────────────────────────────────────────
    const sendBinary = useCallback((tag: number, payload: Uint8Array) => {
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        const frame = new Uint8Array(1 + payload.byteLength);
        frame[0] = tag;
        frame.set(payload, 1);
        ws.send(frame);
    }, []);

    const sendText = useCallback((msg: string) => {
        sendBinary(TAG_TEXT, new TextEncoder().encode(msg));

        // Also add to local history immediately so it shows up in UI
        setHistory(prev => [...prev, { role: "user", text: msg, timestamp: Date.now() }]);
        console.log(`[FlowState] 💬 User typed: "${msg}"`);
    }, [sendBinary]);

    const playPCM = useCallback(async (raw: ArrayBuffer) => {
        try {
            // Buffer the chunk for later WAV encoding
            const ints = new Int16Array(raw);
            pcmBufferRef.current.push(ints);

            if (!micCtxRef.current || micCtxRef.current.state === "closed") {
                micCtxRef.current = new AudioContext({ sampleRate: 24_000 });
                nextStartTimeRef.current = 0;
            }
            const ctx = micCtxRef.current;

            // Resume if suspended (common browser policy)
            if (ctx.state === "suspended") await ctx.resume();

            const f32 = new Float32Array(ints.length);
            for (let i = 0; i < ints.length; i++) f32[i] = ints[i] / 32768;

            const buf = ctx.createBuffer(1, f32.length, 24_000);
            buf.copyToChannel(f32, 0);

            const src = ctx.createBufferSource();
            src.buffer = buf;
            src.connect(ctx.destination);

            // Precise Scheduling:
            // We schedule the chunk to play immediately after the previous one.
            // If we are behind (gap occurred), we reset to 'now' + small lookahead.
            const now = ctx.currentTime;
            const lookahead = 0.05; // 50ms buffer to handle network jitter

            if (nextStartTimeRef.current < now) {
                nextStartTimeRef.current = now + lookahead;
            }

            console.log(`[FlowState] 🔊 playing AI audio chunk — ${raw.byteLength} bytes at ${nextStartTimeRef.current.toFixed(3)}s`);
            src.start(nextStartTimeRef.current);
            nextStartTimeRef.current += buf.duration;

        } catch (e) {
            console.warn("[FlowState] 🔊 Audio playback error:", e);
        }
    }, []);

    // ── Canvas snapshot loop (every 20s, NO screen share) ────────────────────
    const startCanvasLoop = useCallback(() => {
        if (canvasTimerRef.current) return;

        const captureAndSend = async () => {
            try {
                const blob = await getCanvasBlob();
                if (!blob) return;

                const ab = await blob.arrayBuffer();
                const size = ab.byteLength;
                const now = Date.now();

                // Smart Snapshot: Skip if size is identical AND it's been < 60s
                // (We send a heartbeat snapshot every 60s regardless to keep Gemini fresh)
                if (size === lastSnapshotSizeRef.current && (now - lastSnapshotTimeRef.current) < 60000) {
                    console.log("[FlowState] 🖼️ Skipping redundant canvas snapshot (no change detected)");
                    return;
                }

                sendBinary(TAG_IMAGE, new Uint8Array(ab));
                lastSnapshotSizeRef.current = size;
                lastSnapshotTimeRef.current = now;
                console.log(`[FlowState] 🖼️ Canvas snapshot sent — ${(size / 1024).toFixed(1)} KB`);
            } catch (e) {
                console.warn("[FlowState] canvas snapshot failed:", e);
            }
        };

        // First capture immediately, then every CANVAS_INTERVAL_MS
        captureAndSend();
        canvasTimerRef.current = setInterval(captureAndSend, CANVAS_INTERVAL_MS);
    }, [getCanvasBlob, sendBinary]);

    const stopCanvasLoop = useCallback(() => {
        if (canvasTimerRef.current) {
            clearInterval(canvasTimerRef.current);
            canvasTimerRef.current = null;
        }
    }, []);

    // ── Mic audio → PCM streaming ─────────────────────────────────────────────
    const startMic = useCallback(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                sampleRate: MIC_SAMPLE_RATE,
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
            },
        });
        micStreamRef.current = stream;

        const ctx = new AudioContext({ sampleRate: MIC_SAMPLE_RATE });
        micCtxRef.current = ctx;

        const source = ctx.createMediaStreamSource(stream);
        const processor = ctx.createScriptProcessor(PCM_CHUNK_SAMPLES, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
            if (isMutedRef.current) return;
            const f32 = e.inputBuffer.getChannelData(0);
            const int16 = new Int16Array(f32.length);
            for (let i = 0; i < f32.length; i++) {
                const s = Math.max(-1, Math.min(1, f32[i]));
                int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
            }
            sendBinary(TAG_AUDIO, new Uint8Array(int16.buffer));
        };

        source.connect(processor);
        processor.connect(ctx.destination);
        console.log("[FlowState] 🎙 Mic started — streaming PCM at 16kHz");
    }, [sendBinary]);

    const stopMic = useCallback(() => {
        processorRef.current?.disconnect();
        processorRef.current = null;
        micStreamRef.current?.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
        micCtxRef.current?.close().catch(() => { });
        micCtxRef.current = null;
    }, []);

    // ── WebSocket connection ──────────────────────────────────────────────────
    const openWebSocket = useCallback((): Promise<void> => {
        return new Promise((resolve, reject) => {
            updateStatus("connecting");
            const url = `${BACKEND_WS}/ws/session/${encodeURIComponent(workspaceId)}?mode=assisted`;
            console.log(`[FlowState] 🔌 Connecting to ${url}`);

            const ws = new WebSocket(url);
            ws.binaryType = "arraybuffer";
            wsRef.current = ws;

            ws.onopen = () => {
                console.log("[FlowState] ✅ WebSocket connected to backend");
                resolve();
            };

            ws.onmessage = async (evt) => {
                // Binary → AI voice PCM
                if (evt.data instanceof ArrayBuffer) {
                    await playPCM(evt.data);
                    return;
                }
                try {
                    const msg = JSON.parse(evt.data as string);

                    if (msg.type === "status") {
                        console.log(`[FlowState] status → ${msg.status}`);
                        updateStatus(msg.status as SessionStatus);

                        // When AI finishes turn, finalize the voice message
                        if (msg.status === "ai_done") {
                            finalizeVoiceMessage();
                        } else if (msg.status === "ai_ready") {
                            startCanvasLoop();
                            pcmBufferRef.current = []; // Clear for next turn
                        }
                        return;
                    }
                    if (msg.type === "transcript" && msg.text) {
                        setTranscript(msg.text);
                        const role = msg.role ?? "model";

                        if (role === "model") {
                            console.log(`[FlowState] 🤖 Gemini: "${msg.text}"`);
                        }

                        // We update the history list
                        // If the last message is the same role, we update its text (streaming effect)
                        // If it's a new role, we append.
                        setHistory(prev => {
                            const last = prev[prev.length - 1];
                            if (last && last.role === role) {
                                const next = [...prev];
                                next[next.length - 1] = { ...last, text: msg.text };
                                return next;
                            }
                            return [...prev, { role, text: msg.text, timestamp: Date.now() }];
                        });

                        onTranscript?.(msg.text, role);
                        return;
                    }
                    if (msg.action === "ADD_NODE") {
                        console.log(`[FlowState] ADD_NODE → ${msg.node_name} (${msg.node_type})`);
                        onAddNode?.(msg as AddNodePayload);
                        return;
                    }
                    if (msg.type === "error") {
                        console.error("[FlowState] backend error:", msg.message);
                        updateStatus("error");
                    }
                } catch (_) { /* non-JSON */ }
            };

            ws.onerror = (e) => {
                console.error("[FlowState] ❌ WebSocket error", e);
                updateStatus("error");
                reject(new Error("WebSocket connection failed — is the backend running?"));
            };

            ws.onclose = (e) => {
                // We use connectingRef to avoid resetting status if we are in the middle of a retry/double-mount
                console.log(`[FlowState] 🔌 WebSocket closed (code=${e.code}, wasClean=${e.wasClean})`);

                if (e.code === 1006 && !connectingRef.current) {
                    console.warn("[FlowState] Abnormal closure (1006). Check if backend is running and reachable.");
                }

                if (!connectingRef.current) {
                    updateStatus("stopped");
                    stopMic();
                    stopCanvasLoop();
                }
                wsRef.current = null;
            };
        });
    }, [workspaceId, updateStatus, playPCM, onAddNode, onTranscript, startCanvasLoop, stopMic, stopCanvasLoop]);

    // ── Public: stop ──────────────────────────────────────────────────────────
    const stop = useCallback(() => {
        console.log("[FlowState] 🛑 Stopping AI session...");
        sessionIDRef.current++; // Invalidate stale start() calls

        stopMic();
        stopCanvasLoop();

        if (wsRef.current) {
            if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
                wsRef.current.close();
            }
            wsRef.current = null;
        }

        playCtxRef.current?.close().catch(() => { });
        playCtxRef.current = null;
        updateStatus("stopped");
    }, [stopMic, stopCanvasLoop, updateStatus]);

    // ── Public: start ─────────────────────────────────────────────────────────
    const start = useCallback(async () => {
        if (status === "ai_ready" || status === "connecting") return;

        if (connectingRef.current) {
            console.log("[FlowState] ⏳ Existing connection in progress, waiting...");
            for (let i = 0; i < 15; i++) {
                if (!connectingRef.current) break;
                await new Promise(r => setTimeout(r, 100));
            }
        }

        const myID = sessionIDRef.current;
        connectingRef.current = true;

        try {
            updateStatus("requesting_permissions");
            console.log("[FlowState] 🎙️ Requesting microphone permission...");

            await startMic();
            if (myID !== sessionIDRef.current) throw new Error("Aborted");

            updateStatus("connecting");
            await openWebSocket();
            if (myID !== sessionIDRef.current) throw new Error("Aborted");

            console.log("[FlowState] 🚀 AI session fully started");
        } catch (err: any) {
            if (myID !== sessionIDRef.current) {
                console.log("[FlowState] 💤 Start sequence suppressed (cleanup/abort)");
            } else {
                console.error("[FlowState] ❌ Start error:", err);
                updateStatus("error");
            }
            stopMic();
            stopCanvasLoop();
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        } finally {
            connectingRef.current = false;
        }
    }, [status, updateStatus, openWebSocket, startMic, stopMic, stopCanvasLoop, stop]);

    // ── Voice Message Finalization (WAV Encoding) ───────────────────────────
    const finalizeVoiceMessage = useCallback(() => {
        if (pcmBufferRef.current.length === 0) return;

        console.log(`[FlowState] 🎙️ Packaging ${pcmBufferRef.current.length} chunks into voice message...`);

        // 1. Calculate total length
        let totalSamples = 0;
        for (const chunk of pcmBufferRef.current) totalSamples += chunk.length;

        // 2. Merge into single Int16Array
        const merged = new Int16Array(totalSamples);
        let offset = 0;
        for (const chunk of pcmBufferRef.current) {
            merged.set(chunk, offset);
            offset += chunk.length;
        }

        // 3. Simple WAV Encoder (44 byte header)
        const sampleRate = 24000;
        const wavBuffer = new ArrayBuffer(44 + merged.length * 2);
        const view = new DataView(wavBuffer);

        const writeString = (offset: number, string: string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, 36 + merged.length * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true); // PCM
        view.setUint16(22, 1, true); // Mono
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, merged.length * 2, true);

        // Copy samples
        for (let i = 0; i < merged.length; i++) {
            view.setInt16(44 + i * 2, merged[i], true);
        }

        const blob = new Blob([wavBuffer], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);

        // 4. Update the LATEST AI message in history with this audioUrl
        setHistory(prev => {
            const next = [...prev];
            let found = false;
            // Find the last model message to attach to
            for (let i = next.length - 1; i >= 0; i--) {
                if (next[i].role === 'model') {
                    next[i] = { ...next[i], audioUrl: url };
                    found = true;
                    console.log("[FlowState] ✅ Voice message attached to existing transcript");
                    break;
                }
            }
            // If no model message exists yet (transcript is slow), create a placeholder
            if (!found) {
                next.push({
                    role: 'model',
                    text: "", // Will be updated by transcript soon
                    timestamp: Date.now(),
                    audioUrl: url
                });
                console.log("[FlowState] ✅ Voice message created as placeholder");
            }
            return next;
        });

        pcmBufferRef.current = []; // Clear for next turn
    }, []);

    useEffect(() => () => { stop(); }, [stop]);

    return useMemo(() => ({
        status,
        transcript,
        history,
        start,
        stop,
        sendText,
        clearHistory,
        isRunning: status === "ai_ready" || status === "ai_done",
        isMuted,
        toggleMute,
    }), [status, transcript, history, start, stop, sendText, clearHistory, isMuted, toggleMute]);
}
