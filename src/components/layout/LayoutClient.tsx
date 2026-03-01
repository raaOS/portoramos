'use client';

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { LazyMotion, domAnimation } from 'framer-motion';
import Header from '@/components/shared/Header';
import { WindowProvider } from '@/contexts/WindowContext';
import GlobalDock from './GlobalDock';
import WindowRenderer from './WindowRenderer';
import type { DockPreferences } from '@/types/about';

// Lazy-load below-fold components to reduce initial JS bundle (~30-50KB savings)
// Footer is available but not currently used in this layout
void dynamic(() => import('@/components/shared/Footer'), { ssr: false });
const ScrollToTop = dynamic(() => import('@/components/layout/ScrollToTop'), { ssr: false });

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
        <LazyMotion features={domAnimation}>
            <WindowProvider>
                {showHeader && <Header />}
                <main className={isContact ? "" : "pb-24"}>
                    {children}
                </main>
                {modal}
                <ScrollToTop />
                {showGlobalDock && <GlobalDock dockConfig={dockConfig} />}
                <WindowRenderer />
            </WindowProvider>
        </LazyMotion>
    )
}

