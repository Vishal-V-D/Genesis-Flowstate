"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Plus, Download, Search, ArrowLeft, Sparkles, User as UserIcon, LogOut, Settings, MoreVertical, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import NewWorkspaceModal from '@/components/workspace/NewWorkspaceModal';
import { useAuth } from '@/hooks/useAuth';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs, getDoc, orderBy, deleteDoc, doc as firestoreDoc } from 'firebase/firestore';

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

export default function LibraryPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [fetching, setFetching] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, workspaceId: string, title: string } | null>(null);
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
    const profileMenuRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Require authentication for the library page
    const { user, loading } = useAuth(true);

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

    useEffect(() => {
        const fetchWorkspaces = async () => {
            if (!user) return;
            try {
                // ── Industry-standard: read from userWorkspaces join collection ──
                // Each user has their own index: userWorkspaces/{uid}/items/{workspaceId}
                // This is O(1) per user and supports owner + collaborators without
                // scanning/filtering the entire workspaces collection.
                const itemsSnap = await getDocs(
                    collection(db, "userWorkspaces", user.uid, "items")
                );

                // Collect all workspace IDs this user has access to
                const joinItems = itemsSnap.docs.map(d => d.data() as {
                    workspaceId: string;
                    role: string;
                    title: string;
                    updatedAt: string;
                });

                // ── Fallback: also pick up old workspaces created before this update ──
                // (ones that don't have a userWorkspaces entry yet)
                const ownedSnap = await getDocs(
                    query(collection(db, "workspaces"), where("userId", "==", user.uid))
                );
                const joinIds = new Set(joinItems.map(j => j.workspaceId));
                ownedSnap.docs.forEach(d => {
                    if (!joinIds.has(d.id)) {
                        joinItems.push({
                            workspaceId: d.id,
                            role: 'owner',
                            title: d.data().title || `Workspace ${d.id.substring(0, 4)}`,
                            updatedAt: d.data().updatedAt || d.data().createdAt || new Date().toISOString(),
                        });
                    }
                });

                // Fetch full workspace docs in parallel for live element count + metadata
                const loaded: Workspace[] = await Promise.all(
                    joinItems.map(async (item) => {
                        const wsDoc = await getDoc(firestoreDoc(db, "workspaces", item.workspaceId));
                        const data = wsDoc.exists() ? wsDoc.data() as any : {};

                        let nodeCount = 0;
                        if (data.elements) {
                            try {
                                const els = JSON.parse(data.elements);
                                nodeCount = Array.isArray(els) ? els.length : 0;
                            } catch (_) { }
                        }

                        const colorIndex = item.workspaceId.charCodeAt(0) % workspaceColors.length;
                        const scheme = workspaceColors[colorIndex];
                        const lastEdited = data.updatedAt || data.createdAt || item.updatedAt;

                        return {
                            id: item.workspaceId,
                            title: data.title || item.title || `Workspace ${item.workspaceId.substring(0, 4)}`,
                            subtitle: data.subtitle || (item.role !== 'owner' ? `Shared · ${item.role}` : "System Architecture"),
                            lastEdited: lastEdited ? new Date(lastEdited).toLocaleDateString() : "–",
                            nodes: nodeCount,
                            color: scheme.color,
                            accent: scheme.accent,
                        };
                    })
                );

                // Sort by most recently updated
                loaded.sort((a, b) => new Date(b.lastEdited).getTime() - new Date(a.lastEdited).getTime());
                setWorkspaces(loaded);
            } catch (err) {
                console.error("Error fetching workspaces:", err);
            } finally {
                setFetching(false);
            }
        };

        fetchWorkspaces();
    }, [user]);


    const handleSignOut = async () => {
        try {
            await signOut(auth);
            router.push('/');
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    const handleDeleteWorkspace = async () => {
        if (!deleteModal || !user) return;
        try {
            await deleteDoc(firestoreDoc(db, "workspaces", deleteModal.workspaceId));
            setWorkspaces(prev => prev.filter(w => w.id !== deleteModal.workspaceId));
            setDeleteModal(null);
        } catch (err) {
            console.error("Error deleting workspace:", err);
        }
    };

    if (loading || !user || fetching) return <div className="min-h-screen bg-[#f0f4f9]" />;

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

                {/* Profile Section */}
                <div className="relative flex items-center justify-end w-24" ref={profileMenuRef}>
                    {user && (
                        <button
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className="w-10 h-10 rounded-full bg-google-blue text-white flex items-center justify-center font-medium text-lg hover:ring-4 hover:ring-blue-100 transition-all focus:outline-none"
                        >
                            {user.firstName ? user.firstName[0].toUpperCase() : user.email[0].toUpperCase()}
                        </button>
                    )}

                    <AnimatePresence>
                        {showProfileMenu && user && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="absolute top-14 right-0 w-80 bg-[#f0f4f9] rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.12)] border border-gray-100 overflow-hidden"
                            >
                                <div className="p-4 flex flex-col items-center border-b border-gray-200/60 bg-white m-2 rounded-[24px]">
                                    <div className="w-16 h-16 rounded-full bg-google-blue text-white flex items-center justify-center font-medium text-2xl mb-3">
                                        {user.firstName ? user.firstName[0].toUpperCase() : user.email[0].toUpperCase()}
                                    </div>
                                    <h3 className="font-medium text-gray-900 text-lg">
                                        Hi, {user.firstName || 'there'}!
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-4">{user.email}</p>

                                    <button
                                        onClick={() => router.push('/profile')}
                                        className="px-6 py-2 border border-gray-200 rounded-full text-sm font-medium text-google-blue hover:bg-blue-50 transition-colors"
                                    >
                                        Manage your Account
                                    </button>
                                </div>

                                <div className="p-2 space-y-1 bg-white mx-2 mb-2 rounded-[24px]">
                                    <button
                                        onClick={() => router.push('/settings')}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 rounded-2xl transition-colors text-left"
                                    >
                                        <Settings className="w-5 h-5 text-gray-400" />
                                        Settings
                                    </button>
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 rounded-2xl transition-colors text-left"
                                    >
                                        <LogOut className="w-5 h-5 text-gray-400" />
                                        Sign out
                                    </button>
                                </div>

                                <div className="py-3 text-center text-[12px] text-gray-500 flex justify-center gap-4">
                                    <span className="hover:text-gray-800 cursor-pointer">Privacy Policy</span>
                                    <span className="hover:text-gray-800 cursor-pointer">• Terms of Service</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </header>

            <div className="max-w-7xl mx-auto pt-28 pb-24 px-8">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-5xl font-[300] text-gray-900 tracking-tight mb-2">Workspaces</h1>
                        <p className="text-gray-500 text-lg">Pick up where you left off, or start something new.</p>
                    </div>
                    {/* Search */}
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search workspaces..."
                            className="w-full pl-12 pr-10 py-3 rounded-full bg-white border border-gray-200 text-gray-700 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#536ea1]/30 focus:border-[#536ea1] transition-all text-sm"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <Plus className="w-5 h-5 rotate-45" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                    {/* Create New Card */}
                    <button
                        onClick={() => setShowModal(true)}
                        className="group relative w-full aspect-[5/4] rounded-[2rem] border-2 border-dashed border-[#536ea1] bg-white hover:bg-[#536ea1]/5 transition-all overflow-hidden flex flex-col items-center justify-center shadow-sm hover:shadow-lg"
                    >
                        {/* Tab-like shape */}
                        <div className="absolute top-0 left-0 w-[60%] h-12 border-b-2 border-r-2 border-dashed border-[#536ea1] bg-[#536ea1]/5 rounded-br-[1.5rem]" />

                        <div className="w-14 h-14 rounded-full bg-[#536ea1] flex items-center justify-center mb-3 mt-8 shadow-md group-hover:scale-110 transition-transform">
                            <Plus className="w-6 h-6 text-white" />
                        </div>

                        <span className="text-sm font-bold text-[#536ea1] relative z-10">New Workspace</span>

                        <div className="mt-2 flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-[#536ea1]/70" />
                            <span className="text-[9px] font-bold tracking-[0.2em] text-[#536ea1]/60 uppercase">Personal or AI</span>
                        </div>
                    </button>

                    {/* Workspace Cards */}
                    {filtered.map((ws, i) => (
                        <WorkspaceCard
                            key={ws.id}
                            workspace={ws}
                            diagramIndex={i}
                            onClick={() => handleOpenWorkspace(ws.id)}
                            onDeleteClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setDeleteModal({ isOpen: true, workspaceId: ws.id, title: ws.title });
                                setMenuOpenId(null);
                            }}
                            isMenuOpen={menuOpenId === ws.id}
                            toggleMenu={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setMenuOpenId(menuOpenId === ws.id ? null : ws.id);
                            }}
                        />
                    ))}

                    {filtered.length === 0 && searchQuery && (
                        <div className="col-span-full text-center py-20 text-gray-400">
                            <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
                            <p className="text-xl">No workspaces found for &quot;{searchQuery}&quot;</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Workspace creation modal */}
            {showModal && <NewWorkspaceModal onClose={() => setShowModal(false)} />}

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteModal?.isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setDeleteModal(null)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 overflow-hidden"
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-6">
                                    <Trash2 className="w-8 h-8 text-red-500" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900 mb-2">Delete Project?</h2>
                                <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                                    Are you sure you want to delete <span className="font-semibold text-gray-900">&quot;{deleteModal.title}&quot;</span>? This action cannot be undone.
                                </p>
                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={() => setDeleteModal(null)}
                                        className="flex-1 px-4 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDeleteWorkspace}
                                        className="flex-1 px-4 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-medium transition-colors shadow-lg shadow-red-200"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </main>
    );
}

