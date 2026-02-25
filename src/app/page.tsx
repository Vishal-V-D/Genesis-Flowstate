"use client";
import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';
import Features from '@/components/landing/Features';
import GeminiPowered from '@/components/landing/GeminiPowered';
import VsTraditional from '@/components/landing/VsTraditional';
import HowItWorks from '@/components/landing/HowItWorks';
import CTASection from '@/components/landing/CTASection';
import Footer from '@/components/landing/Footer';
import { PaperTearEffect } from '@/components/ui/paper-tear-effect';
import { MaskContainer } from '@/components/ui/svg-mask-effect';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function Home() {
    const { user, loading } = useAuth();
    const [hoverStyle, setHoverStyle] = useState<"svgMask" | "tear" | "smooth" | "splatter" | "glitch">("tear");

    useEffect(() => {
        if (user && user.hoverStyle) {
            setHoverStyle(user.hoverStyle);
        }
    }, [user]);

    const handleHoverChange = async (style: "svgMask" | "tear" | "smooth" | "splatter" | "glitch") => {
        setHoverStyle(style);

        if (user) {
            try {
                await updateDoc(doc(db, "users", user.uid), { hoverStyle: style });
            } catch (err) {
                console.error("Error saving setting to Firestore:", err);
            }
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    return (
        <main className="relative z-10 w-full overflow-x-hidden">
            {/* Nav Header - landing page only */}
            <header className="absolute top-0 w-full p-6 flex justify-between items-center z-10">
                <div className="flex gap-6 items-center text-sm font-medium text-gray-500">
                    <span className="text-gray-900 font-semibold cursor-pointer">FlowState</span>
                    <Link href="#features" className="cursor-pointer hover:text-gray-900 transition-colors">Features</Link>
                    <Link href="#how-it-works" className="cursor-pointer hover:text-gray-900 transition-colors">How it works</Link>
                    <Link href="#compare" className="cursor-pointer hover:text-gray-900 transition-colors">Compare</Link>
                </div>
                <div className="flex items-center gap-4">
                    {user ? (
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-gray-600 hidden sm:block">
                                Hi, {user.firstName || user.email.split('@')[0]}
                            </span>
                            <button
                                onClick={handleSignOut}
                                className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
                            >
                                Sign out
                            </button>

                        </div>
                    ) : (
                        <Link href="/signin" className="bg-gray-100 hover:bg-gray-200 text-sm font-medium px-5 py-2.5 rounded-full transition-colors text-gray-800">
                            Sign in
                        </Link>
                    )}
                </div>
            </header>

            {/* Hero Section - Full Viewport Height */}
            <section className="flex flex-col items-center justify-center w-full min-h-[100vh] p-8 text-center relative">
                {hoverStyle === "svgMask" ? (
                    <MaskContainer
                        className="w-full !bg-transparent mb-10"
                        revealSize={400}
                        revealText={
                            <div className="flex flex-col items-center justify-center text-center">
                                {/* Small Kira FlowState header text */}
                                <div className="flex items-center gap-2 mb-6 pointer-events-auto">

                                    <span className="text-gray-600 font-medium text-lg">FlowState</span>
                                </div>

                                {/* Main hero heading */}
                                <h1 className="text-6xl md:text-5xl font-bold tracking-tight max-w-5xl text-gray-900 leading-[1.1] mb-6 pointer-events-auto">
                                    Experience system design like never before<br />with the world’s first AI Architect
                                </h1>

                                <p className="text-xl md:text-xl text-gray-500 max-w-2xl leading-relaxed pointer-events-auto">
                                    Talk through your system design, and watch your whiteboard come to life in real-time.
                                </p>
                            </div>
                        }
                    >
                        <div className="flex flex-col items-center justify-center text-center relative z-10 w-full h-full">
                            {/* Small Kira FlowState header text - active dark */}
                            <div className="flex items-center gap-2 mb-6 pointer-events-none">

                                <span className="text-gray-300 font-medium text-lg">FlowState</span>
                            </div>

                            {/* Main hero heading - active dark */}
                            <h1 className="text-6xl md:text-5xl font-bold tracking-tight max-w-5xl leading-[1.1] mb-6 text-white drop-shadow-sm">
                                The whiteboard that thinks<br />and builds as fast as you
                            </h1>

                            <p className="text-xl md:text-xl text-white-500 max-w-2xl leading-relaxed">
                                Stop drawing boxes. Start shipping systems — Kira handles the architecture so you handle the vision.
                            </p>
                        </div>
                    </MaskContainer>
                ) : (
                    <PaperTearEffect
                        className="w-full !bg-transparent mb-10"
                        variant={hoverStyle}
                        textHoverSize={400}
                        revealText={
                            <div className="flex flex-col items-center justify-center text-center">
                                {/* Small Kira FlowState header text */}
                                <div className="flex items-center gap-2 mb-6 pointer-events-auto">

                                    <span className="text-gray-600 font-medium text-lg">FlowState</span>
                                </div>

                                {/* Main hero heading */}
                                <h1 className="text-6xl md:text-5xl font-bold tracking-tight max-w-5xl text-gray-900 leading-[1.1] mb-6 pointer-events-auto">
                                    Experience system design like never before<br />with the world’s first AI Architect
                                </h1>

                                <p className="text-xl md:text-xl text-gray-500 max-w-2xl leading-relaxed pointer-events-auto">
                                    Talk through your system design, and watch your whiteboard come to life in real-time.
                                </p>
                            </div>
                        }
                    >
                        <div className="flex flex-col items-center justify-center text-center relative z-10 w-full h-full">
                            {/* Small Kira FlowState header text - active dark */}
                            <div className="flex items-center gap-2 mb-6 pointer-events-none">

                                <span className="text-gray-300 font-medium text-lg">FlowState</span>
                            </div>

                            {/* Main hero heading - active dark */}
                            <h1 className="text-6xl md:text-5xl font-bold tracking-tight max-w-5xl leading-[1.1] mb-6 text-white drop-shadow-sm">
                                The whiteboard that thinks<br />and builds as fast as you
                            </h1>

                            <p className="text-xl md:text-xl text-white-500 max-w-2xl leading-relaxed">
                                Stop drawing boxes. Start shipping systems — Kira handles the architecture so you handle the vision.
                            </p>
                        </div>
                    </PaperTearEffect>
                )}

                {/* Primary CTAs */}
                <div className="flex flex-col sm:flex-row items-center gap-4 relative z-50 pointer-events-auto">
                    <Link href="/library" className="flex items-center gap-2 bg-[#1a1a1a] hover:bg-black text-white px-8 py-3.5 rounded-full font-medium transition-all shadow-md hover:shadow-lg">
                        <Sparkles className="w-5 h-5" />
                        Open FlowState
                    </Link>
                    <button className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 px-8 py-3.5 rounded-full font-medium transition-all">
                        View Demo
                    </button>
                </div>

                {/* Disclaimer / Fine print */}
                <p className="mt-8 text-sm text-gray-400">
                    Runs directly in your browser.
                </p>
            </section>

            {/* FlowState AI Sections */}
            <div id="features"><Features /></div>
            <GeminiPowered />
            <div id="compare"><VsTraditional /></div>
            <div id="how-it-works"><HowItWorks /></div>
            <CTASection />
            <Footer hoverStyle={hoverStyle} onHoverStyleChange={handleHoverChange} />
        </main>
    );
}
