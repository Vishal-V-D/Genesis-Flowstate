"use client";

/**
 * NewWorkspaceModal.tsx
 *
 * Modal shown when the user clicks "New Workspace".
 */

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { X, User, Sparkles, Mic, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getCurrentSession } from "@/lib/aws-client";

interface Props {
    onClose: () => void;
}

export default function NewWorkspaceModal({ onClose }: Props) {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState("");

    const generateProfessionalId = () => {
        const chars = '0123456789abcdef';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    const createWorkspaceDoc = async (id: string, mode: string) => {
        if (!user) return;
        const session = getCurrentSession();
        if (!session) return;

        try {
            const res = await fetch("/api/workspaces", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.idToken}`,
                },
                body: JSON.stringify({
                    workspaceId: id,
                    title: title.trim() || "Untitled Architecture",
                    subtitle: mode === "assisted" ? "AI Assisted Session" : "Personal Workspace",
                }),
            });
            if (!res.ok) {
                console.error("Failed to create workspace in DB");
            }
        } catch (e) {
            console.error("Error creating workspace:", e);
        }
    };

    // Personal mode — just open the canvas
    const openPersonal = async () => {
        setLoading(true);
        const id = generateProfessionalId();
        await createWorkspaceDoc(id, "personal");
        router.push(`/workspace/${id}?mode=personal`);
    };

    // Assisted mode — open canvas with AI session flag
    const openAssisted = async () => {
        setLoading(true);
        const id = generateProfessionalId();
        await createWorkspaceDoc(id, "assisted");
        router.push(`/workspace/${id}?mode=assisted`);
    };

    return (
        /* Backdrop */
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
            onClick={onClose}
        >
            {/* Panel */}
            <div
                className="relative w-full max-w-lg mx-4 bg-white rounded-3xl shadow-2xl p-8 border border-gray-100"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                    <X className="w-4 h-4 text-gray-500" />
                </button>

                {/* Header */}
                <div className="mb-6">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-1">
                        New Workspace
                    </h2>
                    <p className="text-sm text-gray-500">
                        Choose how you want to work on this architecture.
                    </p>
                </div>

                {/* Title Input */}
                <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Workspace Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Payment Gateway Architecture"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#536ea1]/30 focus:border-[#536ea1] transition-all"
                        disabled={loading}
                    />
                </div>

                {/* Two mode cards */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Personal mode */}
                    <button
                        onClick={openPersonal}
                        disabled={loading}
                        className="group flex flex-col items-start p-6 rounded-2xl border-2 border-gray-200 hover:border-gray-400 bg-white hover:bg-gray-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="w-11 h-11 rounded-2xl bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center mb-4 transition-colors">
                            <User className="w-5 h-5 text-gray-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 text-base mb-1">
                            Personal
                        </h3>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            Blank canvas. Draw your architecture freely without AI.
                        </p>
                    </button>

                    {/* AI-Assisted mode */}
                    <button
                        onClick={openAssisted}
                        disabled={loading}
                        className="group flex flex-col items-start p-6 rounded-2xl border-2 border-[#536ea1] bg-[#536ea1]/5 hover:bg-[#536ea1]/10 transition-all text-left relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-[#536ea1]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                        <div className="w-11 h-11 rounded-2xl bg-[#536ea1] flex items-center justify-center mb-4 shadow-md">
                            {loading ? (
                                <Loader2 className="w-5 h-5 text-white animate-spin" />
                            ) : (
                                <Sparkles className="w-5 h-5 text-white" />
                            )}
                        </div>
                        <h3 className="font-semibold text-[#3a5080] text-base mb-1">
                            With AI Assistance
                        </h3>
                        <p className="text-xs text-[#536ea1] leading-relaxed mb-3">
                            FlowState AI joins as your architect. Speak naturally, it draws.
                        </p>

                        <div className="flex items-center gap-2 mt-auto">
                            <span className="flex items-center gap-1 text-[10px] font-medium text-[#536ea1]/70">
                                <Mic className="w-3 h-3" /> Microphone only
                            </span>
                        </div>
                    </button>
                </div>

                <p className="mt-6 text-xs text-gray-400 text-center">
                    AI Assistance only needs your microphone — no screen sharing required.
                </p>
            </div>
        </div>
    );
}
