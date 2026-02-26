"use client";

import React, { useRef, useEffect, useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import type { LibraryItems } from "@excalidraw/excalidraw/types";
import { useAuth } from "@/hooks/useAuth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import WorkspaceLoading from '../loading';

const LIBRARY_STORAGE_KEY = "kira-excalidraw-library";

// --- Client-side Memory Cache ---
// Caches workspace data by ID so navigating back to a workspace is instant.
const globalWorkspaceCache: Record<string, {
    savedLibraryItems: LibraryItems;
    initialElements: any[] | null;
    initialAppState: any | null;
    workspaceTitle: string;
    isOwner: boolean;
    canEdit: boolean;
}> = {};

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

function WorkspacePageInner({ params }: { params: { id: string } }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const excalidrawRef = useRef<any>(null);

    const cached = globalWorkspaceCache[params.id];

    const [savedLibraryItems, setSavedLibraryItems] = useState<LibraryItems>(cached?.savedLibraryItems || []);
    const [pendingLibraryUrl, setPendingLibraryUrl] = useState<string | null>(null);
    // If we have cached data, no need to show the loading screen initially.
    const [libraryLoaded, setLibraryLoaded] = useState(!!cached);

    // Canvas Document State
    const [initialElements, setInitialElements] = useState<any[] | null>(cached?.initialElements || null);
    const [initialAppState, setInitialAppState] = useState<any | null>(cached?.initialAppState || null);
    const [workspaceTitle, setWorkspaceTitle] = useState<string>(cached?.workspaceTitle || "");
    const [isOwner, setIsOwner] = useState(cached?.isOwner || false);
    const [canEdit, setCanEdit] = useState(cached?.canEdit || false);

    // Enforce authentication for workspace access
    const { user, loading: authLoading } = useAuth(true);

    // Load workspace data + validate share token
    useEffect(() => {
        if (authLoading || !user) return;

        const fetchWorkspaceData = async () => {
            try {
                const shareToken = searchParams?.get("token") ?? null;

                let newSavedLibraryItems: LibraryItems = [];
                let newInitialElements: any[] | null = null;
                let newInitialAppState: any | null = null;

                // 1. Load User Library Items
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists() && userDoc.data().excalidrawLibrary) {
                    const parsed = JSON.parse(userDoc.data().excalidrawLibrary);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setSavedLibraryItems(parsed);
                        newSavedLibraryItems = parsed;
                    }
                }

                // 2. Load Workspace Canvas
                const workspaceDoc = await getDoc(doc(db, "workspaces", params.id));

                let resolvedTitle = "Untitled Architecture";
                let resolvedRole: 'owner' | 'editor' | 'viewer' = 'viewer';
                let owner = false;

                if (workspaceDoc.exists()) {
                    const data = workspaceDoc.data();
                    if (data.title) { resolvedTitle = data.title; setWorkspaceTitle(data.title); }
                    if (data.elements && data.elements !== "undefined") {
                        try {
                            newInitialElements = JSON.parse(data.elements);
                            setInitialElements(newInitialElements);
                        } catch (e) { console.error("Error parsing elements", e); }
                    }
                    if (data.appState && data.appState !== "undefined") {
                        try {
                            newInitialAppState = JSON.parse(data.appState);
                            setInitialAppState(newInitialAppState);
                        } catch (e) { console.error("Error parsing appState", e); }
                    }

                    owner = data.userId === user.uid;
                    setIsOwner(owner);

                    if (owner) {
                        resolvedRole = 'owner';
                        setCanEdit(true);
                    } else if (shareToken) {
                        const editTokens: string[] = data.editTokens || [];
                        const viewTokens: string[] = data.viewTokens || [];
                        if (editTokens.includes(shareToken)) {
                            resolvedRole = 'editor';
                            setCanEdit(true);
                        } else if (viewTokens.includes(shareToken)) {
                            resolvedRole = 'viewer';
                            setCanEdit(false);
                        } else {
                            resolvedRole = data.shareMode !== 'viewer' ? 'editor' : 'viewer';
                            setCanEdit(data.shareMode !== 'viewer');
                        }
                    } else {
                        resolvedRole = data.shareMode !== 'viewer' ? 'editor' : 'viewer';
                        setCanEdit(data.shareMode !== 'viewer');
                    }
                } else {
                    // Brand new workspace — create it
                    await setDoc(doc(db, "workspaces", params.id), {
                        userId: user.uid,
                        title: resolvedTitle,
                        createdAt: new Date().toISOString(),
                        shareMode: 'editor',
                        editTokens: [],
                        viewTokens: [],
                    });
                    resolvedRole = 'owner';
                    setWorkspaceTitle(resolvedTitle);
                    setIsOwner(true);
                    setCanEdit(true);
                }

                // 3. ── Industry-Standard Join Write ──────────────────────────────────────
                // Write a lightweight index entry into userWorkspaces/{uid}/items/{workspaceId}.
                // This is how Notion/Linear/Figma list all workspaces a user has access to
                // without scanning the entire workspaces collection or using array-contains.
                // The library page reads THIS subcollection — fast O(1) per user, role-aware.
                await setDoc(
                    doc(db, "userWorkspaces", user.uid, "items", params.id),
                    {
                        workspaceId: params.id,
                        role: resolvedRole,           // 'owner' | 'editor' | 'viewer'
                        title: resolvedTitle,
                        updatedAt: new Date().toISOString(),
                    },
                    { merge: true }
                );

                // Update cache successfully
                globalWorkspaceCache[params.id] = {
                    savedLibraryItems: newSavedLibraryItems,
                    initialElements: newInitialElements,
                    initialAppState: newInitialAppState,
                    workspaceTitle: resolvedTitle,
                    isOwner: owner,
                    canEdit: resolvedRole !== 'viewer',
                };

            } catch (e) {
                console.warn("[FlowState] Could not load workspace data from Firestore:", e);
            } finally {
                setLibraryLoaded(true);
            }
        };
        fetchWorkspaceData();
    }, [user, authLoading, params.id, searchParams]);


    // Detect #addLibrary=... hash
    useEffect(() => {
        const parseHash = () => {
            const hash = window.location.hash;
            if (!hash.startsWith('#addLibrary=')) return;
            const p = new URLSearchParams(hash.slice(1));
            const libUrl = p.get('addLibrary');
            if (libUrl) {
                setPendingLibraryUrl(libUrl);
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
            }
        };
        parseHash();
        window.addEventListener('hashchange', parseHash);
        return () => window.removeEventListener('hashchange', parseHash);
    }, []);

    // Load library from pending URL
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
                await excalidrawRef.current.updateLibrary({ libraryItems, merge: true, openLibraryMenu: true });
                setPendingLibraryUrl(null);
            } catch (e) {
                console.error('Failed to install library from hash:', e);
                setPendingLibraryUrl(null);
            }
        }, 300);
        return () => clearInterval(interval);
    }, [pendingLibraryUrl]);

    // Persist library items to Firestore
    const handleLibraryChange = async (items: LibraryItems) => {
        if (!user) return;

        // Guard: Excalidraw fires onLibraryChange([]) on mount before items are loaded.
        // Without this guard that empty call would wipe whatever was saved in Firestore.
        if (items.length === 0) return;

        try {
            // Use setDoc+merge so it works for new users who don't have a users/{uid} doc yet.
            // updateDoc throws "No document to update" for new users, losing their library items.
            await setDoc(doc(db, "users", user.uid), {
                excalidrawLibrary: JSON.stringify(items)
            }, { merge: true });
            console.log(`[FlowState] 💾 Saved ${items.length} library items to Firestore.`);
        } catch (e) {
            console.error("[FlowState] Could not save library to Firestore:", e);
        }
    };


    if (!libraryLoaded) {
        return <WorkspaceLoading />;
    }

    return (
        <div style={{ width: "100vw", height: "100vh" }}>
            <ExcalidrawWrapper
                excalidrawRef={excalidrawRef}
                savedLibraryItems={savedLibraryItems}
                initialElements={initialElements}
                initialAppState={initialAppState}
                onLibraryChange={handleLibraryChange}
                onBack={() => router.push('/library')}
                workspaceId={params.id}
                workspaceTitle={workspaceTitle}
                isOwner={isOwner}
                canEdit={canEdit}
            />
        </div>
    );
}

export default function WorkspacePage({ params }: { params: { id: string } }) {
    return (
        <Suspense fallback={<WorkspaceLoading />}>
            <WorkspacePageInner params={params} />
        </Suspense>
    );
}
