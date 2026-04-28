'use client';

import React, { Suspense, useState, useEffect, startTransition } from 'react';
import { usePathname } from 'next/navigation';
import { LazyMotion, domAnimation, AnimatePresence, m } from 'motion/react';
import Header from '@/components/shared/Header';
import { WindowProvider } from '@/contexts/WindowContext';
import { useOSSystem } from '@/components/os/context/OSSystemContext';
import dynamic from 'next/dynamic';
import GlobalDock from './GlobalDock';
import WindowRenderer from './WindowRenderer';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import type { DockPreferences } from '@/types/about';

const ControlCenter = dynamic(() => import('@/components/os/ui/ControlCenter'), {
    ssr: false
});

const CalendarPopout = dynamic(() => import('@/components/os/ui/CalendarPopout'), {
    ssr: false
});

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
    const { 
        showControlCenter, setShowControlCenter,
        showCalendar, setShowCalendar 
    } = useOSSystem();
    const isAdminRequest = pathname?.startsWith('/admin');
    const isOsMode = pathname === '/' || pathname?.startsWith('/about-test') || pathname?.startsWith('/about');
    const isContact = pathname === '/contact' || pathname?.startsWith('/contact');

    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        startTransition(() => {
            setIsMounted(true);
        });
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

                    {/* Global Control Center for non-OS pages */}
                    <AnimatePresence>
                        {showControlCenter && (
                            <div 
                                className="fixed inset-0 pointer-events-auto z-[10001]" 
                                onClick={() => setShowControlCenter(false)}
                            >
                                <div onClick={e => e.stopPropagation()}>
                                    <ControlCenter 
                                        isOpen={showControlCenter} 
                                        onClose={() => setShowControlCenter(false)} 
                                    />
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                    {/* Global Calendar Popout for non-OS pages */}
                    <AnimatePresence>
                        {showCalendar && (
                            <div 
                                className="fixed inset-0 pointer-events-auto z-[10001]" 
                                onClick={() => setShowCalendar(false)}
                            >
                                <div onClick={e => e.stopPropagation()}>
                                    <CalendarPopout 
                                        isOpen={showCalendar} 
                                        onClose={() => setShowCalendar(false)} 
                                    />
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                </WindowProvider>
            </LazyMotion>
        </ErrorBoundary>
    )
}
