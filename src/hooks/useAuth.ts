"use client";
import { useState, useEffect } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export interface UserProfile {
    uid: string;
    email: string;
    firstName?: string;
    lastName?: string;
    onboardingData?: any;
    hoverStyle?: "svgMask" | "tear" | "smooth" | "splatter" | "glitch";
}

export function useAuth(requireAuth: boolean = false) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
                    if (userDoc.exists()) {
                        setUser({ uid: firebaseUser.uid, email: firebaseUser.email || "", ...userDoc.data() });
                    } else {
                        setUser({ uid: firebaseUser.uid, email: firebaseUser.email || "" });
                    }
                } catch (error) {
                    console.error("Error fetching user profile:", error);
                    setUser({ uid: firebaseUser.uid, email: firebaseUser.email || "" });
                }
            } else {
                setUser(null);
                if (requireAuth) {
                    router.push("/signin");
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [requireAuth, router]);

    return { user, loading, setUser };
}
