"use client";

/**
 * useFlowStateAI.ts
 *
 * Connects the Excalidraw workspace to the FlowState backend.
 *
 * What it does:
 * 1. Opens a WebSocket to ws://localhost:8000/ws/flowstate?workspace_id=<id>
 * 2. Captures microphone audio at 16kHz → streams as PCM binary (tag 0x01)
 * 3. Snapshots the Excalidraw canvas every 2s → sends as JPEG (tag 0x02)
 * 4. Receives:
 *    - Binary frames = AI TTS audio → plays through AudioContext
 *    - JSON { action: "ADD_NODE" } → calls onAddNode callback
 *    - JSON { type: "transcript" } → calls onTranscript callback
 *    - JSON { type: "status" } → calls onStatus callback
 *
 * Usage in ExcalidrawWrapper:
 *   const { isConnected, status, transcript } = useFlowStateAI({
 *     workspaceId: id,
 *     getCanvasSnapshot: () => canvasRef.exportToBlob({ ... }),
 *     onAddNode: (node) => { ... insert Excalidraw element ... },
 *   });
 */

import { useEffect, useRef, useCallback, useState } from "react";

const WS_URL = process.env.NEXT_PUBLIC_BACKEND_WS_URL || "ws://localhost:8000";

const TAG_AUDIO = 0x01;
const TAG_IMAGE = 0x02;
const TAG_TEXT = 0x03;

const CANVAS_INTERVAL_MS = 2000;
const SEND_SAMPLE_RATE = 16000;

export interface AddNodePayload {
    action: "ADD_NODE";
    type: string;
    name: string;
    reasoning: string;
}

export type AIStatus =
    | "disconnected"
    | "connecting"
    | "connected"
    | "ai_ready"
    | "ai_speaking"
    | "ai_done"
    | "error";

interface FlowStateAIOptions {
    workspaceId: string;
    /** Returns a Base64-encoded JPEG string of the current canvas */
    getCanvasSnapshot: () => Promise<string | null>;
    onAddNode?: (payload: AddNodePayload) => void;
    onTranscript?: (text: string) => void;
    onStatus?: (status: AIStatus) => void;
}

interface FlowStateAIResult {
    isConnected: boolean;
    status: AIStatus;
    transcript: string;
    sendText: (text: string) => void;
    startListening: () => Promise<void>;
    stopListening: () => void;
    connect: () => void;
    disconnect: () => void;
}

