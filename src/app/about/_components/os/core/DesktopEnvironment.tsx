"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";

import { AnimatePresence, m, LazyMotion, domMax } from "framer-motion";
import dynamic from "next/dynamic";

// Admin Auth Hook
import { useAdminAuth } from "@/hooks/useAdminAuth";

// Layout Persistence Context
import { LayoutPersistenceProvider, useLayoutPersistence } from "../contexts/LayoutPersistenceContext";

// Unified Z-Index Context
import { UnifiedZIndexProvider } from "../context/UnifiedZIndexContext";

// Render Layer Components (Dynamic Imports for Bundle Optimization)
const DesktopIconsLayer = dynamic(() => import("../layers/DesktopIconsLayer"), { ssr: false });
const UnifiedLayer = dynamic(() => import("../layers/UnifiedLayer"), { ssr: false });
const UIOverlaysLayer = dynamic(() => import("../layers/UIOverlaysLayer"), { ssr: false });

// Window Content Components - Required by useDesktopNavigation
const ChatWindow = dynamic(() => import("../windows/ChatWindow"), {
    loading: () => <div className="animate-pulse bg-gray-100 h-full w-full rounded" />,
    ssr: false
});



// Hooks & Types
import { WindowState } from "@/hooks/useWindowManager";
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
import { clearVisitorPositions } from "../utils/positionSync";
import { DesktopWindowProvider, useDesktopWindowContext } from "../context/DesktopWindowContext";

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

export default function DesktopEnvironment({ aboutData, experienceData, hardSkillsData, projects }: DesktopEnvironmentProps) {
    // Screen Lock & Resize Hook (Handles mounted state, window size, and body lock)
    const { mounted, isMobile } = useDesktopLock();
    const { needsPowerOn, isBooting, finishBooting } = useBootSequence();

    // When boot is skipped, ensure sound is unlocked and boot is marked complete
    useEffect(() => {
        if (!needsPowerOn && !isBooting) {
            // Boot was skipped or completed - ensure audio is unlocked
            soundManager.unlock();
        }
    }, [needsPowerOn, isBooting]);

    // Track when StartScreen has actually mounted and is covering the screen
    const [startScreenReady, setStartScreenReady] = useState(false);

    // Track when the StartScreen begins its "glassReveal" animation (hole expands)
    const [isRevealed, setIsRevealed] = useState(false);

    // Admin auth check
    const { isAdmin, csrfToken, logout: originalLogout } = useAdminAuth();

    // Notes visibility toggle
    const [notesVisible, setNotesVisible] = useState(true);

    // Dynamic Contacts
    const { dynamicContacts, testimonialContacts } = useChatContacts();

    // Spotlight search state
    const [showSpotlight, setShowSpotlight] = useState(false);
    useDesktopShortcuts({ showSpotlight, setShowSpotlight });

    const commercialProjects = useMemo(() => {
        if (aboutData?.desktopPreferences?.visibleProjectIds) {
            return projects.filter(p => aboutData.desktopPreferences?.visibleProjectIds.includes(p.id));
        }
        return projects.filter(p => p.type !== 'visual_art');
    }, [projects, aboutData]);

    const initialWindows: WindowState[] = useMemo(() =>
        createInitialWindows({
            aboutData,
            experienceData,
            hardSkillsData,
            projects, // Restore projects as required by WindowFactoryProps
            commercialProjects,
            dynamicContacts,
            isAdmin
        }),
        [aboutData, experienceData, hardSkillsData, projects, commercialProjects, dynamicContacts, isAdmin]
    );

    const handleBootComplete = () => {
        if (aboutData?.soundConfig) {
            soundManager.loadConfig(aboutData.soundConfig);
        }
        soundManager.suppressSound('window-open', 1500);
        finishBooting();
    };

    if (!mounted) {
        return <DesktopSkeleton isBooting={needsPowerOn} wallpaperUrl={aboutData?.wallpaperConfig?.activeWallpaperId} />;
    }

    return (
        <DesktopErrorBoundary>
            <LayoutPersistenceProvider>
                <UnifiedZIndexProvider>
                    <DesktopWindowProvider
                        initialWindows={initialWindows}
                        aboutData={aboutData}
                        csrfToken={csrfToken || undefined}
                        isAdmin={isAdmin}
                    >
                        <DesktopMainWithLogout
                            aboutData={aboutData}
                            isMobile={isMobile}
                            needsPowerOn={needsPowerOn}
                            isBooting={isBooting}
                            isRevealed={isRevealed}
                            startScreenReady={startScreenReady}
                            setStartScreenReady={setStartScreenReady}
                            setIsRevealed={setIsRevealed}
                            handleBootComplete={handleBootComplete}
                            notesVisible={notesVisible}
                            setNotesVisible={setNotesVisible}
                            dynamicContacts={dynamicContacts}
                            testimonialContacts={testimonialContacts}
                            showSpotlight={showSpotlight}
                            setShowSpotlight={setShowSpotlight}
                            commercialProjects={commercialProjects}
                            projects={projects}
                            isAdmin={isAdmin}
                            csrfToken={csrfToken}
                            originalLogout={originalLogout}
                        />
                    </DesktopWindowProvider>
                </UnifiedZIndexProvider>
            </LayoutPersistenceProvider>
        </DesktopErrorBoundary>
    );
}