function WorkspaceCard({ workspace, diagramIndex, onClick, onDeleteClick, isMenuOpen, toggleMenu }: {
    workspace: Workspace,
    diagramIndex: number,
    onClick: () => void,
    onDeleteClick: (e: React.MouseEvent) => void,
    isMenuOpen: boolean,
    toggleMenu: (e: React.MouseEvent) => void
}) {
    // Stability: use charCode loop to pick preview so it doesn't change when others are filtered
    const preview = DiagramPreviews[workspace.id.charCodeAt(0) % DiagramPreviews.length];

    return (
        <Link
            href={`/workspace/${workspace.id}`}
            className="group relative w-full aspect-[5/4] rounded-[2rem] shadow-xl hover:shadow-2xl transition-all cursor-pointer overflow-hidden hover:-translate-y-1.5"
            style={{ backgroundColor: workspace.color }}
        >
            {/* Tabbed Header Background (Darker accent) */}
            <div
                className="absolute top-0 left-0 w-[70%] h-14 rounded-br-[2rem] z-10 flex items-center px-8 transition-colors"
                style={{ backgroundColor: workspace.accent }}
            >
                <h3 className="text-sm tracking-tight text-white truncate max-w-[80%]">{workspace.title}</h3>
            </div>

            {/* Three Dot Menu */}
            <div className="absolute top-3 right-4 z-30">
                <button
                    onClick={toggleMenu}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                >
                    <MoreVertical className="w-5 h-5" />
                </button>

                <AnimatePresence>
                    {isMenuOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    toggleMenu(e);
                                }}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                className="absolute right-0 top-10 w-40 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden"
                            >
                                <button
                                    onClick={onDeleteClick}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Project
                                </button>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>

            {/* Inner white canvas - floating offset */}
            <div
                className="absolute bg-[#f0f2f5] overflow-hidden border border-white/10 shadow-inner z-0"
                style={{
                    top: '3.5rem',
                    left: '1.25rem',
                    right: '1.25rem',
                    bottom: '1.25rem',
                    borderRadius: '4rem 1.5rem 2.5rem 1.5rem'
                }}
            >
                {/* Mini diagram preview */}
                <div className="w-full h-full flex items-center justify-center p-8 opacity-60">
                    {preview}
                </div>
            </div>

            {/* Action FAB button (Bottom Right) */}
            <div
                className="absolute bottom-6 right-7 w-12 h-12 rounded-full flex items-center justify-center shadow-lg z-20 group-hover:scale-110 transition-transform"
                style={{ backgroundColor: workspace.accent }}
            >
                <Download className="w-5 h-5 text-white" />
            </div>

            {/* subtle info on hover */}
            <div className="absolute bottom-6 left-10 flex items-center gap-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <div
                    className="text-[10px] font-bold tracking-widest uppercase"
                    style={{ color: workspace.accent }}
                >
                    {workspace.lastEdited}
                </div>
            </div>
        </Link>
    );
}
