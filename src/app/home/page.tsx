"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    Cpu, FileText, BookOpen, ArrowRight,
    Clock, Layers, ChevronRight, ArrowLeft, Zap
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getCurrentSession } from "@/lib/supabase-client";
import NewWorkspaceModal from "@/components/workspace/NewWorkspaceModal";
import TiltCard from "@/components/ui/TiltCard";
import SpotlightCard from "@/components/ui/SpotlightCard";

const PATHS = [
    {
        id: "architecture",
        label: "Architecture Canvas",
        tagline: "Voice → diagram, live",
        description: "Speak naturally. AI draws your architecture in real time. Collaborate with your team without screen sharing.",
        icon: Cpu,
        color: "#6b85b8",
        lightBg: "bg-[#6b85b8]/8",
        border: "border-[#6b85b8]/20",
        tag: "AI + Voice",
        tagBg: "bg-[#6b85b8]/10 text-[#4a6b9c]",
        gradientFrom: "from-blue-50/80",
        gradientTo: "to-indigo-50/60",
        preview: (
            <svg viewBox="0 0 200 100" className="w-full h-full">
                <rect x="10" y="20" width="50" height="30" rx="6" fill="none" stroke="#6b85b8" strokeWidth="1.5" opacity="0.4" />
                <rect x="80" y="10" width="50" height="30" rx="6" fill="none" stroke="#6b85b8" strokeWidth="1.5" opacity="0.4" />
                <rect x="80" y="55" width="50" height="30" rx="6" fill="none" stroke="#6b85b8" strokeWidth="1.5" opacity="0.4" />
                <rect x="150" y="32" width="40" height="30" rx="6" fill="none" stroke="#6b85b8" strokeWidth="1.5" opacity="0.4" />
                <line x1="60" y1="35" x2="80" y2="25" stroke="#6b85b8" strokeWidth="1" opacity="0.3" />
                <line x1="60" y1="35" x2="80" y2="70" stroke="#6b85b8" strokeWidth="1" opacity="0.3" />
                <line x1="130" y1="25" x2="150" y2="47" stroke="#6b85b8" strokeWidth="1" opacity="0.3" />
                <line x1="130" y1="70" x2="150" y2="52" stroke="#6b85b8" strokeWidth="1" opacity="0.3" />
                <circle cx="35" cy="35" r="3" fill="#6b85b8" opacity="0.6" />
                <circle cx="105" cy="25" r="3" fill="#6b85b8" opacity="0.6" />
                <circle cx="105" cy="70" r="3" fill="#6b85b8" opacity="0.6" />
                <circle cx="170" cy="47" r="3" fill="#6b85b8" opacity="0.6" />
            </svg>
        ),
    },
    {
        id: "design_doc",
        label: "Design Docs",
        tagline: "Async technical communication",
        description: "Voice-narrate your decisions. Auto-generates structured docs your team reviews and comments on — no meeting needed.",
        icon: FileText,
        color: "#2d8b6e",
        lightBg: "bg-[#2d8b6e]/8",
        border: "border-[#2d8b6e]/20",
        tag: "New",
        tagBg: "bg-emerald-100 text-emerald-700",
        gradientFrom: "from-emerald-50/80",
        gradientTo: "to-teal-50/60",
        preview: (
            <svg viewBox="0 0 200 100" className="w-full h-full">
                <rect x="20" y="12" width="160" height="10" rx="3" fill="#2d8b6e" opacity="0.15" />
                <rect x="20" y="28" width="120" height="7" rx="2" fill="#2d8b6e" opacity="0.1" />
                <rect x="20" y="40" width="140" height="7" rx="2" fill="#2d8b6e" opacity="0.1" />
                <rect x="20" y="52" width="100" height="7" rx="2" fill="#2d8b6e" opacity="0.1" />
                <rect x="20" y="68" width="160" height="7" rx="2" fill="#2d8b6e" opacity="0.08" />
                <rect x="20" y="80" width="80" height="7" rx="2" fill="#2d8b6e" opacity="0.08" />
                <rect x="8" y="28" width="3" height="38" rx="1.5" fill="#2d8b6e" opacity="0.4" />
            </svg>
        ),
    },
    {
        id: "codebase_tour",
        label: "Codebase Tours",
        tagline: "Living onboarding for engineers",
        description: "Record voice walkthroughs while drawing. New engineers follow interactive visual explanations of your codebase.",
        icon: BookOpen,
        color: "#7c5cbf",
        lightBg: "bg-[#7c5cbf]/8",
        border: "border-[#7c5cbf]/20",
        tag: "New",
        tagBg: "bg-violet-100 text-violet-700",
        gradientFrom: "from-violet-50/80",
        gradientTo: "to-purple-50/60",
        preview: (
            <svg viewBox="0 0 200 100" className="w-full h-full">
                <circle cx="40" cy="50" r="22" fill="none" stroke="#7c5cbf" strokeWidth="1.5" opacity="0.3" />
                <circle cx="40" cy="50" r="12" fill="#7c5cbf" opacity="0.08" />
                <circle cx="40" cy="50" r="4" fill="#7c5cbf" opacity="0.5" />
                <line x1="62" y1="50" x2="85" y2="50" stroke="#7c5cbf" strokeWidth="1" opacity="0.3" strokeDasharray="4 2" />
                <rect x="85" y="38" width="30" height="24" rx="5" fill="none" stroke="#7c5cbf" strokeWidth="1.5" opacity="0.35" />
                <line x1="115" y1="50" x2="138" y2="38" stroke="#7c5cbf" strokeWidth="1" opacity="0.3" strokeDasharray="4 2" />
                <line x1="115" y1="50" x2="138" y2="62" stroke="#7c5cbf" strokeWidth="1" opacity="0.3" strokeDasharray="4 2" />
                <rect x="138" y="30" width="24" height="16" rx="4" fill="none" stroke="#7c5cbf" strokeWidth="1.2" opacity="0.35" />
                <rect x="138" y="54" width="24" height="16" rx="4" fill="none" stroke="#7c5cbf" strokeWidth="1.2" opacity="0.35" />
                <circle cx="150" cy="38" r="2.5" fill="#7c5cbf" opacity="0.5" />
                <circle cx="150" cy="62" r="2.5" fill="#7c5cbf" opacity="0.5" />
            </svg>
        ),
    },
    {
        id: "code_gen",
        label: "Diagram to Code",
        tagline: "Architecture → production code",
        description: "Turn your diagrams into Terraform, Kubernetes, SQL schemas, and more. AI generates artifacts directly from your canvas.",
        icon: Zap,
        color: "#c97d2a",
        lightBg: "bg-[#c97d2a]/8",
        border: "border-[#c97d2a]/20",
        tag: "Beta",
        tagBg: "bg-orange-100 text-orange-700",
        gradientFrom: "from-orange-50/80",
        gradientTo: "to-amber-50/60",
        preview: (
            <svg viewBox="0 0 200 100" className="w-full h-full">
                <rect x="10" y="30" width="40" height="40" rx="6" fill="none" stroke="#c97d2a" strokeWidth="1.5" opacity="0.4" />
                <text x="30" y="55" textAnchor="middle" fill="#c97d2a" opacity="0.5" fontSize="10" fontFamily="monospace">{ }</text>
                <line x1="52" y1="50" x2="68" y2="50" stroke="#c97d2a" strokeWidth="1.5" opacity="0.4" strokeDasharray="3 2" />
                <polygon points="68,46 76,50 68,54" fill="#c97d2a" opacity="0.5" />
                <rect x="78" y="20" width="110" height="12" rx="3" fill="#c97d2a" opacity="0.12" />
                <rect x="78" y="37" width="80" height="8" rx="2" fill="#c97d2a" opacity="0.08" />
                <rect x="78" y="50" width="95" height="8" rx="2" fill="#c97d2a" opacity="0.08" />
                <rect x="78" y="63" width="65" height="8" rx="2" fill="#c97d2a" opacity="0.08" />
                <rect x="78" y="76" width="85" height="8" rx="2" fill="#c97d2a" opacity="0.06" />
            </svg>
        ),
    },
];


