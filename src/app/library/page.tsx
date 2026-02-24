"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Download, Search, ArrowLeft, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import NewWorkspaceModal from '@/components/workspace/NewWorkspaceModal';

const mockWorkspaces = [
    {
        id: 1,
        title: "Project Workspace",
        subtitle: "System architecture diagram",
        lastEdited: "2 hours ago",
        nodes: 14,
        color: "#6b85b8",
        accent: "#4a6b9c",
    },
    {
        id: 2,
        title: "B2B Features",
        subtitle: "Feature breakdown canvas",
        lastEdited: "Yesterday",
        nodes: 8,
        color: "#7a8eb0",
        accent: "#5a7090",
    },
    {
        id: 3,
        title: "Database Design",
        subtitle: "Entity relationship model",
        lastEdited: "3 days ago",
        nodes: 21,
        color: "#8b7da8",
        accent: "#6b5d88",
    },
    {
        id: 4,
        title: "Microservices Map",
        subtitle: "Service boundary mapping",
        lastEdited: "Last week",
        nodes: 33,
        color: "#6b97b0",
        accent: "#4a77a0",
    },
];

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
    const [query, setQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const router = useRouter();

    const filtered = mockWorkspaces.filter(w =>
        w.title.toLowerCase().includes(query.toLowerCase()) ||
        w.subtitle.toLowerCase().includes(query.toLowerCase())
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
            <header className="absolute top-0 w-full px-8 py-6 flex items-center justify-between z-20">
                <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Back to Home</span>
                </Link>
                <div className="flex items-center gap-2">

                    <span className="text-gray-600 font-medium ml-1">FlowState</span>
                </div>
                <div className="w-24" /> {/* spacer */}
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
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Search workspaces..."
                            className="w-full pl-12 pr-10 py-3 rounded-full bg-white border border-gray-200 text-gray-700 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#536ea1]/30 focus:border-[#536ea1] transition-all text-sm"
                        />
                        {query && (
                            <button
                                onClick={() => setQuery('')}
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
                        />
                    ))}

                    {filtered.length === 0 && query && (
                        <div className="col-span-full text-center py-20 text-gray-400">
                            <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
                            <p className="text-xl">No workspaces found for &quot;{query}&quot;</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Workspace creation modal */}
            {showModal && <NewWorkspaceModal onClose={() => setShowModal(false)} />}
        </main>
    );
}

function WorkspaceCard({ workspace, diagramIndex, onClick }: { workspace: typeof mockWorkspaces[0], diagramIndex: number, onClick: () => void }) {
    // Stability: use workspace.id to pick preview so it doesn't change when others are filtered
    const preview = DiagramPreviews[(workspace.id - 1) % DiagramPreviews.length];

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
                <h3 className="text-sm tracking-tight text-white">{workspace.title}</h3>
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
