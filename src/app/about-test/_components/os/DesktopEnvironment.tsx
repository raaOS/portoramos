"use client";

import React, { useState, useEffect } from "react";
import { User, Briefcase, Terminal, Github, Linkedin, FileText, AlertTriangle, Home, Phone, Grid } from "lucide-react";
import OSWindow from "./Window";
import DesktopIcon from "./DesktopIcon";
import Dock from "./Dock";
import AboutContent from "./AboutContent"; // Import the new component
import IndexClientWithAutoUpdate from "@/components/home/IndexClientWithAutoUpdate";
import { AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import type { AboutData } from "@/types/about";
import type { ExperienceData } from "@/types/experience";
import type { HardSkillsData } from "@/types/hardSkill";
import type { Project } from "@/types/projects";

interface WindowState {
    id: string;
    title: string;
    isOpen: boolean;
    isMinimized?: boolean;
    isMaximized?: boolean;
    zIndex: number;
    noPadding?: boolean; // Added support
    content: React.ReactNode;
    initialPosition?: { x: number; y: number };
    width?: number;
    height?: number;
}

const AppIcon = ({ color, icon: Icon }: { color: string, icon: any }) => (
    <div className={`w-full h-full rounded-[14px] bg-gradient-to-b ${color} flex items-center justify-center shadow-lg relative`}>
        <div className="absolute inset-0 rounded-[14px] ring-1 ring-white/20 inset-ring pointer-events-none" />
        <Icon className="text-white drop-shadow-sm" size="55%" strokeWidth={2.5} />
    </div>
);

interface DesktopEnvironmentProps {
    children: React.ReactNode;
    aboutData?: AboutData | null;
    experienceData?: ExperienceData | null;
    hardSkillsData?: HardSkillsData | null;
    projects: Project[];
}

export default function DesktopEnvironment({ children, aboutData, experienceData, hardSkillsData, projects }: DesktopEnvironmentProps) {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [windowSize, setWindowSize] = useState({ width: 1200, height: 800 });

    useEffect(() => {
        setMounted(true);
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });

        // Lock global scroll (Agresif: html + body + Lenis)
        const html = document.documentElement;
        const body = document.body;

        const originalHtmlOverflow = html.style.overflow;
        const originalBodyOverflow = body.style.overflow;
        const originalHtmlHeight = html.style.height;
        const originalBodyHeight = body.style.height;

        // Force lock
        html.style.overflow = "hidden";
        body.style.overflow = "hidden";
        html.style.height = "100%";
        body.style.height = "100%";
        html.classList.add('lenis-stopped');

        const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            // Restore
            html.style.overflow = originalHtmlOverflow;
            body.style.overflow = originalBodyOverflow;
            html.style.height = originalHtmlHeight;
            body.style.height = originalBodyHeight;
            html.classList.remove('lenis-stopped');
        };
    }, []);

    const [topZIndex, setTopZIndex] = useState(20);
    const [bouncingDocId, setBouncingDocId] = useState<string | null>(null);

    // -- Window Definitions --
    // We define them here to have access to props/router, but we only add them to state when opened.
    const windowDefinitions: WindowState[] = [
        {
            id: "about",
            title: "Finder: About Me",
            isOpen: false,
            zIndex: 10,
            noPadding: true,
            initialPosition: { x: typeof window !== 'undefined' ? (window.innerWidth - 900) / 2 : 100, y: typeof window !== 'undefined' ? (window.innerHeight - 600) / 2 : 80 },
            width: 900,
            height: 600,
            content: <AboutContent aboutData={aboutData} experienceData={experienceData} hardSkillsData={hardSkillsData} />
        },
        {
            id: "projects",
            title: "Finder: Projects",
            isOpen: false,
            zIndex: 9,
            noPadding: true, // Full width for content
            initialPosition: { x: typeof window !== 'undefined' ? (window.innerWidth - 1000) / 2 : 150, y: typeof window !== 'undefined' ? (window.innerHeight - 700) / 2 : 100 },
            width: 1000,
            height: 700,
            content: (
                <div className="w-full h-full overflow-y-auto bg-white custom-scrollbar">
                    {/* We pass the projects data directly to the component */}
                    <IndexClientWithAutoUpdate initialProjects={projects} />
                </div>
            )
        },
        {
            id: "error",
            title: "System_Error.log",
            isOpen: false,
            zIndex: 11,
            initialPosition: { x: 200, y: 200 },
            content: (
                <div className="flex flex-col items-center text-center p-4">
                    <AlertTriangle size={40} className="text-yellow-500 mb-3" />
                    <h3 className="text-md font-bold text-black mb-1">Critical Creativity Overflow</h3>
                    <p className="text-xs text-gray-500 mb-4">
                        The system has detected an excessive amount of ideas.
                    </p>
                    <button className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 text-xs font-medium border border-gray-300 transition-colors">
                        Close
                    </button>
                </div>
            )
        }
    ];

    const [windows, setWindows] = useState<WindowState[]>(windowDefinitions);

    // Update positions once mounted
    useEffect(() => {
        if (mounted) {
            setWindows(prev => prev.map(w => {
                // Dynamically center 'about' window on mount
                if (w.id === 'about') {
                    return { ...w, initialPosition: { x: (window.innerWidth - 900) / 2, y: (window.innerHeight - 600) / 2 } };
                }
                if (w.id === 'projects') {
                    return { ...w, initialPosition: { x: (window.innerWidth - 1000) / 2, y: (window.innerHeight - 700) / 2 } };
                }
                if (w.id === 'error') {
                    return { ...w, initialPosition: { x: window.innerWidth / 2 - 200, y: window.innerHeight / 2 - 150 } };
                }
                return w;
            }));
        }
    }, [mounted]);


    // -- Actions --

    const openWindow = (id: string) => {
        setWindows(prev => prev.map(w => {
            if (w.id === id) {
                return { ...w, isOpen: true, isMinimized: false, zIndex: topZIndex + 1 };
            }
            return w;
        }));
        setTopZIndex(prev => prev + 1);
    };

    const closeWindow = (id: string) => {
        setWindows(prev => prev.map(w => {
            if (w.id === id) {
                return { ...w, isOpen: false, isMinimized: false, isMaximized: false };
            }
            return w;
        }));
    };

    const minimizeWindow = (id: string) => {
        setWindows(prev => prev.map(w => {
            if (w.id === id) {
                return { ...w, isMinimized: true };
            }
            return w;
        }));

        // Trigger Dock Bounce
        setBouncingDocId(id);
        setTimeout(() => setBouncingDocId(null), 2000); // Reset after animation
    };

    const maximizeWindow = (id: string) => {
        setWindows(prev => prev.map(w => {
            if (w.id === id) {
                return { ...w, isMaximized: !w.isMaximized, zIndex: topZIndex + 1 };
            }
            return w;
        }));
        setTopZIndex(prev => prev + 1);
    };

    const focusWindow = (id: string) => {
        setWindows(prev => prev.map(w => {
            if (w.id === id) {
                return { ...w, zIndex: topZIndex + 1 };
            }
            return w;
        }));
        setTopZIndex(prev => prev + 1);
    };

    const updateWindowPosition = (id: string, x: number, y: number) => {
        setWindows(prev => prev.map(w => {
            if (w.id === id) {
                return { ...w, initialPosition: { x, y } };
            }
            return w;
        }));
    };

    const handleWindowResize = (id: string, width: number, height: number) => {
        setWindows(prev => prev.map(w => {
            if (w.id === id) {
                return { ...w, width, height };
            }
            return w;
        }));
    };

    const getMinimizeTarget = (id: string) => {
        if (typeof document === 'undefined') return { x: 0, y: 0 };
        const elem = document.getElementById(`dock-item-${id}`);
        if (elem) {
            const rect = elem.getBoundingClientRect();
            // Return center of the icon
            return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        }

        // Fallback
        return { x: window.innerWidth / 2, y: window.innerHeight - 50 };
    };

    const isWindowOpen = (id: string) => windows.find(w => w.id === id)?.isOpen ?? false;

    // -- Config --
    const dockItems = [
        { id: "home", label: "Home", icon: <AppIcon icon={Home} color="from-blue-400 to-blue-600" />, onClick: () => router.push("/") },
        { id: "about", label: "About Me", icon: <AppIcon icon={User} color="from-purple-400 to-purple-600" />, onClick: () => openWindow("about"), isOpen: isWindowOpen("about") },
        { id: "work", label: "Work", icon: <AppIcon icon={Briefcase} color="from-orange-400 to-orange-600" />, onClick: () => router.push("/work") },
        { id: "projects", label: "Projects", icon: <AppIcon icon={Grid} color="from-emerald-400 to-emerald-600" />, onClick: () => openWindow("projects"), isOpen: isWindowOpen("projects") },
        { id: "contact", label: "Contact", icon: <AppIcon icon={Phone} color="from-pink-400 to-pink-600" />, onClick: () => router.push("/contact") },
        { id: "github", label: "GitHub", icon: <AppIcon icon={Github} color="from-gray-700 to-black" />, onClick: () => window.open("https://github.com", "_blank") },
        { id: "error", label: "Logs", icon: <AppIcon icon={Terminal} color="from-red-500 to-red-700" />, onClick: () => openWindow("error"), isOpen: isWindowOpen("error") },
    ];

    const desktopIcons = [
        { id: "folder-1", label: "My Portfolio", icon: <Briefcase />, x: 40, y: 40, action: () => openWindow("projects") },
        { id: "file-1", label: "About.txt", icon: <FileText />, x: 40, y: 160, action: () => openWindow("about") },
        { id: "link-1", label: "LinkedIn", icon: <Linkedin />, x: 40, y: 280, action: () => window.open("https://linkedin.com", "_blank") },
        { id: "trash", label: "Recycle Bin", icon: <div className="text-white/50"><Terminal /></div>, x: mounted ? windowSize.width - 100 : 100, y: mounted ? windowSize.height - 120 : 100, action: () => { } },
    ];

    // FORCE OVERLAY: fixed + z-[9999] to sit on top of everything
    return (
        <div className="fixed inset-0 z-[9999] w-full h-screen overflow-hidden select-none bg-black">

            {/* Layer 0: Background (Spline) */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {children}
            </div>

            {/* Layer 1: Desktop Icons */}
            <div className="absolute inset-0 z-10 pointer-events-auto">
                {desktopIcons.map(icon => (
                    <DesktopIcon
                        key={icon.id}
                        id={icon.id}
                        label={icon.label}
                        icon={icon.icon}
                        x={icon.x}
                        y={icon.y}
                        onClick={icon.action}
                    />
                ))}
            </div>

            {/* Layer 2: Windows */}
            <div className="absolute inset-0 z-20 pointer-events-none">
                <AnimatePresence>
                    {mounted && windows.filter(w => w.isOpen).map(w => (
                        <div key={w.id} className="pointer-events-auto contents">
                            <OSWindow
                                id={w.id}
                                title={w.title}
                                isOpen={w.isOpen}
                                isMinimized={w.isMinimized}
                                isMaximized={w.isMaximized}
                                zIndex={w.zIndex}
                                onClose={() => closeWindow(w.id)}
                                onMinimize={() => minimizeWindow(w.id)}
                                onMaximize={() => maximizeWindow(w.id)}
                                onFocus={() => focusWindow(w.id)}
                                initialPosition={w.initialPosition}
                                minimizeTarget={getMinimizeTarget(w.id)}
                                noPadding={w.noPadding}
                                onUpdatePosition={(x, y) => updateWindowPosition(w.id, x, y)}
                                width={w.width}
                                height={w.height}
                                onResize={(wId, h) => handleWindowResize(w.id, wId, h)}
                            >
                                {w.content}
                            </OSWindow>
                        </div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Layer 3: Dock */}
            <Dock
                items={dockItems}
                bouncingId={bouncingDocId}
            />

        </div>
    );
}
