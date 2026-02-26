"use client";
import React, { useState } from "react";
import { Mic, Eye, Sparkles, Network, LayoutDashboard, Building2 } from "lucide-react";

const features = [
    {
        id: "voice",
        label: "VOICE",
        icon: <Mic className="w-7 h-7" />,
        title: "Real-time Voice",
        desc: "Interact globally with latency-free constant bidirectional audio streaming.",
        btnText: "Try Voice",
        colorClass: "card-blue",
        bgColor: "bg-[#1a73e8]",
        hoverBg: "hover:bg-blue-700",
    },
    {
        id: "vision",
        label: "VISION",
        icon: <Eye className="w-7 h-7" />,
        title: "Multimodal Vision",
        desc: "The AI agent constantly watches your canvas to understand spatial context.",
        btnText: "Visual Analytics",
        colorClass: "card-red",
        bgColor: "bg-[#ea4335]",
        hoverBg: "hover:bg-red-600",
    },
    {
        id: "ai",
        label: "REASONING",
        icon: <Sparkles className="w-7 h-7" />,
        title: "Gemini 2.0 API",
        desc: "Powered by the latest multimodal capabilities for deep architectural reasoning.",
        btnText: "Explore AI",
        colorClass: "card-yellow",
        bgColor: "bg-[#fbbc04]",
        hoverBg: "hover:bg-yellow-600",
    },
    {
        id: "export",
        label: "EXPORT",
        icon: <Network className="w-7 h-7" />,
        title: "Design Export",
        desc: "Instantly compile your visual architecture into production-ready system design documents.",
        btnText: "Generate Docs",
        colorClass: "card-green",
        bgColor: "bg-[#34a853]",
        hoverBg: "hover:bg-green-700",
    },
    {
        id: "workspaces",
        label: "SPACES",
        icon: <LayoutDashboard className="w-7 h-7" />,
        title: "Workspaces",
        desc: "Manage infinite canvases and access your brainstorming history anytime.",
        btnText: "Library",
        colorClass: "card-purple", // New color
        bgColor: "bg-[#9333ea]",
        hoverBg: "hover:bg-purple-700",
    },
    {
        id: "enterprise",
        label: "ENTERPRISE",
        icon: <Building2 className="w-7 h-7" />,
        title: "Enterprise B2B",
        desc: "Secure, scalable, and built for team collaboration on day one.",
        btnText: "Upgrade",
        colorClass: "card-pink", // New color
        bgColor: "bg-[#ec4899]",
        hoverBg: "hover:bg-pink-600",
    },
];

