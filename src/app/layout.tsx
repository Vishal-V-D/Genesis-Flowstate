import type { Metadata } from "next";
import "./globals.css";
import NextTopLoader from 'nextjs-toploader';

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
                <NextTopLoader
                    color="linear-gradient(to right, #4285F4, #a142f4, #f442a1, #EA4335, #FBBC05, #34A853)"
                    initialPosition={0.08}
                    crawlSpeed={200}
                    height={3}
                    crawl={true}
                    showSpinner={false}
                    easing="ease"
                    speed={200}
                    shadow="none"
                />
                <div className="bg-mesh"></div>

                {children}
            </body>
        </html>
    );
}
