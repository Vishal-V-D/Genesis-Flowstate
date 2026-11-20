"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Mail } from "lucide-react";
import AuthBackground from "@/components/auth/AuthBackground";
import { signUpUser } from "@/lib/supabase-client";

export default function SignUp() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Signup form states
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Flow states
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (searchParams?.get("confirm") === "true") {
            setIsVerifying(true);
            const mail = searchParams.get("email");
            if (mail) setEmail(mail);
        }
    }, [searchParams]);

    // Handle sign up submission
    const handleSignUpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        if (!firstName || !lastName || !email || !password) {
            setError("Please fill in all fields");
            setIsLoading(false);
            return;
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            setError("Please enter a valid email address");
            setIsLoading(false);
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            setIsLoading(false);
            return;
        }

        try {
            await signUpUser(email, password, firstName, lastName);
            setIsLoading(false);
            setIsVerifying(true);
        } catch (err: any) {
            console.error("Sign up error:", err);
            let msg = "Failed to create account. Please try again.";
            if (err.message?.includes("already registered") || err.message?.includes("already been registered")) {
                msg = "An account with this email address already exists.";
            } else if (err.message?.includes("Password")) {
                msg = "Password does not meet requirements. Use 8+ characters with letters, numbers, and symbols.";
            }
            setError(msg);
            setIsLoading(false);
        }
    };


    return (
        <div className="relative min-h-screen flex items-center justify-center p-4 selection:bg-google-blue/20 overflow-hidden">
            <AuthBackground mode="signup" />
            <div className="relative z-10 w-full max-w-[450px] bg-white dark:bg-dark-card backdrop-blur-xl rounded-xl p-10 border border-gray-100 dark:border-dark-border flex flex-col pt-12">
                <div className="flex justify-center mb-6">
                    <div className="flex rounded-sm p-1 px-2">
                        <span className="text-google-blue font-[300] text-xl">G</span>
                        <span className="text-google-red font-[300] text-xl">e</span>
                        <span className="text-google-yellow font-[300] text-xl">n</span>
                        <span className="text-google-green font-[300] text-xl">e</span>
                        <span className="text-google-blue font-[300] text-xl">s</span>
                        <span className="text-google-red font-[300] text-xl">i</span>
                        <span className="text-google-yellow font-[300] text-xl">s</span>
                    </div>
                </div>

                {!isVerifying ? (
                    <>
                        <h1 className="text-3xl font-[400] text-[#1f1f1f] dark:text-dark-text text-center mb-2 tracking-tight">Create Account</h1>
                        <p className="text-center text-[#444746] dark:text-dark-muted mb-8 text-[15px]">Enter your details to register</p>

                        {error && (
                            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm mb-6 border border-red-100 flex items-center gap-3">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSignUpSubmit} className="space-y-4">
                            <div className="flex gap-4">
                                <div className="relative group w-1/2">
                                    <input
                                        type="text"
                                        placeholder="First name"
                                        className="w-full px-4 py-4 bg-transparent border border-gray-300 dark:border-dark-border rounded-[8px] text-[#1f1f1f] dark:text-dark-text focus:outline-none focus:border-google-blue focus:border-2 transition-all peer placeholder-transparent"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                    />
                                    <label className="absolute left-4 top-4 text-gray-500 text-[15px] pointer-events-none transition-all peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-google-blue peer-focus:bg-white dark:peer-focus:bg-dark-card peer-focus:px-1 peer-valid:-top-2.5 peer-valid:text-xs peer-valid:bg-white dark:peer-valid:bg-dark-card peer-valid:px-1 [&:not(:empty)]:peer-[:not(:placeholder-shown)]:-top-2.5 [&:not(:empty)]:peer-[:not(:placeholder-shown)]:text-xs [&:not(:empty)]:peer-[:not(:placeholder-shown)]:bg-white dark:[&:not(:empty)]:peer-[:not(:placeholder-shown)]:bg-dark-card [&:not(:empty)]:peer-[:not(:placeholder-shown)]:px-1">
                                        First name
                                    </label>
                                </div>
                                <div className="relative group w-1/2">
                                    <input
                                        type="text"
                                        placeholder="Last name"
                                        className="w-full px-4 py-4 bg-transparent border border-gray-300 dark:border-dark-border rounded-[8px] text-[#1f1f1f] dark:text-dark-text focus:outline-none focus:border-google-blue focus:border-2 transition-all peer placeholder-transparent"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                    />
                                    <label className="absolute left-4 top-4 text-gray-500 text-[15px] pointer-events-none transition-all peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-google-blue peer-focus:bg-white dark:peer-focus:bg-dark-card peer-focus:px-1 peer-valid:-top-2.5 peer-valid:text-xs peer-valid:bg-white dark:peer-valid:bg-dark-card peer-valid:px-1 [&:not(:empty)]:peer-[:not(:placeholder-shown)]:-top-2.5 [&:not(:empty)]:peer-[:not(:placeholder-shown)]:text-xs [&:not(:empty)]:peer-[:not(:placeholder-shown)]:bg-white dark:[&:not(:empty)]:peer-[:not(:placeholder-shown)]:bg-dark-card [&:not(:empty)]:peer-[:not(:placeholder-shown)]:px-1">
                                        Last name
                                    </label>
                                </div>
                            </div>

                            <div className="relative group pt-2">
                                <input
                                    type="email"
                                    placeholder="Email address"
                                    className="w-full px-4 py-4 bg-transparent border border-gray-300 dark:border-dark-border rounded-[8px] text-[#1f1f1f] dark:text-dark-text focus:outline-none focus:border-google-blue focus:border-2 transition-all peer placeholder-transparent"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <label className="absolute left-4 top-6 text-gray-500 text-[15px] pointer-events-none transition-all peer-focus:-top-0.5 peer-focus:text-xs peer-focus:text-google-blue peer-focus:bg-white dark:peer-focus:bg-dark-card peer-focus:px-1 peer-valid:-top-0.5 peer-valid:text-xs peer-valid:bg-white dark:peer-valid:bg-dark-card peer-valid:px-1 [&:not(:empty)]:peer-[:not(:placeholder-shown)]:-top-0.5 [&:not(:empty)]:peer-[:not(:placeholder-shown)]:text-xs [&:not(:empty)]:peer-[:not(:placeholder-shown)]:bg-white dark:[&:not(:empty)]:peer-[:not(:placeholder-shown)]:bg-dark-card [&:not(:empty)]:peer-[:not(:placeholder-shown)]:px-1">
                                    Email address
                                </label>
                            </div>

                            <div className="relative group pt-2 mb-2">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    className="w-full px-4 py-4 bg-transparent border border-gray-300 dark:border-dark-border rounded-[8px] text-[#1f1f1f] dark:text-dark-text focus:outline-none focus:border-google-blue focus:border-2 transition-all peer placeholder-transparent pr-12"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <label className="absolute left-4 top-6 text-gray-500 text-[15px] pointer-events-none transition-all peer-focus:-top-0.5 peer-focus:text-xs peer-focus:text-google-blue peer-focus:bg-white dark:peer-focus:bg-dark-card peer-focus:px-1 peer-valid:-top-0.5 peer-valid:text-xs peer-valid:bg-white dark:peer-valid:bg-dark-card peer-valid:px-1 [&:not(:empty)]:peer-[:not(:placeholder-shown)]:-top-0.5 [&:not(:empty)]:peer-[:not(:placeholder-shown)]:text-xs [&:not(:empty)]:peer-[:not(:placeholder-shown)]:bg-white dark:[&:not(:empty)]:peer-[:not(:placeholder-shown)]:bg-dark-card [&:not(:empty)]:peer-[:not(:placeholder-shown)]:px-1">
                                    Password
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-6 text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-full transition-colors flex items-center justify-center"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={20} className="text-gray-600" /> : <Eye size={20} className="text-gray-600" />}
                                </button>
                            </div>
                            <p className="text-[12px] text-gray-500 dark:text-dark-subtle pl-1 pb-4">Use 8 or more characters with a mix of letters, numbers & symbols</p>

                            <div className="flex items-center justify-between pt-4 pb-4">
                                <Link href="/signin" className="text-google-blue text-[14px] hover:bg-blue-50 px-3 py-2 rounded-md font-[500] transition-colors -ml-3">
                                    Sign in instead
                                </Link>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="bg-[#0b57d0] hover:bg-blue-700 text-white px-6 py-2.5 rounded-full text-[14px] font-[500] transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Creating...
                                        </>
                                    ) : "Next"}
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <>
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                                <Mail size={28} className="text-[#0b57d0]" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-[400] text-[#1f1f1f] dark:text-dark-text text-center mb-2 tracking-tight">Check your email</h1>
                        <p className="text-center text-[#444746] dark:text-dark-muted mb-2 text-[15px]">
                            We sent a verification link to
                        </p>
                        <p className="text-center text-[#1f1f1f] dark:text-dark-text font-[500] mb-8 text-[15px]">{email}</p>

                        <div className="bg-blue-50 dark:bg-dark-border rounded-xl p-4 mb-8 text-sm text-[#444746] dark:text-dark-muted text-center leading-relaxed">
                            Click the link in the email to verify your account and get started. The link expires in 24 hours.
                        </div>

                        <div className="flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => setIsVerifying(false)}
                                className="text-gray-500 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-dark-border px-3 py-2 rounded-md font-[500] text-[14px] transition-colors -ml-3"
                            >
                                Back
                            </button>
                            <Link
                                href="/signin"
                                className="bg-[#0b57d0] hover:bg-blue-700 text-white px-6 py-2.5 rounded-full text-[14px] font-[500] transition-colors"
                            >
                                Go to Sign In
                            </Link>
                        </div>
                    </>
                )}
            </div>

            {/* Minimal footer */}
            <div className="absolute bottom-4 left-0 w-full flex justify-between px-8 max-w-5xl mx-auto items-center text-[12px] text-gray-500 dark:text-dark-subtle">
                <div className="flex gap-4">
                    <span className="cursor-pointer hover:bg-gray-200 dark:hover:bg-dark-border px-2 py-1 rounded transition-colors">English (United States)</span>
                </div>
                <div className="flex gap-4">
                    <span className="cursor-pointer hover:bg-gray-200 dark:hover:bg-dark-border px-2 py-1 rounded transition-colors">Help</span>
                    <span className="cursor-pointer hover:bg-gray-200 dark:hover:bg-dark-border px-2 py-1 rounded transition-colors">Privacy</span>
                    <span className="cursor-pointer hover:bg-gray-200 dark:hover:bg-dark-border px-2 py-1 rounded transition-colors">Terms</span>
                </div>
            </div>
        </div>
    );
}
