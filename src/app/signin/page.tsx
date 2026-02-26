"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function SignIn() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        if (!email || !password) {
            setError("Please fill in all fields");
            setIsLoading(false);
            return;
        }

        // Basic validation
        if (!/\S+@\S+\.\S+/.test(email)) {
            setError("Please enter a valid email address");
            setIsLoading(false);
            return;
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Fetch additional profile data from Firestore
            const userDoc = await getDoc(doc(db, "users", user.uid));
            let userData = { uid: user.uid, email: user.email };

            if (userDoc.exists()) {
                userData = { ...userData, ...userDoc.data() };
            }

            setIsLoading(false);
            router.push("/library");
        } catch (err: any) {
            console.error("Sign in error:", err);
            setError("Invalid email or password. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f0f4f9] flex items-center justify-center p-4 selection:bg-google-blue/20">
            <div className="w-full max-w-[450px] bg-white rounded-[24px] shadow-[0_8px_40px_rgba(0,0,0,0.06)] p-10 border border-gray-100 flex flex-col pt-12">
                <div className="flex justify-center mb-6">
                    <div className="flex  rounded-sm p-1 px-2">
                        <span className="text-google-blue font-[300] text-xl">K</span>
                        <span className="text-google-red font-[300] text-xl">i</span>
                        <span className="text-google-yellow font-[300] text-xl">r</span>
                        <span className="text-google-green font-[300] text-xl">a</span>
                    </div>
                </div>

                <h1 className="text-3xl font-[400] text-[#1f1f1f] text-center mb-2 tracking-tight">Sign in</h1>
                <p className="text-center text-[#444746] mb-8 text-[15px]">Use your FlowState Account</p>

                {error && (
                    <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm mb-6 border border-red-100 flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative group">
                        <input
                            type="email"
                            placeholder="Email or phone"
                            className="w-full px-4 py-4 bg-transparent border border-gray-300 rounded-[8px] text-[#1f1f1f] focus:outline-none focus:border-google-blue focus:border-2 transition-all peer placeholder-transparent"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <label className="absolute left-4 top-4 text-gray-500 text-[15px] pointer-events-none transition-all peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-google-blue peer-focus:bg-white peer-focus:px-1 peer-valid:-top-2.5 peer-valid:text-xs peer-valid:bg-white peer-valid:px-1 [&:not(:empty)]:peer-[:not(:placeholder-shown)]:-top-2.5 [&:not(:empty)]:peer-[:not(:placeholder-shown)]:text-xs [&:not(:empty)]:peer-[:not(:placeholder-shown)]:bg-white [&:not(:empty)]:peer-[:not(:placeholder-shown)]:px-1">
                            Email or phone
                        </label>
                    </div>

                    <div className="relative group pt-2">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            className="w-full px-4 py-4 bg-transparent border border-gray-300 rounded-[8px] text-[#1f1f1f] focus:outline-none focus:border-google-blue focus:border-2 transition-all peer placeholder-transparent pr-12"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <label className="absolute left-4 top-6 text-gray-500 text-[15px] pointer-events-none transition-all peer-focus:-top-0.5 peer-focus:text-xs peer-focus:text-google-blue peer-focus:bg-white peer-focus:px-1 peer-valid:-top-0.5 peer-valid:text-xs peer-valid:bg-white peer-valid:px-1 [&:not(:empty)]:peer-[:not(:placeholder-shown)]:-top-0.5 [&:not(:empty)]:peer-[:not(:placeholder-shown)]:text-xs [&:not(:empty)]:peer-[:not(:placeholder-shown)]:bg-white [&:not(:empty)]:peer-[:not(:placeholder-shown)]:px-1">
                            Enter your password
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

                    <div className="pt-2 pb-6">
                        <button type="button" className="text-google-blue text-[14px] font-[500] hover:underline bg-transparent border-none p-0 cursor-pointer">
                            Forgot password?
                        </button>
                    </div>

                    <div className="flex items-center justify-between pt-8 pb-4">
                        <Link href="/signup" className="text-google-blue text-[14px] hover:bg-blue-50 px-3 py-2 rounded-md font-[500] transition-colors -ml-3">
                            Create account
                        </Link>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-[#0b57d0] hover:bg-blue-700 text-white px-6 py-2.5 rounded-full text-[14px] font-[500] transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Signing in...
                                </>
                            ) : "Next"}
                        </button>
                    </div>
                </form>
            </div>

            {/* Minimal footer typical of Google logins */}
            <div className="absolute bottom-4 left-0 w-full flex justify-between px-8 max-w-5xl mx-auto items-center text-[12px] text-gray-500">
                <div className="flex gap-4">
                    <span className="cursor-pointer hover:bg-gray-200 px-2 py-1 rounded transition-colors">English (United States)</span>
                </div>
                <div className="flex gap-4">
                    <span className="cursor-pointer hover:bg-gray-200 px-2 py-1 rounded transition-colors">Help</span>
                    <span className="cursor-pointer hover:bg-gray-200 px-2 py-1 rounded transition-colors">Privacy</span>
                    <span className="cursor-pointer hover:bg-gray-200 px-2 py-1 rounded transition-colors">Terms</span>
                </div>
            </div>
        </div>
    );
}
