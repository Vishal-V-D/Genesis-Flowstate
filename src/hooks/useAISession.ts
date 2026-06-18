"use client";
/**
 * useAISession.ts — FlowState AI
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getCurrentSession } from "@/lib/aws-client";

const BACKEND_WS =
  process.env.NEXT_PUBLIC_BACKEND_WS_URL ?? "ws://localhost:8080";

const TAG_AUDIO    = 0x01;
const TAG_IMAGE    = 0x02;
const TAG_TEXT     = 0x03;
const TAG_LIBRARY  = 0x04;
const TAG_AI_AUDIO = 0xa1;

const MIC_SAMPLE_RATE    = 16_000;
const PLAY_SAMPLE_RATE   = 24_000;
const PCM_CHUNK_SAMPLES  = 4_096;   // 256ms chunks — fewer WS frames
const CANVAS_INTERVAL_MS = 20_000;

// 1.5s absorbs tool-call audio gaps (5 nodes × ~200ms ACK each ≈ 1s)
const RESET_THRESHOLD_S = 1.5;
const LOOKAHEAD_S       = 0.02;

// AudioWorklet runs off main thread — zero jank, no dropped samples
const WORKLET_CODE = `
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buf = new Int16Array(${PCM_CHUNK_SAMPLES});
    this._off = 0;
  }
  _rms(buf) {
    let sum = 0;
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    return Math.sqrt(sum / buf.length);
  }
  process(inputs) {
    const ch = inputs[0]?.[0];
    if (!ch) return true;
    for (let i = 0; i < ch.length; i++) {
      const s = Math.max(-1, Math.min(1, ch[i]));
      this._buf[this._off++] = s < 0 ? s * 0x8000 : s * 0x7fff;
      if (this._off >= ${PCM_CHUNK_SAMPLES}) {
        // VAD: only send if RMS > 150 (speech), drop silence
        if (this._rms(this._buf) > 150) {
          this.port.postMessage(this._buf.slice(0));
        }
        this._off = 0;
      }
    }
    return true;
  }
}
registerProcessor('pcm-processor', PCMProcessor);
`;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AddNodePayload {
  action:
    | "ADD_NODE" | "CONNECT_NODES" | "DELETE_NODE" | "RENAME_NODE"
    | "ADD_GROUP" | "SUGGEST" | "VALIDATE" | "STEP_NARRATION";
  node_name?: string;
  node_type?: string;
  connected_to?: string;
  placement?: string;
  [key: string]: any;
}

export interface HistoryMessage {
  role: "user" | "model";
  text: string;
  timestamp: number;
  audioUrl?: string;
}

export type SessionStatus =
  | "idle" | "requesting_permissions" | "connecting"
  | "ai_ready" | "ai_done" | "error" | "stopped";

export interface AISessionOptions {
  workspaceId:   string;
  getCanvasBlob: () => Promise<Blob | null>;
  onAddNode?:    (node: AddNodePayload) => void;
  onTranscript?: (text: string) => void;
  onStatus?:     (s: SessionStatus) => void;
  libraryItems?: readonly any[];
}

export interface AISessionHandle {
  status:       SessionStatus;
  transcript:   string;
  history:      HistoryMessage[];
  start:        () => Promise<void>;
  stop:         () => void;
  sendText:     (msg: string) => void;
  clearHistory: () => void;
  isRunning:    boolean;
  isMuted:      boolean;
  toggleMute:   () => void;
  interrupt:    () => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAISession({
  workspaceId,
  getCanvasBlob,
  onAddNode,
  onTranscript,
  onStatus,
  libraryItems,
}: AISessionOptions): AISessionHandle {

  const [status,     setStatus]     = useState<SessionStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [history,    setHistory]    = useState<HistoryMessage[]>([]);
  const [isMuted,    setIsMuted]    = useState(false);

  const isMutedRef        = useRef(false);
  const isInterruptedRef  = useRef(false);
  const { user }          = useAuth();

  const toggleMute = useCallback(() => {
    setIsMuted(prev => { isMutedRef.current = !prev; return !prev; });
  }, []);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const wsRef             = useRef<WebSocket | null>(null);
  const micCtxRef         = useRef<AudioContext | null>(null);
  const workletRef        = useRef<AudioWorkletNode | null>(null);
  const micStreamRef      = useRef<MediaStream | null>(null);
  const playCtxRef        = useRef<AudioContext | null>(null);
  const nextStartRef      = useRef(0);
  const canvasTimerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionIDRef      = useRef(0);
  const connectingRef     = useRef(false);
  const lastSizeRef       = useRef(0);
  const lastTimeRef       = useRef(0);
  const pcmBufRef         = useRef<Int16Array[]>([]);
  const fsTimerRef        = useRef<ReturnType<typeof setTimeout> | null>(null);
  const libraryItemsRef   = useRef(libraryItems);
  useEffect(() => { libraryItemsRef.current = libraryItems; }, [libraryItems]);

  // ── Load history ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const session = getCurrentSession();
        if (!session) return;
        const res = await fetch(`/api/workspaces/${workspaceId}`, {
          headers: {
            Authorization: `Bearer ${session.idToken}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.chats) setHistory(data.chats);
        }
      } catch (e) { console.warn("[AI] load history:", e); }
    })();
  }, [workspaceId, user]);

  // ── Save history (debounced 2s) ────────────────────────────────────────────
  useEffect(() => {
    if (!user || history.length === 0) return;
    if (fsTimerRef.current) clearTimeout(fsTimerRef.current);
    fsTimerRef.current = setTimeout(async () => {
      try {
        const session = getCurrentSession();
        if (!session) return;
        await fetch(`/api/workspaces/${workspaceId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.idToken}`,
          },
          body: JSON.stringify({ chats: history }),
        });
      } catch (e) { console.warn("[AI] save history:", e); }
    }, 2000);
  }, [history, workspaceId, user]);

  const clearHistory = useCallback(async () => {
    setHistory([]);
    if (user) {
      try {
        const session = getCurrentSession();
        if (!session) return;
        await fetch(`/api/workspaces/${workspaceId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.idToken}`,
          },
          body: JSON.stringify({ chats: [] }),
        });
      } catch (e) { console.warn("[AI] clear:", e); }
    }
  }, [workspaceId, user]);

  // ── Status ─────────────────────────────────────────────────────────────────
  const updateStatus = useCallback((s: SessionStatus) => {
    setStatus(s);
    onStatus?.(s);
  }, [onStatus]);

  // ── Binary frame ───────────────────────────────────────────────────────────
  const sendBinary = useCallback((tag: number, payload: Uint8Array) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const frame = new Uint8Array(1 + payload.byteLength);
    frame[0] = tag;
    frame.set(payload, 1);
    ws.send(frame);
  }, []);

  // ── Library sync ───────────────────────────────────────────────────────────
  const syncLibrary = useCallback(() => {
    const items = libraryItemsRef.current;
    if (!items?.length) return;
    const names = items
      .map((i: any) => i.name || i.elements?.find((e: any) => e.type === "text")?.text)
      .filter(Boolean) as string[];
    if (!names.length) return;
    const enc = new TextEncoder().encode(JSON.stringify(names));
    const frame = new Uint8Array(1 + enc.byteLength);
    frame[0] = TAG_LIBRARY;
    frame.set(enc, 1);
    wsRef.current?.send(frame);
    console.log(`[AI] 📚 library synced — ${names.length} items`);
  }, []);

  // ── Text ───────────────────────────────────────────────────────────────────
  const sendText = useCallback((msg: string) => {
    isInterruptedRef.current = false; // User engaged, reset interrupt
    sendBinary(TAG_TEXT, new TextEncoder().encode(msg));
    setHistory(prev => [...prev, { role: "user", text: msg, timestamp: Date.now() }]);
  }, [sendBinary]);

  // ── Interrupt ──────────────────────────────────────────────────────────────
  const interrupt = useCallback(() => {
    isInterruptedRef.current = true;
    pcmBufRef.current = []; // Clear queued chunks
    nextStartRef.current = 0;
    if (playCtxRef.current && playCtxRef.current.state === "running") {
      playCtxRef.current.suspend();
      setTimeout(() => playCtxRef.current?.resume(), 50); // Flush current playing audio
    }
  }, []);

  // ── Playback ───────────────────────────────────────────────────────────────
  const playPCM = useCallback(async (raw: ArrayBuffer) => {
    try {
      const view = new Uint8Array(raw);
      let data = view[0] === TAG_AI_AUDIO ? raw.slice(1) : raw;
      
      // Prevent 'byte length of Int16Array should be a multiple of 2' RangeError
      if (data.byteLength % 2 !== 0) {
          data = data.slice(0, data.byteLength - 1);
      }
      
      const ints = new Int16Array(data);
      if (ints.length === 0) return;
 
      pcmBufRef.current.push(new Int16Array(ints));

      const ctx = playCtxRef.current;
      if (!ctx) return;
      if (ctx.state === "suspended") await ctx.resume();

      const f32 = new Float32Array(ints.length);
      for (let i = 0; i < ints.length; i++) f32[i] = ints[i] / 32768;

      const buf = ctx.createBuffer(1, f32.length, PLAY_SAMPLE_RATE);
      buf.copyToChannel(f32, 0);

      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);

      const now = ctx.currentTime;
      if (nextStartRef.current < now - RESET_THRESHOLD_S) {
        nextStartRef.current = now + LOOKAHEAD_S;
      } else if (nextStartRef.current < now) {
        nextStartRef.current = now;
      }
      src.start(nextStartRef.current);
      nextStartRef.current += buf.duration;
    } catch (e) {
      console.warn("[AI] playPCM:", e);
    }
  }, []);

  // ── Canvas loop ────────────────────────────────────────────────────────────
  const startCanvasLoop = useCallback(() => {
    if (canvasTimerRef.current) return;
    const send = async () => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
      try {
        const blob = await getCanvasBlob();
        if (!blob) return;
        const ab  = await blob.arrayBuffer();
        const now = Date.now();
        if (ab.byteLength === lastSizeRef.current && now - lastTimeRef.current < 60_000) return;
        sendBinary(TAG_IMAGE, new Uint8Array(ab));
        lastSizeRef.current = ab.byteLength;
        lastTimeRef.current = now;
        console.log(`[AI] 🖼 canvas ${(ab.byteLength / 1024).toFixed(1)}KB`);
      } catch (e) { console.warn("[AI] canvas:", e); }
    };
    send();
    canvasTimerRef.current = setInterval(send, CANVAS_INTERVAL_MS);
  }, [getCanvasBlob, sendBinary]);

  const stopCanvasLoop = useCallback(() => {
    if (canvasTimerRef.current) {
      clearInterval(canvasTimerRef.current);
      canvasTimerRef.current = null;
    }
  }, []);

  // ── Mic ────────────────────────────────────────────────────────────────────
  const startMic = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate:       MIC_SAMPLE_RATE,
        channelCount:     1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl:  true,
      },
    });
    micStreamRef.current = stream;

    // Create AudioContext AFTER permission granted (avoids browser block)
    const ctx = new AudioContext({ sampleRate: MIC_SAMPLE_RATE });
    micCtxRef.current = ctx;

    const blob = new Blob([WORKLET_CODE], { type: "application/javascript" });
    const url  = URL.createObjectURL(blob);
    await ctx.audioWorklet.addModule(url);
    URL.revokeObjectURL(url);

    const source = ctx.createMediaStreamSource(stream);
    const worklet = new AudioWorkletNode(ctx, "pcm-processor");
    workletRef.current = worklet;

    worklet.port.onmessage = (e: MessageEvent<Int16Array>) => {
      if (isMutedRef.current) return;
      isInterruptedRef.current = false; // User started speaking, reset interrupt
      sendBinary(TAG_AUDIO, new Uint8Array(e.data.buffer));
    };

    source.connect(worklet);
    worklet.connect(ctx.destination);
    console.log("[AI] 🎙 mic started — AudioWorklet 16kHz");
  }, [sendBinary]);

  const stopMic = useCallback(() => {
    workletRef.current?.disconnect();
    workletRef.current = null;
    micStreamRef.current?.getTracks().forEach(t => t.stop());
    micStreamRef.current = null;
    micCtxRef.current?.close().catch(() => {});
    micCtxRef.current = null;
  }, []);

  // ── WAV packager (for history playback) ────────────────────────────────────
  const finalizeVoice = useCallback(() => {
    if (pcmBufRef.current.length === 0) return;
    let total = 0;
    for (const c of pcmBufRef.current) total += c.length;
    const merged = new Int16Array(total);
    let off = 0;
    for (const c of pcmBufRef.current) { merged.set(c, off); off += c.length; }

    const wav  = new ArrayBuffer(44 + merged.length * 2);
    const dv   = new DataView(wav);
    const str  = (o: number, s: string) => {
      for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i));
    };
    str(0, "RIFF"); dv.setUint32(4, 36 + merged.length * 2, true);
    str(8, "WAVE"); str(12, "fmt ");
    dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
    dv.setUint32(24, PLAY_SAMPLE_RATE, true); dv.setUint32(28, PLAY_SAMPLE_RATE * 2, true);
    dv.setUint16(32, 2, true); dv.setUint16(34, 16, true);
    str(36, "data"); dv.setUint32(40, merged.length * 2, true);
    for (let i = 0; i < merged.length; i++) dv.setInt16(44 + i * 2, merged[i], true);

    const audioUrl = URL.createObjectURL(new Blob([wav], { type: "audio/wav" }));
    setHistory(prev => {
      const next = [...prev];
      for (let i = next.length - 1; i >= 0; i--) {
        if (next[i].role === "model") {
          next[i] = { ...next[i], audioUrl };
          return next;
        }
      }
      return [...next, { role: "model", text: "", timestamp: Date.now(), audioUrl }];
    });
    pcmBufRef.current = [];
  }, []);

  // ── WebSocket ──────────────────────────────────────────────────────────────
  const openWebSocket = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      const session = getCurrentSession();
      const tokenParam = session?.idToken ? `&token=${encodeURIComponent(session.idToken)}` : "";
      const url = `${BACKEND_WS}/ws/session/${encodeURIComponent(workspaceId)}?mode=assisted${tokenParam}`;
      console.log(`[AI] 🔌 connecting → ${url}`);

      const ws = new WebSocket(url);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[AI] ✅ WS open — waiting for ai_ready");
        startCanvasLoop();
        syncLibrary();
        resolve();
      };

      ws.onmessage = async (evt) => {
        // Binary = AI voice PCM
        if (evt.data instanceof ArrayBuffer) {
          if (isInterruptedRef.current) return; // Drop audio while interrupted
          await playPCM(evt.data);
          return;
        }

        try {
          const msg = JSON.parse(evt.data as string);

          if (msg.type === "status") {
            updateStatus(msg.status as SessionStatus);
            if (msg.status === "ai_done") {
              finalizeVoice();
              pcmBufRef.current = [];
              // Clear transcript bubble after 4s
              if (transcriptTimer.current) clearTimeout(transcriptTimer.current);
              transcriptTimer.current = setTimeout(() => setTranscript(""), 4000);
            }
            return;
          }

          if (msg.type === "transcript" && msg.text) {
            const text = msg.text as string;
            const role = (msg.role ?? "model") as "model" | "user";
            if (role === "model") {
              setTranscript(text);
              onTranscript?.(text);
              // Clear stale transcript after silence
              if (transcriptTimer.current) clearTimeout(transcriptTimer.current);
              transcriptTimer.current = setTimeout(() => setTranscript(""), 6000);
            }
            setHistory(prev => {
              const last = prev[prev.length - 1];
              if (last && last.role === role && !last.audioUrl) {
                const next = [...prev];
                next[next.length - 1] = { ...last, text };
                return next;
              }
              return [...prev, { role, text, timestamp: Date.now() }];
            });
            return;
          }

          if (msg.action) {
            console.log(`[AI] 🎯 ${msg.action} ${msg.node_name ?? ""}`);
            onAddNode?.(msg as AddNodePayload);
            return;
          }

          if (msg.type === "step_narration") {
            onAddNode?.({ ...msg, action: "STEP_NARRATION" } as AddNodePayload);
            return;
          }

          if (msg.type === "error") {
            console.error("[AI] backend error:", msg.message);
            updateStatus("error");
          }
        } catch (_) { /* ping frames */ }
      };

      ws.onerror = (e) => {
        console.error("[AI] WS error", e);
        updateStatus("error");
        reject(new Error("WebSocket connection failed"));
      };

      ws.onclose = (e) => {
        console.log(`[AI] WS closed code=${e.code}`);
        if (!connectingRef.current) {
          updateStatus("stopped");
          stopMic();
          stopCanvasLoop();
        }
        wsRef.current = null;
      };
    });
  }, [
    workspaceId, updateStatus, playPCM, onAddNode, onTranscript,
    startCanvasLoop, stopMic, stopCanvasLoop, syncLibrary, finalizeVoice,
  ]);

  // ── Stop ───────────────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    sessionIDRef.current++;
    stopMic();
    stopCanvasLoop();
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)
        wsRef.current.close();
      wsRef.current = null;
    }
    playCtxRef.current?.close().catch(() => {});
    playCtxRef.current  = null;
    nextStartRef.current = 0;
    if (transcriptTimer.current) clearTimeout(transcriptTimer.current);
    setTranscript("");
    updateStatus("stopped");
    setHistory(prev => {
      if (prev.length > 0 && prev[prev.length - 1].text === "[AI Session Stopped]") return prev;
      return [...prev, { role: "model", text: "[AI Session Stopped]", timestamp: Date.now() }];
    });
  }, [stopMic, stopCanvasLoop, updateStatus]);

  // ── Start ──────────────────────────────────────────────────────────────────
  const start = useCallback(async () => {
    if (connectingRef.current) return;
    if (status === "ai_ready" || status === "connecting" || status === "requesting_permissions") return;

    const myID = sessionIDRef.current;
    connectingRef.current = true;

    try {
      updateStatus("requesting_permissions");

      // Request mic FIRST
      await startMic();
      if (myID !== sessionIDRef.current) throw new Error("Aborted");

      if (!playCtxRef.current || playCtxRef.current.state === "closed") {
        playCtxRef.current   = new AudioContext({ sampleRate: PLAY_SAMPLE_RATE });
        nextStartRef.current = 0;
      }
      if (playCtxRef.current.state === "suspended") {
        await playCtxRef.current.resume();
      }

      updateStatus("connecting");
      await openWebSocket();
      if (myID !== sessionIDRef.current) throw new Error("Aborted");

      console.log("[AI] 🚀 WS open — Gemini initialising...");

    } catch (err: any) {
      if (myID === sessionIDRef.current) {
        console.error("[AI] start failed:", err.message);
        updateStatus("error");
      }
      stopMic();
      stopCanvasLoop();
      wsRef.current?.close();
      wsRef.current = null;
      playCtxRef.current?.close().catch(() => {});
      playCtxRef.current = null;
    } finally {
      connectingRef.current = false;
    }
  }, [status, updateStatus, openWebSocket, startMic, stopMic, stopCanvasLoop]);

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
    interrupt,
  }), [status, transcript, history, start, stop, sendText, clearHistory, isMuted, toggleMute, interrupt]);
}