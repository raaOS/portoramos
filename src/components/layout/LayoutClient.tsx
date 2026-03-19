'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { LazyMotion, domAnimation, motion, AnimatePresence } from 'framer-motion';
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

    // BUG FIX: Add transition state to prevent dock flash
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [prevPathname, setPrevPathname] = useState(pathname);

    // We want the Dock on ALL pages except Admin and the OS Desktop itself (which has its own Dock)
    const showGlobalDock = !isAdminRequest && !isOsMode && !isTransitioning;

    const showHeader = !isAdminRequest && !isOsMode;

    // Handle transition from OS mode to normal mode
    useEffect(() => {
        if (prevPathname !== pathname) {
            const wasOsMode = prevPathname === '/' || prevPathname?.startsWith('/about');
            const isNowOsMode = isOsMode;
            
            // If transitioning from OS mode to normal mode, add delay
            if (wasOsMode && !isNowOsMode) {
                setIsTransitioning(true);
                const timer = setTimeout(() => {
                    setIsTransitioning(false);
                }, 150); // 150ms delay for OS dock to fully unmount
                
                setPrevPathname(pathname);
                return () => clearTimeout(timer);
            }
            
            setPrevPathname(pathname);
        }
    }, [pathname, prevPathname, isOsMode]);

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
                    <motion.main 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className={isContact ? "" : "pb-24"}
                    >
                        {children}
                    </motion.main>
                    {modal}

                    <AnimatePresence mode="wait">
                        {showGlobalDock && (
                            <motion.div
                                key="global-dock"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <GlobalDock dockConfig={dockConfig} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <WindowRenderer />
                </WindowProvider>
            </LazyMotion>
        </ErrorBoundary>
    )
}
