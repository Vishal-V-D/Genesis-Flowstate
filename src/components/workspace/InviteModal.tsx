"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, Copy, Check, Globe, Lock, ShieldCheck, Users, ChevronDown, Link2, Pencil, Eye, Zap } from "lucide-react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, onValue } from "firebase/database";
import { db, rtdb } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";

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
    const { user } = useAuth();
    const [collaborators, setCollaborators] = useState<any[]>([]);

    // UI state for the unified share section
    const [accessMode, setAccessMode] = useState<'restricted' | 'public'>('public');
    const [selectedRole, setSelectedRole] = useState<'editor' | 'viewer'>('editor');
    const [accessDropdownOpen, setAccessDropdownOpen] = useState(false);
    const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

    // Copy state
    const [copied, setCopied] = useState(false);

    // Email Invite state
    const [inviteEmail, setInviteEmail] = useState('');
    const [isSendingInvite, setIsSendingInvite] = useState(false);
    const [isInviteSent, setIsInviteSent] = useState(false);

    // Stored tokens
    const [editToken, setEditToken] = useState<string | null>(null);
    const [viewToken, setViewToken] = useState<string | null>(null);
    const [generatingToken, setGeneratingToken] = useState<boolean>(false);

    const origin = typeof window !== "undefined" ? window.location.origin : "";

    // Active link based on selected role
    const activeToken = selectedRole === 'editor' ? editToken : viewToken;
    const publicLink = activeToken ? `${origin}/workspace/${workspaceId}?token=${activeToken}` : null;
    const restrictedLink = `${origin}/workspace/${workspaceId}`;

    const activeLink = accessMode === 'public' ? publicLink : restrictedLink;

    const handleSendEmailInvite = async () => {
        if (!inviteEmail.trim()) return;
        setIsSendingInvite(true);

        try {
            let token = activeToken;
            if (!token) {
                token = generateToken();
                const field = selectedRole === 'editor' ? 'editTokens' : 'viewTokens';
                await updateDoc(doc(db, "workspaces", workspaceId), {
                    [field]: [token],
                });
                if (selectedRole === 'editor') setEditToken(token);
                else setViewToken(token);
            }
            const linkToSend = `${origin}/workspace/${workspaceId}?token=${token}`;

            const res = await fetch('/api/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: inviteEmail,
                    link: linkToSend,
                    inviter: user?.firstName || user?.email || 'Someone',
                    workspaceTitle: workspaceTitle || 'Untitled document',
                    role: selectedRole,
                })
            });

            if (res.ok) {
                setInviteEmail('');
                setIsInviteSent(true);
                setTimeout(() => setIsInviteSent(false), 2500);
            } else {
                console.error("Failed to send invite");
            }
        } catch (error) {
            console.error("Error sending invite:", error);
        } finally {
            setIsSendingInvite(false);
        }
    };

    const copyLink = async () => {
        let linkToCopy = activeLink;

        // Auto-generate if missing for public link
        if (accessMode === 'public' && !activeToken) {
            const token = generateToken();
            const field = selectedRole === 'editor' ? 'editTokens' : 'viewTokens';
            await updateDoc(doc(db, "workspaces", workspaceId), {
                [field]: [token],
            });
            if (selectedRole === 'editor') setEditToken(token);
            else setViewToken(token);
            linkToCopy = `${origin}/workspace/${workspaceId}?token=${token}`;
        }

        if (!linkToCopy) return;
        try {
            await navigator.clipboard.writeText(linkToCopy);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
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

    const handleGenerateToken = async () => {
        setGeneratingToken(true);
        try {
            const token = generateToken();
            const field = selectedRole === 'editor' ? 'editTokens' : 'viewTokens';

            const snap = await getDoc(doc(db, "workspaces", workspaceId));
            const existing: string[] = snap.exists() ? (snap.data()[field] || []) : [];

            await updateDoc(doc(db, "workspaces", workspaceId), {
                [field]: [...existing.slice(-4), token], // Keep last 5 tokens max
            });

            if (selectedRole === 'editor') setEditToken(token);
            else setViewToken(token);
        } catch (err) {
            console.error("Failed to generate token:", err);
        } finally {
            setGeneratingToken(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-white w-full max-w-[540px] rounded-2xl shadow-2xl overflow-hidden font-sans" style={{ animation: "modalIn 0.2s cubic-bezier(0.16,1,0.3,1)" }}>

                {/* Header */}
                <div className="px-6 pt-5 pb-4">
                    <div className="flex items-start justify-between">
                        <h2 className="text-[22px] font-normal text-gray-800">
                            Share '{workspaceTitle || "Untitled document"}'
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="px-6 pb-6">
                    {/* Real Email Input */}
                    <div className="relative w-full mb-6">
                        <input
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="Add people, groups, spaces and calendar events"
                            className="w-full border border-gray-300 rounded-[4px] px-3 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-500"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSendEmailInvite();
                            }}
                        />
                        {(inviteEmail.trim() || isInviteSent) && (
                            <button
                                onClick={handleSendEmailInvite}
                                disabled={isSendingInvite || isInviteSent}
                                className={`absolute right-2 top-1.5 bottom-1.5 px-4 text-white text-sm font-medium rounded transition-colors disabled:opacity-70 flex items-center gap-1.5 ${isInviteSent ? 'bg-green-600 hover:bg-green-700' : 'bg-[#0b57d0] hover:bg-[#0a4fc0]'}`}
                            >
                                {isSendingInvite ? 'Sending...' : isInviteSent ? <><Check size={16} /> Sent</> : 'Send'}
                            </button>
                        )}
                    </div>

                    {/* People with access */}
                    <div className="mb-6">
                        <h3 className="text-[15px] font-medium text-gray-800 mb-3">People with access</h3>

                        {/* Owner Row */}
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-[#4285F4] text-white flex items-center justify-center font-medium text-lg">
                                    {(user?.firstName || user?.email || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[14px] font-medium text-gray-900">{user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'You'} (you)</span>
                                    <span className="text-[12px] text-gray-500">{user?.email || 'user@example.com'}</span>
                                </div>
                            </div>
                            <span className="text-[13px] text-gray-500 mr-2">Owner</span>
                        </div>
                        {/* Internal Collaborators (Realtime) */}
                        <div className="space-y-1 overflow-y-auto max-h-[140px]">
                            {collaborators
                                .filter((c: any) => c.id !== user?.uid)
                                .map((c: any) => (
                                    <div key={c.id || c.username} className="flex items-center justify-between hover:bg-gray-50 p-1.5 -ml-1.5 rounded-lg transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white"
                                                style={{ backgroundColor: c.color?.background || '#d946ef' }}
                                            >
                                                {(c.username || '?').charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[14px] font-medium text-gray-900">{c.username || 'Anonymous'}</span>
                                                <span className="text-[12px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                                    Active now
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-[13px] text-gray-500 mr-2 capitalize">{selectedRole}</span>
                                    </div>
                                ))}
                        </div>
                    </div>

                    {/* General Access Google Docs Style */}
                    <div>
                        <h3 className="text-[15px] font-medium text-gray-800 mb-3">General access</h3>
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                {accessMode === 'restricted' ? <Lock size={20} className="text-gray-700" /> : <Globe size={20} className="text-green-700" />}
                            </div>
                            <div className="flex-1 mt-0.5">
                                <div className="flex items-center gap-3">
                                    {/* Access Mode Dropdown */}
                                    <div className="relative">
                                        <button
                                            onClick={() => { setAccessDropdownOpen(!accessDropdownOpen); setRoleDropdownOpen(false); }}
                                            className="flex items-center gap-1.5 text-[14px] font-medium text-gray-900 hover:bg-gray-100 px-2 py-1 -ml-2 rounded transition-colors"
                                        >
                                            {accessMode === 'restricted' ? 'Restricted' : 'Anyone with the link'}
                                            <ChevronDown size={16} className="text-gray-600" />
                                        </button>

                                        {accessDropdownOpen && (
                                            <>
                                                <div className="fixed inset-0 z-10" onClick={() => setAccessDropdownOpen(false)} />
                                                <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded shadow-[0_2px_10px_rgba(0,0,0,0.1)] z-20 py-1">
                                                    <button onClick={() => { setAccessMode('restricted'); setAccessDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                                                        <Lock size={14} className="text-gray-500" /> Restricted
                                                    </button>
                                                    <button onClick={() => { setAccessMode('public'); setAccessDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                                                        <Globe size={14} className="text-gray-500" /> Anyone with the link
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Role Dropdown */}
                                    {accessMode === 'public' && (
                                        <div className="relative ml-auto">
                                            <button
                                                onClick={() => { setRoleDropdownOpen(!roleDropdownOpen); setAccessDropdownOpen(false); }}
                                                className="flex items-center gap-1.5 text-[13px] text-gray-600 bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded transition-colors"
                                            >
                                                {selectedRole === 'editor' ? 'Editor' : 'Viewer'}
                                                <ChevronDown size={14} />
                                            </button>

                                            {roleDropdownOpen && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setRoleDropdownOpen(false)} />
                                                    <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded shadow-[0_2px_10px_rgba(0,0,0,0.1)] z-20 py-1">
                                                        <button onClick={() => { setSelectedRole('viewer'); setRoleDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-100 flex items-center justify-between">
                                                            Viewer {selectedRole === 'viewer' && <Check size={14} />}
                                                        </button>
                                                        <button onClick={() => { setSelectedRole('editor'); setRoleDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-100 flex items-center justify-between">
                                                            Editor {selectedRole === 'editor' && <Check size={14} />}
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <p className="text-[12px] text-gray-500 mt-1">
                                    {accessMode === 'restricted'
                                        ? 'Only people with access can open with the link'
                                        : `Anyone on the internet with the link can ${selectedRole === 'editor' ? 'edit' : 'view'}`
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Buttons inline with Google Docs */}
                <div className="px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={copyLink}
                        className="flex items-center gap-2 px-5 py-2 rounded-full border border-gray-300 text-[14px] font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                        {copied ? <Check size={18} /> : <Link2 size={18} />}
                        {copied ? 'Link copied' : 'Copy link'}
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-full text-[14px] font-medium bg-[#0b57d0] text-white hover:bg-[#0a4fc0] transition-colors"
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
