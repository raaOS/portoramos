"use client";

import React, { startTransition, useCallback, useEffect, useMemo } from "react";
import { AnimatePresence, m, LazyMotion, domMax } from "motion/react";
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
import { useOSSystem } from "../context/OSSystemContext";
import type { AboutData } from "@/types/about";
import type { ExperienceData } from "@/types/experience";
import type { HardSkillsData } from "@/types/hardSkill";
import type { Project } from "@/types/projects";
import type { TestimonialData } from "@/types/testimonial";
import type { ContactData } from "@/types/contact";
import { soundManager } from "../utils/SoundManager";
import { createInitialWindows } from "../utils/windowFactory";
import { clearVisitorPositions } from "../utils/positionSync";
import type { ContactProfile } from "../data/mockChats";
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
    testimonialsData?: TestimonialData | null;
    contactData?: ContactData | null;
}

interface DesktopMainBaseProps {
    aboutData?: AboutData | null;
    isMobile: boolean;
    isAdmin: boolean;
    csrfToken: string | null;
    commercialProjects: Project[];
    projects: Project[];
    dynamicContacts: Record<string, ContactProfile>;
    testimonialContacts: ContactProfile[];
}

interface DesktopMainWithLogoutProps extends DesktopMainBaseProps {
    originalLogout: () => Promise<void>;
}

interface DesktopMainProps extends DesktopMainBaseProps {
    logout: () => void | Promise<void>;
}

export default function DesktopEnvironment({ aboutData, experienceData, hardSkillsData, projects, testimonialsData, contactData }: DesktopEnvironmentProps) {
    const { mounted, isMobile } = useDesktopLock();
    const { needsPowerOn, isBooting } = useBootSequence();
    const { isAdmin, csrfToken, logout: originalLogout } = useAdminAuth();
    const { dynamicContacts, testimonialContacts } = useChatContacts(testimonialsData);

    const commercialProjects = useMemo(() => {
        if (aboutData?.desktopPreferences?.visibleProjectIds) {
            return projects.filter(p => aboutData.desktopPreferences?.visibleProjectIds.includes(p.id));
        }
        return projects.filter(p => p.type !== 'visual_art');
    }, [projects, aboutData]);

    const initialWindows = useMemo(() => createInitialWindows({
        aboutData, experienceData, hardSkillsData, contactData, projects, commercialProjects, dynamicContacts, isAdmin
    }), [aboutData, experienceData, hardSkillsData, contactData, projects, commercialProjects, dynamicContacts, isAdmin]);

    if (!mounted) {
        return <DesktopSkeleton isBooting={needsPowerOn || isBooting} wallpaperUrl={aboutData?.wallpaperConfig?.collection?.find(w => w.id === aboutData.wallpaperConfig?.activeWallpaperId)?.url} />;
    }

    return (
        <DesktopProviders
            initialWindows={initialWindows}
            aboutData={aboutData}
            csrfToken={csrfToken || undefined}
            isAdmin={isAdmin}
        >
            <DesktopMainWithLogout
                aboutData={aboutData} isMobile={isMobile} commercialProjects={commercialProjects}
                projects={projects} isAdmin={isAdmin} csrfToken={csrfToken ?? null} 
                originalLogout={originalLogout} dynamicContacts={dynamicContacts}
                testimonialContacts={testimonialContacts}
            />
        </DesktopProviders>
    );
}

function DesktopMainWithLogout({ originalLogout, ...props }: DesktopMainWithLogoutProps) {
    const { flushAll } = useLayoutPersistence();
    const handleLogout = async () => {
        await flushAll();
        clearVisitorPositions();
        await new Promise(r => setTimeout(r, 300));
        await originalLogout();
    };
    return <DesktopMain {...props} logout={handleLogout} />;
}

