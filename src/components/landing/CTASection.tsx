"use client";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function CTASection() {
    return (
        <div className="bg-[#f8f9fa]">
        <section className="w-full max-w-6xl mx-auto py-32 px-6 relative z-10">
            <motion.div
                initial={{ scale: 0.95 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="w-full rounded-[3rem] bg-white border border-gray-400  p-16 text-center relative overflow-hidden"
            >
                {/* Floating background gradient orbs */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none mix-blend-multiply opacity-50">
                    <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[120%] bg-google-blue rounded-full blur-[100px] opacity-20" />
                    <div className="absolute top-[20%] -right-[10%] w-[50%] h-[100%] bg-google-red rounded-full blur-[100px] opacity-20" />
                </div>

                <div className="relative z-10">
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 border border-gray-200 text-google-blue font-[300] text-sm mb-8 tracking-wide">

                        START BUILDING TODAY
                    </span>
                    <h2 className="text-5xl md:text-6xl font-[300] text-gray-900 tracking-tight leading-tight mb-8">
                        Ready to flow with<br />the speed of thought?
                    </h2>
                    <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-12">
                        Join thousands of architects who use Kira FlowState to translate ideas into production-ready system designs instantly.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center items-center gap-2 max-w-lg mx-auto">
                        <div className="relative w-full">
                            <input
                                type="email"
                                placeholder="name@company.com"
                                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-full px-6 py-4 outline-none focus:bg-white focus:border-google-blue focus:ring-4 focus:ring-blue-100 transition-all text-lg placeholder-gray-400"
                            />
                        </div>
                        <button className="bg-google-blue hover:bg-blue-600 text-white px-8 py-4 rounded-full font-[300] text-lg transition-all hover:scale-105 active:scale-95 w-full sm:w-auto whitespace-nowrap">
                            Subscribe
                        </button>
                    </div>

                    <p className="mt-6 text-sm text-gray-400">
                        Join the waitlist to receive the latest product updates and early access.
                    </p>
                </div>
            </motion.div>
        </section></div>
    );
}
