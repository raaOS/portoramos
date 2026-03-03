"use client";

import React, { useState, useEffect, useMemo } from "react";

import { AnimatePresence, m, LazyMotion, domMax } from "framer-motion";
import dynamic from "next/dynamic";

// Admin Auth Hook
import { useAdminAuth } from "@/hooks/useAdminAuth";

// Render Layer Components (Dynamic Imports for Bundle Optimization)
const DesktopIconsLayer = dynamic(() => import("../layers/DesktopIconsLayer"), { ssr: false });
const WindowsLayer = dynamic(() => import("../layers/WindowsLayer"), { ssr: false });
const UIOverlaysLayer = dynamic(() => import("../layers/UIOverlaysLayer"), { ssr: false });

// Window Content Components - Required by useDesktopNavigation
const ChatWindow = dynamic(() => import("../windows/ChatWindow"), {
    loading: () => <div className="animate-pulse bg-gray-100 h-full w-full rounded" />,
    ssr: false
});



// Hooks & Types
import { useWindowManager, WindowState } from "@/hooks/useWindowManager";
import { useStickyNotes } from "../hooks/useStickyNotes";
import { useDesktopLock } from "../hooks/useDesktopLock";
import { useBootSequence } from "../hooks/useBootSequence";
import { useDesktopShortcuts } from "../hooks/useDesktopShortcuts";
import { useChatContacts } from "../hooks/useChatContacts";
import { useDesktopLayout } from "../hooks/useDesktopLayout";
import { useDesktopIcons } from "../hooks/useDesktopIcons";
import { useDesktopNavigation } from "../hooks/useDesktopNavigation";
import type { AboutData } from "@/types/about";
import type { ExperienceData } from "@/types/experience";
import type { HardSkillsData } from "@/types/hardSkill";
import type { Project } from "@/types/projects";

// Refactored Imports
import DesktopErrorBoundary from "../windows/DesktopErrorBoundary";
import { soundManager } from "../utils/SoundManager";
import { createInitialWindows } from "../utils/windowFactory";
import { DesktopWindowContext } from "../context/DesktopWindowContext";

// UI Components (Extracted)
import DesktopBackground from "../ui/DesktopBackground";
import DesktopSkeleton from "../ui/DesktopSkeleton";
const StartScreen = dynamic(() => import("../ui/StartScreen"), {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black z-[10000]" />
});

const RetroMobileOverlay = dynamic(() => import("../ui/RetroMobileOverlay"), {
    loading: () => <div className="fixed inset-0 bg-[#c0c0c0] z-[10000]" />,
    ssr: false
});

// --- Main Component ---

export interface DesktopEnvironmentProps {
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

function DesktopEnvironmentContent({ aboutData, experienceData, hardSkillsData, projects }: DesktopEnvironmentProps) {

    // Screen Lock & Resize Hook (Handles mounted state, window size, and body lock)
    const { mounted, isMobile } = useDesktopLock();
    const { needsPowerOn, isBooting, finishBooting } = useBootSequence();

    // Track when StartScreen has actually mounted and is covering the screen
    // This prevents the desktop from being visible during the React render timing gap
    const [startScreenReady, setStartScreenReady] = useState(false);

    // Handle boot completion - StartScreen already played startup sound
    const handleBootComplete = () => {
        if (aboutData?.soundConfig) {
            soundManager.loadConfig(aboutData.soundConfig);
        }
        // Suppress window-open sound briefly so it doesn't overlap
        soundManager.suppressSound('window-open', 1500);
        finishBooting();
    };
    const [showSpotlight, setShowSpotlight] = useState(false);
    useDesktopShortcuts({ showSpotlight, setShowSpotlight });

    // Boot runs on every mount (refresh or navigation)




    // Notes visibility toggle (visible by default as per request)
    const [notesVisible, setNotesVisible] = useState(true);

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
        bringToFrontNote
    } = useStickyNotes(mounted, isAdmin, csrfToken);

    // Re-apply sound config jika aboutData berubah setelah boot (misal admin ubah setting)
    useEffect(() => {
        if (mounted && aboutData?.soundConfig) {
            soundManager.loadConfig(aboutData.soundConfig);
        }
    }, [mounted, aboutData?.soundConfig]);


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
        openProjectWindow,
        navToChat,
        openWhatsAppList,
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
        setNotesDockBouncing: () => { }
    });

    // Icons Layout (Extracted)
    const { iconPositions, handleIconPositionChange } = useDesktopLayout({ aboutData, isAdmin, csrfToken: csrfToken || null });

    const { projectIcons } = useDesktopIcons({
        mounted,
        commercialProjects,
        aboutData,
        handleGoHome,
        iconPositions
    });

    // Effects for Lock & Cleanup controlled by useDesktopLock hook now


    // SSR Skeleton: Show a basic visual immediately to improve LCP
    // Before: `return null` caused 17s LCP (blank screen until JS hydrates)
    if (!mounted) {
        return <DesktopSkeleton isBooting={needsPowerOn} wallpaperUrl={aboutData?.wallpaperConfig?.activeWallpaperId} />;
    }
    // Desktop Content - ready immediately, no delay
    // Desktop Content - ready immediately, no delay

    return (
        <DesktopErrorBoundary>
            <DesktopWindowContext.Provider value={windowManager}>
                <LazyMotion features={domMax}>
                    {isMobile ? (
                        <RetroMobileOverlay />
                    ) : (
                        <>
                            {/* Boot Sequence - StartScreen handles all visuals and sounds */}
                            <AnimatePresence>
                                <StartScreen
                                    key="start-screen"
                                    onStart={handleBootComplete}
                                    isActive={needsPowerOn || isBooting}
                                    onReady={() => setStartScreenReady(true)}
                                />
                            </AnimatePresence>

                            {/* Main Desktop Content - Hidden until StartScreen is mounted and covering the screen */}
                            <m.div
                                className="relative w-full h-full overflow-hidden select-none"
                                initial={{ opacity: 0 }}
                                animate={{
                                    opacity: startScreenReady ? 1 : 0
                                }}
                                transition={{ duration: 0.15 }}
                                style={{
                                    willChange: 'opacity',
                                    visibility: startScreenReady ? 'visible' : 'hidden'
                                }}
                            >
                                {/* Wallpaper */}
                                <DesktopBackground wallpaperConfig={aboutData?.wallpaperConfig} />

                                {/* Layer 1: Desktop Icons & Sticky Notes */}
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                <DesktopIconsLayer
                                    projectIcons={projectIcons as any[]}
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
                                />

                                {/* Layer 2: Windows (Rendered early so animations finish before doors open) */}
                                <WindowsLayer isAdmin={isAdmin} />

                                {/* Layer 3: UI Overlays (Dock, MenuBar, Spotlight, DynamicIsland) */}
                                <UIOverlaysLayer
                                    isBooting={isBooting || needsPowerOn}
                                    navToChat={navToChat}
                                    openWhatsAppList={openWhatsAppList}
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
            </DesktopWindowContext.Provider>
        </DesktopErrorBoundary >
    );
}
