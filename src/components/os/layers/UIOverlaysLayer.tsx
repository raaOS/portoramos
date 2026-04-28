"use client";

import React from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "motion/react";
import MenuBar from "../core/MenuBar";
import OSDock from "../core/OSDock";

import type { AboutData } from "@/types/about";
import type { Project } from "@/types/projects";
import type { ContactProfile } from "../data/mockChats";
import { useDesktopWindowContext } from "../context/DesktopWindowContext";
import { useUnifiedZIndex } from "../context/UnifiedZIndexContext";
import { ISLAND_ID } from "../ui/DynamicIsland";
import { useOSSystem } from "../context/OSSystemContext";
import { useBootSequence } from "../hooks/useBootSequence";

const Spotlight = dynamic(() => import("../core/Spotlight"), {
    loading: () => null,
    ssr: false
});

const DynamicIsland = dynamic(() => import("../ui/DynamicIsland"), {
    loading: () => null,
    ssr: false
});

const ControlCenter = dynamic(() => import("../ui/ControlCenter"), {
    loading: () => null,
    ssr: false
});

const CalendarPopout = dynamic(() => import("../ui/CalendarPopout"), {
    ssr: false
});

interface UIOverlaysLayerProps {
    navToChat: (chatId?: string) => void;
    openWhatsAppList: () => void;
    testimonialContacts: ContactProfile[];
    aboutData?: AboutData | null;
    isAdmin: boolean;
    logout: () => void;
    toggleNotesVisibility: () => void;
    isMobile: boolean;
    commercialProjects: Project[];
    openProjectWindow: (project: Project) => void;
}

export default function UIOverlaysLayer({
    navToChat,
    openWhatsAppList,
    testimonialContacts,
    aboutData,
    isAdmin,
    logout,
    toggleNotesVisibility,
    isMobile,
    commercialProjects,
    openProjectWindow
}: UIOverlaysLayerProps) {
    const { isBooting, needsPowerOn } = useBootSequence();
    const { 
        showSpotlight, setShowSpotlight, 
        notesVisible, 
        showControlCenter, setShowControlCenter,
        showCalendar, setShowCalendar
    } = useOSSystem();
    const isBootingOrStarting = isBooting || needsPowerOn;
    
    const { windows, openWindow, bouncingDocId } = useDesktopWindowContext();
    const { getZIndex } = useUnifiedZIndex();

    const isWindowOpen = (id: string) => windows?.find(w => w.id === id)?.isOpen ?? false;
    const activeWindows = (windows || []).filter(w => w.isOpen && !w.isMinimized);
    const topWindow = activeWindows.reduce<typeof activeWindows[number] | null>((currentTop, candidate) => {
        if (!currentTop) {
            return candidate;
        }
        return getZIndex(candidate.id) > getZIndex(currentTop.id) ? candidate : currentTop;
    }, null);
    const topWindowTitle = topWindow?.title || null;

    return (
        <div className="absolute inset-0 pointer-events-none">
            {/* Dynamic Island - Unified Z-index participant */}
            <DynamicIsland
                activeWindow={topWindowTitle}
                isBooting={isBooting}
                onOpenChat={navToChat}
                customNotifications={testimonialContacts}
                islandId={ISLAND_ID}
            />

            <AnimatePresence mode="wait">
                {/* MenuBar - hidden during boot */}
                {!isBootingOrStarting && (
                    <motion.div
                        key="menubar"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                    >
                        <MenuBar
                            activeWindow={topWindowTitle || "Finder"}
                            onAbout={() => openWindow("about")}
                            onSearch={() => setShowSpotlight(true)}
                            availability={aboutData?.hero?.availability}
                            isAdmin={isAdmin}
                            onLogout={logout}
                            onToggleControlCenter={() => setShowControlCenter(!showControlCenter)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {/* Dock Container - hidden during boot */}
                {!isBootingOrStarting && (
                    <motion.div 
                        key="os-dock"
                        className="fixed bottom-4 left-0 right-0 flex justify-center pointer-events-none pb-safe z-[99999]"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.15 }}
                    >
                        <div className="pointer-events-auto">
                            {aboutData && (
                                <OSDock
                                    aboutData={aboutData}
                                    onOpenWindow={openWindow}
                                    onOpenWhatsApp={openWhatsAppList}
                                    onOpenContact={() => openWindow("contact")}
                                    onOpenNotes={toggleNotesVisibility}
                                    onOpenTrash={() => openWindow("trash-bin")}
                                    isWindowOpen={isWindowOpen}
                                    notesVisible={notesVisible}
                                    bouncingId={bouncingDocId}
                                    isMobile={isMobile}
                                />
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {showSpotlight && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-auto z-[9999]">
                    <Spotlight
                        isOpen={showSpotlight}
                        onClose={() => setShowSpotlight(false)}
                        projects={commercialProjects}
                        onOpenProject={(project: Project) => {
                            setShowSpotlight(false);
                            openProjectWindow(project);
                        }}
                        onOpenApp={(id) => openWindow(id)}
                    />
                </div>
            )}

            <AnimatePresence>
                {showControlCenter && (
                    <div className="absolute inset-0 pointer-events-auto z-[10001]" onClick={() => setShowControlCenter(false)}>
                        <div onClick={e => e.stopPropagation()}>
                            <ControlCenter 
                                isOpen={showControlCenter} 
                                onClose={() => setShowControlCenter(false)} 
                            />
                        </div>
                    </div>
                )}
            </AnimatePresence>
            {/* Global Calendar Popout */}
            <AnimatePresence>
                {showCalendar && (
                    <div 
                        className="fixed inset-0 pointer-events-auto z-[10001]" 
                        onClick={() => setShowCalendar(false)}
                    >
                        <div onClick={e => e.stopPropagation()}>
                            <CalendarPopout 
                                isOpen={showCalendar} 
                                onClose={() => setShowCalendar(false)} 
                            />
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
