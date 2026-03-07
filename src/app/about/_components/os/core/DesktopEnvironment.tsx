"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";

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

    // Track when StartScreen has actually mounted and is covering the screen
    const [startScreenReady, setStartScreenReady] = useState(false);

    // Track when the StartScreen begins its "glassReveal" animation (hole expands)
    const [isRevealed, setIsRevealed] = useState(false);

    // Admin auth check
    const { isAdmin, csrfToken, logout } = useAdminAuth();

    // Notes visibility toggle
    const [notesVisible, setNotesVisible] = useState(true);

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
            dynamicContacts
        }),
        [aboutData, experienceData, hardSkillsData, projects, commercialProjects, dynamicContacts]
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
            <DesktopWindowProvider
                initialWindows={initialWindows}
                aboutData={aboutData}
                csrfToken={csrfToken || undefined}
            >
                <DesktopMain
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
                    notes={notes}
                    addNote={addNote}
                    updateNote={updateNote}
                    deleteNote={deleteNote}
                    permanentDeleteNote={permanentDeleteNote}
                    restoreNote={restoreNote}
                    bringToFrontNote={bringToFrontNote}
                    dynamicContacts={dynamicContacts}
                    testimonialContacts={testimonialContacts}
                    showSpotlight={showSpotlight}
                    setShowSpotlight={setShowSpotlight}
                    commercialProjects={commercialProjects}
                    projects={projects}
                    isAdmin={isAdmin}
                    logout={logout}
                />
            </DesktopWindowProvider>
        </DesktopErrorBoundary>
    );
}

// Sub-component that has access to DesktopWindowContext
function DesktopMain({
    aboutData, isMobile, needsPowerOn, isBooting, isRevealed,
    startScreenReady, setStartScreenReady, setIsRevealed,
    handleBootComplete, notesVisible, setNotesVisible, notes,
    addNote, updateNote, deleteNote, permanentDeleteNote,
    restoreNote, bringToFrontNote, dynamicContacts,
    testimonialContacts, showSpotlight, setShowSpotlight,
    commercialProjects, projects, isAdmin, logout
}: any) {
    const { openWindow, resetWindows } = useDesktopWindowContext();

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

    const { iconPositions, handleIconPositionChange } = useDesktopLayout({
        aboutData,
        isAdmin,
        csrfToken: null // CSRF is only needed for sticky notes
    });

    const { projectIcons } = useDesktopIcons({
        mounted: true,
        commercialProjects,
        aboutData,
        handleGoHome: () => window.location.href = '/',
        iconPositions
    });

    // Memoized callbacks for StartScreen to prevent React Compiler warnings
    const handleStartScreenReady = useCallback(() => setStartScreenReady(true), [setStartScreenReady]);
    const handleStartScreenReveal = useCallback(() => setIsRevealed(true), [setIsRevealed]);

    return (
        <LazyMotion features={domMax}>
            {isMobile ? (
                <RetroMobileOverlay />
            ) : (
                <>
                    <AnimatePresence>
                        <StartScreen
                            key="start-screen"
                            onStart={handleBootComplete}
                            isActive={needsPowerOn || isBooting}
                            onReady={handleStartScreenReady}
                            onReveal={handleStartScreenReveal}
                        />
                    </AnimatePresence>

                    <m.div
                        className="relative w-full h-full overflow-hidden select-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: startScreenReady ? 1 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <DesktopBackground wallpaperConfig={aboutData?.wallpaperConfig} />

                        <DesktopIconsLayer
                            projectIcons={projectIcons as any[]}
                            isMobile={isMobile}
                            notesVisible={notesVisible}
                            notes={notes}
                            handleIconPositionChange={handleIconPositionChange}
                            updateNote={updateNote}
                            bringToFrontNote={bringToFrontNote}
                            deleteNote={deleteNote}
                            permanentDeleteNote={permanentDeleteNote}
                            restoreNote={restoreNote}
                            addNote={addNote}
                            openProjectWindow={openProjectWindow}
                            isAdmin={isAdmin}
                            isReady={isRevealed || (!needsPowerOn && !isBooting)}
                        />
                        <WindowsLayer
                            isAdmin={isAdmin}
                            isReady={isRevealed || (!needsPowerOn && !isBooting)}
                        />
                        <UIOverlaysLayer
                            isBooting={isBooting}
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
