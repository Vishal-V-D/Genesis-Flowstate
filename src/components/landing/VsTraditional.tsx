"use client";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

export default function VsTraditional() {
    return (
        <div className="bg-[#f8f9fa]">
        <section className="w-full max-w-6xl mx-auto py-24 px-6 relative z-10">
            <div className="text-center mb-16">
                <h2 className="text-4xl font-[300] text-gray-900 mb-4">FlowState vs Traditional</h2>
                <p className="text-gray-500 text-lg">See why static whiteboards are outdated.</p>
            </div>

            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="py-4 px-6 font-[300] text-gray-900 w-1/3">Feature</th>
                            <th className="py-4 px-6 font-[300] text-gray-500 w-1/3 text-center border-l border-gray-200">Static Tools<br /><span className="text-xs font-normal">(Miro, Lucid)</span></th>
                            <th className="py-4 px-6 font-[300] text-google-blue w-1/3 text-center border-l border-gray-200">FlowState AI</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[
                            { feat: "Intelligence", old: "Passive", new: "Active Co-pilot" },
                            { feat: "Input Method", old: "Mouse & Keyboard", new: "Voice First" },
                            { feat: "Node Addition", old: "Manual Drag/Drop", new: "Automated via Speech" },
                            { feat: "Guidance", old: "None", new: "Proactive Architecture Suggestions" },
                            { feat: "System Design Export", old: "Manual Mapping", new: "Instant Design Artifacts" }
                        ].map((row, i) => (
                            <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                                <td className="py-4 px-6 font-[300] text-gray-800">{row.feat}</td>
                                <td className="py-4 px-6 text-center text-gray-500 border-l border-gray-100 flex-col items-center justify-center gap-2">
                                    <X className="w-5 h-5 mx-auto text-gray-300 mb-1" />
                                    {row.old}
                                </td>
                                <td className="py-4 px-6 text-center text-gray-900 font-[300] border-l border-gray-100 bg-blue-50/30 group-hover:bg-blue-50/50 transition-colors">
                                    <Check className="w-5 h-5 mx-auto text-google-blue mb-1" />
                                    {row.new}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
        </div>
    );
}
