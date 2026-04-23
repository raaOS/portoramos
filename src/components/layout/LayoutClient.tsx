'use client';

import React, { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { LazyMotion, domAnimation, AnimatePresence, m } from 'motion/react';
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

    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    // We want the Dock on ALL pages except Admin, OS Desktop, and fullscreen pages
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

                    <AnimatePresence mode="wait">
                        {isMounted && showGlobalDock && (
                            <m.div
                                key="global-dock"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <GlobalDock dockConfig={dockConfig} />
                            </m.div>
                        )}
                    </AnimatePresence>
                    <WindowRenderer />
                </WindowProvider>
            </LazyMotion>
        </ErrorBoundary>
    )
}
