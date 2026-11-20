"use client";
import { motion, Variants } from "framer-motion";

interface SplitTextProps {
    text: string;
    className?: string;
    delay?: number;
    duration?: number;
    ease?: string;
    splitBy?: "words" | "chars";
}

export default function SplitText({
    text,
    className = "",
    delay = 0,
    duration = 0.5,
    ease = "easeOut",
    splitBy = "words",
}: SplitTextProps) {
    const tokens = splitBy === "chars" ? text.split("") : text.split(" ");

    const container: Variants = {
        hidden: {},
        visible: { transition: { staggerChildren: 0.04, delayChildren: delay } },
    };

    const child: Variants = {
        hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
        visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration, ease } },
    };

    return (
        <motion.span
            className={`inline-flex flex-wrap gap-x-[0.25em] ${className}`}
            variants={container}
            initial="hidden"
            animate="visible"
        >
            {tokens.map((token, i) => (
                <motion.span key={i} variants={child} className="inline-block">
                    {token}
                </motion.span>
            ))}
        </motion.span>
    );
}
