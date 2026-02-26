import React from 'react';

export default function LibraryLoading() {
    return (
        <main className="relative z-10 w-full min-h-screen overflow-x-hidden bg-[#f0f4f9] pt-28 pb-24 px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-10">
                    <div>
                        <div className="h-12 w-64 bg-gray-200/60 rounded-lg animate-pulse mb-4"></div>
                        <div className="h-6 w-96 bg-gray-200/50 rounded-lg animate-pulse"></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Create New Card Skeleton */}
                    <div className="w-full aspect-[5/4] rounded-[2rem] border-2 border-dashed border-gray-300 bg-white/50 animate-pulse flex flex-col items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-gray-200 mb-3"></div>
                        <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    </div>

                    {[...Array(7)].map((_, i) => (
                        <div key={i} className="relative w-full aspect-[5/4] rounded-[2rem] bg-gray-100 animate-pulse overflow-hidden">
                            <div className="absolute top-0 left-0 w-[70%] h-14 rounded-br-[2rem] bg-gray-200"></div>
                            <div
                                className="absolute bg-white/50 border border-white/20"
                                style={{
                                    top: '3.5rem',
                                    left: '1.25rem',
                                    right: '1.25rem',
                                    bottom: '1.25rem',
                                    borderRadius: '4rem 1.5rem 2.5rem 1.5rem'
                                }}
                            ></div>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
