"use client";

import React from "react";

interface WindowSkeletonProps {
    type?: 'explorer' | 'about' | 'generic';
    title?: string;
}

export default function WindowSkeleton({ type = 'generic', title = 'Loading...' }: WindowSkeletonProps) {
    return (
        <div className="flex flex-col h-full w-full bg-[#f6f6f6] dark:bg-[#1a1a1a] rounded-[18px] overflow-hidden border border-white/20 shadow-2xl animate-pulse">
            {/* Title Bar Mockup */}
            <div className="h-10 bg-white/50 dark:bg-black/40 backdrop-blur-md flex items-center px-4 border-b border-black/5 dark:border-white/5 shrink-0">
                <div className="flex gap-2 w-[52px]">
                    <div className="w-3 h-3 rounded-full bg-black/10 dark:bg-white/10" />
                    <div className="w-3 h-3 rounded-full bg-black/10 dark:bg-white/10" />
                    <div className="w-3 h-3 rounded-full bg-black/10 dark:bg-white/10" />
                </div>
                <div className="flex-1 text-center">
                    <div className="h-3 w-24 bg-black/5 dark:bg-white/5 rounded mx-auto" />
                </div>
                <div className="w-[52px]" />
            </div>

            {/* Content Area Mockup */}
            <div className="flex-1 flex overflow-hidden">
                {type === 'about' && (
                    <div className="w-[180px] border-r border-black/5 dark:border-white/5 p-4 flex flex-col gap-3">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-8 bg-black/5 dark:bg-white/5 rounded-md w-full" />
                        ))}
                    </div>
                )}
                
                <div className="flex-1 p-6 flex flex-col gap-6">
                    {type === 'explorer' ? (
                        null
                    ) : (
                        <>
                            <div className="h-8 w-2/3 bg-black/5 dark:bg-white/5 rounded-lg" />
                            <div className="space-y-3">
                                <div className="h-4 w-full bg-black/5 dark:bg-white/5 rounded" />
                                <div className="h-4 w-full bg-black/5 dark:bg-white/5 rounded" />
                                <div className="h-4 w-3/4 bg-black/5 dark:bg-white/5 rounded" />
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div className="h-32 bg-black/5 dark:bg-white/5 rounded-xl" />
                                <div className="h-32 bg-black/5 dark:bg-white/5 rounded-xl" />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
