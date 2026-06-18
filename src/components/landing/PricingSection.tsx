"use client";

import React from 'react';
import Link from 'next/link';
import { Check, Flame } from 'lucide-react';

export default function PricingSection() {
    return (
        <section id="pricing" className="py-28 px-6 relative z-10">
            <div className="max-w-6xl mx-auto relative z-10">
                <div className="text-center mb-16">
                    <div className="flex justify-center mb-4"><h2 className="px-3 py-1 text-[10px] sm:text-xs font-mono font-bold tracking-widest uppercase rounded-full bg-white/10 text-white border border-white/20 backdrop-blur-md shadow-lg">PRICING PLANS</h2></div>
                    <h3 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Flexible plans for growing teams</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch relative z-10">
                    {/* Free Plan / Early Access with Silver Glow */}
                    <div className="relative group min-h-[480px]">
                        {/* Silver/White background glow */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-gray-200/10 via-white/5 to-transparent rounded-2xl blur-[12px] opacity-40 group-hover:opacity-75 transition duration-500 -z-10" />

                        {/* Main Starter Card */}
                        <div className="h-full w-full p-8 rounded-2xl border border-white/10 bg-gradient-to-b from-[#111115] to-[#070709] flex flex-col justify-between text-left relative shadow-[0_20px_40px_rgba(0,0,0,0.4)] hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_25px_60px_rgba(255,255,255,0.05)] hover:border-white/30 z-10">
                            <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-gradient-to-r from-gray-600 to-gray-800 text-white text-[9px] font-bold tracking-wider shadow-lg shadow-black/40 flex items-center gap-1 border border-white/10">
                                EARLY ACCESS
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white tracking-wide">Early</h4>
                                <p className="text-xs text-gray-500 mt-1">Perfect for individual system architects.</p>
                                <div className="mt-6 flex items-baseline gap-1">
                                    <span className="text-3xl font-extrabold text-white">$0</span>
                                    <span className="text-xs text-gray-500">/ forever</span>
                                </div>

                                <ul className="mt-8 space-y-3.5 text-xs text-gray-300">
                                    <li className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-gray-300 shrink-0">
                                            <Check className="w-3 h-3" />
                                        </div>
                                        <span>Up to 3 active workspaces</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-gray-300 shrink-0">
                                            <Check className="w-3 h-3" />
                                        </div>
                                        <span>Basic AI synthesis runs</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-gray-300 shrink-0">
                                            <Check className="w-3 h-3" />
                                        </div>
                                        <span>Terraform exporter</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-gray-300 shrink-0">
                                            <Check className="w-3 h-3" />
                                        </div>
                                        <span>Visual whiteboard diagramming</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-gray-300 shrink-0">
                                            <Check className="w-3 h-3" />
                                        </div>
                                        <span>Local state JSON import</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-gray-300 shrink-0">
                                            <Check className="w-3 h-3" />
                                        </div>
                                        <span>Community support access</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="mt-8">
                                <Link href="/library" className="block text-center bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-all duration-200">
                                    Get Started
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Pro Team Plan with Premium Stack Effect */}
                    <div className="relative group min-h-[480px]">
                        {/* Lowest Stack Layer */}
                        <div className="absolute inset-x-4 -bottom-3 top-3 rounded-2xl bg-[#060609] border border-white/[0.02] -z-20 translate-y-3 scale-[0.94] opacity-50 transition-transform duration-300 group-hover:translate-y-4" />
                        {/* Middle Stack Layer */}
                        <div className="absolute inset-x-2 -bottom-1.5 top-1.5 rounded-2xl bg-[#09090d] border border-indigo-500/10 -z-10 translate-y-1.5 scale-[0.97] opacity-80 transition-transform duration-300 group-hover:translate-y-2" />

                        {/* Main Pro Team Card */}
                        <div className="h-full p-8 rounded-2xl border border-indigo-500/40 bg-gradient-to-b from-[#0e0e16] to-[#07070b] flex flex-col justify-between text-left relative shadow-[0_20px_50px_rgba(99,102,241,0.05)] hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_25px_60px_rgba(99,102,241,0.15)] hover:border-indigo-400/60 z-10">
                            <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[9px] font-bold tracking-wider shadow-lg shadow-indigo-500/20">POPULAR</div>
                            <div>
                                <h4 className="text-sm font-bold text-white tracking-wide">Team</h4>
                                <p className="text-xs text-indigo-300 mt-1">Collaborative workspace for engineering squads.</p>
                                <div className="mt-6 flex items-baseline gap-1">
                                    <span className="text-3xl font-extrabold text-white">$19</span>
                                    <span className="text-xs text-gray-400">/ user / month</span>
                                </div>

                                <ul className="mt-8 space-y-3.5 text-xs text-gray-300">
                                    <li className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                                            <Check className="w-3 h-3" />
                                        </div>
                                        <span>Infinite workspaces</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                                            <Check className="w-3 h-3" />
                                        </div>
                                        <span>Unlimited multiplayer cursors</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                                            <Check className="w-3 h-3" />
                                        </div>
                                        <span>Advanced prompt compiler</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                                            <Check className="w-3 h-3" />
                                        </div>
                                        <span>Multi-Format exports (Docker, AWS)</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                                            <Check className="w-3 h-3" />
                                        </div>
                                        <span>Git version control sync</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                                            <Check className="w-3 h-3" />
                                        </div>
                                        <span>Custom component variables library</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                                            <Check className="w-3 h-3" />
                                        </div>
                                        <span>Priority email support (24h SLA)</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="mt-8">
                                <Link href="/library" className="block text-center bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-lg shadow-indigo-600/15 transition-all duration-200">
                                    Launch Team Space
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Enterprise Plan with Premium Flame Effect */}
                    <div className="relative group min-h-[480px]">
                        {/* Flame background glow */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/25 via-red-500/20 to-yellow-500/10 rounded-2xl blur-[12px] opacity-40 group-hover:opacity-75 transition duration-500 -z-10" />

                        {/* Main Enterprise Card */}
                        <div className="h-full p-8 rounded-2xl border border-orange-500/30 bg-gradient-to-b from-[#160d0b] to-[#080505] flex flex-col justify-between text-left relative shadow-[0_20px_50px_rgba(249,115,22,0.04)] hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_25px_60px_rgba(239,68,68,0.15)] hover:border-orange-500/50 z-10">
                            <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 text-white text-[9px] font-bold tracking-wider shadow-lg shadow-orange-500/20 flex items-center gap-1">
                                <Flame className="w-3 h-3 text-white fill-white animate-pulse" />
                                TOP PICK
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white tracking-wide">Enterprise</h4>
                                <p className="text-xs text-orange-300/60 mt-1">Custom data privacy and access security.</p>
                                <div className="mt-6 flex items-baseline gap-1">
                                    <span className="text-3xl font-extrabold text-white">Custom</span>
                                </div>

                                <ul className="mt-8 space-y-3.5 text-xs text-gray-300">
                                    <li className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400 shrink-0">
                                            <Check className="w-3 h-3" />
                                        </div>
                                        <span>Cognito SSO & SAML support</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400 shrink-0">
                                            <Check className="w-3 h-3" />
                                        </div>
                                        <span>Isolated cloud tenant deployment</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400 shrink-0">
                                            <Check className="w-3 h-3" />
                                        </div>
                                        <span>SOC2 audit logs & monitoring</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400 shrink-0">
                                            <Check className="w-3 h-3" />
                                        </div>
                                        <span>Dedicated SLAs</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400 shrink-0">
                                            <Check className="w-3 h-3" />
                                        </div>
                                        <span>Custom code exporter plugins</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400 shrink-0">
                                            <Check className="w-3 h-3" />
                                        </div>
                                        <span>24/7 dedicated solutions engineer</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400 shrink-0">
                                            <Check className="w-3 h-3" />
                                        </div>
                                        <span>Unlimited workspaces & multiplayer</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="mt-8">
                                <a href="mailto:sales@flowstate.platform" className="block text-center bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-lg shadow-orange-600/15 transition-all duration-200 border-none">
                                    Contact Sales
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