// Wrapper component that handles logout with flush
interface DesktopMainWithLogoutProps extends Omit<DesktopMainProps, 'logout'> {
    originalLogout: () => void;
}

function DesktopMainWithLogout(props: DesktopMainWithLogoutProps) {
    const { flushAll } = useLayoutPersistence();
    const { originalLogout, ...desktopMainProps } = props;

    const handleLogout = async () => {
        console.log('[DesktopEnvironment] Flushing pending saves before logout...');
        await flushAll();
        // Clear visitor session so admin sees their saved template after logout
        clearVisitorPositions();
        // Tunggu sebentar agar fetch selesai
        await new Promise(resolve => setTimeout(resolve, 300));
        originalLogout();
    };

    return <DesktopMain {...desktopMainProps} logout={handleLogout} />;
}

// Sub-component that has access to DesktopWindowContext
interface DesktopMainProps {
    aboutData: AboutData | null | undefined;
    isMobile: boolean;
    needsPowerOn: boolean;
    isBooting: boolean;
    isRevealed: boolean;
    startScreenReady: boolean;
    setStartScreenReady: React.Dispatch<React.SetStateAction<boolean>>;
    setIsRevealed: React.Dispatch<React.SetStateAction<boolean>>;
    handleBootComplete: () => void;
    notesVisible: boolean;
    setNotesVisible: React.Dispatch<React.SetStateAction<boolean>>;
    testimonialContacts: import('../data/mockChats').ContactProfile[];
    dynamicContacts: Record<string, import('../data/mockChats').ContactProfile>;
    showSpotlight: boolean;
    setShowSpotlight: React.Dispatch<React.SetStateAction<boolean>>;
    commercialProjects: Project[];
    projects: Project[];
    isAdmin: boolean;
    logout: () => void;
    csrfToken?: string;
}

