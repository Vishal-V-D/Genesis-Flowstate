"use client";
import React, { useRef, useState } from "react";

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    tiltAmount?: number;
}

export default function TiltCard({ children, className = "", tiltAmount = 8, ...props }: TiltCardProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [transform, setTransform] = useState("");

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        setTransform(
            `perspective(600px) rotateX(${-y * tiltAmount}deg) rotateY(${x * tiltAmount}deg) scale3d(1.02,1.02,1.02)`
        );
    };

    const handleMouseLeave = () => {
        setTransform("perspective(600px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)");
    };

    return (
        <div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={className}
            style={{ transform, transition: "transform 0.15s ease-out", willChange: "transform" }}
            {...props}
        >
            {children}
        </div>
    );
}
