"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Monitor, Bell, Palette, Globe, Shield, CreditCard, ChevronRight, Wand2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getCurrentSession } from '@/lib/aws-client';

export default function SettingsPage() {
    const router = useRouter();
    const { user, loading } = useAuth(true);
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
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session.idToken}`,
                    },
                    body: JSON.stringify({
                        hoverStyle: value,
                    }),
                });
            } catch (err) {
                console.error("Error saving setting:", err);
            }
        }
    };

    if (loading || !user) return <div className="min-h-screen bg-[#f0f4f9]" />;

    const settingsLinks = [
        { icon: <Monitor className="w-5 h-5 text-google-blue" />, title: "General", desc: "Language, region, and basic app behavior", color: "bg-blue-50" },
        { icon: <Palette className="w-5 h-5 text-google-red" />, title: "Appearance", desc: "Dark mode, themes, and canvas styling", color: "bg-red-50" },
        { icon: <Bell className="w-5 h-5 text-google-yellow" />, title: "Notifications", desc: "Emails, alerts, and collaborate pings", color: "bg-yellow-50" },
        { icon: <Shield className="w-5 h-5 text-google-green" />, title: "Privacy & Data", desc: "Manage how your workspace data is used", color: "bg-green-50" },
        { icon: <Globe className="w-5 h-5 text-gray-600" />, title: "Integrations", desc: "Connect GitHub, Jira, and Slack", color: "bg-gray-100" },
        { icon: <CreditCard className="w-5 h-5 text-purple-600" />, title: "Billing & Plans", desc: "Upgrade to Genesis Pro or manage team seats", color: "bg-purple-50" },
    ];

    return (
        <main className="relative z-10 w-full min-h-screen bg-[#f0f4f9] overflow-x-hidden pt-28 pb-24 text-[#1f1f1f]">
            {/* Top navigation bar */}
            <header className="absolute top-0 w-full px-8 py-6 flex items-center justify-between z-50">
                <Link href="/library" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Back to Library</span>
                </Link>
                <div className="flex items-center gap-2">
                    <span className="text-gray-900 font-semibold ml-1">Settings</span>
                </div>

                {/* Profile Avatar */}
                <div className="relative flex items-center justify-end w-24">
                    <div className="w-10 h-10 rounded-full bg-google-blue text-white flex items-center justify-center font-medium text-lg shadow-sm">
                        {user.firstName ? user.firstName[0].toUpperCase() : user.email[0].toUpperCase()}
                    </div>
                </div>
            </header>

            <div className="max-w-[1200px] mx-auto px-4">
                <div className="mb-8 pl-4">
                    <h1 className="text-3xl font-[400] text-gray-900 mb-2">Workspace Settings</h1>
                    <p className="text-gray-600">Customize how FlowState looks and operates across all your devices.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {settingsLinks.map((link, i) => (
                        <div key={i} className="bg-white rounded-[24px] border border-gray-200 shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex items-center p-6 hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all group">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-5 shrink-0 transition-transform group-hover:scale-110 ${link.color}`}>
                                {link.icon}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-[16px] font-medium text-[#1f1f1f] mb-0.5">{link.title}</h3>
                                <p className="text-[13px] text-[#444746] leading-snug">{link.desc}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-google-blue transition-colors ml-2 shrink-0" />
                        </div>
                    ))}
                </div>

                <div className="mb-6 pl-4 mt-8">
                    <h2 className="text-[20px] font-[400] text-[#1f1f1f] mb-2">Experimental Features</h2>
                    <p className="text-[#444746] text-sm">Configure beta tools and visual effects like the landing page hover mask.</p>
                </div>

                <div className="bg-white rounded-[24px] border border-gray-200 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)] mb-8">
                    <div className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="mt-1 shrink-0">
                                <Wand2 className="w-6 h-6 text-indigo-500" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-[16px] font-[500] text-[#1f1f1f] mb-1">Landing Page Hover Style</h3>
                                <p className="text-[14px] text-[#444746] mb-5">Choose the visual effect used when moving your mouse over the primary hero banner on the home page.</p>

                                <select
                                    value={hoverStyle}
                                    onChange={handleHoverStyleChange}
                                    className="w-full sm:w-72 px-4 py-3 bg-[#f0f4f9] border border-transparent rounded-[12px] text-[14px] text-[#1f1f1f] focus:outline-none focus:border-google-blue focus:bg-white transition-all cursor-pointer"
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
                </div>

                <div className="mt-12 flex justify-center">
                    <button className="text-[14px] font-[500] text-google-red hover:bg-red-50 px-5 py-2.5 rounded-full transition-colors">
                        Delete Workspace Account
                    </button>
                </div>
            </div>
        </main>
    );
}
