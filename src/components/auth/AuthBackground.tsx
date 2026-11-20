"use client";

/**
 * AuthBackground — a solid purple DIAGONAL half covering the screen
 * (split top→bottom diagonally). On sign-in it sits on the LEFT half; on
 * sign-up it moves to the RIGHT half. The clip-path is animated so switching
 * between the two feels like the purple half flows across (liquid transition).
 */

import React from "react";

export default function AuthBackground({ mode = "signin" }: { mode?: "signin" | "signup" }) {
    const isSignup = mode === "signup";

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-0">
            {/* Light base for the non-purple half */}
            <div className="absolute inset-0 bg-gradient-to-br from-white via-[#faf9ff] to-[#f1ecff] dark:from-dark-bg dark:via-dark-bg dark:to-dark-bg" />

            {/* Solid purple diagonal half — left wedge for sign-in, right for sign-up */}
            <div
                className="absolute inset-0 auth-purple-half"
                style={{
                    background:
                        "linear-gradient(135deg, #6d28d9 0%, #5227FF 45%, #7c3aed 75%, #a855f7 100%)",
                    clipPath: isSignup
                        ? "polygon(100% 0, 100% 100%, 42% 100%, 58% 0)"
                        : "polygon(0 0, 58% 0, 42% 100%, 0 100%)",
                }}
            />
        </div>
    );
}