export function useFlowStateAI({
    workspaceId,
    getCanvasSnapshot,
    onAddNode,
    onTranscript,
    onStatus,
}: FlowStateAIOptions): FlowStateAIResult {
    const wsRef = useRef<WebSocket | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const micStreamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const canvasTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [status, setStatus] = useState<AIStatus>("disconnected");
    const [transcript, setTranscript] = useState("");

    const updateStatus = useCallback(
        (s: AIStatus) => {
            setStatus(s);
            onStatus?.(s);
        },
        [onStatus]
    );

    // ── Helpers ──────────────────────────────────────────────────────────────

    /** Prefix a byte tag and send a binary payload over the WebSocket */
    const sendTagged = useCallback((tag: number, payload: Uint8Array) => {
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        const frame = new Uint8Array(1 + payload.byteLength);
        frame[0] = tag;
        frame.set(payload, 1);
        ws.send(frame);
    }, []);

    // ── Canvas Vision Loop ────────────────────────────────────────────────────

    const startCanvasLoop = useCallback(() => {
        if (canvasTimerRef.current) return;
        canvasTimerRef.current = setInterval(async () => {
            try {
                const b64 = await getCanvasSnapshot();
                if (!b64 || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
                // Strip data URL prefix if present
                const raw = b64.startsWith("data:") ? b64.split(",")[1] : b64;
                const encoded = new TextEncoder().encode(raw);
                sendTagged(TAG_IMAGE, encoded);
            } catch (_) { /* canvas not ready yet */ }
        }, CANVAS_INTERVAL_MS);
    }, [getCanvasSnapshot, sendTagged]);

    const stopCanvasLoop = useCallback(() => {
        if (canvasTimerRef.current) {
            clearInterval(canvasTimerRef.current);
            canvasTimerRef.current = null;
        }
    }, []);

    // ── Mic input → PCM stream ────────────────────────────────────────────────

    const startListening = useCallback(async () => {
        if (processorRef.current) return; // already running

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                channelCount: 1,
                sampleRate: SEND_SAMPLE_RATE,
                echoCancellation: true,
                noiseSuppression: true,
            },
        });
        micStreamRef.current = stream;

        const ctx = new AudioContext({ sampleRate: SEND_SAMPLE_RATE });
        audioCtxRef.current = ctx;

        const source = ctx.createMediaStreamSource(stream);
        // ScriptProcessor for broad compatibility; worklet is better for prod
        const processor = ctx.createScriptProcessor(1024, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
            const float32 = e.inputBuffer.getChannelData(0);
            // Convert Float32 → Int16 PCM
            const int16 = new Int16Array(float32.length);
            for (let i = 0; i < float32.length; i++) {
                const s = Math.max(-1, Math.min(1, float32[i]));
                int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
            }
            sendTagged(TAG_AUDIO, new Uint8Array(int16.buffer));
        };

        source.connect(processor);
        processor.connect(ctx.destination);
    }, [sendTagged]);

    const stopListening = useCallback(() => {
        processorRef.current?.disconnect();
        processorRef.current = null;
        micStreamRef.current?.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
        audioCtxRef.current?.close();
        audioCtxRef.current = null;
    }, []);

    // ── Play AI TTS audio ─────────────────────────────────────────────────────

    const playAudioBytes = useCallback(async (data: ArrayBuffer) => {
        try {
            // Gemini returns raw PCM int16 at 24kHz
            const int16 = new Int16Array(data);
            const float32 = new Float32Array(int16.length);
            for (let i = 0; i < int16.length; i++) {
                float32[i] = int16[i] / 32768;
            }

            const ctx = new AudioContext({ sampleRate: 24000 });
            const buffer = ctx.createBuffer(1, float32.length, 24000);
            buffer.copyToChannel(float32, 0);
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.start();
            updateStatus("ai_speaking");
            source.onended = () => {
                updateStatus("ai_done");
                ctx.close();
            };
        } catch (_) { /* ignore playback errors */ }
    }, [updateStatus]);

    // ── WebSocket connection ──────────────────────────────────────────────────

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;
        updateStatus("connecting");

        const ws = new WebSocket(
            `${WS_URL}/ws/flowstate?workspace_id=${encodeURIComponent(workspaceId)}`
        );
        ws.binaryType = "arraybuffer";
        wsRef.current = ws;

        ws.onopen = () => {
            updateStatus("connected");
        };

        ws.onmessage = async (evt) => {
            // Binary = raw PCM audio from Gemini TTS
            if (evt.data instanceof ArrayBuffer) {
                await playAudioBytes(evt.data);
                return;
            }

            // Text = JSON command
            try {
                const msg = JSON.parse(evt.data as string);

                if (msg.action === "ADD_NODE") {
                    onAddNode?.(msg as AddNodePayload);
                    return;
                }

                if (msg.type === "transcript" && msg.text) {
                    setTranscript(msg.text);
                    onTranscript?.(msg.text);
                    return;
                }

                if (msg.type === "status") {
                    updateStatus(msg.status as AIStatus);
                    // Auto-start canvas loop once AI is ready
                    if (msg.status === "ai_ready") {
                        startCanvasLoop();
                    }
                    return;
                }

                if (msg.type === "error") {
                    console.error("[FlowState WS]", msg.message);
                    updateStatus("error");
                }
            } catch (_) { /* non-JSON frame, ignore */ }
        };

        ws.onerror = () => updateStatus("error");

        ws.onclose = () => {
            updateStatus("disconnected");
            stopCanvasLoop();
        };
    }, [
        workspaceId,
        onAddNode,
        onTranscript,
        updateStatus,
        playAudioBytes,
        startCanvasLoop,
        stopCanvasLoop,
    ]);

    const disconnect = useCallback(() => {
        stopListening();
        stopCanvasLoop();
        wsRef.current?.close();
        wsRef.current = null;
    }, [stopListening, stopCanvasLoop]);

    const sendText = useCallback((text: string) => {
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        const encoded = new TextEncoder().encode(text);
        sendTagged(TAG_TEXT, encoded);
    }, [sendTagged]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return {
        isConnected: status !== "disconnected" && status !== "error",
        status,
        transcript,
        sendText,
        startListening,
        stopListening,
        connect,
        disconnect,
    };
}
