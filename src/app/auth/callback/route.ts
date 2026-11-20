import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
    const { searchParams, origin } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
        return NextResponse.redirect(`${origin}/signin?error=missing_code`);
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.session) {
        console.error("Auth callback error:", error);
        return NextResponse.redirect(`${origin}/signin?error=auth_failed`);
    }

    const { user, session } = data;

    // Provision user profile on first login
    await prisma.user.upsert({
        where: { userId: user.id },
        update: {},
        create: {
            userId: user.id,
            email: user.email!,
            firstName: user.user_metadata?.firstName,
            lastName: user.user_metadata?.lastName,
            hoverStyle: "smooth",
            onboardingData: {},
        },
    });

    // Store session in cookie-friendly redirect with token in URL fragment
    // Frontend will pick this up via supabase.auth.onAuthStateChange
    const response = NextResponse.redirect(`${origin}/onboarding`);
    return response;
}
