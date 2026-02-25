"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, Copy, Check, Globe, Lock, ShieldCheck, Users, ChevronDown, Link2, Pencil, Eye, Zap } from "lucide-react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, onValue } from "firebase/database";
import { db, rtdb } from "@/lib/firebase";

interface InviteModalProps {
    isOpen: boolean;
    onClose: () => void;
    workspaceId: string;
    workspaceTitle?: string;
}

function generateToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length: 24 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function InviteModal({ isOpen, onClose, workspaceId, workspaceTitle }: InviteModalProps) {
    const [collaborators, setCollaborators] = useState<any[]>([]);
    const [shareMode, setShareMode] = useState<'editor' | 'viewer'>('editor');
    const [isUpdatingShareMode, setIsUpdatingShareMode] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // Copy state per link type
    const [copied, setCopied] = useState<'default' | 'editor' | 'viewer' | null>(null);

    // Stored tokens
    const [editToken, setEditToken] = useState<string | null>(null);
    const [viewToken, setViewToken] = useState<string | null>(null);
    const [generatingToken, setGeneratingToken] = useState<'editor' | 'viewer' | null>(null);

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const defaultLink = `${origin}/workspace/${workspaceId}`;
    const editorLink = editToken ? `${origin}/workspace/${workspaceId}?token=${editToken}` : null;
    const viewerLink = viewToken ? `${origin}/workspace/${workspaceId}?token=${viewToken}` : null;

    const copyLink = async (link: string, type: 'default' | 'editor' | 'viewer') => {
        try {
            await navigator.clipboard.writeText(link);
            setCopied(type);
            setTimeout(() => setCopied(null), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    // Load workspace settings + tokens on open
    useEffect(() => {
        if (!isOpen || !workspaceId) return;

        const fetchSettings = async () => {
            try {
                const snap = await getDoc(doc(db, "workspaces", workspaceId));
                if (snap.exists()) {
                    const data = snap.data();
                    if (data.shareMode) setShareMode(data.shareMode);
                    const editTokens: string[] = data.editTokens || [];
                    const viewTokens: string[] = data.viewTokens || [];
                    if (editTokens.length > 0) setEditToken(editTokens[editTokens.length - 1]);
                    if (viewTokens.length > 0) setViewToken(viewTokens[viewTokens.length - 1]);
                }
            } catch (err) {
                console.warn("Failed to fetch workspace settings", err);
            }
        };
        fetchSettings();

        if (!rtdb) return;
        const collaboratorsRef = ref(rtdb, `rooms/${workspaceId}/collaborators`);
        const unsub = onValue(collaboratorsRef, (snapshot) => {
            if (snapshot.exists()) {
                setCollaborators(Object.values(snapshot.val()));
            } else {
                setCollaborators([]);
            }
        });
        return () => unsub();
    }, [isOpen, workspaceId]);

    const handleShareModeChange = async (mode: 'editor' | 'viewer') => {
        if (mode === shareMode) { setDropdownOpen(false); return; }
        setIsUpdatingShareMode(true);
        try {
            await updateDoc(doc(db, "workspaces", workspaceId), { shareMode: mode });
            setShareMode(mode);
        } catch (err) {
            console.error("Failed to update share mode:", err);
        } finally {
            setIsUpdatingShareMode(false);
            setDropdownOpen(false);
        }
    };

    const handleGenerateToken = async (type: 'editor' | 'viewer') => {
        setGeneratingToken(type);
        try {
            const token = generateToken();
            const field = type === 'editor' ? 'editTokens' : 'viewTokens';

            // Read existing tokens and append
            const snap = await getDoc(doc(db, "workspaces", workspaceId));
            const existing: string[] = snap.exists() ? (snap.data()[field] || []) : [];

            await updateDoc(doc(db, "workspaces", workspaceId), {
                [field]: [...existing.slice(-4), token], // Keep last 5 tokens max
            });

            if (type === 'editor') setEditToken(token);
            else setViewToken(token);
        } catch (err) {
            console.error("Failed to generate token:", err);
        } finally {
            setGeneratingToken(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-[3px]" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-white w-full max-w-[500px] rounded-[28px] shadow-2xl overflow-hidden" style={{ animation: "modalIn 0.2s cubic-bezier(0.16,1,0.3,1)" }}>

                {/* Header */}
                <div className="p-7 pb-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-[22px] font-semibold text-gray-900 tracking-tight">
                                Share workspace
                            </h3>
                            <p className="text-sm text-gray-400 mt-0.5 font-medium truncate max-w-[340px]">
                                "{workspaceTitle || "Untitled Architecture"}"
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 mt-0.5">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className="px-7 pb-7 space-y-5">

                    {/* General access row */}
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                                <Globe size={15} className="text-blue-500" />
                            </div>
                            <div>
                                <p className="text-[13px] font-semibold text-gray-800">General access</p>
                                <p className="text-[11px] text-gray-400">Anyone with the link</p>
                            </div>
                        </div>
                        <div className="relative">
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                disabled={isUpdatingShareMode}
                                className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-[13px] font-semibold text-gray-700 disabled:opacity-50"
                            >
                                {isUpdatingShareMode ? "Saving…" : shareMode === 'editor' ? "Can edit" : "Can view"}
                                <ChevronDown size={13} className={`text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {dropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                                    <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-20 py-1.5">
                                        {(['editor', 'viewer'] as const).map(m => (
                                            <button
                                                key={m}
                                                onClick={() => handleShareModeChange(m)}
                                                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors ${shareMode === m ? 'text-blue-600 bg-blue-50/60' : 'text-gray-700 hover:bg-gray-50'}`}
                                            >
                                                {m === 'editor' ? <Pencil size={13} /> : <Eye size={13} />}
                                                <span className="font-medium">{m === 'editor' ? 'Can edit' : 'Can view'}</span>
                                                {shareMode === m && <Check size={12} className="ml-auto" />}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Default share link */}
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2 px-0.5">Default link</p>
                        <div className="flex gap-2 items-center bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                            <Link2 size={14} className="text-gray-400 flex-shrink-0" />
                            <span className="flex-1 text-[13px] text-gray-600 truncate font-medium">{defaultLink}</span>
                            <button
                                onClick={() => copyLink(defaultLink, 'default')}
                                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${copied === 'default' ? 'bg-green-500 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 shadow-sm'}`}
                            >
                                {copied === 'default' ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                            </button>
                        </div>
                    </div>

                    {/* Permission-specific links */}
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2.5 px-0.5">Signed links</p>
                        <div className="space-y-2.5">
                            {/* Editor link */}
                            <div className="rounded-2xl border border-gray-100 overflow-hidden">
                                <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-50/50 to-transparent">
                                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                        <Pencil size={13} className="text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-semibold text-gray-800">Editor link</p>
                                        <p className="text-[11px] text-gray-400">Recipients can draw and edit</p>
                                    </div>
                                    {editorLink ? (
                                        <button
                                            onClick={() => copyLink(editorLink, 'editor')}
                                            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${copied === 'editor' ? 'bg-green-500 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 shadow-sm'}`}
                                        >
                                            {copied === 'editor' ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleGenerateToken('editor')}
                                            disabled={generatingToken === 'editor'}
                                            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-all disabled:opacity-60 shadow-sm"
                                        >
                                            <Zap size={12} />
                                            {generatingToken === 'editor' ? 'Generating…' : 'Generate'}
                                        </button>
                                    )}
                                </div>
                                {editorLink && (
                                    <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/50 flex items-center gap-2">
                                        <span className="flex-1 text-[11px] text-gray-400 truncate font-mono">{editorLink}</span>
                                        <button
                                            onClick={() => handleGenerateToken('editor')}
                                            className="text-[11px] text-blue-500 hover:text-blue-600 font-semibold flex-shrink-0"
                                        >
                                            Regenerate
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Viewer link */}
                            <div className="rounded-2xl border border-gray-100 overflow-hidden">
                                <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-purple-50/50 to-transparent">
                                    <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                        <Eye size={13} className="text-purple-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-semibold text-gray-800">Viewer link</p>
                                        <p className="text-[11px] text-gray-400">Recipients can only view</p>
                                    </div>
                                    {viewerLink ? (
                                        <button
                                            onClick={() => copyLink(viewerLink, 'viewer')}
                                            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${copied === 'viewer' ? 'bg-green-500 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 shadow-sm'}`}
                                        >
                                            {copied === 'viewer' ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleGenerateToken('viewer')}
                                            disabled={generatingToken === 'viewer'}
                                            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-purple-500 text-white hover:bg-purple-600 transition-all disabled:opacity-60 shadow-sm"
                                        >
                                            <Zap size={12} />
                                            {generatingToken === 'viewer' ? 'Generating…' : 'Generate'}
                                        </button>
                                    )}
                                </div>
                                {viewerLink && (
                                    <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/50 flex items-center gap-2">
                                        <span className="flex-1 text-[11px] text-gray-400 truncate font-mono">{viewerLink}</span>
                                        <button
                                            onClick={() => handleGenerateToken('viewer')}
                                            className="text-[11px] text-purple-500 hover:text-purple-600 font-semibold flex-shrink-0"
                                        >
                                            Regenerate
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Active collaborators */}
                    {collaborators.length > 0 && (
                        <div>
                            <div className="flex items-center justify-between mb-2.5 px-0.5">
                                <div className="flex items-center gap-2">
                                    <Users size={13} className="text-gray-400" />
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Active now</p>
                                </div>
                                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                    {collaborators.length} online
                                </span>
                            </div>
                            <div className="space-y-1.5 max-h-[130px] overflow-y-auto pr-1">
                                {collaborators.map((c: any) => (
                                    <div key={c.id || c.username} className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors">
                                        <div
                                            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-sm flex-shrink-0"
                                            style={{ backgroundColor: c.color?.background || '#3b82f6' }}
                                        >
                                            {(c.username || '?').charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-[13px] font-semibold text-gray-800 flex-1 truncate">{c.username || 'Anonymous'}</span>
                                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-7 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-gray-400">
                        <ShieldCheck size={13} className="text-green-500" />
                        <span className="text-[11px] font-medium">FlowState Workspace Security</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-full text-sm font-semibold text-[#1a73e8] hover:bg-blue-50 transition-all active:scale-95"
                    >
                        Done
                    </button>
                </div>
            </div>

            <style jsx>{`
                @keyframes modalIn {
                    from { transform: scale(0.94) translateY(8px); opacity: 0; }
                    to { transform: scale(1) translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
