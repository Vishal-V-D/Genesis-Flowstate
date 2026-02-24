"use client";

import React, { useRef, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import type { LibraryItems } from "@excalidraw/excalidraw/types";

const LIBRARY_STORAGE_KEY = "kira-excalidraw-library";

const ExcalidrawWrapper = dynamic(() => import("./ExcalidrawWrapper"), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center w-full h-full bg-[#f8f9fa]">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
                <span className="text-sm text-gray-400 font-medium">Loading canvas...</span>
            </div>
        </div>
    ),
});

export default function WorkspacePage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const excalidrawRef = useRef<any>(null);
    const [savedLibraryItems, setSavedLibraryItems] = useState<LibraryItems>([]);
    const [pendingLibraryUrl, setPendingLibraryUrl] = useState<string | null>(null);

    // Load persisted library items from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(LIBRARY_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setSavedLibraryItems(parsed);
                }
            }
        } catch (e) {
            console.warn("Could not load library from storage:", e);
        }
    }, []);

    // Detect #addLibrary=... hash (set by libraries.excalidraw.com redirect)
    useEffect(() => {
        const parseHash = () => {
            const hash = window.location.hash;
            if (!hash.startsWith('#addLibrary=')) return;
            const params = new URLSearchParams(hash.slice(1));
            const libUrl = params.get('addLibrary');
            if (libUrl) {
                setPendingLibraryUrl(libUrl);
                // Clear hash without triggering another hashchange
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
            }
        };

        // Handle on initial page load (redirect arrives with hash already in URL)
        parseHash();
        window.addEventListener('hashchange', parseHash);
        return () => window.removeEventListener('hashchange', parseHash);
    }, []);

    // Once a library URL is pending AND the Excalidraw API is ready, load it
    useEffect(() => {
        if (!pendingLibraryUrl) return;

        const interval = setInterval(async () => {
            if (!excalidrawRef.current) return;
            clearInterval(interval);

            try {
                const { loadLibraryFromBlob } = await import('@excalidraw/excalidraw');
                const proxyUrl = `/api/library-proxy?url=${encodeURIComponent(pendingLibraryUrl)}`;
                const res = await fetch(proxyUrl);
                if (!res.ok) throw new Error(`Proxy HTTP ${res.status}`);
                const json = await res.json();
                const blob = new Blob([JSON.stringify(json)], { type: 'application/json' });
                const libraryItems = await loadLibraryFromBlob(blob);

                await excalidrawRef.current.updateLibrary({
                    libraryItems,
                    merge: true,
                    openLibraryMenu: true,
                });

                setPendingLibraryUrl(null);
            } catch (e) {
                console.error('Failed to install library from hash:', e);
                setPendingLibraryUrl(null);
            }
        }, 300);

        return () => clearInterval(interval);
    }, [pendingLibraryUrl]);

    // Persist library items to localStorage whenever they change
    const handleLibraryChange = (items: LibraryItems) => {
        try {
            localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(items));
        } catch (e) {
            console.warn("Could not save library to storage:", e);
        }
    };

    return (
        <div style={{ width: "100vw", height: "100vh" }}>
            <ExcalidrawWrapper
                excalidrawRef={excalidrawRef}
                savedLibraryItems={savedLibraryItems}
                onLibraryChange={handleLibraryChange}
                onBack={() => router.push('/library')}
                workspaceId={params.id}
            />
        </div>
    );
}