export default function HomePage() {
    const router = useRouter();
    const { user, logout } = useAuth(true);
    const [showModal, setShowModal] = useState(false);
    const [workspaces, setWorkspaces] = useState<any[]>([]);

    const firstName = user?.firstName || user?.email?.split("@")[0] || "there";
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    useEffect(() => {
        const session = getCurrentSession();
        if (!session) return;
        fetch("/api/workspaces", { headers: { Authorization: `Bearer ${session.idToken}` } })
            .then((r) => r.json())
            .then((d) => setWorkspaces(Array.isArray(d) ? d.slice(0, 6) : []))
            .catch(() => {});
    }, []);

    const handleCardClick = (id: string) => {
        if (id === "architecture") setShowModal(true);
        else if (id === "design_doc") router.push("/design-docs");
        else if (id === "codebase_tour") router.push("/codebase-tours");
    };

    return (
        <main className="relative w-full min-h-screen bg-[#f8f9fa] dark:bg-dark-bg overflow-x-hidden">

            {/* Nav */}
            <header className="sticky top-0 z-20 w-full bg-white/80 dark:bg-dark-bg/95 backdrop-blur-md border-b border-gray-100/80 dark:border-dark-border/80">
                <div className="w-full px-10 h-14 flex items-center">
                    <div className="flex items-center gap-3 flex-1">
                        <Link href="/" className="flex items-center gap-1.5 text-gray-400 dark:text-dark-subtle hover:text-gray-700 dark:hover:text-dark-muted transition-colors group">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                            <span className="text-[13px] font-medium">Back</span>
                        </Link>
                        <span className="text-gray-200 dark:text-dark-subtle text-lg font-light">|</span>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-[14px] tracking-tight">
                                <span className="text-google-blue">G</span>
                                <span className="text-google-red">e</span>
                                <span className="text-google-yellow">n</span>
                                <span className="text-google-green">e</span>
                                <span className="text-google-blue">s</span>
                                <span className="text-google-red">i</span>
                                <span className="text-google-yellow">s</span>
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 flex-1 justify-end">
                        {["Library", "Settings"].map((item) => (
                            <button
                                key={item}
                                onClick={() => router.push(`/${item.toLowerCase()}`)}
                                className="text-[13px] text-gray-500 dark:text-dark-muted hover:text-gray-900 dark:hover:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-border px-3 py-1.5 rounded-lg transition-colors font-medium"
                            >
                                {item}
                            </button>
                        ))}
                        <div className="w-px h-4 bg-gray-200 dark:bg-dark-border mx-1" />
                        <button
                            onClick={logout}
                            className="text-[13px] text-gray-400 dark:text-dark-subtle hover:text-gray-600 dark:hover:text-dark-muted transition-colors font-medium"
                        >
                            Sign out
                        </button>
                        <div className="w-8 h-8 rounded-full bg-google-blue flex items-center justify-center shadow-sm ml-1">
                            <span className="text-white font-semibold uppercase text-[12px]">
                                {user?.firstName?.charAt(0) || user?.email?.charAt(0) || "?"}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="relative z-10 w-full px-10 pt-14 pb-28 space-y-16">

                {/* Greeting */}
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                >
                    <p className="text-[12px] text-gray-400 dark:text-dark-subtle font-medium mb-1 tracking-wide">{greeting}</p>
                    <h1 className="text-[42px] font-semibold text-gray-900 dark:text-dark-text tracking-tight leading-tight mb-2">
                        Hey, {firstName} 👋
                    </h1>
                    <p className="text-gray-400 dark:text-dark-muted text-[15px]">What would you like to build today?</p>
                </motion.div>

                {/* Feature cards */}
                <div>
                    <p className="text-[11px] font-semibold text-gray-400 dark:text-dark-subtle tracking-widest uppercase mb-5">Features</p>
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                        {PATHS.map((path, i) => {
                            const Icon = path.icon;
                            return (
                                <motion.div
                                    key={path.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.08 + i * 0.08, duration: 0.45, ease: "easeOut" }}
                                    className="h-full"
                                >
                                    <TiltCard
                                        tiltAmount={5}
                                        className="cursor-pointer h-full"
                                        onClick={() => handleCardClick(path.id)}
                                    >
                                        <SpotlightCard
                                            spotlightColor={`${path.color}22`}
                                            className="h-full bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col rounded-2xl"
                                        >
                                            {/* Preview area — gradient wash */}
                                            <div
                                                className="h-52 flex items-center justify-center px-4 py-4 relative overflow-hidden rounded-t-2xl"
                                                style={{
                                                    background: `linear-gradient(135deg, ${path.color}22 0%, ${path.color}08 60%, ${path.color}18 100%)`,
                                                }}
                                            >
                                                {/* Glow blob */}
                                                <div
                                                    className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl"
                                                    style={{ backgroundColor: `${path.color}30` }}
                                                />
                                                <div
                                                    className="absolute bottom-0 left-0 w-16 h-16 rounded-full blur-xl"
                                                    style={{ backgroundColor: `${path.color}20` }}
                                                />
                                                <div className="relative z-10 w-full">{path.preview}</div>
                                            </div>
                                            <div className="p-5 flex flex-col flex-1">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${path.color}15` }}>
                                                        <Icon className="w-4 h-4" style={{ color: path.color }} />
                                                    </div>
                                                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md" style={{ backgroundColor: `${path.color}12`, color: path.color }}>
                                                        {path.tag}
                                                    </span>
                                                </div>
                                                <h2 className="text-[15px] font-semibold text-gray-900 dark:text-dark-text mb-1 tracking-tight">{path.label}</h2>
                                                <p className="text-[11px] font-medium mb-1.5" style={{ color: path.color }}>{path.tagline}</p>
                                                <p className="text-[12px] text-gray-400 dark:text-dark-subtle leading-relaxed flex-1">{path.description}</p>
                                                <div className="mt-4 flex items-center gap-1 text-[12px] font-semibold" style={{ color: path.color }}>
                                                    Get started <ChevronRight className="w-3 h-3" />
                                                </div>
                                            </div>
                                        </SpotlightCard>
                                    </TiltCard>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Recent workspaces */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-gray-300 dark:text-dark-subtle" />
                            <span className="text-[11px] font-semibold text-gray-400 dark:text-dark-subtle tracking-widest uppercase">Recent</span>
                        </div>
                        <button
                            onClick={() => router.push("/library")}
                            className="text-[12px] text-gray-400 dark:text-dark-subtle hover:text-gray-700 dark:hover:text-dark-muted transition-colors font-medium flex items-center gap-1 group"
                        >
                            View all <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>

                    {workspaces.length === 0 ? (
                        <div className="text-center py-10 rounded-xl border border-dashed border-gray-200 dark:border-dark-border bg-white/50 dark:bg-dark-card/50">
                            <p className="text-gray-400 dark:text-dark-subtle text-[13px]">No workspaces yet — create one above.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {workspaces.map((ws, i) => {
                                const colors = ["#6b85b8", "#7c5cbf", "#2d8b6e", "#b87c3a", "#6b85b8", "#2d8b6e"];
                                const color = colors[i % colors.length];
                                return (
                                    <button
                                        key={ws.workspaceId}
                                        onClick={() => router.push(`/workspace/${ws.workspaceId}`)}
                                        className="group flex items-center gap-3 p-4 bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all text-left"
                                    >
                                        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15` }}>
                                            <Cpu className="w-4 h-4" style={{ color }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-medium text-gray-800 dark:text-dark-text truncate">{ws.title}</p>
                                            <p className="text-[11px] text-gray-400 dark:text-dark-subtle mt-0.5">
                                                {new Date(ws.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                            </p>
                                        </div>
                                        <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-dark-subtle group-hover:text-gray-500 dark:group-hover:text-dark-muted transition-colors flex-shrink-0" />
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </motion.div>
            </div>

            {showModal && <NewWorkspaceModal onClose={() => setShowModal(false)} />}
        </main>
    );
}
