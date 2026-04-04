"use client";

import React, { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, m, LazyMotion, domMax } from "framer-motion";
import dynamic from "next/dynamic";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useLayoutPersistence } from "../contexts/LayoutPersistenceContext";
import { useDesktopWindowContext } from "../context/DesktopWindowContext";
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
import { soundManager } from "../utils/SoundManager";
import { createInitialWindows } from "../utils/windowFactory";
import { clearVisitorPositions } from "../utils/positionSync";
import DesktopProviders from "./DesktopProviders";
import DesktopBackground from "../ui/DesktopBackground";
import DesktopSkeleton from "../ui/DesktopSkeleton";

const DesktopIconsLayer = dynamic(() => import("../layers/DesktopIconsLayer"), { ssr: false });
const UnifiedLayer = dynamic(() => import("../layers/UnifiedLayer"), { ssr: false });
const UIOverlaysLayer = dynamic(() => import("../layers/UIOverlaysLayer"), { ssr: false });
const ChatWindow = dynamic(() => import("../windows/ChatWindow"), {
    loading: () => <div className="animate-pulse bg-gray-100 h-full w-full rounded" />,
    ssr: false
});
const StartScreen = dynamic(() => import("../ui/StartScreen"), { ssr: false, loading: () => <div className="fixed inset-0 bg-black z-[10000]" /> });
const RetroMobileOverlay = dynamic(() => import("../ui/RetroMobileOverlay"), { loading: () => <div className="fixed inset-0 bg-[#c0c0c0] z-[10000]" />, ssr: false });

export interface DesktopEnvironmentProps {
    children?: React.ReactNode;
    aboutData?: AboutData | null;
    experienceData?: ExperienceData | null;
    hardSkillsData?: HardSkillsData | null;
    projects: Project[];
    initialHasBooted?: boolean;
}

export default function DesktopEnvironment({ aboutData, experienceData, hardSkillsData, projects, initialHasBooted }: DesktopEnvironmentProps) {
    const { mounted, isMobile } = useDesktopLock();
    const { needsPowerOn, isBooting, finishBooting } = useBootSequence({ initialHasBooted });
    const { isAdmin, csrfToken, logout: originalLogout } = useAdminAuth();
    const { dynamicContacts, testimonialContacts } = useChatContacts();
    const [showSpotlight, setShowSpotlight] = useState(false);
    const [notesVisible, setNotesVisible] = useState(true);
    const [startScreenReady, setStartScreenReady] = useState(false);
    const [isRevealed, setIsRevealed] = useState(false);

    useDesktopShortcuts({ showSpotlight, setShowSpotlight });

    const commercialProjects = useMemo(() => {
        if (aboutData?.desktopPreferences?.visibleProjectIds) {
            return projects.filter(p => aboutData.desktopPreferences?.visibleProjectIds.includes(p.id));
        }
        return projects.filter(p => p.type !== 'visual_art');
    }, [projects, aboutData]);

    const initialWindows = useMemo(() => createInitialWindows({
        aboutData, experienceData, hardSkillsData, projects, commercialProjects, dynamicContacts, isAdmin
    }), [aboutData, experienceData, hardSkillsData, projects, commercialProjects, dynamicContacts, isAdmin]);

    const handleBootComplete = () => {
        if (aboutData?.soundConfig) soundManager.loadConfig(aboutData.soundConfig);
        soundManager.suppressSound('window-open', 1500);
        startTransition(() => setIsRevealed(true));
        finishBooting();
    };

    if (!mounted) {
        return <DesktopSkeleton isBooting={needsPowerOn} wallpaperUrl={aboutData?.wallpaperConfig?.collection?.find(w => w.id === aboutData.wallpaperConfig?.activeWallpaperId)?.url} />;
    }

    return (
        <DesktopProviders
            initialWindows={initialWindows}
            aboutData={aboutData}
            csrfToken={csrfToken || undefined}
            isAdmin={isAdmin}
        >
            <DesktopMainWithLogout
                aboutData={aboutData} isMobile={isMobile} needsPowerOn={needsPowerOn} isBooting={isBooting}
                isRevealed={isRevealed} startScreenReady={startScreenReady} setStartScreenReady={setStartScreenReady} 
                setIsRevealed={setIsRevealed} handleBootComplete={handleBootComplete} notesVisible={notesVisible}
                setNotesVisible={setNotesVisible} dynamicContacts={dynamicContacts} testimonialContacts={testimonialContacts}
                showSpotlight={showSpotlight} setShowSpotlight={setShowSpotlight} commercialProjects={commercialProjects}
                projects={projects} isAdmin={isAdmin} csrfToken={csrfToken || undefined} originalLogout={originalLogout}
            />
        </DesktopProviders>
    );
}

function DesktopMainWithLogout({ originalLogout, ...props }: any) {
    const { flushAll } = useLayoutPersistence();
    const handleLogout = async () => {
        await flushAll();
        clearVisitorPositions();
        await new Promise(r => setTimeout(r, 300));
        originalLogout();
    };
    return <DesktopMain {...props} logout={handleLogout} />;
}

