import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: "class",
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                google: {
                    blue: "#4285F4",
                    red: "#EA4335",
                    yellow: "#FBBC04",
                    green: "#34A853",
                },
                // Dark theme palette — Gemini dark
                dark: {
                    bg: "#131314",      // page background
                    card: "#1e1f20",    // cards / panels
                    border: "#28292b",  // borders / elevated elements
                    text: "#e3e3e3",    // primary text
                    muted: "#bdc1c6",   // secondary text
                    subtle: "#9aa0a6",  // tertiary text / icons
                },
            },
            fontFamily: {
                sans: ["var(--font-google-sans)"],
            },
        },
    },
    plugins: [],
};
export default config;
