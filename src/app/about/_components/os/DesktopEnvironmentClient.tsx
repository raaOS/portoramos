"use client";

import dynamic from 'next/dynamic';

const DesktopEnvironment = dynamic(() => import('./DesktopEnvironment'), {
    ssr: false,
    loading: () => <div className="h-screen w-full bg-[#050505]" />
});

export default DesktopEnvironment;
