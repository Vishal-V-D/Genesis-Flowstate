"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Mail, Shield, Smartphone, Key } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';

export default function ProfilePage() {
    const { user, loading } = useAuth(true);

    if (loading || !user) return <div className="min-h-screen bg-[#f0f4f9]" />;

    return (
        <main className="relative z-10 w-full min-h-screen bg-[#f0f4f9] overflow-x-hidden pt-28 pb-24">
            {/* Top navigation bar */}
            <header className="absolute top-0 w-full px-8 py-6 flex items-center justify-between z-50">
                <Link href="/library" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Back to Library</span>
                </Link>
                <div className="flex items-center gap-2">
                    <span className="text-gray-900 font-semibold ml-1">FlowState Account</span>
                </div>

                {/* Profile Avatar (static since we are on profile) */}
                <div className="relative flex items-center justify-end w-24">
                    <div className="w-10 h-10 rounded-full bg-google-blue text-white flex items-center justify-center font-medium text-lg shadow-sm">
                        {user.firstName ? user.firstName[0].toUpperCase() : user.email[0].toUpperCase()}
                    </div>
                </div>
            </header>

            <div className="max-w-[1200px] mx-auto px-4">
                {/* Hero Section */}
                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full bg-google-blue text-white flex items-center justify-center text-5xl font-medium shadow-md">
                            {user.firstName ? user.firstName[0].toUpperCase() : user.email[0].toUpperCase()}
                        </div>
                        <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md border border-gray-100 text-gray-600 hover:text-google-blue transition-colors">
                            <span className="sr-only">Edit Profile Picture</span>
                            <User className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="text-center mb-10">
                    <h1 className="text-4xl font-[400] text-[#1f1f1f] mb-3 tracking-tight">Welcome, {user.firstName || 'User'}</h1>
                    <p className="text-[#444746] text-base">Manage your info, privacy, and security to make FlowState work better for you.</p>
                </div>

                {/* Info Cards Grid */}
                {/* Info Cards Masonry Layout */}
                <div className="flex flex-col md:flex-row gap-6">

                    {/* Left Column */}
                    <div className="flex-1 flex flex-col gap-6">
                        {/* Basic Info Card */}
                        <div className="bg-white rounded-[24px] border border-gray-200 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-end">
                                <div>
                                    <h2 className="text-[22px] font-[400] text-[#1f1f1f] mb-1">Basic info</h2>
                                    <p className="text-[14px] text-[#444746]">Some info may be visible to other people using FlowState services.</p>
                                </div>
                            </div>
                            <div className="divide-y divide-gray-100">
                                <div className="flex items-center px-6 py-4 hover:bg-[#f8fafd] cursor-pointer transition-colors group">
                                    <div className="text-[11px] font-[500] tracking-wider text-[#444746] w-1/3">PROFILE PICTURE</div>
                                    <div className="text-[14px] text-[#1f1f1f] w-2/3 flex items-center justify-between">
                                        <div className="text-[#444746]">A picture helps personalize your account</div>
                                        <div className="w-10 h-10 rounded-full bg-google-blue text-white flex items-center justify-center font-medium">
                                            {user.firstName ? user.firstName[0].toUpperCase() : user.email[0].toUpperCase()}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center px-6 py-4 hover:bg-[#f8fafd] cursor-pointer transition-colors group">
                                    <div className="text-[11px] font-[500] tracking-wider text-[#444746] w-1/3">NAME</div>
                                    <div className="text-[14px] text-[#1f1f1f] w-2/3 flex items-center justify-between">
                                        <div>{user.firstName} {user.lastName}</div>
                                        <div className="text-transparent group-hover:text-gray-400">&gt;</div>
                                    </div>
                                </div>
                                <div className="flex items-center px-6 py-4 hover:bg-[#f8fafd] cursor-pointer transition-colors group">
                                    <div className="text-[11px] font-[500] tracking-wider text-[#444746] w-1/3">ONBOARDING ROLE</div>
                                    <div className="text-[14px] text-[#1f1f1f] w-2/3 flex items-center justify-between">
                                        <div className="capitalize">{user.onboardingData?.accountType || 'Not set'}</div>
                                        <div className="text-transparent group-hover:text-gray-400">&gt;</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Security Card */}
                        <div className="bg-white rounded-[24px] border border-gray-200 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                            <div className="px-6 py-5 border-b border-gray-100 flex items-start gap-4">
                                <div className="mt-1">
                                    <Shield className="w-8 h-8 text-google-green shrink-0" />
                                </div>
                                <div>
                                    <h2 className="text-[22px] font-[400] text-[#1f1f1f] mb-1">Security recommendations</h2>
                                    <p className="text-[14px] text-[#444746]">Protect your account with these tailored security measures.</p>
                                </div>
                            </div>
                            <div className="divide-y divide-gray-100">
                                <div className="flex items-center px-6 py-5 gap-4 hover:bg-[#f8fafd] cursor-pointer transition-colors group">
                                    <Key className="w-5 h-5 text-gray-500 shrink-0" />
                                    <div className="flex-1 flex items-center justify-between">
                                        <div>
                                            <div className="text-[15px] text-[#1f1f1f]">Password</div>
                                            <div className="text-[13px] text-[#444746]">Last changed recently</div>
                                        </div>
                                        <div className="text-transparent group-hover:text-gray-400">&gt;</div>
                                    </div>
                                </div>
                                <div className="flex items-center px-6 py-5 gap-4 hover:bg-[#f8fafd] cursor-pointer transition-colors group">
                                    <Smartphone className="w-5 h-5 text-gray-500 shrink-0" />
                                    <div className="flex-1 flex items-center justify-between">
                                        <div>
                                            <div className="text-[15px] text-[#1f1f1f]">2-Step Verification</div>
                                            <div className="text-[13px] text-[#444746]">Off</div>
                                        </div>
                                        <div className="text-transparent group-hover:text-gray-400">&gt;</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="flex-1 flex flex-col gap-6">
                        {/* Contact Info Card */}
                        <div className="bg-white rounded-[24px] border border-gray-200 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                            <div className="px-6 py-5 border-b border-gray-100">
                                <h2 className="text-[22px] font-[400] text-[#1f1f1f] mb-1">Contact info</h2>
                                <p className="text-[14px] text-[#444746]">Where you receive important notifications.</p>
                            </div>
                            <div className="divide-y divide-gray-100">
                                <div className="flex items-center px-6 py-4 hover:bg-[#f8fafd] cursor-pointer transition-colors group">
                                    <div className="text-[11px] font-[500] tracking-wider text-[#444746] w-1/3">EMAIL</div>
                                    <div className="text-[14px] text-[#1f1f1f] w-2/3 flex items-center justify-between">
                                        <div className="truncate">{user.email}</div>
                                        <div className="text-transparent group-hover:text-gray-400">&gt;</div>
                                    </div>
                                </div>
                                <div className="flex items-center px-6 py-4 hover:bg-[#f8fafd] cursor-pointer transition-colors group">
                                    <div className="text-[11px] font-[500] tracking-wider text-[#444746] w-1/3">PHONE</div>
                                    <div className="text-[14px] text-[#1f1f1f] w-2/3 flex items-center justify-between">
                                        <div>Add a recovery phone</div>
                                        <div className="text-transparent group-hover:text-gray-400">&gt;</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}
