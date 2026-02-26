import React from 'react';

export default function Loading() {
    return (
        <div className="flex items-center justify-center w-full min-h-screen bg-[#f0f4f9]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-[#4285F4] rounded-full animate-spin" />
                <span className="text-sm text-gray-400 font-medium">FlowState is thinking...</span>
            </div>
            {/* The same mesh background as the base layout so it looks seamless */}
            <div className="bg-mesh absolute inset-0 z-[-1] opacity-50"></div>
        </div>
    );
}
