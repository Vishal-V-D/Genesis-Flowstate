"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const PaperTearEffect = ({
    children,
    revealText,
    className,
    textDetection = true,
    textHoverSize = 250,
    dotSize = 40,
    variant = "tear",
}: {
    children?: string | React.ReactNode;
    revealText?: string | React.ReactNode;
    className?: string;
    textDetection?: boolean;
    textHoverSize?: number;
    dotSize?: number;
    variant?: "tear" | "smooth" | "splatter" | "glitch";
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isHoveringText, setIsHoveringText] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    const updateMousePosition = (e: MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });

        if (textDetection) {
            const target = e.target as HTMLElement;
            let currentElement: HTMLElement | null = target;
            let isText = false;

            while (currentElement && currentElement !== containerRef.current) {
                const tagName = currentElement.tagName?.toLowerCase();
                if (tagName && ['p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'b', 'i', 'a', 'hgroup'].includes(tagName)) {
                    isText = true;
                    break;
                }
                currentElement = currentElement.parentElement;
            }
            setIsHoveringText(isText);
        }
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
    }, [textDetection]);

    let maskSize = 0;
    if (isHovered) {
        if (textDetection) {
            maskSize = isHoveringText ? textHoverSize : dotSize;
        } else {
            maskSize = textHoverSize;
        }
    }

    // Different SVG filter combinations for different paper styles
    const filterDefs = {
        tear: `<filter id='tear'><feTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='5' result='noise' /><feDisplacementMap in='SourceGraphic' in2='noise' scale='140' xChannelSelector='R' yChannelSelector='G' /></filter>`,
        splatter: `<filter id='tear'><feTurbulence type='fractalNoise' baseFrequency='0.03' numOctaves='3' result='noise' /><feDisplacementMap in='SourceGraphic' in2='noise' scale='200' xChannelSelector='R' yChannelSelector='G' /></filter>`,
        smooth: ``, // no filter
        glitch: `<filter id='tear'><feTurbulence type='turbulence' baseFrequency='0.5 0.05' numOctaves='2' result='noise' /><feDisplacementMap in='SourceGraphic' in2='noise' scale='60' xChannelSelector='R' yChannelSelector='G' /></filter>`
    };

    const filterToUse = filterDefs[variant as keyof typeof filterDefs] || filterDefs.tear;

    // Create an inline SVG data URI representing a jagged paper tear hole
    const svgMaskDataUri = `data:image/svg+xml,%3Csvg width='700' height='700' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E${filterToUse}%3C/defs%3E%3Ccircle cx='350' cy='350' r='300' ${variant === 'smooth' ? '' : "filter='url(%23tear)'"} fill='black' /%3E%3C/svg%3E`;

    // We also make a secondary one to simulate a rough white drop-shadow/border around the tear hole
    const svgBorderDataUri = `data:image/svg+xml,%3Csvg width='700' height='700' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E${filterToUse}%3C/defs%3E%3Ccircle cx='350' cy='350' r='303' ${variant === 'smooth' ? '' : "filter='url(%23tear)'"} fill='none' stroke='rgba(255,255,255,0.9)' stroke-width='25' /%3E%3C/svg%3E`;

    return (
        <div
            ref={containerRef}
            className={cn("relative w-full overflow-visible", className)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* The base text layer (visible by default) normally 'revealText' props is what shows outside the mask */}
            <div className="relative w-full flex flex-col items-center justify-center pointer-events-none transition-opacity duration-300">
                {revealText}
            </div>

            {/* The trailing torn hole revealing the dark text */}
            <motion.div
                className="absolute -inset-x-64 -inset-y-64 z-10 gemini-mask-bg flex flex-col items-center justify-center pointer-events-none"
                animate={{
                    WebkitMaskPosition: `${mousePosition.x + 256 - maskSize / 2}px ${mousePosition.y + 256 - maskSize / 2}px`,
                    WebkitMaskSize: `${maskSize}px`,
                    opacity: isHovered ? 1 : 0
                }}
                transition={{
                    WebkitMaskPosition: { type: "tween", ease: "backOut", duration: 0.1 },
                    WebkitMaskSize: { type: "spring", bounce: 0, duration: 0.5 },
                    opacity: { duration: 0.2 }
                }}
                style={{
                    WebkitMaskImage: `url("${svgMaskDataUri}")`,
                    WebkitMaskRepeat: "no-repeat"
                }}
            >
                <div className="absolute inset-32 flex flex-col items-center justify-center pointer-events-none">
                    {children}
                </div>
            </motion.div>

            {/* Simulated inner paper torn edge (white jagged border) */}
            <motion.div
                className="absolute -inset-x-64 -inset-y-64 z-20 pointer-events-none mix-blend-plus-lighter"
                animate={{
                    backgroundPosition: `${mousePosition.x + 256 - maskSize / 2}px ${mousePosition.y + 256 - maskSize / 2}px`,
                    backgroundSize: `${maskSize}px`,
                    opacity: isHovered ? 1 : 0
                }}
                style={{
                    backgroundImage: `url("${svgBorderDataUri}")`,
                    backgroundRepeat: "no-repeat"
                }}
                transition={{
                    backgroundPosition: { type: "tween", ease: "backOut", duration: 0.1 },
                    backgroundSize: { type: "spring", bounce: 0, duration: 0.5 },
                    opacity: { duration: 0.2 }
                }}
            />
        </div>
    );
};
