import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Kira FlowState | Build the new way",
    description: "Experience it all with the next-generation whiteboarding tool",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Google+Sans+Text:wght@400;500;700&display=swap" rel="stylesheet" />
            </head>
            <body className="antialiased font-sans flex flex-col min-h-screen">
                <div className="bg-mesh"></div>

                {children}
            </body>
        </html>
    );
}
