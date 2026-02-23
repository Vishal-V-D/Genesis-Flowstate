"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const MaskContainer = ({
    children,
    revealText,
    size = 10,
    revealSize = 600,
    className,
}: {
    children?: string | React.ReactNode;
    revealText?: string | React.ReactNode;
    size?: number;
    revealSize?: number;
    className?: string;
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [mousePosition, setMousePosition] = useState<any>({ x: null, y: null });
    const containerRef = useRef<any>(null);

    const updateMousePosition = (e: any) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    useEffect(() => {
        const currentRef = containerRef.current;
        if (currentRef) {
            currentRef.addEventListener("mousemove", updateMousePosition);
        }
        return () => {
            if (currentRef) {
                currentRef.removeEventListener("mousemove", updateMousePosition);
            }
        };
    }, []);

    const maskSize = isHovered ? revealSize : size;

    return (
        <motion.div
            ref={containerRef}
            className={cn("relative w-full overflow-visible", className)}
        >
            {/* The mask layer covers a larger area so it doesn't hard-clip at the text bounds */}
            <motion.div
                className="absolute -inset-x-32 -inset-y-32 z-10 gemini-mask-bg text-white [mask-image:url(/splash.svg)] [mask-size:40px] [mask-repeat:no-repeat] flex flex-col items-center justify-center transition-opacity"
                animate={{
                    WebkitMaskPosition: `${mousePosition.x + 128 - maskSize / 2}px ${mousePosition.y + 128 - maskSize / 2}px`,
                    WebkitMaskSize: `${maskSize}px`,
                    opacity: isHovered ? 1 : 0
                }}
                transition={{
                    WebkitMaskPosition: { type: "tween", ease: "backOut", duration: 0.1 },
                    WebkitMaskSize: { duration: 0.2 }
                }}
            >
                <div
                    onMouseEnter={() => {
                        setIsHovered(true);
                    }}
                    onMouseLeave={() => {
                        setIsHovered(false);
                    }}
                    className="absolute inset-32 z-20 flex flex-col items-center justify-center placeholder:pointer-events-auto"
                >
                    {children}
                </div>
            </motion.div>

            <div className="relative w-full flex flex-col items-center justify-center pointer-events-none">
                {revealText}
            </div>
        </motion.div>
    );
};