function DesktopMain({
    aboutData, isMobile, isAdmin, logout, csrfToken, 
    commercialProjects, projects, dynamicContacts, testimonialContacts
}: DesktopMainProps) {
    const { needsPowerOn, isBooting, finishBooting } = useBootSequence();
    const { 
        startScreenReady, setStartScreenReady,
        isRevealed, setIsRevealed
    } = useOSSystem();
    const wasBootSkipped = !needsPowerOn && !isBooting;

    useDesktopShortcuts();

    const handleGoHome = useCallback(() => {
        window.location.href = '/';
    }, []);

    const { 
        openWindow, resetWindows, requestNextZIndex,
        windows, closeWindow, minimizeWindow, maximizeWindow, focusWindow,
        updateWindowPosition, handleWindowResize, handleWindowResizeEnd, togglePin
    } = useDesktopWindowContext();

    const { notes, addNote, updateNote, deleteNote, permanentDeleteNote, restoreNote, bringToFrontNote } = useStickyNotes(true, isAdmin, csrfToken ?? undefined, requestNextZIndex);
    const { openProjectWindow, navToChat, openWhatsAppList, toggleNotesVisibility } = useDesktopNavigation({
        openWindow, resetWindows, dynamicContacts, ChatWindow,
        notes, projects, restoreNote, addNote, isAdmin, setNotesDockBouncing: () => { }
    });
    const { iconPositions, handleIconPositionChange } = useDesktopLayout({ aboutData, isAdmin, csrfToken });
    const { projectIcons } = useDesktopIcons({ 
        mounted: true, 
        commercialProjects, 
        aboutData, 
        handleGoHome, 
        onOpenExplorer: () => openWindow('explorer'),
        iconPositions 
    });

    const handleBootComplete = useCallback(() => {
        if (aboutData?.soundConfig) soundManager.loadConfig(aboutData.soundConfig);
        soundManager.suppressSound('window-open', 1500);
        soundManager.suppressSound('notification', 1000);
        startTransition(() => setIsRevealed(true));
        finishBooting();
    }, [aboutData, finishBooting, setIsRevealed]);

    // Handle initial sound suppression if boot is skipped
    useEffect(() => {
        if (!needsPowerOn && !isBooting) {
            soundManager.suppressSound('window-open', 800);
            soundManager.suppressSound('notification', 800);
        }
    }, [needsPowerOn, isBooting]);

    // Synchronize OS states for skipped boot to ensure immediate visibility on refresh
    useEffect(() => {
        if (wasBootSkipped && (!isRevealed || !startScreenReady)) {
            startTransition(() => {
                setIsRevealed(true);
                setStartScreenReady(true);
            });
        }
    }, [wasBootSkipped, isRevealed, startScreenReady, setIsRevealed, setStartScreenReady]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleUrlParams = () => {
            const params = new URLSearchParams(window.location.search);
            const rawApp = params.get('app');
            if (!rawApp) return;

            const app = rawApp === 'mail' ? 'contact' : rawApp;
            if (app === 'whatsapp') {
                openWhatsAppList();
            } else {
                openWindow(app);
            }

            const nextUrl = window.location.pathname + window.location.hash;
            window.history.replaceState({}, '', nextUrl);
        };

        handleUrlParams();
        window.addEventListener('popstate', handleUrlParams);
        return () => window.removeEventListener('popstate', handleUrlParams);
    }, [openWindow, openWhatsAppList]);

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
                        className="desktop-main-container relative w-full h-full overflow-hidden select-none"
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
                                    windows={windows} notes={notes} isAdmin={isAdmin}
                                    isRevealed={isDesktopRevealed}
                                    closeWindow={closeWindow} minimizeWindow={minimizeWindow} maximizeWindow={maximizeWindow} focusWindow={focusWindow}
                                    updateWindowPosition={updateWindowPosition} handleWindowResize={handleWindowResize} handleWindowResizeEnd={handleWindowResizeEnd}
                                    togglePin={togglePin} updateNote={updateNote} bringToFrontNote={bringToFrontNote} deleteNote={deleteNote}
                                    permanentDeleteNote={permanentDeleteNote} restoreNote={restoreNote} addNote={addNote}
                                />
                                <UIOverlaysLayer
                                    navToChat={navToChat} openWhatsAppList={openWhatsAppList}
                                    testimonialContacts={testimonialContacts}
                                    aboutData={aboutData} isAdmin={isAdmin} logout={logout} 
                                    toggleNotesVisibility={toggleNotesVisibility}
                                    isMobile={isMobile} commercialProjects={commercialProjects} 
                                    openProjectWindow={openProjectWindow}
                                />
                            </>
                        )}
                    </m.div>
                </>
            )}
        </LazyMotion>
    );
}
