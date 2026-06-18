"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { User, Briefcase, GraduationCap, Code2, BookOpen, Layers } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getCurrentSession } from "@/lib/aws-client";

type Step = 1 | 2;

export default function Onboarding() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState<Step>(1);
    const [accountType, setAccountType] = useState<string | null>(null);
    const [primaryGoal, setPrimaryGoal] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const { user, loading } = useAuth(true);

    // If user already onboarded, skip
    useEffect(() => {
        if (!loading && user && user.onboardingData) {
            router.push("/library");
        }
    }, [user, loading, router]);

    const handleAccountTypeSelect = (type: string) => {
        setAccountType(type);
        setTimeout(() => setCurrentStep(2), 400); // Smooth auto-advance
    };

    const handleGoalSelect = async (goal: string) => {
        setPrimaryGoal(goal);
        setIsSaving(true);

        // Wait a beat for animation
        await new Promise(resolve => setTimeout(resolve, 600));

        // Save to DynamoDB
        if (user) {
            try {
                const onboardingData = {
                    accountType,
                    primaryGoal: goal,
                    completedAt: new Date().toISOString()
                };
                const session = getCurrentSession();
                if (session) {
                    await fetch("/api/users/profile", {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${session.idToken}`,
                        },
                        body: JSON.stringify({ onboardingData }),
                    });
                }
            } catch (err) {
                console.error("Failed to save onboarding data:", err);
            }
        }

        // Complete onboarding, go to dashboard
        router.push("/library");
    };

    const handleSkip = async () => {
        if (user) {
            try {
                const onboardingData = {
                    skipped: true,
                    completedAt: new Date().toISOString()
                };
                const session = getCurrentSession();
                if (session) {
                    await fetch("/api/users/profile", {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${session.idToken}`,
                        },
                        body: JSON.stringify({ onboardingData }),
                    });
                }
            } catch (err) {
                console.error("Failed to save skip state:", err);
            }
        }
        router.push("/library");
    };

    return (
        <div className="min-h-screen bg-[#f0f4f9] flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-[30vh] bg-gradient-to-b from-google-blue/5 to-transparent pointer-events-none" />

            <div className="w-full max-w-[600px] z-10">
                <div className="flex justify-center mb-8">
                    <div className="flex bg-white shadow-sm rounded-lg p-1.5 px-3 border border-gray-100">
                        <span className="text-google-blue font-[400] text-2xl">G</span>
                        <span className="text-google-red font-[400] text-2xl">e</span>
                        <span className="text-google-yellow font-[400] text-2xl">n</span>
                        <span className="text-google-green font-[400] text-2xl">e</span>
                        <span className="text-google-blue font-[400] text-2xl">s</span>
                        <span className="text-google-red font-[400] text-2xl">i</span>
                        <span className="text-google-yellow font-[400] text-2xl">s</span>
                    </div>
                </div>

                <div className="bg-white rounded-[32px] shadow-[0_8px_40px_rgba(0,0,0,0.04)] border border-gray-100 p-8 sm:p-12 relative overflow-hidden min-h-[450px]">
                    {/* Progress indicator */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gray-100">
                        <motion.div
                            className="h-full bg-google-blue"
                            initial={{ width: "0%" }}
                            animate={{ width: currentStep === 1 ? "50%" : "100%" }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                        />
                    </div>

                    <AnimatePresence mode="wait">
                        {currentStep === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="flex flex-col h-full"
                            >
                                <div className="mb-8 text-center">
                                    <h1 className="text-3xl font-[400] text-gray-900 mb-3">Welcome to FlowState, {user?.firstName || 'there'}!</h1>
                                    <p className="text-gray-500 text-lg">How are you planning to use Genesis?</p>
                                </div>

                                <div className="grid grid-cols-1 gap-4 mt-auto">
                                    <button
                                        onClick={() => handleAccountTypeSelect('personal')}
                                        className={`p-5 rounded-2xl border-2 text-left flex items-center gap-5 transition-all group ${accountType === 'personal' ? 'border-google-blue bg-blue-50/30' : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${accountType === 'personal' ? 'bg-google-blue text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-google-blue'}`}>
                                            <User className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900 text-lg">For personal use</h3>
                                            <p className="text-gray-500 text-sm">Solo projects, hobbyists, enthusiasts</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => handleAccountTypeSelect('work')}
                                        className={`p-5 rounded-2xl border-2 text-left flex items-center gap-5 transition-all group ${accountType === 'work' ? 'border-google-blue bg-blue-50/30' : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${accountType === 'work' ? 'bg-google-blue text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-google-blue'}`}>
                                            <Briefcase className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900 text-lg">For work / My team</h3>
                                            <p className="text-gray-500 text-sm">Startups, enterprise, agencies</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => handleAccountTypeSelect('education')}
                                        className={`p-5 rounded-2xl border-2 text-left flex items-center gap-5 transition-all group ${accountType === 'education' ? 'border-google-blue bg-blue-50/30' : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${accountType === 'education' ? 'bg-google-blue text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-google-blue'}`}>
                                            <GraduationCap className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900 text-lg">For education</h3>
                                            <p className="text-gray-500 text-sm">Students, instructors, study groups</p>
                                        </div>
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="flex flex-col h-full"
                            >
                                <div className="mb-8 text-center">
                                    <button
                                        onClick={() => setCurrentStep(1)}
                                        className="absolute left-8 top-8 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                                    </button>
                                    <h1 className="text-3xl font-[400] text-gray-900 mb-3">Almost done</h1>
                                    <p className="text-gray-500 text-lg">What brings you to FlowState today?</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-auto">
                                    <button
                                        onClick={() => handleGoalSelect('design')}
                                        className={`p-5 rounded-2xl border-2 text-left flex flex-col gap-3 transition-all group ${primaryGoal === 'design' ? 'border-google-blue bg-blue-50/30' : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-blue-50 text-google-blue flex items-center justify-center">
                                            <Layers className="w-5 h-5" />
                                        </div>
                                        <h3 className="font-medium text-gray-900">Design an entirely new system</h3>
                                    </button>

                                    <button
                                        onClick={() => handleGoalSelect('refactor')}
                                        className={`p-5 rounded-2xl border-2 text-left flex flex-col gap-3 transition-all group ${primaryGoal === 'refactor' ? 'border-google-red bg-red-50/30' : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-red-50 text-google-red flex items-center justify-center">
                                            <Code2 className="w-5 h-5" />
                                        </div>
                                        <h3 className="font-medium text-gray-900">Refactor an existing architecture</h3>
                                    </button>

                                    <button
                                        onClick={() => handleGoalSelect('learning')}
                                        className={`p-5 rounded-2xl border-2 text-left flex flex-col gap-3 transition-all group ${primaryGoal === 'learning' ? 'border-google-green bg-green-50/30' : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-green-50 text-google-green flex items-center justify-center">
                                            <BookOpen className="w-5 h-5" />
                                        </div>
                                        <h3 className="font-medium text-gray-900">Learn how systems work</h3>
                                    </button>

                                    <button
                                        onClick={() => handleGoalSelect('interview')}
                                        className={`p-5 rounded-2xl border-2 text-left flex flex-col gap-3 transition-all group ${primaryGoal === 'interview' ? 'border-google-yellow bg-yellow-50/30' : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-yellow-50 text-google-yellow flex items-center justify-center">
                                            <Briefcase className="w-5 h-5" />
                                        </div>
                                        <h3 className="font-medium text-gray-900">Prepare for an interview</h3>
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Saving overlay */}
                    {isSaving && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-4">
                                <svg className="animate-spin h-8 w-8 text-google-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                <span className="text-gray-600 font-medium">Personalizing your workspace...</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-center mt-6">
                    <button
                        onClick={handleSkip}
                        disabled={isSaving}
                        className="text-gray-500 hover:text-gray-800 text-sm font-medium transition-colors"
                    >
                        Skip for now
                    </button>
                </div>
            </div>
        </div>
    );
}
