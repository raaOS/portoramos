'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const DesktopOS = dynamic(
  () => import('@/components/os/core/DesktopEnvironmentClient'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-screen w-full bg-[#050505] flex items-center justify-center">
        <div className="text-white opacity-50 animate-pulse font-mono tracking-tighter">
          LOADING RAMOS OS...
        </div>
      </div>
    )
  }
);

export default function HomeOSWrapper(props: any) {
  return <DesktopOS {...props} />;
}
