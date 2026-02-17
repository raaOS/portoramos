'use client';

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import Header from '@/components/shared/Header';
import { WindowProvider } from '@/contexts/WindowContext';
import GlobalDock from './GlobalDock';
import WindowRenderer from './WindowRenderer';

// Lazy-load below-fold components to reduce initial JS bundle (~30-50KB savings)
const Footer = dynamic(() => import('@/components/shared/Footer'), { ssr: false });
const ScrollToTop = dynamic(() => import('@/components/layout/ScrollToTop'), { ssr: false });

export default function LayoutClient({
    children,
    modal,
    dockConfig
}: {
    children: React.ReactNode;
    modal: React.ReactNode;
    dockConfig?: any;
}) {
    const pathname = usePathname();
    const isAdminRequest = pathname?.startsWith('/admin');
    const isOsMode = pathname === '/' || pathname?.startsWith('/about-test') || pathname?.startsWith('/about');

    // We want the Dock on ALL pages except Admin and the OS Desktop itself (which has its own Dock)
    const showGlobalDock = !isAdminRequest && !isOsMode;

    if (isAdminRequest || isOsMode) {
        return (
            <>
                {children}
                {modal}
            </>
        );
    }

    return (
        <WindowProvider>
            <Header />
            <main className="pb-24">
                {children}
            </main>
            {modal}
            <ScrollToTop />
            {showGlobalDock && <GlobalDock dockConfig={dockConfig} />}
            <WindowRenderer />
        </WindowProvider>
    )
}

