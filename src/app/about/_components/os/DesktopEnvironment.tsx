"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { User, ArrowLeft, Grid, Smile, Rocket, Mail, Trash2, MessageCircle, FileText, Image as ImageIcon, MessageSquare, StickyNote } from "lucide-react";
import { AnimatePresence, m, LazyMotion, domMax } from "framer-motion";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// Admin Auth Hook
import { useAdminAuth } from "@/hooks/useAdminAuth";

// Internal Components (always loaded - core UI)
import OSWindow from "./Window";
import DesktopIcon from "./DesktopIcon";
import OSDock from "./OSDock";
import MenuBar from "./MenuBar";

// Render Layer Components (Dynamic Imports for Bundle Optimization)
const DesktopIconsLayer = dynamic(() => import("./layers/DesktopIconsLayer"), { ssr: false });
const WindowsLayer = dynamic(() => import("./layers/WindowsLayer"), { ssr: false });
const UIOverlaysLayer = dynamic(() => import("./layers/UIOverlaysLayer"), { ssr: false });

// Window Content Components - Lazy loaded for faster initial paint
const AboutContent = dynamic(() => import("./AboutContent"), {
    loading: () => <div className="animate-pulse bg-gray-100 h-full w-full rounded" />,
    ssr: false
});

const ChatWindow = dynamic(() => import("./ChatWindow"), {
    loading: () => <div className="animate-pulse bg-gray-100 h-full w-full rounded" />,
    ssr: false
});

// Removed ProjectsGridWindow - now using direct navigation

// Heavy components - Lazy loaded to improve initial load time
const IndexClientWithAutoUpdate = dynamic(() => import("@/components/home/IndexClientWithAutoUpdate"), {
    loading: () => <div className="animate-pulse bg-gray-100 dark:bg-gray-800 h-full w-full rounded" />,
    ssr: false
});

// Project Detail Component moved to ProjectDetailWrapper to reduce bundle/file size

// Hooks & Types
import { useWindowManager, WindowState } from "@/hooks/useWindowManager";
import { useStickyNotes } from "./hooks/useStickyNotes";
import { useDesktopLock } from "./hooks/useDesktopLock";
import { useBootSequence } from "./hooks/useBootSequence";
import { useDesktopShortcuts } from "./hooks/useDesktopShortcuts";
import { useChatContacts } from "./hooks/useChatContacts";
import { useDesktopLayout } from "./hooks/useDesktopLayout";
import { useDesktopIcons } from "./hooks/useDesktopIcons";
import { useDesktopNavigation } from "./hooks/useDesktopNavigation";
import type { AboutData, DesktopPreferences } from "@/types/about";
import type { ExperienceData } from "@/types/experience";
import type { HardSkillsData } from "@/types/hardSkill";
import type { Project, GalleryItem } from "@/types/projects";

// Refactored Imports
import DesktopErrorBoundary from "./DesktopErrorBoundary";
import { soundManager } from "./utils/SoundManager";
import { createInitialWindows } from "./utils/windowFactory";
import { WindowContext } from "./context/WindowContext";

// UI Components (Extracted)
import DesktopBackground from "./ui/DesktopBackground";
import AppIcon from "./ui/AppIcon";
import ProjectDetailWrapper from "./ui/ProjectDetailWrapper";
import DesktopSkeleton from "./ui/DesktopSkeleton";
const BootSequence = dynamic(() => import("./ui/BootSequence"), {
    loading: () => <div className="fixed inset-0 bg-black flex items-center justify-center"><div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" /></div>,
    ssr: false
});

// - ProjectDetailWrapper -> ./ui/ProjectDetailWrapper.tsx
// - AppIcon -> ./ui/AppIcon.tsx

const RetroMobileOverlay = dynamic(() => import("./ui/RetroMobileOverlay"), {
    loading: () => <div className="fixed inset-0 bg-[#c0c0c0] z-[10000]" />,
    ssr: false
});

// --- Main Component ---

