"use client";
import { motion } from "framer-motion";
import { Mic, Eye, Sparkles, Network, LayoutDashboard, Building2 } from "lucide-react";

const features = [
    { icon: Mic, title: "Real-time Voice", desc: "Interact globally with latency-free constant bidirectional audio streaming." },
    { icon: Eye, title: "Multimodal Vision", desc: "The AI agent constantly watches your canvas to understand spatial context." },
    { icon: Sparkles, title: "Gemini 2.0 API", desc: "Powered by the latest multimodal capabilities for deep reasoning." },
    { icon: Network, title: "Design Export", desc: "Instantly compile your visual architecture into production-ready system design documents." },
    { icon: LayoutDashboard, title: "Workspaces", desc: "Manage infinite canvases and access your brainstorming history anytime." },
    { icon: Building2, title: "Enterprise B2B", desc: "Secure, scalable, and built for team collaboration on day one." },
];

export default function Features() {
    return (
        <section className="w-full max-w-6xl mx-auto py-24 px-6 relative z-10">
            <div className="text-center mb-16">
                <h2 className="text-4xl font-[300] text-gray-900 mb-4">Core Capabilities</h2>
                <p className="text-gray-500 text-lg">Everything you need to build the next-generation architecture.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.map((feat, i) => (
                    <motion.div
                        initial={{ y: 20 }}
                        whileInView={{ y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ delay: i * 0.1, duration: 0.5 }}
                        key={i}
                        className="group relative bg-white border border-gray-200 rounded-3xl p-8 hover:shadow-xl transition-all duration-300 overflow-hidden"
                    >
                        {/* Hover Gradient Line */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-google-blue via-google-red to-google-yellow opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <feat.icon className="w-6 h-6 text-gray-700 group-hover:text-google-blue transition-colors" />
                        </div>

                        <h3 className="text-xl font-[300] text-gray-900 mb-3">{feat.title}</h3>
                        <p className="text-gray-500 leading-relaxed">{feat.desc}</p>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
