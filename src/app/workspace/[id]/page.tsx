"use client";

import React, { useRef, useEffect, useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import type { LibraryItems } from "@excalidraw/excalidraw/types";
import { useAuth } from "@/hooks/useAuth";
import { getCurrentSession } from "@/lib/aws-client";
import WorkspaceLoading from '../loading';

const LIBRARY_STORAGE_KEY = "kira-excalidraw-library";

// --- Client-side Memory Cache ---
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
        const session = getCurrentSession();
        if (!session) return;

        const fetchWorkspaceData = async () => {
            try {
                const shareToken = searchParams?.get("token") ?? null;

                let newSavedLibraryItems: LibraryItems = [];
                let newInitialElements: any[] | null = null;
                let newInitialAppState: any | null = null;

                // 1. ── FAST PATH: localStorage (instant, no network) ────────────────
                const lsElements = localStorage.getItem(`workspace_elements_${params.id}`);
                const lsAppState = localStorage.getItem(`workspace_appstate_${params.id}`);
                if (lsElements) {
                    try {
                        newInitialElements = JSON.parse(lsElements);
                        setInitialElements(newInitialElements);
                        console.log(`[FlowState] ⚡ ${newInitialElements?.length} elements from localStorage (instant).`);
                    } catch (e) { localStorage.removeItem(`workspace_elements_${params.id}`); }
                }
                if (lsAppState) {
                    try { newInitialAppState = JSON.parse(lsAppState); setInitialAppState(newInitialAppState); }
                    catch (e) { localStorage.removeItem(`workspace_appstate_${params.id}`); }
                }

                // 2. Load User Library Items from API
                const userProfileRes = await fetch("/api/users/profile", {
                    headers: {
                        Authorization: `Bearer ${session.idToken}`,
                    },
                });

                if (userProfileRes.ok) {
                    const profile = await userProfileRes.json();
                    if (profile.excalidrawLibrary) {
                        try {
                            const parsed = JSON.parse(profile.excalidrawLibrary);
                            if (Array.isArray(parsed) && parsed.length > 0) {
                                setSavedLibraryItems(parsed);
                                newSavedLibraryItems = parsed;
                            }
                        } catch (e) { }
                    }
                }

                // 3. Load Workspace Canvas from API
                const tokenParam = shareToken ? `?token=${encodeURIComponent(shareToken)}` : "";
                const wsRes = await fetch(`/api/workspaces/${params.id}${tokenParam}`, {
                    headers: {
                        Authorization: `Bearer ${session.idToken}`,
                    },
                });

                let resolvedTitle = "Untitled Architecture";
                let resolvedRole = 'viewer';
                let isOwnerRole = false;

                if (wsRes.ok) {
                    const data = await wsRes.ok ? await wsRes.json() : null;
                    if (data) {
                        if (data.title) {
                            resolvedTitle = data.title;
                            setWorkspaceTitle(data.title);
                        }

                        // Only use database elements if localStorage was empty
                        if (!newInitialElements && data.elements && data.elements !== "undefined") {
                            try {
                                newInitialElements = JSON.parse(data.elements);
                                setInitialElements(newInitialElements);
                                localStorage.setItem(`workspace_elements_${params.id}`, data.elements);
                            } catch (e) { }
                        }
                        if (!newInitialAppState && data.appState && data.appState !== "undefined") {
                            try {
                                newInitialAppState = JSON.parse(data.appState);
                                setInitialAppState(newInitialAppState);
                                localStorage.setItem(`workspace_appstate_${params.id}`, data.appState);
                            } catch (e) { }
                        }

                        isOwnerRole = data.isOwner;
                        resolvedRole = data.userRole;
                        setIsOwner(isOwnerRole);
                        setCanEdit(resolvedRole === 'owner' || resolvedRole === 'editor');
                    }
                } else if (wsRes.status === 404) {
                    // Brand new workspace — create it via API
                    const createRes = await fetch("/api/workspaces", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${session.idToken}`,
                        },
                        body: JSON.stringify({
                            workspaceId: params.id,
                            title: resolvedTitle,
                        }),
                    });

                    if (createRes.ok) {
                        setIsOwner(true);
                        setCanEdit(true);
                        setWorkspaceTitle(resolvedTitle);
                    }
                }

                // Update cache successfully
                globalWorkspaceCache[params.id] = {
                    savedLibraryItems: newSavedLibraryItems,
                    initialElements: newInitialElements,
                    initialAppState: newInitialAppState,
                    workspaceTitle: resolvedTitle,
                    isOwner: isOwnerRole,
                    canEdit: resolvedRole === 'owner' || resolvedRole === 'editor',
                };

            } catch (e) {
                console.warn("[FlowState] Could not load workspace data:", e);
            } finally {
                setLibraryLoaded(true);
            }
        };

        fetchWorkspaceData();
    }, [user, authLoading, params.id, searchParams]);

    // Force-update canvas when DB data arrives after mount
    useEffect(() => {
        if (!initialElements || !excalidrawRef.current) return;
        const api = excalidrawRef.current;
        const t = setTimeout(() => {
            try {
                api.updateScene({ elements: initialElements });
            } catch (e) { }
        }, 300);
        return () => clearTimeout(t);
    }, [initialElements]);

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

    // Persist library items to Database
    const handleLibraryChange = async (items: LibraryItems) => {
        if (!user) return;
        const session = getCurrentSession();
        if (!session) return;

        if (items.length === 0) return;

        try {
            await fetch("/api/users/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.idToken}`,
                },
                body: JSON.stringify({
                    excalidrawLibrary: JSON.stringify(items),
                }),
            });
        } catch (e) {
            console.error("[FlowState] Could not save library:", e);
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
                isAssisted={true}
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
