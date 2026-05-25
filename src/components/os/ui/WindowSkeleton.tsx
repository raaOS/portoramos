'use client';

import React from 'react';

interface WindowSkeletonProps {
  type?: 'explorer' | 'about' | 'generic';
  title?: string;
}

export default function WindowSkeleton({
  type = 'generic',
  title: _title = 'Loading...',
}: WindowSkeletonProps) {
  return (
    <div className="flex h-full w-full animate-pulse flex-col overflow-hidden rounded-[18px] border border-white/20 bg-[#f6f6f6] shadow-2xl dark:bg-[#1a1a1a]">
      {/* Title Bar Mockup */}
      <div className="flex h-10 shrink-0 items-center border-b border-black/5 bg-white/50 px-4 backdrop-blur-md dark:border-white/5 dark:bg-black/40">
        <div className="flex w-[52px] gap-2">
          <div className="h-3 w-3 rounded-full bg-black/10 dark:bg-white/10" />
          <div className="h-3 w-3 rounded-full bg-black/10 dark:bg-white/10" />
          <div className="h-3 w-3 rounded-full bg-black/10 dark:bg-white/10" />
        </div>
        <div className="flex-1 text-center">
          <div className="mx-auto h-3 w-24 rounded bg-black/5 dark:bg-white/5" />
        </div>
        <div className="w-[52px]" />
      </div>

      {/* Content Area Mockup */}
      <div className="flex flex-1 overflow-hidden">
        {type === 'about' && (
          <div className="flex w-[180px] flex-col gap-3 border-r border-black/5 p-4 dark:border-white/5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 w-full rounded-md bg-black/5 dark:bg-white/5" />
            ))}
          </div>
        )}

        <div className="flex flex-1 flex-col gap-6 p-6">
          {type === 'explorer' ? null : (
            <>
              <div className="h-8 w-2/3 rounded-lg bg-black/5 dark:bg-white/5" />
              <div className="space-y-3">
                <div className="h-4 w-full rounded bg-black/5 dark:bg-white/5" />
                <div className="h-4 w-full rounded bg-black/5 dark:bg-white/5" />
                <div className="h-4 w-3/4 rounded bg-black/5 dark:bg-white/5" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="h-32 rounded-xl bg-black/5 dark:bg-white/5" />
                <div className="h-32 rounded-xl bg-black/5 dark:bg-white/5" />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