interface DesktopEnvironmentProps {
    children?: React.ReactNode;
    aboutData?: AboutData | null;
    experienceData?: ExperienceData | null;
    hardSkillsData?: HardSkillsData | null;
    projects: Project[];
}

export default function DesktopEnvironment({ children, aboutData, experienceData, hardSkillsData, projects }: DesktopEnvironmentProps) {
    return (
        <DesktopErrorBoundary>
            <DesktopEnvironmentContent
                aboutData={aboutData}
                experienceData={experienceData}
                hardSkillsData={hardSkillsData}
                projects={projects}
            >
                {children}
            </DesktopEnvironmentContent>
        </DesktopErrorBoundary>
    );
}

function DesktopEnvironmentContent({ children, aboutData, experienceData, hardSkillsData, projects }: DesktopEnvironmentProps) {
    const router = useRouter();

    // Screen Lock & Resize Hook (Handles mounted state, window size, and body lock)
    const { mounted, windowSize, isMobile } = useDesktopLock();
    const { isBooting, finishBooting } = useBootSequence();
    const [showSpotlight, setShowSpotlight] = useState(false);
    useDesktopShortcuts({ showSpotlight, setShowSpotlight });

    // Check if we've already booted in this session
    useEffect(() => {
        // We want to boot on every mount (refresh or navigation)
        // strict mode double-invoke is acceptable in dev
    }, []);



    // Notes visibility toggle (visible by default as per request)
    const [notesVisible, setNotesVisible] = useState(true);
    const [notesDockBouncing, setNotesDockBouncing] = useState(false);

    // Admin auth check - now safe to use (API returns 200 for non-admins)
    // Admin auth check - now returns csrfToken
    const { isAdmin, csrfToken, logout } = useAdminAuth();

    // Hooks
    const {
        notes,
        addNote,
        updateNote,
        deleteNote,
        permanentDeleteNote,
        restoreNote,
        bringToFrontNote,
        setNotes
    } = useStickyNotes(mounted, isAdmin, csrfToken);

    // Logging for debug
    useEffect(() => {
        if (mounted) {
            console.log(`[Desktop v1.2] Admin status: ${isAdmin ? 'AUTHORIZED' : 'VISITOR'}`);
        }
    }, [mounted, isAdmin]);


    // Dynamic Contacts (Mock + Testimonials)
    const { dynamicContacts, testimonialContacts } = useChatContacts();

    const commercialProjects = useMemo(() => {
        if (aboutData?.desktopPreferences?.visibleProjectIds) {
            return projects.filter(p => aboutData.desktopPreferences?.visibleProjectIds.includes(p.id));
        }
        return projects.filter(p => p.type !== 'visual_art');
    }, [projects, aboutData]);


    // Windows Init
    const initialWindows: WindowState[] = useMemo(() =>
        createInitialWindows({
            aboutData,
            experienceData,
            hardSkillsData,
            projects,
            commercialProjects,
            dynamicContacts
        }),
        [aboutData, experienceData, hardSkillsData, projects, commercialProjects, dynamicContacts]
    );


    const windowManager = useWindowManager({ initialWindows, aboutData, projects, csrfToken, isAdmin });
    const {
        windows,
        openWindow,
        resetWindows
    } = windowManager;

    // Auto-open app from query param (e.g. /?app=about)
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const params = new URLSearchParams(window.location.search);
        const appToOpen = params.get('app');

        if (appToOpen) {
            // Wait for boot sequence to finish slightly
            setTimeout(() => {
                if (appToOpen === 'notes') {
                    setNotesVisible(true);
                    setNotesDockBouncing(true);
                    setTimeout(() => setNotesDockBouncing(false), 600);
                } else {
                    openWindow(appToOpen);
                }

                // Clean URL without refresh
                window.history.replaceState({}, '', '/');
            }, 1500); // Wait for boot animation
        }
    }, [openWindow]);

    // Update position and isWindowOpen functions pushed to Context API.

    // Navigation & Desktop Actions (Extracted)
    const {
        handleGoHome,
        resetDesktopAndClose,
        openProjectWindow,
        navToChat,
        toggleNotesVisibility
    } = useDesktopNavigation({
        openWindow,
        resetWindows,
        dynamicContacts,
        ChatWindow,
        notesVisible,
        setNotesVisible,
        notes,
        restoreNote,
        addNote,
        isAdmin,
        setNotesDockBouncing
    });

    // Icons Layout (Extracted)
    const { iconPositions, handleIconPositionChange } = useDesktopLayout({ aboutData, isAdmin, csrfToken: csrfToken || null });

    const { projectIcons } = useDesktopIcons({
        mounted,
        windowSize,
        commercialProjects,
        aboutData,
        handleGoHome,
        iconPositions
    });

    // Effects for Lock & Cleanup controlled by useDesktopLock hook now


    // SSR Skeleton: Show a basic visual immediately to improve LCP
    // Before: `return null` caused 17s LCP (blank screen until JS hydrates)
    if (!mounted) {
        return <DesktopSkeleton />;
    }
    // Desktop Content Animation (Zoom In Effect after Boot)
    const desktopVariants = {
        booting: { scale: 1.1, filter: "blur(10px)", opacity: 0 },
        ready: {
            scale: 1,
            filter: "blur(0px)",
            opacity: 1,
            transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
        }
    };

    return (
        <DesktopErrorBoundary>
            <WindowContext.Provider value={windowManager}>
                <LazyMotion features={domMax}>
                    {isMobile ? (
                        <RetroMobileOverlay />
                    ) : (
                        <>
                            {/* Boot Sequence Overlay */}
                            <AnimatePresence>
                                {isBooting && (
                                    <BootSequence
                                        onComplete={finishBooting}
                                    />
                                )}
                            </AnimatePresence>

                            {/* Main Desktop Content */}
                            <m.div
                                className="relative w-full h-full overflow-hidden select-none"
                                initial="booting"
                                animate={isBooting ? "booting" : "ready"}
                                variants={desktopVariants}
                            >
                                {/* Wallpaper */}
                                <DesktopBackground wallpaperConfig={aboutData?.wallpaperConfig} />

                                {/* Layer 1: Desktop Icons & Sticky Notes */}
                                <DesktopIconsLayer
                                    projectIcons={projectIcons}
                                    isMobile={isMobile}
                                    notesVisible={notesVisible}
                                    notes={notes}
                                    handleIconPositionChange={handleIconPositionChange}
                                    openProjectWindow={openProjectWindow}
                                    updateNote={updateNote}
                                    bringToFrontNote={bringToFrontNote}
                                    deleteNote={deleteNote}
                                    permanentDeleteNote={permanentDeleteNote}
                                    restoreNote={restoreNote}
                                    addNote={addNote}
                                    isAdmin={isAdmin}
                                    setNotesVisible={setNotesVisible}
                                />

                                {/* Layer 2: Windows (Load ONLY when at least one window is open) */}
                                {windows.some(w => w.isOpen) && (
                                    <WindowsLayer
                                        isAdmin={isAdmin}
                                    />
                                )}

                                {/* Layer 3: UI Overlays (Dock, MenuBar, Spotlight, DynamicIsland) */}
                                <UIOverlaysLayer
                                    isBooting={isBooting}
                                    navToChat={navToChat}
                                    testimonialContacts={testimonialContacts}
                                    showSpotlight={showSpotlight}
                                    setShowSpotlight={setShowSpotlight}
                                    aboutData={aboutData}
                                    isAdmin={isAdmin}
                                    logout={logout}
                                    toggleNotesVisibility={toggleNotesVisibility}
                                    notesVisible={notesVisible}
                                    isMobile={isMobile}
                                    commercialProjects={commercialProjects}
                                    openProjectWindow={openProjectWindow}
                                />
                            </m.div >
                        </>
                    )}
                </LazyMotion >
            </WindowContext.Provider>
        </DesktopErrorBoundary >
    );
}
