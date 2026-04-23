'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ChevronRight, Monitor, Zap } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';

interface SystemNavFrameProps {
    children: React.ReactNode;
    title?: string;
    hideFooter?: boolean;
}

export default function SystemNavFrame({ children, title: _title, hideFooter }: SystemNavFrameProps) {
    const searchParams = useSearchParams();
    const isPrintMode = searchParams?.get('print') === 'true';
    const pathname = usePathname();

    const view = searchParams?.get('view');
    const is3D = view === '3d';
    const isList = view === 'list';
    const isContact = pathname === '/contact' || pathname?.startsWith('/contact');
    const isProjects = pathname?.startsWith('/projects');
    const effectiveHideFooter = hideFooter || isContact || is3D;
    const showSystemHeader = !isProjects && !isPrintMode;

    // Generate Breadcrumbs from pathname
    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbs = [
        { label: 'Ramos OS', href: '/', isLast: pathSegments.length === 0 },
        ...pathSegments.map((segment, i) => ({
            label: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
            href: `/${pathSegments.slice(0, i + 1).join('/')}`,
            isLast: i === pathSegments.length - 1
        }))
    ];

    return (
        <div className={`${(is3D || isList) ? 'h-screen overflow-hidden' : 'min-h-screen'} bg-white dark:bg-gray-950 flex flex-col`}>
            {/* Retro System Header */}
            {showSystemHeader && (
                <header className="sticky top-0 z-50 w-full bg-[#EFEFEF] border-b border-[#D1D1D1] h-9 flex items-center justify-between px-4 select-none print:hidden">
                    <div className="flex items-center gap-4">
                        {/* System OS Label */}
                        <div className="flex items-center gap-2 pr-4 border-r border-gray-300">
                            <Monitor size={14} className="text-gray-600" />
                            <span className="text-[11px] font-bold tracking-tight text-gray-800">Ramos v2.0 <span className="font-normal text-gray-500 ml-1">(System Connected)</span></span>
                        </div>

                        {/* Breadcrumb Navigator */}
                        <nav className="hidden md:flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                            {breadcrumbs.map((crumb, i) => (
                                <React.Fragment key={crumb.href}>
                                    {i > 0 && <ChevronRight size={12} className="text-gray-400 shrink-0" />}
                                    <Link
                                        href={crumb.href}
                                        className={`text-[11px] font-medium transition-colors hover:text-black whitespace-nowrap ${crumb.isLast ? 'text-black font-bold' : 'text-gray-500'
                                            }`}
                                    >
                                        {crumb.label}
                                    </Link>
                                </React.Fragment>
                            ))}
                        </nav>
                    </div>

                    {/* System Status Indicators */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <Zap size={12} className="text-green-600 fill-green-600" />
                            <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">Live</span>
                        </div>
                    </div>
                </header>
            )}

            {/* Main Content Area */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex-1 flex flex-col"
            >
                {children}
            </motion.div>

            {/* Minimal Retro Footer (Print Hidden) */}
            {!effectiveHideFooter && (
                <footer className="w-full py-6 px-8 border-t border-gray-100 bg-gray-50/50 print:hidden mt-auto">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">
                            Handcrafted with passion & Precision
                        </div>
                        <div className="flex gap-6">
                            <Link href="/" className="text-[10px] text-gray-500 hover:text-black transition-colors uppercase tracking-widest font-bold">Back to OS</Link>
                            <Link href="/cv" className="text-[10px] text-gray-500 hover:text-black transition-colors uppercase tracking-widest font-bold">Resume</Link>
                            <Link href="/contact" className="text-[10px] text-gray-500 hover:text-black transition-colors uppercase tracking-widest font-bold">Contact</Link>
                        </div>
                    </div>
                </footer>
            )}
        </div>
    );
}