export default function Features() {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    return (
        <section className="w-full bg-[#f8f9fa] py-24 relative overflow-hidden font-sans">
            <div className="max-w-6xl mx-auto px-6">
                <header className="text-center mb-16">

                    <h2 className="text-4xl md:text-5xl font-medium text-[#202124] mb-6 tracking-tight">
                        Design <span className="text-[#1a73e8]">Intelligence</span>
                    </h2>
                    <p className="text-[#5f6368] max-w-lg mx-auto text-lg">
                        Everything you need to build the next-generation architecture.
                    </p>
                </header>

                {/* Container centered exactly like screenshot */}
                <div className="skew-container flex flex-col md:flex-row gap-6 justify-center items-center min-h-[500px] pt-10 md:pt-0">
                    {features.map((feat, i) => (
                        <div
                            key={feat.id}
                            className={`slant-card ${feat.colorClass}`}
                            onMouseEnter={() => setHoveredIndex(i)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        >
                            <span className="card-label">{feat.label}</span>
                            <div className="icon-box">{feat.icon}</div>

                            <div className="card-content">
                                <h3 className="text-[22px] font-bold text-[#202124] mb-3 tracking-tight">{feat.title}</h3>
                                <p className="text-[#5f6368] text-[15px] leading-relaxed mb-8">
                                    {feat.desc}
                                </p>
                                <button className={`w-fit px-5 py-2.5 ${feat.bgColor} ${feat.hoverBg} text-white text-sm font-medium rounded transition-colors shadow-sm`}>
                                    {feat.btnText}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style jsx>{`
                /* The Container */
                .skew-container {
                    /* Desktop config: The exact angle from the screenshot looks to be around -12deg to -15deg */
                    --slant-angle: -14deg;
                    perspective: 1000px;
                }

                /* The Card Base - Exact match to screenshot */
                .slant-card {
                    position: relative;
                    width: 140px; /* Even wider resting state to match screenshot proportions */
                    height: 480px; /* Slightly decreased height as requested */
                    background: #ffffff;
                    border: 1px solid #e0e0e0; /* Very clean gray solid border */
                    transform: skewX(var(--slant-angle));
                    transition: all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
                    overflow: hidden;
                    cursor: pointer;
                    /* Sharper corners to match screenshot */
                    border-radius: 2px; 
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
                    will-change: transform, width, box-shadow;
                }

                /* Hover Expansion */
                .slant-card:hover {
                    width: 480px; /* Wider expansion to accommodate padding and text */
                    transform: skewX(var(--slant-angle)) translateY(-12px);
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                    border-color: #d1d1d1;
                    z-index: 10;
                }

                /* Content Container inside the skewed card */
                .card-content {
                    padding: 3.5rem 7rem 3.5rem 3rem; /* Significant right padding to clear the 14deg slant */
                    width: 480px;
                    height: 100%;
                    box-sizing: border-box;
                    /* Un-skew the content so it sits straight */
                    transform: skewX(calc(var(--slant-angle) * -1));
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-end;
                    opacity: 0;
                    transition: opacity 0.3s ease 0.1s, transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
                    pointer-events: none;
                }

                .slant-card:hover .card-content {
                    opacity: 1;
                    pointer-events: auto;
                }

                /* Colored Top Indicator - exactly like the Google tab line */
                .slant-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 5px; /* Thin clean line */
                    transition: height 0.3s ease;
                    z-index: 2;
                }

                .slant-card:hover::before {
                    height: 8px; /* Slightly thicker on hover */
                }

                /* Exact Google brand Colors and new custom colors */
                .card-blue::before { background: #1a73e8; }
                .card-red::before { background: #ea4335; }
                .card-yellow::before { background: #fbbc04; }
                .card-green::before { background: #34a853; }
                .card-purple::before { background: #9333ea; }
                .card-pink::before { background: #ec4899; }

                /* Icon Styling - Exact placement */
                .icon-box {
                    position: absolute;
                    top: 4rem; /* Lowered a bit more like screenshot */
                    left: 50%;
                    /* Un-skew so icon isn't tilted */
                    transform: translateX(-50%) skewX(calc(var(--slant-angle) * -1));
                    transition: all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
                    color: #5f6368; /* Crisp dark gray */
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                /* Icon moves to the left on hover */
                .slant-card:hover .icon-box {
                    left: 3.5rem; /* Push slightly right to align with padding */
                    transform: translateX(0) skewX(calc(var(--slant-angle) * -1)) scale(1.1);
                }

                /* Specific Icon Colors on Hover to match the top bar */
                .slant-card.card-blue:hover .icon-box { color: #1a73e8; }
                .slant-card.card-red:hover .icon-box { color: #ea4335; }
                .slant-card.card-yellow:hover .icon-box { color: #fbbc04; }
                .slant-card.card-green:hover .icon-box { color: #34a853; }
                .slant-card.card-purple:hover .icon-box { color: #9333ea; }
                .slant-card.card-pink:hover .icon-box { color: #ec4899; }

                /* Vertical Text formatting - Exact match to screenshot */
                .card-label {
                    position: absolute;
                    bottom: 25%; /* Pushed down to the bottom half */
                    left: 50%;
                    transform: translateX(-50%) translateY(50%) rotate(-90deg) skewX(calc(var(--slant-angle) * -1));
                    white-space: nowrap;
                    font-weight: 500;
                    color: #80868b;
                    font-size: 0.8rem;
                    letter-spacing: 0.2em; /* Much wider letter spacing like screenshot */
                    text-transform: uppercase;
                    transition: opacity 0.2s ease;
                    pointer-events: none;
                }

                .slant-card:hover .card-label {
                    opacity: 0;
                }

                /* Mobile overrides */
                @media (max-width: 768px) {
                    .skew-container {
                        --slant-angle-mobile: -8deg;
                        gap: 1.5rem;
                    }
                    .slant-card {
                        width: 100%;
                        max-width: 340px;
                        height: 120px;
                        transform: skewY(var(--slant-angle-mobile)) skewX(0);
                        border-radius: 12px;
                    }
                    .slant-card:hover {
                        height: 380px;
                        width: 100%;
                        max-width: 340px;
                        transform: skewY(var(--slant-angle-mobile)) skewX(0) translateX(4px);
                    }
                    .card-content {
                        width: 100%;
                        max-width: 340px;
                        transform: skewY(calc(var(--slant-angle-mobile) * -1)) skewX(0);
                        padding: 2.5rem;
                    }
                    .icon-box {
                        transform: translateX(-50%) skewY(calc(var(--slant-angle-mobile) * -1)) skewX(0);
                        top: 2.2rem;
                        left: 80%;
                    }
                    .slant-card:hover .icon-box {
                        left: 2rem;
                        top: 2rem;
                        transform: translateX(0) skewY(calc(var(--slant-angle-mobile) * -1)) skewX(0) scale(1.1);
                    }
                    .card-label {
                        transform: translateY(-50%) rotate(0) skewY(calc(var(--slant-angle-mobile) * -1)) skewX(0);
                        bottom: auto;
                        top: 50%;
                        left: 2rem;
                        font-size: 0.9rem;
                        color: #5f6368;
                    }
                }
            `}</style>
        </section>
    );
}
