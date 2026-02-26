"use client";
import { motion } from "framer-motion";

export default function GeminiPowered() {
    return (
        <section className="w-full max-w-7xl mx-auto py-24 px-6 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                {/* Left Side: 3D Demo Image & Pills */}
                <div className="relative perspective-1000">
                    <motion.div
                        initial={{ rotateY: 10, rotateX: 5 }}
                        whileInView={{ rotateY: 0, rotateX: 0 }}
                        transition={{ duration: 0.8 }}
                        className="relative bg-[#f0f4f9] p-4 md:p-8 rounded-[10px]  border border-gray-200 aspect-square flex items-center justify-center overflow-hidden"
                        style={{ transformStyle: "preserve-3d" }}
                    >


                        <div className="w-full h-full rounded-xl overflow-hidden relative border border-gray-200/50 bg-white shadow-inner flex items-center justify-center">
                            <video
                                src="/kira.mp4"
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                            />
                            {/* Visual polish overlay */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none z-20" />
                        </div>
                    </motion.div>

                    {/* Capability Pills */}
                    <div className="absolute -bottom-6 left-10 flex gap-4 z-20">
                        <motion.div initial={{ y: 20 }} whileInView={{ y: 0 }} transition={{ delay: 0.2 }} className="bg-white px-4 py-2 rounded-full  border border-gray-100 text-sm font-[300] text-gray-800 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-google-blue" />Voice</motion.div>
                        <motion.div initial={{ y: 20 }} whileInView={{ y: 0 }} transition={{ delay: 0.3 }} className="bg-white px-4 py-2 rounded-full  border border-gray-100 text-sm font-[300] text-gray-800 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-google-green" />Vision</motion.div>
                        <motion.div initial={{ y: 20 }} whileInView={{ y: 0 }} transition={{ delay: 0.4 }} className="bg-white px-4 py-2 rounded-full  border border-gray-100 text-sm font-[300] text-gray-800 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-google-yellow" />Functions</motion.div>
                    </div>
                </div>

                {/* Right Side: Data Flow Diagram */}
                <div>
                    <h2 className="text-4xl font-[300] text-gray-900 mb-6">Powered by Gemini Live API</h2>
                    <p className="text-gray-500 text-lg mb-12">Experience the lowest latency multimodal interaction ever built into a whiteboarding tool. We stream directly to the model.</p>

                    <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                        {/* Timeline Item 1 */}
                        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-gray-100 group-[.is-active]:bg-google-blue text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors">
                                1
                            </div>
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="font-[300] text-gray-900">16kHz Audio Mic</div>
                                </div>
                                <div className="text-gray-500 text-sm">Continuous raw audio streaming directly to the backend.</div>
                            </div>
                        </div>
                        {/* Timeline Item 2 */}
                        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-gray-100 group-[.is-active]:bg-google-yellow text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors">
                                2
                            </div>
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="font-[300] text-gray-900">JPEG Snapshots</div>
                                </div>
                                <div className="text-gray-500 text-sm">2s interval canvas state capture for multimodal context.</div>
                            </div>
                        </div>
                        {/* Timeline Item 3 */}
                        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-gray-100 group-[.is-active]:bg-google-green text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors">
                                3
                            </div>
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="font-[300] text-gray-900">Live UI Updates</div>
                                </div>
                                <div className="text-gray-500 text-sm">Gemini orchestrates immediate structural state mutations.</div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
