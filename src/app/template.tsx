"use client";

import { motion } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0.5, y: -5 }}
            transition={{
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1] // Elegant ease-out
            }}
            className="flex flex-col min-h-screen w-full"
        >
            {children}
        </motion.div>
    );
}
