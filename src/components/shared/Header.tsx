'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Search, Wifi, Battery, Volume2 } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';

const Header: React.FC = () => {
    const [currentTime, setCurrentTime] = useState<Date | null>(null);
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { trackEvent } = useAnalytics();

    const isPrintMode = searchParams.get('print') === 'true';

    useEffect(() => {
        setCurrentTime(new Date()); // eslint-disable-line
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60_000); // Update every 60s — clock only shows HH:MM
        return () => clearInterval(timer);
    }, []);

    const formatTime = useCallback((date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }, []);

    const formatDate = useCallback((date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    }, []);

    // Memoize app name to avoid recalculating on every timer tick
    const appName = useMemo(() => {
        if (pathname === '/') return 'Finder';
        if (pathname?.startsWith('/projects')) return 'Portfolio';
        if (pathname?.startsWith('/cv')) return 'Resume';
        if (pathname?.startsWith('/contact')) return 'Contact';
        if (pathname?.startsWith('/about')) return 'About';
        return 'Portfolio';
    }, [pathname]);

    const isProjectsPage = pathname?.startsWith('/projects');

    return (
        <header 
            className={`fixed top-0 left-0 right-0 h-8 bg-white flex items-center justify-between px-4 z-[100] text-black text-xs select-none print:hidden ${isPrintMode ? 'border-none shadow-none' : 'shadow-sm border-b border-gray-200'}`}
            style={isPrintMode ? { border: 'none', boxShadow: 'none' } : {}}
        >
            {/* Left Side */}
            <div className="flex items-center gap-4">
                <Link href="/" className="flex items-center px-2 py-1 rounded cursor-pointer transition-colors" aria-label="Home">
                    {/* Authentic Apple Logo Style */}
                    <svg width="15" height="18" viewBox="0 0 17 20" fill="black" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.6661 17.6533C10.7495 18.9959 9.68947 19.9572 8.52947 20C7.61613 20 7.18947 19.6826 6.32947 19.6826C5.4628 19.6826 4.9628 19.6826 4.09613 20C3.0028 19.9714 2.05613 18.9959 1.15613 17.1666C-0.650534 13.9166 -0.563868 8.64731 2.76947 6.84865C3.8428 6.27398 4.71613 6.13131 5.5628 6.13131C6.55613 6.13131 7.22947 6.74465 8.16947 6.74465C9.09613 6.74465 9.77613 5.96598 10.9561 6.13131C11.5161 6.17398 13.0695 6.36065 14.1228 7.89398C14.0761 7.94731 12.0361 9.13131 12.0761 11.5313C12.1161 14.3473 14.5428 15.3087 14.5961 15.3487C14.5828 15.394 14.2295 16.642 13.5628 17.6133L11.6661 17.6533ZM11.1361 4.10065C11.5961 3.52598 11.9161 2.75931 11.8228 1.95665C11.0828 2.02865 10.1961 2.45798 9.66947 3.09798C9.17613 3.65798 8.7628 4.45798 8.87613 5.23131C9.69613 5.29531 10.5561 4.79398 11.1361 4.10065Z" />
                    </svg>
                </Link>
                <div className="font-bold cursor-default px-2 py-1 hidden sm:block">
                    {appName}
                </div>

                {/* Menus (Nav Links Disguised as Menus) - Hidden on clean Project pages or print mode */}
                {!isProjectsPage && !isPrintMode && (
                    <nav className="hidden md:flex items-center gap-1 font-medium">
                        <Link href="/projects" className="px-3 py-1 rounded cursor-pointer transition-colors hover:bg-black/5">Works</Link>
                        <Link href="/" className="px-3 py-1 rounded cursor-pointer transition-colors hover:bg-black/5">About</Link>
                        <Link href="/contact" className="px-3 py-1 rounded cursor-pointer transition-colors hover:bg-black/5">Contact</Link>
                        <Link href="/cv" className="px-3 py-1 rounded cursor-pointer transition-colors hover:bg-black/5">Resume</Link>
                    </nav>
                )}
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-3 sm:gap-5">
                <div className="flex items-center gap-3 text-black/80">
                    <button onClick={() => trackEvent('header_search_click', { page: pathname })} aria-label="Search">
                        <Search size={14} className="hover:text-black transition-colors" />
                    </button>
                    <Wifi size={14} />
                    <Battery size={14} />
                    <Volume2 size={14} />
                </div>
                <div className="flex items-center gap-2 font-medium cursor-default">
                    {currentTime && (
                        <>
                            <span>{formatDate(currentTime)}</span>
                            <span className="w-[60px] text-right">{formatTime(currentTime)}</span>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
