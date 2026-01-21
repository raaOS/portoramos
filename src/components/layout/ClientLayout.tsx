'use client';

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic'; // Added this import
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import BottomNavigation from '@/components/layout/BottomNavigation';
import ScrollToTop from '@/components/layout/ScrollToTop';
// Removed: import ChatWidget from '@/components/ChatWidget';
const ChatWidget = dynamic(() => import('@/components/features/ChatWidget'), {
    ssr: false,
});
import PageTransition from '@/components/shared/PageTransition';

export default function ClientLayout({
    children,
    modal,
}: {
    children: React.ReactNode;
    modal: React.ReactNode;
}) {
    const pathname = usePathname();
    const isAdminRequest = pathname?.startsWith('/admin');

    if (isAdminRequest) {
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
            <ChatWidget />
        </>
    );
}
