"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
    Sparkles, Terminal, Cpu, Database, Activity, ShieldCheck, ArrowRight,
    Check, Lock, Users, Share2, Code, Layers, Settings, Play, ArrowUpRight, Flame, Globe,
    Search, GitBranch
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import dynamic from 'next/dynamic';

const Lightfall = dynamic(() => import('@/components/ui/Lightfall/Lightfall'), {
    ssr: false
});

const LightPillar = dynamic(() => import('@/components/ui/LightPillar/LightPillar'), {
    ssr: false
});

const PricingSection = dynamic(() => import('@/components/landing/PricingSection'), { ssr: true });
const SandboxSection = dynamic(() => import('@/components/landing/SandboxSection'), { ssr: true });
const IDEPreviewSection = dynamic(() => import('@/components/landing/IDEPreviewSection'), { ssr: true });

const slides = [
    {
        tag: "01 / SHOWCASE",
        title: "End-to-End Walkthrough",
        description: "See the complete visual-to-code compiler flow in action. Watch how infrastructure components publish, validate, and deploy natively in real-time."
    },
    {
        tag: "02 / CANVAS",
        title: "Visual Architecture Design",
        description: "Map your cloud infrastructure visually on our infinite canvas. FlowState auto-arranges layout nodes and handles complex cloud topology connections automatically."
    },
    {
        tag: "03 / CODE",
        title: "Real-time IaC Compiler",
        description: "Watch clean, valid Terraform configuration generate side-by-side as you update your diagram. Full support for AWS resources and secure variables."
    },
    {
        tag: "04 / COLLABORATION",
        title: "Multiplayer Engine",
        description: "Co-author setups live with your DevOps and development teams. Share real-time cursors, canvas version histories, and audio channels."
    }
];

