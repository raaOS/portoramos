'use client';

import React, { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { LazyMotion, domAnimation } from 'framer-motion';
import Header from '@/components/shared/Header';
import { WindowProvider } from '@/contexts/WindowContext';
import GlobalDock from './GlobalDock';
import WindowRenderer from './WindowRenderer';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import type { DockPreferences } from '@/types/about';


export default function LayoutClient({
    children,
    modal,
    dockConfig
}: {
    children: React.ReactNode;
    modal: React.ReactNode;
    dockConfig?: DockPreferences;
}) {
    const pathname = usePathname();
    const isAdminRequest = pathname?.startsWith('/admin');
    const isOsMode = pathname === '/' || pathname?.startsWith('/about-test') || pathname?.startsWith('/about');
    const isContact = pathname === '/contact' || pathname?.startsWith('/contact');

    // We want the Dock on ALL pages except Admin and the OS Desktop itself (which has its own Dock)
    const showGlobalDock = !isAdminRequest && !isOsMode;

    const showHeader = !isAdminRequest && !isOsMode;

    if (isAdminRequest || isOsMode) {
        return (
            <>
                {children}
                {modal}
            </>
        );
    }

    return (
        <ErrorBoundary>
            <LazyMotion features={domAnimation}>
                <WindowProvider>
                    <Suspense fallback={null}>
                        {showHeader && <Header />}
                    </Suspense>
                    <main className={isContact ? "" : "pb-24"}>
                        {children}
                    </main>
                    {modal}

                    {showGlobalDock && <GlobalDock dockConfig={dockConfig} />}
                    <WindowRenderer />
                </WindowProvider>
            </LazyMotion>
        </ErrorBoundary>
    )
}
