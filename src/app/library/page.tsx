"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Plus, Download, Search, ArrowLeft, LogOut, Settings, MoreVertical, Trash2, Info, ExternalLink, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import NewWorkspaceModal from '@/components/workspace/NewWorkspaceModal';
import InviteModal from '@/components/workspace/InviteModal';
import { useAuth } from '@/hooks/useAuth';
import { getCurrentSession } from '@/lib/aws-client';
import LibraryLoading from './loading';

// Colors for the workspaces
const workspaceColors = [
    { color: "#6b85b8", accent: "#4a6b9c" },
    { color: "#7a8eb0", accent: "#5a7090" },
    { color: "#8b7da8", accent: "#6b5d88" },
    { color: "#6b97b0", accent: "#4a77a0" },
];

interface Workspace {
    id: string;
    title: string;
    subtitle: string;
    lastEdited: string;
    nodes: number;
    color: string;
    accent: string;
    role: string;
}

// SVG mini-diagrammatic previews unique per card
const DiagramPreviews = [
    // Preview 1 - floor plan-like with edges
    (
        <svg viewBox="0 0 220 140" className="w-full h-full opacity-40">
            <rect x="20" y="20" width="80" height="55" rx="8" fill="none" stroke="#9ca3af" strokeWidth="1.5" />
            <rect x="120" y="20" width="80" height="55" rx="8" fill="none" stroke="#9ca3af" strokeWidth="1.5" />
            <rect x="60" y="90" width="100" height="35" rx="8" fill="none" stroke="#9ca3af" strokeWidth="1.5" />
            <line x1="100" y1="47" x2="120" y2="47" stroke="#9ca3af" strokeWidth="1.5" />
            <line x1="110" y1="75" x2="110" y2="90" stroke="#9ca3af" strokeWidth="1.5" />
            <circle cx="60" cy="47" r="4" fill="#6b85b8" />
            <circle cx="160" cy="47" r="4" fill="#6b85b8" />
            <circle cx="110" cy="107" r="4" fill="#6b85b8" />
        </svg>
    ),
    // Preview 2 - services mesh
    (
        <svg viewBox="0 0 220 140" className="w-full h-full opacity-40">
            <circle cx="110" cy="70" r="18" fill="none" stroke="#9ca3af" strokeWidth="1.5" />
            <circle cx="40" cy="35" r="12" fill="none" stroke="#9ca3af" strokeWidth="1.5" />
            <circle cx="185" cy="35" r="12" fill="none" stroke="#9ca3af" strokeWidth="1.5" />
            <circle cx="40" cy="105" r="12" fill="none" stroke="#9ca3af" strokeWidth="1.5" />
            <circle cx="185" cy="105" r="12" fill="none" stroke="#9ca3af" strokeWidth="1.5" />
            <line x1="60" y1="45" x2="95" y2="60" stroke="#9ca3af" strokeWidth="1" />
            <line x1="165" y1="45" x2="130" y2="58" stroke="#9ca3af" strokeWidth="1" />
            <line x1="58" y1="98" x2="95" y2="80" stroke="#9ca3af" strokeWidth="1" />
            <line x1="168" y1="97" x2="130" y2="80" stroke="#9ca3af" strokeWidth="1" />
            <circle cx="110" cy="70" r="5" fill="#7a8eb0" />
        </svg>
    ),
    // Preview 3 - entity relationship
    (
        <svg viewBox="0 0 220 140" className="w-full h-full opacity-40">
            <rect x="10" y="45" width="60" height="50" rx="6" fill="none" stroke="#9ca3af" strokeWidth="1.5" />
            <rect x="80" y="10" width="60" height="50" rx="6" fill="none" stroke="#9ca3af" strokeWidth="1.5" />
            <rect x="80" y="80" width="60" height="50" rx="6" fill="none" stroke="#9ca3af" strokeWidth="1.5" />
            <rect x="155" y="45" width="60" height="50" rx="6" fill="none" stroke="#9ca3af" strokeWidth="1.5" />
            <line x1="70" y1="70" x2="80" y2="35" stroke="#9ca3af" strokeWidth="1.5" />
            <line x1="70" y1="70" x2="80" y2="105" stroke="#9ca3af" strokeWidth="1.5" />
            <line x1="140" y1="35" x2="155" y2="70" stroke="#9ca3af" strokeWidth="1.5" />
            <line x1="140" y1="105" x2="155" y2="70" stroke="#9ca3af" strokeWidth="1.5" />
            <circle cx="40" cy="70" r="3" fill="#8b7da8" />
            <circle cx="110" cy="35" r="3" fill="#8b7da8" />
            <circle cx="110" cy="105" r="3" fill="#8b7da8" />
            <circle cx="185" cy="70" r="3" fill="#8b7da8" />
        </svg>
    ),
    // Preview 4 - service boundaries
    (
        <svg viewBox="0 0 220 140" className="w-full h-full opacity-40">
            <rect x="10" y="10" width="90" height="55" rx="12" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeDasharray="5,3" />
            <rect x="120" y="10" width="90" height="55" rx="12" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeDasharray="5,3" />
            <rect x="65" y="80" width="90" height="50" rx="12" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeDasharray="5,3" />
            <rect x="25" y="25" width="30" height="20" rx="4" fill="#6b97b0" opacity="0.3" />
            <rect x="65" y="25" width="30" height="20" rx="4" fill="#6b97b0" opacity="0.3" />
            <rect x="135" y="25" width="30" height="20" rx="4" fill="#6b97b0" opacity="0.3" />
            <rect x="80" y="95" width="60" height="20" rx="4" fill="#6b97b0" opacity="0.3" />
            <line x1="110" y1="65" x2="110" y2="80" stroke="#9ca3af" strokeWidth="1.5" />
        </svg>
    ),
];