export default function Home() {
    const { user, logout } = useAuth();
    const [isScrolled, setIsScrolled] = useState(false);
    const [showEffects, setShowEffects] = useState(true);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 20) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };
        window.addEventListener('scroll', handleScroll);
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const [activeSlide, setActiveSlide] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    useEffect(() => {
        const unsubscribe = scrollYProgress.on("change", (latest) => {
            if (latest < 0.325) {
                setActiveSlide(0);
            } else if (latest < 0.55) {
                setActiveSlide(1);
            } else if (latest < 0.775) {
                setActiveSlide(2);
            } else {
                setActiveSlide(3);
            }
        });
        return () => unsubscribe();
    }, [scrollYProgress]);

    const heroOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0]);
    const heroY = useTransform(scrollYProgress, [0, 0.08], [0, -80]);
    const heroLightfallOpacity = useTransform(scrollYProgress, [0, 0.08], [0.75, 0]);

    const leftColumnOpacity = useTransform(scrollYProgress, [0.08, 0.15], [0, 1]);
    const leftColumnY = useTransform(scrollYProgress, [0.08, 0.15], [30, 0]);

    const macbookX = useTransform(scrollYProgress, [0, 0.15], ["-20%", "0%"]);
    const macbookY = useTransform(scrollYProgress, [0, 0.15], ["480px", "0px"]);

    const scale = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [1.12, 1.08, 1.08, 0.98]);
    const rotateX = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [12, 0, 0, -10]);

    return (
        <div className="relative w-full bg-[#0a0a0c] text-gray-100 min-h-screen overflow-x-clip font-sans antialiased">
            {/* Grid Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            {/* Glowing accents */}

            {/* Nav Header - landing page style */}
            <header className={`fixed top-0 left-0 w-full transition-all duration-300 flex justify-between items-center z-[100] bg-transparent border-none ${isScrolled
                ? 'px-8 py-2'
                : 'px-8 py-4'
                }`}>
                <div className="flex gap-6 items-center text-sm font-medium text-gray-400">
                    <div className="flex items-center gap-2 mr-2">
                        <img src="/logo.png" alt="FlowState Logo" className="w-5 h-5 object-contain" />
                        <span className="text-white font-inter font-bold tracking-tight cursor-pointer"> Genesis FlowState</span>
                    </div>
                    <Link href="#features" className="cursor-pointer hover:text-white transition-colors">Features</Link>
                    <Link href="#how-it-works" className="cursor-pointer hover:text-white transition-colors">How it works</Link>
                    <Link href="#sandbox" className="cursor-pointer hover:text-white transition-colors">IaC Engine</Link>
                    <Link href="#pricing" className="cursor-pointer hover:text-white transition-colors">Pricing</Link>
                </div>
                <div className="flex items-center gap-4">
                    {user ? (
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-gray-400 hidden sm:block">
                                Hi, {user.firstName || user.email.split('@')[0]}
                            </span>
                            <button
                                onClick={logout}
                                className="text-sm font-medium text-gray-400 hover:text-white transition-colors animate-none"
                            >
                                Sign out
                            </button>
                        </div>
                    ) : (
                        <Link href="/signin" className="bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-colors">
                            Sign in
                        </Link>
                    )}
                </div>
            </header>

            {/* Hero Section */}
            <section className="lg:hidden block relative pt-20 pb-20 md:pt-32 md:pb-28 max-w-7xl mx-auto px-6 text-center overflow-hidden">
                <div className={`absolute inset-0 w-full h-full pointer-events-none -z-10 transition-opacity duration-700 ${showEffects ? 'opacity-75' : 'opacity-0'}`}>
                    {showEffects && (
                    <Lightfall
                        colors={['#818cf8', '#a855f7', '#ff9ffc']}
                        backgroundColor="#0a0a0c"
                        speed={0.6}
                        streakCount={4}
                        streakWidth={0.9}
                        streakLength={0.9}
                        glow={2}
                        density={0.5}
                        twinkle={1}
                        zoom={2.5}
                        backgroundGlow={0.8}
                        opacity={0.7}
                        mouseInteraction={true}
                        mouseStrength={0.8}
                        mouseRadius={0.8}
                    />
                    )}
                </div>
                <div className="flex flex-col items-center max-w-4xl mx-auto">
                    {/* Badge */}


                    {/* Heading */}
                    <motion.h1
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 tracking-tight leading-[1.15] mb-8"
                    >
                        Whiteboards that compile<br />directly to cloud code
                    </motion.h1>

                    {/* Subheading */}
                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-base sm:text-lg text-gray-400 max-w-2xl leading-relaxed mb-10"
                    >
                        FlowState combines intuitive visual whiteboarding with an advanced AI compiler.
                        Design system architectures, collaborate with colleagues, and watch clean Terraform generate in real-time.
                    </motion.p>

                    {/* Actions */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="flex flex-col sm:flex-row gap-4 items-center mb-16"
                    >
                        <Link href="/library" className="flex items-center gap-2 bg-white text-black font-semibold px-6 py-3 rounded-lg shadow-lg hover:bg-gray-200 transition-all text-sm w-full sm:w-auto justify-center">
                            Start designing free <ArrowRight className="w-4 h-4" />
                        </Link>
                        <a href="#sandbox" className="flex items-center gap-2 bg-[#121217] hover:bg-[#181822] text-gray-300 hover:text-white border border-white/[0.08] font-semibold px-6 py-3 rounded-lg transition-all text-sm w-full sm:w-auto justify-center">
                            View live IaC compile
                        </a>
                    </motion.div>
                </div>

                {/* Hero Spacer */}
                <div className="h-8" />

            </section>

            {/* Scroll-Pinned MacBook Section (Desktop) */}
            <div ref={containerRef} id="how-it-works" className="hidden lg:block relative h-[400vh] w-full bg-[#0a0a0c] z-30">
                {/* Sticky Wrapper */}
                <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">
                    {/* Lightfall Canvas Background */}
                    <motion.div
                        style={{ opacity: heroLightfallOpacity }}
                        className={`absolute inset-0 w-full h-full pointer-events-none -z-10 transition-opacity duration-700 ${showEffects ? 'opacity-100' : 'opacity-0'}`}
                    >
                        {showEffects && (
                        <Lightfall
                            colors={['#818cf8', '#a855f7', '#ff9ffc']}
                            backgroundColor="#0a0a0c"
                            speed={0.8}
                            streakCount={4}
                            streakWidth={0.9}
                            streakLength={0.9}
                            glow={2.0}
                            density={0.8}
                            twinkle={0.8}
                            zoom={2.5}
                            backgroundGlow={0.8}
                            opacity={0.7}
                            mouseInteraction={true}
                            mouseStrength={0.8}
                            mouseRadius={0.8}
                        />
                        )}
                    </motion.div>
                    {/* Glowing background highlights specifically for this section */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

                    {/* Desktop Hero Content (Fades and slides up on scroll) */}
                    <motion.div
                        style={{ opacity: heroOpacity, y: heroY }}
                        className="flex flex-col items-center max-w-4xl mx-auto absolute top-[18%] left-0 right-0 z-40 text-center px-6 pointer-events-none"
                    >
                        <h1 className="text-4xl sm:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 tracking-tight leading-[1.15] mb-8">
                            Whiteboards that compile<br />directly to cloud code
                        </h1>
                        <p className="text-base sm:text-lg text-gray-400 max-w-2xl leading-relaxed mb-10">
                            FlowState combines intuitive visual whiteboarding with an advanced AI compiler.
                            Design system architectures, collaborate with colleagues, and watch clean Terraform generate in real-time.
                        </p>
                        <div className="flex flex-row gap-4 items-center justify-center pointer-events-auto">
                            <Link href="/library" className="flex items-center gap-2 bg-white text-black font-semibold px-6 py-3 rounded-lg shadow-lg hover:bg-gray-200 transition-all text-sm justify-center">
                                Start designing free <ArrowRight className="w-4 h-4" />
                            </Link>
                            <a href="#sandbox" className="flex items-center gap-2 bg-[#121217] hover:bg-[#181822] text-gray-300 hover:text-white border border-white/[0.08] font-semibold px-6 py-3 rounded-lg transition-all text-sm justify-center">
                                View live IaC compile
                            </a>
                        </div>
                    </motion.div>

                    <div className="max-w-[1400px] w-full mx-auto px-12 grid grid-cols-12 gap-12 items-center h-full">
                        {/* Left Column: Slide Text Details */}
                        <motion.div
                            style={{ opacity: leftColumnOpacity, y: leftColumnY }}
                            className="col-span-4 flex flex-col justify-center relative h-[450px]"
                        >
                            {/* Slide indicators / progress track */}
                            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-white/[0.04] rounded">
                                <motion.div
                                    className="w-full bg-gradient-to-b from-indigo-500 to-purple-500 rounded"
                                    style={{
                                        height: useTransform(scrollYProgress, [0, 1], ["0%", "100%"])
                                    }}
                                />
                            </div>

                            {/* Slides */}
                            <div className="pl-8 flex flex-col gap-6 relative h-full justify-center">
                                {slides.map((slide, idx) => (
                                    <motion.div
                                        key={idx}
                                        className="absolute pr-6"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{
                                            opacity: activeSlide === idx ? 1 : 0,
                                            y: activeSlide === idx ? 0 : (activeSlide > idx ? -30 : 30),
                                            pointerEvents: activeSlide === idx ? "auto" : "none"
                                        }}
                                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="text-[10px] font-mono tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 uppercase font-semibold">
                                                {slide.tag}
                                            </span>
                                        </div>
                                        <h3 className="text-3xl font-extrabold text-white tracking-tight mb-4 leading-tight">
                                            {slide.title}
                                        </h3>
                                        <p className="text-gray-400 leading-relaxed text-sm">
                                            {slide.description}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Right Column: MacBook Mockup */}
                        <div className="col-span-8 flex items-center justify-center relative">
                            <motion.div
                                style={{
                                    perspective: 1200,
                                    scale,
                                    rotateX,
                                    x: macbookX,
                                    y: macbookY,
                                }}
                                className="w-full z-20"
                            >
                                {/* Screen / Lid */}
                                <div
                                    className="relative border-[12px] border-[#1d1d22] rounded-t-3xl bg-[#0a0a0c] shadow-[0_30px_70px_rgba(0,0,0,0.8)] overflow-hidden aspect-[16/10] z-10"
                                >
                                    {/* Notch */}
                                    <div className="absolute -top-[12px] left-1/2 -translate-x-1/2 w-32 h-7 bg-[#1d1d22] rounded-b-lg z-[30] flex items-center justify-center gap-2 pt-[10px]">
                                        {/* Camera Lens */}
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#040404] border border-[#2d2d35] flex items-center justify-center">
                                            <div className="w-0.5 h-0.5 rounded-full bg-cyan-900/60" />
                                        </div>
                                        {/* Camera indicator green light (active state glow) */}
                                        <div className="w-1 h-1 rounded-full bg-green-500/80 shadow-[0_0_4px_#22c55e]" />
                                    </div>

                                    {/* Screen Content */}
                                    <div className="w-full h-full bg-[#0a0a0c] overflow-hidden flex flex-col pt-2.5">
                                        {/* Header Controls */}
                                        <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-2 bg-[#0c0c10] shrink-0">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-red-500/70" />
                                                <span className="w-2 h-2 rounded-full bg-yellow-500/70" />
                                                <span className="w-2 h-2 rounded-full bg-green-500/70" />
                                                <span className="text-[10px] font-mono text-gray-500 ml-2">production-env-spec.tf</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-semibold border border-emerald-500/20">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Sync
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-medium">Default AWS VPC</span>
                                            </div>
                                        </div>

                                        {/* Screen Dynamic Content Wrapper */}
                                        <div className="flex-1 relative overflow-hidden bg-[#070709]">
                                            <AnimatePresence mode="wait">
                                                {activeSlide === 0 && (
                                                    <motion.div
                                                        key="slide0"
                                                        initial={{ opacity: 0, scale: 0.98 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.98 }}
                                                        transition={{ duration: 0.3 }}
                                                        className="w-full h-full relative bg-black flex items-center justify-center overflow-hidden"
                                                    >
                                                        <video
                                                            src="/Product_showcase_animation_works…_202606181555.mp4"
                                                            autoPlay
                                                            loop
                                                            muted
                                                            playsInline
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </motion.div>
                                                )}

                                                {activeSlide === 1 && (
                                                    <motion.div
                                                        key="slide1"
                                                        initial={{ opacity: 0, scale: 0.98 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.98 }}
                                                        transition={{ duration: 0.3 }}
                                                        className="w-full h-full grid grid-cols-12 text-left overflow-hidden"
                                                    >
                                                        {/* Sidebar Palette */}
                                                        <div className="col-span-4 flex flex-col border-r border-white/[0.05] p-3 bg-[#09090d] text-[11px] space-y-3 shrink-0">
                                                            <div className="text-gray-500 font-semibold uppercase tracking-wider text-[9px] font-mono">Architecture Palette</div>
                                                            <div className="space-y-1.5">
                                                                <div className="flex items-center gap-2 p-1.5 rounded bg-white/[0.02] border border-white/[0.05] text-gray-300">
                                                                    <Activity className="w-3.5 h-3.5 text-indigo-400" />
                                                                    <span>Application Load Balancer</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 p-1.5 rounded bg-white/[0.02] border border-white/[0.05] text-gray-300">
                                                                    <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                                                                    <span>ECS / Fargate Service</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 p-1.5 rounded bg-white/[0.02] border border-white/[0.05] text-gray-300">
                                                                    <Database className="w-3.5 h-3.5 text-purple-400" />
                                                                    <span>Amazon DynamoDB</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 p-1.5 rounded bg-white/[0.02] border border-white/[0.05] text-gray-300">
                                                                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                                                                    <span>Cognito Identity Pool</span>
                                                                </div>
                                                            </div>
                                                            <div className="border-t border-white/[0.05] pt-3 mt-auto">
                                                                <div className="text-gray-500 font-semibold uppercase tracking-wider text-[9px] mb-1.5 font-mono">Workspace Prompt</div>
                                                                <div className="p-2 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono text-[9px] leading-relaxed">
                                                                    "Deploy a highly available web system."
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Canvas */}
                                                        <div className="col-span-8 relative bg-[#0a0a0c] p-4 flex flex-col justify-between overflow-hidden">
                                                            <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
                                                            <div className="relative flex-1 flex flex-col justify-between items-center py-6 z-10">
                                                                {/* ALB Node */}
                                                                <motion.div
                                                                    initial={{ scale: 0.8, opacity: 0, y: -10 }}
                                                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                                                    transition={{ delay: 0.2 }}
                                                                    className="flex items-center gap-2.5 bg-[#111116] border border-indigo-500/40 px-3 py-2 rounded shadow-lg shadow-indigo-500/5"
                                                                >
                                                                    <div className="p-1 rounded bg-indigo-500/20 text-indigo-400">
                                                                        <Activity className="w-3.5 h-3.5" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-[8px] text-gray-500 font-mono leading-none">AWS ALB</div>
                                                                        <div className="text-[10px] font-bold text-white">web-balancer</div>
                                                                    </div>
                                                                </motion.div>

                                                                {/* Connections */}
                                                                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                                                                    <motion.path
                                                                        initial={{ pathLength: 0 }}
                                                                        animate={{ pathLength: 1 }}
                                                                        transition={{ delay: 0.4, duration: 0.8 }}
                                                                        d="M 180 55 L 80 135 M 180 55 L 280 135"
                                                                        fill="none"
                                                                        stroke="#6366f1"
                                                                        strokeWidth="1.2"
                                                                        strokeDasharray="4 4"
                                                                    />
                                                                </svg>

                                                                {/* Servers */}
                                                                <div className="w-full flex justify-between px-6 my-2">
                                                                    <motion.div
                                                                        initial={{ scale: 0.8, opacity: 0, x: -10 }}
                                                                        animate={{ scale: 1, opacity: 1, x: 0 }}
                                                                        transition={{ delay: 0.5 }}
                                                                        className="flex items-center gap-2.5 bg-[#111116] border border-white/10 px-3 py-2 rounded shadow"
                                                                    >
                                                                        <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                                                                        <div>
                                                                            <div className="text-[8px] text-gray-500 leading-none">ECS Fargate</div>
                                                                            <span className="text-[10px] text-white font-bold">server-a</span>
                                                                        </div>
                                                                    </motion.div>
                                                                    <motion.div
                                                                        initial={{ scale: 0.8, opacity: 0, x: 10 }}
                                                                        animate={{ scale: 1, opacity: 1, x: 0 }}
                                                                        transition={{ delay: 0.6 }}
                                                                        className="flex items-center gap-2.5 bg-[#111116] border border-white/10 px-3 py-2 rounded shadow"
                                                                    >
                                                                        <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                                                                        <div>
                                                                            <div className="text-[8px] text-gray-500 leading-none">ECS Fargate</div>
                                                                            <span className="text-[10px] text-white font-bold">server-b</span>
                                                                        </div>
                                                                    </motion.div>
                                                                </div>

                                                                <div className="h-4" />
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}

                                                {activeSlide === 2 && (
                                                    <motion.div
                                                        key="slide2"
                                                        initial={{ opacity: 0, scale: 0.98 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.98 }}
                                                        transition={{ duration: 0.3 }}
                                                        className="w-full h-full grid grid-cols-12 text-left overflow-hidden"
                                                    >
                                                        {/* Visual Canvas (Left half of screen) */}
                                                        <div className="col-span-6 relative bg-[#0a0a0c] p-4 border-r border-white/[0.05] flex flex-col justify-center items-center overflow-hidden">
                                                            <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none" />
                                                            <div className="relative flex flex-col items-center gap-5 z-10">
                                                                <div className="flex items-center gap-2 bg-[#111116] border border-indigo-500/40 px-2.5 py-1.5 rounded shadow-lg">
                                                                    <Activity className="w-3.5 h-3.5 text-indigo-400" />
                                                                    <span className="text-[10px] font-mono text-white">web-alb</span>
                                                                </div>
                                                                <div className="w-[1px] h-8 border-l border-dashed border-indigo-500/40" />
                                                                <div className="flex items-center gap-2 bg-[#111116] border border-white/10 px-2.5 py-1.5 rounded shadow">
                                                                    <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                                                                    <span className="text-[10px] font-mono text-white">web-asg</span>
                                                                </div>
                                                                <div className="w-[1px] h-8 border-l border-dashed border-purple-500/40" />
                                                                <div className="flex items-center gap-2 bg-[#111116] border border-purple-500/40 px-2.5 py-1.5 rounded shadow-lg">
                                                                    <Database className="w-3.5 h-3.5 text-purple-400" />
                                                                    <span className="text-[10px] font-mono text-white">postgres-db</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Code Editor (Right half of screen) */}
                                                        <div className="col-span-6 bg-[#050508] p-4 font-mono text-[10px] leading-relaxed text-gray-300 overflow-y-auto h-full flex flex-col justify-start">
                                                            <div className="text-purple-400 mb-1"># Generated Terraform Configuration</div>
                                                            <div className="text-blue-400">resource <span className="text-amber-400">"aws_elb" "web_alb"</span> &#123;</div>
                                                            <div className="pl-3 text-gray-400">name = <span className="text-green-400">"web-application-load-balancer"</span></div>
                                                            <div className="pl-3 text-gray-400">subnets = [aws_subnet.public_a.id, aws_subnet.public_b.id]</div>
                                                            <div className="text-blue-400">&#125;</div>

                                                            <div className="mt-2 text-blue-400">resource <span className="text-amber-400">"aws_autoscaling_group" "web_asg"</span> &#123;</div>
                                                            <div className="pl-3 text-gray-400">desired_capacity = <span className="text-purple-400">2</span></div>
                                                            <div className="pl-3 text-gray-400">max_size         = <span className="text-purple-400">5</span></div>
                                                            <div className="text-blue-400">&#125;</div>

                                                            <div className="mt-2 text-blue-400">resource <span className="text-amber-400">"aws_db_instance" "db"</span> &#123;</div>
                                                            <div className="pl-3 text-gray-400">engine = <span className="text-green-400">"postgres"</span></div>
                                                            <div className="pl-3 text-gray-400">instance_class = <span className="text-green-400">"db.t4g.micro"</span></div>
                                                            <div className="text-blue-400">&#125;</div>
                                                        </div>
                                                    </motion.div>
                                                )}

                                                {activeSlide === 3 && (
                                                    <motion.div
                                                        key="slide3"
                                                        initial={{ opacity: 0, scale: 0.98 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.98 }}
                                                        transition={{ duration: 0.3 }}
                                                        className="w-full h-full relative bg-[#0a0a0c] p-4 flex flex-col justify-between overflow-hidden"
                                                    >
                                                        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

                                                        {/* Header inside canvas */}
                                                        <div className="flex items-center justify-between z-10 border-b border-white/[0.04] pb-2">
                                                            <span className="text-[9px] font-mono text-gray-500">active developers: 3</span>
                                                            <span className="inline-flex items-center gap-1.5 text-[9px] text-emerald-400 font-mono font-semibold">
                                                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                                                multiplayer active
                                                            </span>
                                                        </div>

                                                        {/* Node items */}
                                                        <div className="flex-1 flex justify-around items-center z-10">
                                                            <div className="flex items-center gap-2.5 bg-[#111116] border border-indigo-500/40 px-3 py-2 rounded shadow-lg">
                                                                <Activity className="w-3.5 h-3.5 text-indigo-400" />
                                                                <span className="text-[10px] font-mono text-white">web-alb</span>
                                                            </div>
                                                            <div className="flex items-center gap-2.5 bg-[#111116] border border-purple-500/40 px-3 py-2 rounded shadow-lg">
                                                                <Database className="w-3.5 h-3.5 text-purple-400" />
                                                                <span className="text-[10px] font-mono text-white">postgres-db</span>
                                                            </div>
                                                        </div>

                                                        {/* Simulated Multiplayer Cursors */}
                                                        <motion.div
                                                            animate={{ x: [60, 160, 100], y: [60, 110, 80] }}
                                                            transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
                                                            className="absolute z-20 flex flex-col items-start"
                                                        >
                                                            <svg className="w-3.5 h-3.5 text-indigo-400 drop-shadow" viewBox="0 0 24 24" fill="currentColor">
                                                                <path d="M4.5 3v15.2l4.8-4.8 5.7 5.7 2-2-5.7-5.7 7.2-.6z" />
                                                            </svg>
                                                            <span className="px-1.5 py-0.5 rounded bg-indigo-500 text-white text-[8px] font-mono font-semibold shadow-md">sara</span>
                                                        </motion.div>

                                                        <motion.div
                                                            animate={{ x: [290, 200, 260], y: [120, 70, 140] }}
                                                            transition={{ repeat: Infinity, duration: 9, ease: "easeInOut", delay: 1.5 }}
                                                            className="absolute z-20 flex flex-col items-start"
                                                        >
                                                            <svg className="w-3.5 h-3.5 text-emerald-400 drop-shadow" viewBox="0 0 24 24" fill="currentColor">
                                                                <path d="M4.5 3v15.2l4.8-4.8 5.7 5.7 2-2-5.7-5.7 7.2-.6z" />
                                                            </svg>
                                                            <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-white text-[8px] font-mono font-semibold shadow-md">alex_lead</span>
                                                        </motion.div>

                                                        <motion.div
                                                            animate={{ x: [120, 230, 150], y: [140, 120, 90] }}
                                                            transition={{ repeat: Infinity, duration: 11, ease: "easeInOut", delay: 3 }}
                                                            className="absolute z-20 flex flex-col items-start"
                                                        >
                                                            <svg className="w-3.5 h-3.5 text-purple-400 drop-shadow" viewBox="0 0 24 24" fill="currentColor">
                                                                <path d="M4.5 3v15.2l4.8-4.8 5.7 5.7 2-2-5.7-5.7 7.2-.6z" />
                                                            </svg>
                                                            <span className="px-1.5 py-0.5 rounded bg-purple-500 text-white text-[8px] font-mono font-semibold shadow-md">devops_john</span>
                                                        </motion.div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                </div>

                                {/* MacBook Base Keyboard/Lip */}
                                <div className="relative h-4 w-[103%] -left-[1.5%] bg-gradient-to-b from-[#2a2a2f] via-[#202022] to-[#121214] rounded-b-xl shadow-[0_15px_35px_rgba(0,0,0,0.6)] z-20 flex justify-center border-t border-[#44444a]/20">
                                    <div className="w-28 h-1.5 bg-[#0a0a0c] rounded-b-sm border-t border-[#404045]" />
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Feature Display (Linear, Stacked cards - clean responsive fallback) */}
            <div id="how-it-works" className="lg:hidden block px-6 py-20 bg-[#0a0a0c] border-t border-white/[0.05]">
                <div className="max-w-xl mx-auto flex flex-col gap-16">
                    <div className="text-center">
                        <span className="text-xs font-mono tracking-widest text-indigo-400 uppercase font-semibold">
                            Platform Tour
                        </span>
                        <h2 className="text-2xl font-bold text-white tracking-tight mt-2">
                            Engineered for high-performing Devs
                        </h2>
                    </div>

                    {slides.map((slide, idx) => (
                        <div key={idx} className="flex flex-col gap-6 border border-white/[0.05] bg-white/[0.01] rounded-2xl p-5">
                            <div>
                                <span className="text-[10px] font-mono tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 uppercase font-semibold">
                                    {slide.tag}
                                </span>
                                <h3 className="text-xl font-bold text-white mt-3 mb-2">{slide.title}</h3>
                                <p className="text-xs text-gray-400 leading-relaxed">{slide.description}</p>
                            </div>                            {/* Miniature/Simple MacBook Screen Simulation */}
                            <div className="relative border-4 border-[#1d1d22] rounded-t-xl bg-[#0a0a0c] overflow-hidden aspect-[16/10] z-10 w-full shadow-lg">
                                {/* Notch */}
                                <div className="absolute -top-[4px] left-1/2 -translate-x-1/2 w-16 h-[14px] bg-[#1d1d22] rounded-b-[4px] z-[30] flex items-center justify-center gap-1 pt-[4px]">
                                    <div className="w-0.5 h-0.5 rounded-full bg-black flex items-center justify-center">
                                        <div className="w-[0.25px] h-[0.25px] rounded-full bg-[#092d3a]" />
                                    </div>
                                    <div className="w-[0.5px] h-[0.5px] rounded-full bg-emerald-400/80 shadow-[0_0_2px_#10b981]" />
                                </div>

                                {/* Screen Content */}
                                <div className="w-full h-full bg-[#0a0a0c] overflow-hidden flex flex-col pt-1">
                                    <div className="flex items-center justify-between border-b border-white/[0.05] px-2 py-1 bg-[#0c0c10] text-[8px] text-gray-500">
                                        <span>spec.tf</span>
                                        <span className="text-emerald-400 font-semibold">● Active</span>
                                    </div>
                                    <div className="flex-1 relative bg-[#070709] p-3 flex items-center justify-center">
                                        {idx === 0 && (
                                            <video
                                                src="/Product_showcase_animation_works…_202606181555.mp4"
                                                autoPlay
                                                loop
                                                muted
                                                playsInline
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                        {idx === 1 && (
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="flex items-center gap-1.5 bg-[#111116] border border-indigo-500/40 px-2 py-1 rounded">
                                                    <Activity className="w-3 h-3 text-indigo-400" />
                                                    <span className="text-[8px] text-white">web-balancer</span>
                                                </div>
                                                <div className="w-[1px] h-4 border-l border-dashed border-indigo-500/40" />
                                                <div className="flex items-center gap-1.5 bg-[#111116] border border-white/10 px-2 py-1 rounded">
                                                    <Cpu className="w-3 h-3 text-emerald-400" />
                                                    <span className="text-[8px] text-white">server-a</span>
                                                </div>
                                            </div>
                                        )}
                                        {idx === 2 && (
                                            <div className="font-mono text-[8px] leading-relaxed text-gray-300 text-left w-full h-full overflow-y-auto">
                                                <div className="text-blue-400">resource "aws_elb" "web_alb" &#123;</div>
                                                <div className="pl-2 text-gray-500">name = "web-alb"</div>
                                                <div className="text-blue-400">&#125;</div>
                                            </div>
                                        )}
                                        {idx === 3 && (
                                            <div className="relative w-full h-full flex items-center justify-center">
                                                <div className="flex items-center gap-1.5 bg-[#111116] border border-indigo-500/40 px-2 py-1 rounded">
                                                    <Activity className="w-3.5 h-3.5 text-indigo-400" />
                                                    <span className="text-[8px] text-white">multiplayer</span>
                                                </div>
                                                <div className="absolute top-1 left-2 bg-indigo-500 text-white text-[6px] px-1 rounded">sara</div>
                                                <div className="absolute bottom-1 right-2 bg-emerald-500 text-white text-[6px] px-1 rounded">alex</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {/* MacBook Base Keyboard/Lip */}
                            <div className="relative h-1 w-[102%] -left-[1%] bg-gradient-to-b from-[#2a2a2f] to-[#121214] rounded-b-sm z-20" />
                        </div>
                    ))}
                </div>
            </div>



            {/* Shared Background Container for IDE, Sandbox, and Pricing */}
            <div className="relative z-40 overflow-hidden bg-[#070709] border-t border-white/[0.05]">
                {/* LightPillar Background Component Spanning Sections */}
                <div className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-700 ${showEffects ? 'opacity-75' : 'opacity-0'}`}>
                    {showEffects && (
                    <LightPillar
                        topColor="#5227FF"
                        bottomColor="#FF9FFC"
                        intensity={0.9}
                        rotationSpeed={0.15}
                        glowAmount={0.004}
                        pillarWidth={4.0}
                        pillarHeight={0.35}
                        noiseIntensity={0.25}
                        pillarRotation={15}
                        interactive={false}
                        mixBlendMode="screen"
                    />
                    )}
                </div>

                {/* VS Code Workspace Compiler Preview */}
                <IDEPreviewSection />

                {/* Sandbox IaC Interactive Playground */}
                <SandboxSection />

                {/* B2B Pricing Tier Section */}
                <PricingSection />
            </div>

            {/* CTA Section */}
            <section className="border-t border-white/[0.05] py-24 px-6 text-center bg-[#070709]">
                <div className="max-w-4xl mx-auto">
                    <h3 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-6">
                        Build your next architecture with absolute flow
                    </h3>
                    <p className="text-gray-400 max-w-lg mx-auto mb-10 text-sm leading-relaxed">
                        Start mapping visual assets, generating Terraform patterns, and co-authoring layout boards with teams in seconds.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Link href="/signin?signup=true" className="bg-white hover:bg-gray-200 text-black font-bold px-6 py-3 rounded-lg shadow-lg transition-all text-xs">
                            Create Free Account
                        </Link>
                        <Link href="/library" className="border border-white/10 hover:bg-white/5 text-white font-medium px-6 py-3 rounded-lg transition-all text-xs">
                            Launch Sandbox
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/[0.05] bg-[#070709] pt-20 pb-10 px-8 relative z-40 overflow-hidden">
                {/* LightPillar Background Component */}
                <div className={`absolute inset-0 w-full h-full pointer-events-none -z-10 transition-opacity duration-700 ${showEffects ? 'opacity-25' : 'opacity-0'}`}>
                    {showEffects && (
                    <LightPillar
                        topColor="#4f46e5"
                        bottomColor="#a855f7"
                        intensity={0.5}
                        rotationSpeed={0.1}
                        glowAmount={0.002}
                        pillarWidth={6.0}
                        pillarHeight={0.25}
                        noiseIntensity={0.15}
                        pillarRotation={340}
                        interactive={false}
                        mixBlendMode="screen"
                    />
                    )}
                </div>

                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
                        {/* Brand Column */}
                        <div className="col-span-2 flex flex-col gap-4">
                            <div className="flex items-center gap-2">
                                <img src="/logo.png" alt="FlowState Logo" className="w-5 h-5 object-contain" />
                                <span className="text-white font-bold text-base tracking-tight">FlowState</span>
                            </div>
                            <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
                                The visual compiler for cloud engineers. Design system topology on our interactive canvas and compile clean, ready-to-deploy HashiCorp Terraform configuration automatically.
                            </p>

                        </div>

                        {/* Product Column */}
                        <div className="flex flex-col gap-3.5">
                            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Product</h4>
                            <Link href="#features" className="text-xs text-gray-400 hover:text-white transition-colors">Features</Link>
                            <Link href="#how-it-works" className="text-xs text-gray-400 hover:text-white transition-colors">Walkthrough</Link>
                            <Link href="#sandbox" className="text-xs text-gray-400 hover:text-white transition-colors">IaC Engine</Link>
                            <Link href="#pricing" className="text-xs text-gray-400 hover:text-white transition-colors">Pricing Options</Link>
                        </div>

                        {/* Resources Column */}
                        <div className="flex flex-col gap-3.5">
                            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Resources</h4>
                            <Link href="#how-it-works" className="text-xs text-gray-400 hover:text-white transition-colors">Documentation</Link>
                            <a href="#" className="text-xs text-gray-400 hover:text-white transition-colors">API Reference</a>
                            <a href="#" className="text-xs text-gray-400 hover:text-white transition-colors">Terraform Registry</a>
                            <a href="#" className="text-xs text-gray-400 hover:text-white transition-colors">Cloud Best Practices</a>
                        </div>

                        {/* Security & Legal Column */}
                        <div className="flex flex-col gap-3.5">
                            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Security & Legal</h4>
                            <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-semibold">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>SOC2 Type II Certified</span>
                            </div>
                            <a href="#" className="text-xs text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
                            <a href="#" className="text-xs text-gray-400 hover:text-white transition-colors">Terms of Service</a>
                            <a href="mailto:security@flowstate.platform" className="text-xs text-gray-400 hover:text-white transition-colors">Trust Center</a>
                        </div>
                    </div>

                    <div className="border-t border-white/[0.05] pt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-[11px] text-gray-500">
                        <div>
                            © {new Date().getFullYear()} FlowState Platform Inc. All rights reserved. Secured with AWS Cognito, IAM roles, and DynamoDB.
                        </div>
                        <div className="flex gap-6 items-center">
                            <div className="flex items-center gap-2 mr-4 border-r border-white/[0.1] pr-6">
                                <span className="uppercase font-bold tracking-wider text-[9px] text-gray-400">Visual Effects</span>
                                <button 
                                    onClick={() => setShowEffects(!showEffects)}
                                    className={`w-7 h-3.5 rounded-full relative transition-colors ${showEffects ? 'bg-indigo-500' : 'bg-[#2a2a30]'}`}
                                    aria-label="Toggle visual effects"
                                >
                                    <div className={`absolute top-[2px] bottom-[2px] w-2.5 rounded-full bg-white transition-transform duration-300 ${showEffects ? 'translate-x-[14px]' : 'translate-x-[2px]'}`} />
                                </button>
                            </div>
                            <a href="#" className="hover:text-gray-300">Twitter</a>
                            <a href="#" className="hover:text-gray-300">GitHub</a>
                            <a href="#" className="hover:text-gray-300">Discord</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
