'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const DesktopOS = dynamic(
  () => import('@/components/os/core/DesktopEnvironmentClient'),
  { 
    ssr: false,
    loading: () => <LoadingOS />
  }
);

function LoadingOS() {
  return (
    <div className="h-screen w-full bg-[#050505] flex items-center justify-center">
      <div className="text-white opacity-50 animate-pulse font-mono tracking-tighter">
        LOADING RAMOS OS...
      </div>
    </div>
  );
}

export default function HomeOSWrapper(props: React.ComponentProps<typeof DesktopOS>) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // First pass: render skeleton/loading (prevents hydration mismatch)
  if (!isMounted) {
    return <LoadingOS />;
  }

  // Second pass: render the real OS environment
  return <DesktopOS {...props} />;
}
