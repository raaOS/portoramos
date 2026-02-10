'use client';

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import Header from '@/components/shared/Header';

// Lazy-load below-fold components to reduce initial JS bundle (~30-50KB savings)
const Footer = dynamic(() => import('@/components/shared/Footer'), { ssr: false });
const BottomNavigation = dynamic(() => import('@/components/layout/BottomNavigation'), { ssr: false });
const ScrollToTop = dynamic(() => import('@/components/layout/ScrollToTop'), { ssr: false });

export default function ClientLayout({
    children,
    modal,
}: {
    children: React.ReactNode;
    modal: React.ReactNode;
}) {
    const pathname = usePathname();
    const isAdminRequest = pathname?.startsWith('/admin');
    const isOsMode = pathname?.startsWith('/about-test') || pathname?.startsWith('/about');

    if (isAdminRequest || isOsMode) {
        return (
            <>
                {children}
                {modal}
            </>
        );
    }

    return (
        <>
            <Header />
            <main className="pb-20">
                {children}
            </main>
            {modal}
            <Footer />
            <BottomNavigation />
            <ScrollToTop />
        </>
    );
}
