"use client";
import React from "react";
import { motion } from "framer-motion";

const COLORS = [
    "rgba(147, 51, 234, 0.28)", // Purple
    "rgba(236, 72, 153, 0.28)", // Pink
    "rgba(59, 130, 246, 0.28)",  // Blue
    "rgba(244, 63, 94, 0.22)",   // Rose
    "rgba(168, 85, 247, 0.22)",  // Light Purple
    "rgba(6, 182, 212, 0.22)",   // Cyan
    "rgba(251, 146, 60, 0.18)",  // Orange/Peach
];

// Comprehensive blob patterns with varied sizes for a natural "spread"
const BLOB_METADATA = [
    { x: 10, y: 10, size: 800, color: COLORS[0], duration: 25, delay: 0 },
    { x: 85, y: 15, size: 900, color: COLORS[1], duration: 30, delay: -5 },
    { x: 15, y: 85, size: 850, color: COLORS[2], duration: 28, delay: -10 },
    { x: 90, y: 90, size: 950, color: COLORS[3], duration: 35, delay: -15 },
    { x: 50, y: 40, size: 1100, color: COLORS[4], duration: 40, delay: -2 },
    { x: -5, y: 55, size: 750, color: COLORS[5], duration: 22, delay: -8 },
    { x: 110, y: 45, size: 800, color: COLORS[6], duration: 32, delay: -12 },
    // Smaller droplets for "splatter" detail
    { x: 30, y: 20, size: 300, color: COLORS[0], duration: 18, delay: -4 },
    { x: 70, y: 80, size: 350, color: COLORS[2], duration: 20, delay: -14 },
    { x: 40, y: 60, size: 250, color: COLORS[5], duration: 15, delay: -1 },
];

export const WatercolorBackground = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-white">
            {/* SVG Filter for Gooey Merging + Organic Stain Edges */}
            <svg style={{ visibility: 'hidden', position: 'absolute' }} width="0" height="0">
                <filter id="watercolor-goo">
                    {/* The Gooey Effect: Blur then high Contrast makes shapes merge when near */}
                    <feGaussianBlur in="SourceGraphic" stdDeviation="45" result="blur" />
                    <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 45 -15" result="goo" />

                    {/* Organic turbulence on the edges */}
                    <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="4" result="noise" />
                    <feDisplacementMap in="goo" in2="noise" scale="80" xChannelSelector="R" yChannelSelector="G" />
                </filter>
            </svg>

            {/* Subtle paper texture overlay - increased intensity */}
            <div
                className="absolute inset-0 opacity-[0.08] mix-blend-multiply pointer-events-none grayscale"
                style={{
                    backgroundImage: `url("https://www.transparenttextures.com/patterns/handmade-paper.png")`,
                    backgroundSize: '250px'
                }}
            />

            <div className="absolute inset-0 opacity-95" style={{ filter: 'url(#watercolor-goo)' }}>
                {BLOB_METADATA.map((blob, i) => (
                    <motion.div
                        key={i}
                        animate={{
                            x: [`${blob.x}%`, `${blob.x + 12}%`, `${blob.x - 6}%`, `${blob.x}%`],
                            y: [`${blob.y}%`, `${blob.y - 15}%`, `${blob.y + 10}%`, `${blob.y}%`],
                            scale: [1, 1.3, 0.85, 1],
                            opacity: [0.6, 0.9, 0.7, 0.6]
                        }}
                        transition={{
                            duration: blob.duration,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: blob.delay
                        }}
                        style={{
                            position: "absolute",
                            width: blob.size,
                            height: blob.size,
                            borderRadius: "50%",
                            background: blob.color,
                            left: `-250px`,
                            top: `-250px`,
                            mixBlendMode: i % 2 === 0 ? "multiply" : "overlay", // Mix modes for better colors
                        }}
                    />
                ))}
            </div>

            {/* Overall soft vignette for depth */}
            <div className="absolute inset-0 bg-radial-vignette pointer-events-none" />

            <style jsx>{`
                .bg-radial-vignette {
                    background: radial-gradient(circle at center, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 100%);
                }
            `}</style>
        </div>
    );
};