function DesktopMain({
    aboutData, isMobile, needsPowerOn, isBooting, isRevealed,
    startScreenReady, setStartScreenReady, setIsRevealed,
    handleBootComplete, notesVisible, setNotesVisible,
    dynamicContacts, testimonialContacts, showSpotlight, setShowSpotlight,
    commercialProjects, projects, isAdmin, logout, csrfToken
}: any) {
    const hasHandledAppParamRef = useRef(false);

    const handleGoHome = useCallback(() => {
        window.location.href = '/';
    }, []);

    const { 
        openWindow, resetWindows, requestNextZIndex,
        windows, closeWindow, minimizeWindow, maximizeWindow, focusWindow,
        updateWindowPosition, handleWindowResize, handleWindowResizeEnd, togglePin
    } = useDesktopWindowContext();

    const { notes, addNote, updateNote, deleteNote, permanentDeleteNote, restoreNote, bringToFrontNote } = useStickyNotes(true, isAdmin, csrfToken, requestNextZIndex);
    const { openProjectWindow, navToChat, openWhatsAppList, toggleNotesVisibility } = useDesktopNavigation({
        openWindow, resetWindows, dynamicContacts, ChatWindow, notesVisible, setNotesVisible,
        notes, projects, restoreNote, addNote, isAdmin, setNotesDockBouncing: () => { }
    });
    const { iconPositions, handleIconPositionChange } = useDesktopLayout({ aboutData, isAdmin, csrfToken });
    const { projectIcons } = useDesktopIcons({ mounted: true, commercialProjects, aboutData, handleGoHome, iconPositions });

    useEffect(() => {
        if (hasHandledAppParamRef.current) return;
        if (typeof window === 'undefined') return;

        const params = new URLSearchParams(window.location.search);
        const rawApp = params.get('app');
        if (!rawApp) {
            hasHandledAppParamRef.current = true;
            return;
        }

        const app = rawApp === 'mail' ? 'contact' : rawApp;
        if (app === 'whatsapp') {
            openWhatsAppList();
        } else {
            openWindow(app);
        }

        const nextUrl = `${window.location.pathname}${window.location.hash}`;
        window.history.replaceState({}, '', nextUrl);
        hasHandledAppParamRef.current = true;
    }, [openWindow, openWhatsAppList]);

    const wasBootSkipped = !needsPowerOn && !isBooting;
    const isDesktopReady = wasBootSkipped || startScreenReady;
    const isDesktopRevealed = wasBootSkipped || isRevealed;

    return (
        <LazyMotion features={domMax}>
            {isMobile ? <RetroMobileOverlay /> : (
                <>
                    {(needsPowerOn || isBooting) && (
                        <AnimatePresence>
                            <StartScreen 
                                key="start-screen" 
                                onStart={handleBootComplete} 
                                isActive={needsPowerOn || isBooting} 
                                onReady={() => setStartScreenReady(true)} 
                            />
                        </AnimatePresence>
                    )}
                    <m.div
                        className="relative w-full h-full overflow-hidden select-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isDesktopReady ? 1 : 0 }}
                        transition={{ duration: wasBootSkipped ? 0.4 : 0.2, ease: wasBootSkipped ? [0.32, 0.72, 0, 1] : "easeOut" }}
                    >
                        {isDesktopReady && (
                            <DesktopBackground wallpaperConfig={aboutData?.wallpaperConfig} />
                        )}
                        {isDesktopRevealed && (
                            <>
                                <DesktopIconsLayer projectIcons={projectIcons} isMobile={isMobile} isReady={isDesktopRevealed} handleIconPositionChange={handleIconPositionChange} openProjectWindow={openProjectWindow} />
                                <UnifiedLayer
                                    windows={windows} notes={notes} notesVisible={notesVisible} isAdmin={isAdmin} isReady={isDesktopRevealed}
                                    closeWindow={closeWindow} minimizeWindow={minimizeWindow} maximizeWindow={maximizeWindow} focusWindow={focusWindow}
                                    updateWindowPosition={updateWindowPosition} handleWindowResize={handleWindowResize} handleWindowResizeEnd={handleWindowResizeEnd}
                                    togglePin={togglePin} updateNote={updateNote} bringToFrontNote={bringToFrontNote} deleteNote={deleteNote}
                                    permanentDeleteNote={permanentDeleteNote} restoreNote={restoreNote} addNote={addNote}
                                />
                                <UIOverlaysLayer
                                    isBooting={isBooting} needsPowerOn={needsPowerOn} navToChat={navToChat} openWhatsAppList={openWhatsAppList}
                                    testimonialContacts={testimonialContacts} showSpotlight={showSpotlight} setShowSpotlight={setShowSpotlight}
                                    aboutData={aboutData} isAdmin={isAdmin} logout={logout} toggleNotesVisibility={toggleNotesVisibility}
                                    notesVisible={notesVisible} isMobile={isMobile} commercialProjects={commercialProjects} openProjectWindow={openProjectWindow}
                                />
                            </>
                        )}
                    </m.div>
                </>
            )}
        </LazyMotion>
    );
}
