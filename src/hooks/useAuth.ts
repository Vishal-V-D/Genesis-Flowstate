"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentSession, signOutUser, CognitoUserSession } from "@/lib/aws-client";

export interface UserProfile {
    uid: string;
    email: string;
    firstName?: string;
    lastName?: string;
    onboardingData?: any;
    hoverStyle?: "svgMask" | "tear" | "smooth" | "splatter" | "glitch";
    excalidrawLibrary?: string;
    createdAt?: string;
    hasSeenTour?: boolean;
}

export function useAuth(requireAuth: boolean = false) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        let isMounted = true;

        async function initAuth() {
            try {
                const session = getCurrentSession();
                if (!session) {
                    if (isMounted) {
                        setUser(null);
                        setLoading(false);
                        if (requireAuth) router.push("/signin");
                    }
                    return;
                }

                // Call local Next.js API Route to fetch user profile from DynamoDB
                const response = await fetch("/api/users/profile", {
                    headers: {
                        Authorization: `Bearer ${session.idToken}`,
                    },
                });

                if (response.ok) {
                    const dbProfile = await response.json();
                    if (isMounted) {
                        setUser({
                            uid: session.uid,
                            email: session.email,
                            firstName: session.firstName || dbProfile.firstName,
                            lastName: session.lastName || dbProfile.lastName,
                            ...dbProfile,
                        });
                    }
                } else {
                    // Profile document doesn't exist yet, or API returned error
                    // Fallback to basic session info
                    if (isMounted) {
                        setUser({
                            uid: session.uid,
                            email: session.email,
                            firstName: session.firstName,
                            lastName: session.lastName,
                        });
                    }
                }
            } catch (err) {
                console.error("Error loading auth profile:", err);
                if (isMounted) {
                    setUser(null);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        initAuth();

        // Listen for standard storage events (handles multi-tab signouts)
        const handleStorageChange = () => {
            const session = getCurrentSession();
            if (!session && requireAuth) {
                router.push("/signin");
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => {
            isMounted = false;
            window.removeEventListener("storage", handleStorageChange);
        };
    }, [requireAuth, router]);

    const logout = () => {
        signOutUser();
        setUser(null);
        router.push("/signin");
    };

    return { user, loading, setUser, logout };
}