function DesktopMain({
    aboutData, isMobile, needsPowerOn, isBooting, isRevealed,
    startScreenReady, setStartScreenReady, setIsRevealed,
    handleBootComplete, notesVisible, setNotesVisible,
    dynamicContacts, testimonialContacts, showSpotlight, setShowSpotlight,
    commercialProjects, projects, isAdmin, logout, csrfToken
}: DesktopMainProps) {
    const { 
        openWindow, resetWindows, requestNextZIndex,
        windows, closeWindow, minimizeWindow, maximizeWindow, focusWindow,
        updateWindowPosition, handleWindowResize, handleWindowResizeEnd, togglePin
    } = useDesktopWindowContext();

    // useStickyNotes must be called HERE because it needs LayoutPersistenceProvider context
    // Now using unified z-index system - requestNextZIndex from UnifiedZIndexProvider via DesktopWindowContext
    const {
        notes, addNote, updateNote, deleteNote,
        permanentDeleteNote, restoreNote, bringToFrontNote
    } = useStickyNotes(true, isAdmin, csrfToken, requestNextZIndex);

    const {
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
        projects,
        restoreNote,
        addNote,
        isAdmin,
        setNotesDockBouncing: () => { }
    });

    // useDesktopLayout sekarang otomatis register flush ke LayoutPersistenceContext
    const { iconPositions, handleIconPositionChange } = useDesktopLayout({
        aboutData,
        isAdmin,
        csrfToken: csrfToken || null
    });

    const { projectIcons } = useDesktopIcons({
        mounted: true,
        commercialProjects,
        aboutData,
        handleGoHome: () => window.location.href = '/',
        iconPositions
    });

    // Check if boot was skipped immediately (based on initial state from useBootSequence)
    const wasBootSkipped = !needsPowerOn && !isBooting;
    
    // For skipped boot: immediately ready and revealed
    // For normal boot: wait for StartScreen callbacks
    const isDesktopReady = wasBootSkipped || startScreenReady;
    const isDesktopRevealed = wasBootSkipped || isRevealed;

    // Memoized callbacks for StartScreen
    const handleStartScreenReady = useCallback(() => setStartScreenReady(true), [setStartScreenReady]);
    const handleStartScreenReveal = useCallback(() => setIsRevealed(true), [setIsRevealed]);

    return (
        <LazyMotion features={domMax}>
            {isMobile ? (
                <RetroMobileOverlay />
            ) : (
                <>
                    {/* Only render StartScreen if boot is needed */}
                    {(needsPowerOn || isBooting) && (
                        <AnimatePresence>
                            <StartScreen
                                key="start-screen"
                                onStart={handleBootComplete}
                                isActive={needsPowerOn || isBooting}
                                onReady={handleStartScreenReady}
                                onReveal={handleStartScreenReveal}
                            />
                        </AnimatePresence>
                    )}

                    <m.div
                        className="relative w-full h-full overflow-hidden select-none"
                        initial={{ opacity: wasBootSkipped ? 0 : 0 }}
                        animate={{ 
                            opacity: isDesktopReady ? 1 : 0 
                        }}
                        transition={{ 
                            duration: wasBootSkipped ? 0.4 : 0.2,
                            ease: wasBootSkipped ? [0.32, 0.72, 0, 1] : "easeOut"
                        }}
                    >
                        <DesktopBackground wallpaperConfig={aboutData?.wallpaperConfig} />

                        {/* Desktop Icons - Only icons, no sticky notes */}
                        <DesktopIconsLayer
                            projectIcons={projectIcons}
                            isMobile={isMobile}
                            isReady={isDesktopRevealed}
                            handleIconPositionChange={handleIconPositionChange}
                            openProjectWindow={openProjectWindow}
                        />
                        
                        {/* Unified Layer - Windows + Sticky Notes with coordinated z-index */}
                        <UnifiedLayer
                            windows={windows}
                            notes={notes}
                            notesVisible={notesVisible}
                            isAdmin={isAdmin}
                            isReady={isDesktopRevealed}
                            closeWindow={closeWindow}
                            minimizeWindow={minimizeWindow}
                            maximizeWindow={maximizeWindow}
                            focusWindow={focusWindow}
                            updateWindowPosition={updateWindowPosition}
                            handleWindowResize={handleWindowResize}
                            handleWindowResizeEnd={handleWindowResizeEnd}
                            togglePin={togglePin}
                            updateNote={updateNote}
                            bringToFrontNote={bringToFrontNote}
                            deleteNote={deleteNote}
                            permanentDeleteNote={permanentDeleteNote}
                            restoreNote={restoreNote}
                            addNote={addNote}
                        />
                        <UIOverlaysLayer
                            isBooting={isBooting}
                            needsPowerOn={needsPowerOn}
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
                    </m.div>
                </>
            )}
        </LazyMotion>
    );
}

// Separate DesktopEnvironmentContent removed, combined above.