// --- Client-side Memory Cache ---
let globalCachedWorkspaces: Workspace[] | null = null;

export default function LibraryPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [workspaces, setWorkspaces] = useState<Workspace[]>(globalCachedWorkspaces || []);
    const [fetching, setFetching] = useState(globalCachedWorkspaces === null);
    const [showModal, setShowModal] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, workspaceId: string, title: string } | null>(null);
    const [propertiesModal, setPropertiesModal] = useState<Workspace | null>(null);
    const [shareModal, setShareModal] = useState<Workspace | null>(null);
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
    const profileMenuRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Require authentication for the library page
    const { user, loading, logout } = useAuth(true);

    // Close profile menu on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const fetchWorkspaces = async () => {
        if (!user) return;
        const session = getCurrentSession();
        if (!session) return;

        try {
            const res = await fetch("/api/workspaces", {
                headers: {
                    Authorization: `Bearer ${session.idToken}`,
                },
            });

            if (res.ok) {
                const data = await res.json();
                const loaded: Workspace[] = data.map((item: any) => {
                    let nodeCount = 0;
                    if (item.elements && item.elements !== "undefined") {
                        try {
                            const els = JSON.parse(item.elements);
                            nodeCount = Array.isArray(els) ? els.length : 0;
                        } catch (_) { }
                    }

                    const colorIndex = item.workspaceId.charCodeAt(0) % workspaceColors.length;
                    const scheme = workspaceColors[colorIndex];
                    const lastEdited = item.updatedAt || item.createdAt;

                    return {
                        id: item.workspaceId,
                        title: item.title || `Workspace ${item.workspaceId.substring(0, 4)}`,
                        subtitle: item.subtitle || (item.userId !== user.uid ? `Shared · editor` : "Personal Workspace"),
                        lastEdited: lastEdited ? new Date(lastEdited).toLocaleDateString() : "–",
                        nodes: nodeCount,
                        color: scheme.color,
                        accent: scheme.accent,
                        role: item.userRole || (item.userId === user.uid ? "owner" : "editor"),
                    };
                });

                setWorkspaces(loaded);
                globalCachedWorkspaces = loaded;
            }
        } catch (err) {
            console.error("Error fetching workspaces:", err);
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchWorkspaces();
        }
    }, [user]);

    const handleSignOut = () => {
        logout();
    };

    const handleDeleteWorkspace = async () => {
        if (!deleteModal || !user) return;
        const session = getCurrentSession();
        if (!session) return;

        try {
            const res = await fetch(`/api/workspaces/${deleteModal.workspaceId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${session.idToken}`,
                },
            });

            if (res.ok) {
                const newWorkspaces = workspaces.filter(w => w.id !== deleteModal.workspaceId);
                setWorkspaces(newWorkspaces);
                globalCachedWorkspaces = newWorkspaces;
                setDeleteModal(null);
            } else {
                alert("Failed to delete workspace. You must be the owner.");
            }
        } catch (err) {
            console.error("Error deleting workspace:", err);
        }
    };

    const handleDownloadWorkspace = async (e: React.MouseEvent, workspaceId: string, title: string) => {
        e.stopPropagation();
        e.preventDefault();
        const session = getCurrentSession();
        if (!session) return;

        try {
            const res = await fetch(`/api/workspaces/${workspaceId}`, {
                headers: {
                    Authorization: `Bearer ${session.idToken}`,
                },
            });

            if (!res.ok) throw new Error("Failed to load workspace data");
            const data = await res.json();

            let elements: any[] = [];
            let appState: any = {};
            let files: any = {};

            if (data.elements && data.elements !== "undefined") {
                try { elements = JSON.parse(data.elements); } catch (e) { }
            }
            if (data.appState && data.appState !== "undefined") {
                try { appState = JSON.parse(data.appState); } catch (e) { }
            }
            if (data.files && data.files !== "undefined") {
                try { files = JSON.parse(data.files); } catch (e) { }
            }

            const excalidrawState = {
                type: "excalidraw",
                version: 2,
                source: process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : "http://localhost:3000"),
                elements,
                appState: {
                    viewBackgroundColor: appState.viewBackgroundColor || "#ffffff",
                    gridSize: appState.gridSize || null,
                },
                files
            };

            const blob = new Blob([JSON.stringify(excalidrawState, null, 2)], {
                type: "application/vnd.excalidraw+json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${title.replace(/\s+/g, "_") || "workspace"}.excalidraw`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error downloading workspace:", error);
            alert("Failed to download workspace.");
        }
    };

    if (loading || !user || fetching) return <LibraryLoading />;

    const filtered = workspaces.filter(w =>
        w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreateNew = () => {
        const newId = Math.random().toString(36).substring(7);
        router.push(`/workspace/${newId}`);
    };

    const handleOpenWorkspace = (id: string | number) => {
        router.push(`/workspace/${id}`);
    };

    return (
        <main className="relative z-10 w-full min-h-screen overflow-x-hidden">
            {/* Top navigation bar */}
            <header className="absolute top-0 w-full px-8 py-6 flex items-center justify-between z-50">
                <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Back to Home</span>
                </Link>
                <div className="flex items-center gap-2">
                    <span className="text-gray-900 font-semibold ml-1">FlowState</span>
                </div>

                <div className="relative flex items-center gap-4">
                    <button
                        onClick={handleCreateNew}
                        className="bg-google-blue hover:bg-blue-600 text-white rounded-full p-3 shadow-md hover:shadow-lg transition-all flex items-center justify-center"
                        title="New Architecture Design"
                    >
                        <Plus className="w-5 h-5" />
                    </button>

                    <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="w-10 h-10 rounded-full bg-google-blue/10 flex items-center justify-center border border-google-blue/20 hover:bg-google-blue/20 transition-all cursor-pointer overflow-hidden"
                    >
                        <span className="text-google-blue font-semibold uppercase text-sm">
                            {user.firstName?.charAt(0) || user.email.charAt(0)}
                        </span>
                    </button>

                    {showProfileMenu && (
                        <div
                            ref={profileMenuRef}
                            className="absolute right-0 top-12 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-3 z-50 flex flex-col"
                        >
                            <div className="px-5 py-3 border-b border-gray-100 flex flex-col mb-2">
                                <span className="font-semibold text-gray-900 truncate">
                                    {user.firstName} {user.lastName}
                                </span>
                                <span className="text-xs text-gray-500 truncate">{user.email}</span>
                            </div>

                            <button
                                onClick={() => router.push('/onboarding')}
                                className="w-full text-left px-5 py-2.5 hover:bg-gray-50 text-sm text-gray-700 flex items-center gap-3 transition-colors"
                            >
                                <Settings className="w-4 h-4 text-gray-400" />
                                <span>Preferences</span>
                            </button>

                            <button
                                onClick={handleSignOut}
                                className="w-full text-left px-5 py-2.5 hover:bg-red-50 text-sm text-red-600 flex items-center gap-3 transition-colors border-t border-gray-100 mt-2"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Sign out</span>
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Main content grid */}
            <div className="max-w-7xl mx-auto px-8 pt-32 pb-24 min-h-screen flex flex-col justify-start">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl font-normal text-gray-900 tracking-tight mb-2">Design Library</h1>
                        <p className="text-gray-500 text-sm">Manage your collaborative canvas diagrams</p>
                    </div>

                    {/* Premium Search bar */}
                    <div className="relative max-w-md w-full md:w-80">
                        <input
                            type="text"
                            placeholder="Search workspace designs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-full focus:outline-none focus:border-google-blue focus:ring-1 focus:ring-google-blue/20 text-sm transition-all"
                        />
                        <Search className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                        <div className="w-16 h-16 rounded-2xl bg-google-blue/10 flex items-center justify-center text-google-blue mb-4">
                            <Search className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">No designs found</h3>
                        <p className="text-gray-500 text-sm max-w-xs text-center">
                            {searchQuery ? "No matches for your search. Try another query." : "Create your first collaborative design to get started."}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={handleCreateNew}
                                className="mt-6 px-6 py-2.5 bg-google-blue text-white rounded-full text-sm font-medium hover:bg-blue-600 transition-all shadow-md"
                            >
                                Create Workspace
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {filtered.map((ws) => (
                            <WorkspaceCard
                                key={ws.id}
                                workspace={ws}
                                onClick={() => handleOpenWorkspace(ws.id)}
                                onDownloadClick={(e) => handleDownloadWorkspace(e, ws.id, ws.title)}
                                onOpenMenu={(id) => setMenuOpenId(id)}
                                menuOpenId={menuOpenId}
                                onDeleteClick={() => setDeleteModal({ isOpen: true, workspaceId: ws.id, title: ws.title })}
                                onPropertiesClick={() => setPropertiesModal(ws)}
                                onShareClick={() => setShareModal(ws)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Custom Modals */}
            <AnimatePresence>
                {deleteModal?.isOpen && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-gray-100"
                        >
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Delete workspace?</h3>
                            <p className="text-gray-500 text-sm mb-6">
                                This will permanently delete <strong>{deleteModal.title}</strong>. This action cannot be undone.
                            </p>
                            <div className="flex gap-4 justify-end">
                                <button
                                    onClick={() => setDeleteModal(null)}
                                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-full transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteWorkspace}
                                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-full transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {propertiesModal && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100"
                        >
                            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                                <Info className="w-5 h-5 text-google-blue" />
                                <span>Workspace Details</span>
                            </h3>

                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between py-2 border-b border-gray-50">
                                    <span className="text-gray-400 text-sm">Title</span>
                                    <span className="text-gray-900 text-sm font-medium">{propertiesModal.title}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-50">
                                    <span className="text-gray-400 text-sm">Subtitle</span>
                                    <span className="text-gray-900 text-sm font-medium truncate max-w-xs">{propertiesModal.subtitle}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-50">
                                    <span className="text-gray-400 text-sm">Workspace ID</span>
                                    <span className="text-gray-900 text-sm font-mono">{propertiesModal.id}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-50">
                                    <span className="text-gray-400 text-sm">Your Role</span>
                                    <span className="text-gray-900 text-sm font-medium capitalize">{propertiesModal.role}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-50">
                                    <span className="text-gray-400 text-sm">Elements Count</span>
                                    <span className="text-gray-900 text-sm font-medium">{propertiesModal.nodes}</span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-gray-400 text-sm">Last Synced</span>
                                    <span className="text-gray-900 text-sm font-medium">{propertiesModal.lastEdited}</span>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={() => setPropertiesModal(null)}
                                    className="px-6 py-2.5 bg-google-blue hover:bg-blue-600 text-white text-sm font-medium rounded-full transition-colors shadow-md"
                                >
                                    Done
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {shareModal && (
                    <InviteModal
                        workspaceId={shareModal.id}
                        onClose={() => setShareModal(null)}
                    />
                )}
            </AnimatePresence>
        </main>
    );
}

interface CardProps {
    workspace: Workspace;
    onClick: () => void;
    onDownloadClick: (e: React.MouseEvent) => void;
    onOpenMenu: (id: string | null) => void;
    menuOpenId: string | null;
    onDeleteClick: () => void;
    onPropertiesClick: () => void;
    onShareClick: () => void;
}

function WorkspaceCard({
    workspace,
    onClick,
    onDownloadClick,
    onOpenMenu,
    menuOpenId,
    onDeleteClick,
    onPropertiesClick,
    onShareClick
}: CardProps) {
    const isMenuOpen = menuOpenId === workspace.id;
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onOpenMenu(null);
            }
        }
        if (isMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isMenuOpen, onOpenMenu]);

    const colorIndex = workspace.id.charCodeAt(0) % DiagramPreviews.length;
    const preview = DiagramPreviews[colorIndex];

    return (
        <div
            onClick={onClick}
            className="group relative bg-[#f8f9fa] rounded-[3rem_1rem_2rem_1rem] border border-gray-200/60 p-5 h-72 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between cursor-pointer overflow-hidden"
        >
            <div className="flex items-start justify-between z-10">
                <div className="flex flex-col gap-1 max-w-[80%]">
                    <h3 className="font-semibold text-lg text-gray-900 group-hover:text-google-blue transition-colors truncate">
                        {workspace.title}
                    </h3>
                    <span className="text-xs text-gray-500 font-medium truncate">{workspace.subtitle}</span>
                </div>

                <div className="relative" ref={menuRef}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            onOpenMenu(isMenuOpen ? null : workspace.id);
                        }}
                        className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                    >
                        <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>

                    {isMenuOpen && (
                        <div className="absolute right-0 top-8 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-30">
                            <button
                                onClick={(e) => { e.stopPropagation(); onShareClick(); onOpenMenu(null); }}
                                className="w-full text-left px-4 py-2 hover:bg-gray-50 text-xs text-gray-700 flex items-center gap-2"
                            >
                                <Users className="w-3.5 h-3.5" />
                                <span>Collaborators</span>
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onPropertiesClick(); onOpenMenu(null); }}
                                className="w-full text-left px-4 py-2 hover:bg-gray-50 text-xs text-gray-700 flex items-center gap-2"
                            >
                                <Info className="w-3.5 h-3.5" />
                                <span>Properties</span>
                            </button>
                            {workspace.role === 'owner' && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDeleteClick(); onOpenMenu(null); }}
                                    className="w-full text-left px-4 py-2 hover:bg-red-50 text-xs text-red-600 flex items-center gap-2 border-t border-gray-50 mt-1"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete design</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Inner white canvas - floating offset */}
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onClick();
                }}
                className="absolute bg-[#f0f2f5] overflow-hidden border border-white/10 shadow-inner z-0 cursor-pointer hover:bg-white transition-colors flex flex-col items-center justify-center p-0 m-0 outline-none"
                style={{
                    top: '3.5rem',
                    left: '1.25rem',
                    right: '1.25rem',
                    bottom: '1.25rem',
                    borderRadius: '4rem 1.5rem 2.5rem 1.5rem',
                    width: 'auto',
                    height: 'auto'
                }}
            >
                {/* Mini diagram preview */}
                <div className="w-full h-full flex flex-col items-center justify-center p-8 opacity-60 pointer-events-none">
                    {preview}
                </div>
            </button>

            {/* Action FAB button (Bottom Right) */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onDownloadClick(e);
                }}
                className="absolute bottom-6 right-7 w-12 h-12 rounded-full flex items-center justify-center shadow-lg z-20 group-hover:scale-110 transition-transform"
                style={{ backgroundColor: workspace.accent }}
            >
                <Download className="w-5 h-5 text-white pointer-events-none" />
            </button>

            {/* subtle info on hover */}
            <div className="absolute bottom-6 left-10 flex items-center gap-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div
                    className="text-[10px] font-bold tracking-widest uppercase pointer-events-none"
                    style={{ color: workspace.accent }}
                >
                    {workspace.lastEdited}
                </div>
            </div>
        </div>
    );
}
