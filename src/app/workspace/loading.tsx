import React from 'react';

export default function WorkspaceLoading() {
    return (
        <div className="flex items-center justify-center w-full h-screen bg-[#f8f9fa] relative overflow-hidden">
            {/* Soft grid background matching canvas */}
            <div
                className="absolute inset-0 z-0 opacity-20 pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                }}
            ></div>

            <div className="flex flex-col items-center gap-4 z-10">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-[#4285F4] rounded-full animate-spin" />
                <span className="text-sm text-gray-500 font-medium tracking-wide">Loading Workspace...</span>
            </div>
        </div>
    );
}
