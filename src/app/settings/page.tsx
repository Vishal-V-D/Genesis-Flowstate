"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Layers, Monitor, Bell, Palette, Globe, Shield, CreditCard, ChevronRight, Wand2, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getCurrentSession } from '@/lib/supabase-client';
import { useTheme } from '@/context/ThemeContext';

export default function SettingsPage() {
    const router = useRouter();
    const { user, loading, logout } = useAuth(true);
    const { theme, toggleTheme } = useTheme();
    const [hoverStyle, setHoverStyle] = useState("tear");

    useEffect(() => {
        if (user && user.hoverStyle) {
            setHoverStyle(user.hoverStyle);
        }
    }, [user]);

    const handleHoverStyleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setHoverStyle(value);
        if (user) {
            try {
                const session = getCurrentSession();
                if (!session) return;
                await fetch("/api/users/profile", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.idToken}` },
                    body: JSON.stringify({ hoverStyle: value }),
                });
            } catch (err) {
                console.error("Error saving setting:", err);
            }
        }
    };

    if (loading || !user) return <div className="min-h-screen bg-[#f8f9fb] dark:bg-dark-bg" />;

    const settingsLinks = [
        { icon: <Monitor className="w-5 h-5 text-google-blue" />, title: "General", desc: "Language, region, and basic app behavior", color: "bg-blue-50 dark:bg-dark-border", action: () => {} },
        { icon: <Bell className="w-5 h-5 text-google-yellow" />, title: "Notifications", desc: "Emails, alerts, and collaborate pings", color: "bg-yellow-50 dark:bg-dark-border", action: () => {} },
        { icon: <Shield className="w-5 h-5 text-google-green" />, title: "Privacy & Data", desc: "Manage how your workspace data is used", color: "bg-green-50 dark:bg-dark-border", action: () => {} },
        { icon: <Globe className="w-5 h-5 text-gray-600 dark:text-dark-muted" />, title: "Integrations", desc: "Connect GitHub, Jira, and Slack", color: "bg-gray-100 dark:bg-dark-border", action: () => {} },
        { icon: <CreditCard className="w-5 h-5 text-purple-600" />, title: "Billing & Plans", desc: "Upgrade to Genesis Pro or manage team seats", color: "bg-purple-50 dark:bg-dark-border", action: () => {} },
    ];

    return (
        <main className="relative w-full min-h-screen bg-[#f8f9fb] dark:bg-dark-bg overflow-x-hidden">

            {/* Header */}
            <header className="sticky top-0 z-20 w-full bg-white/80 dark:bg-dark-bg/95 backdrop-blur-md border-b border-gray-100/80 dark:border-dark-border/80">
                <div className="w-full px-10 h-14 flex items-center">
                    <div className="flex items-center gap-3 flex-1">
                        <Link href="/home" className="flex items-center gap-1.5 text-gray-400 dark:text-dark-subtle hover:text-gray-700 dark:hover:text-dark-muted transition-colors group">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                            <span className="text-[13px] font-medium">Back</span>
                        </Link>
                        <span className="text-gray-200 dark:text-dark-subtle text-lg font-light">|</span>
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

                    <div className="flex items-center gap-1 flex-1 justify-end">
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

            <div className="w-full px-10 pt-12 pb-24">

                {/* Page heading */}
                <div className="mb-10">
                    <p className="text-[11px] font-semibold text-gray-400 dark:text-dark-subtle tracking-widest uppercase mb-2">Configuration</p>
                    <h1 className="text-[32px] font-semibold text-gray-900 dark:text-dark-text tracking-tight mb-2">Settings</h1>
                    <p className="text-gray-400 dark:text-dark-muted text-[15px]">Customize how Genesis looks and operates across all your devices.</p>
                </div>

                {/* Dark mode toggle — prominent */}
                <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border shadow-sm p-6 mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-[#7c5cbf]/15' : 'bg-amber-50'}`}>
                                {theme === 'dark'
                                    ? <Moon className="w-5 h-5 text-[#7c5cbf]" />
                                    : <Sun className="w-5 h-5 text-amber-500" />
                                }
                            </div>
                            <div>
                                <p className="text-[15px] font-semibold text-gray-900 dark:text-dark-text">
                                    {theme === 'dark' ? 'Dark mode' : 'Light mode'}
                                </p>
                                <p className="text-[13px] text-gray-400 dark:text-dark-muted mt-0.5">
                                    {theme === 'dark' ? 'Using Gemini dark palette' : 'Switch to dark for low-light environments'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className={`relative w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none ${
                                theme === 'dark' ? 'bg-[#7c5cbf]' : 'bg-gray-200'
                            }`}
                            aria-label="Toggle dark mode"
                        >
                            <span
                                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                                    theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                                }`}
                            />
                        </button>
                    </div>
                </div>

                {/* Settings grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                    {settingsLinks.map((link, i) => (
                        <button
                            key={i}
                            onClick={link.action}
                            className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border shadow-sm flex items-center p-5 hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all group text-left"
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 shrink-0 transition-transform group-hover:scale-110 ${link.color}`}>
                                {link.icon}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-[14px] font-semibold text-gray-900 dark:text-dark-text mb-0.5">{link.title}</h3>
                                <p className="text-[12px] text-gray-400 dark:text-dark-muted leading-snug">{link.desc}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300 dark:text-dark-subtle group-hover:text-google-blue transition-colors ml-2 shrink-0" />
                        </button>
                    ))}
                </div>

                {/* Experimental */}
                <p className="text-[11px] font-semibold text-gray-400 dark:text-dark-subtle tracking-widest uppercase mb-4">Experimental</p>
                <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border shadow-sm p-6 mb-10">
                    <div className="flex items-start gap-4">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-dark-border flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Wand2 className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-[14px] font-semibold text-gray-900 dark:text-dark-text mb-1">Landing Page Hover Style</h3>
                            <p className="text-[13px] text-gray-400 dark:text-dark-muted mb-5 leading-relaxed">
                                Choose the visual effect when hovering the primary hero banner.
                            </p>
                            <select
                                value={hoverStyle}
                                onChange={handleHoverStyleChange}
                                className="w-full sm:w-72 px-4 py-2.5 bg-gray-50 dark:bg-dark-border border border-gray-100 dark:border-dark-border rounded-xl text-[13px] text-gray-700 dark:text-dark-text focus:outline-none focus:border-google-blue transition-all cursor-pointer"
                            >
                                <option value="svgMask">Flashlight / X-Ray</option>
                                <option value="tear">Paper Tear (Default)</option>
                                <option value="smooth">Smooth Overlay</option>
                                <option value="splatter">Ink Splatter</option>
                                <option value="glitch">Digital Glitch</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex justify-center">
                    <button className="text-[13px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 px-5 py-2.5 rounded-xl transition-colors">
                        Delete account
                    </button>
                </div>
            </div>
        </main>
    );
}
