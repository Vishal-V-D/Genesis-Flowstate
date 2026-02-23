"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function HowItWorks() {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start center", "end center"]
    });

    const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

    return (
        <section ref={containerRef} className="w-full max-w-6xl mx-auto py-32 px-6 relative z-10 overflow-hidden">
            <div className="text-center mb-24">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">How it works</h2>
                <p className="text-gray-500 text-lg">Three steps to architecting the future.</p>
            </div>

            <div className="relative">
                {/* Animated Connection Line */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 z-0 hidden md:block">
                    <motion.div
                        style={{ scaleX, transformOrigin: 'left' }}
                        className="w-full h-full bg-gradient-to-r from-google-blue via-google-red to-google-yellow"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                    {/* Step 1 */}
                    <motion.div initial={{ y: 50 }} whileInView={{ y: 0 }} viewport={{ once: true }} className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-2xl font-bold text-gray-400 mb-6 shadow-sm">01</div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Speak your mind</h3>
                        <p className="text-gray-500">Enable your microphone and start describing your system architecture naturally.</p>
                    </motion.div>

                    {/* Step 2 (Highlighted) */}
                    <motion.div initial={{ y: 50 }} whileInView={{ y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="flex flex-col items-center text-center relative">
                        {/* Radar ping effect */}
                        <div className="absolute top-0 w-16 h-16 rounded-full bg-google-blue opacity-30 animate-ping" />

                        <div className="w-16 h-16 rounded-full bg-google-blue border-4 border-white flex items-center justify-center text-2xl font-bold text-white mb-6 shadow-xl relative z-10">02</div>
                        <h3 className="text-xl font-bold text-google-blue mb-3">AI visualizes it</h3>
                        <p className="text-gray-600 font-medium">Gemini processes your voice and live canvas state to instantly draw out your nodes.</p>
                    </motion.div>

                    {/* Step 3 */}
                    <motion.div initial={{ y: 50 }} whileInView={{ y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }} className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-2xl font-bold text-gray-400 mb-6 shadow-sm">03</div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Export Design</h3>
                        <p className="text-gray-500">Hit export and receive production-ready system design artifacts instantly.</p>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
