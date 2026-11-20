import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface SupabaseUserSession {
    uid: string;
    email: string;
    firstName?: string;
    lastName?: string;
    idToken: string;
    accessToken: string;
    refreshToken?: string;
}

export async function signUpUser(email: string, password: string, firstName: string, lastName: string) {
    const redirectTo =
        typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback`
            : `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`;

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { firstName, lastName },
            emailRedirectTo: redirectTo,
        },
    });
    if (error) throw error;
    return data;
}

export async function confirmSignUpUser(email: string, code: string) {
    const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "signup",
    });
    if (error) throw error;
    return data;
}

export async function signInUser(email: string, password: string): Promise<SupabaseUserSession> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.session || !data.user) throw new Error("Authentication failed");

    const session: SupabaseUserSession = {
        uid: data.user.id,
        email: data.user.email!,
        firstName: data.user.user_metadata?.firstName,
        lastName: data.user.user_metadata?.lastName,
        idToken: data.session.access_token,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
    };
    localStorage.setItem("flowstate_session", JSON.stringify(session));
    return session;
}

export function signOutUser() {
    supabase.auth.signOut();
    localStorage.removeItem("flowstate_session");
}

export function getCurrentSession(): SupabaseUserSession | null {
    if (typeof window === "undefined") return null;
    const data = localStorage.getItem("flowstate_session");
    if (!data) return null;
    try {
        const session = JSON.parse(data) as SupabaseUserSession;
        const parts = session.idToken.split(".");
        if (parts.length !== 3) { signOutUser(); return null; }
        const payload = JSON.parse(window.atob(parts[1]));
        if (Date.now() >= payload.exp * 1000) { signOutUser(); return null; }
        return session;
    } catch {
        return null;
    }
}
