"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { User, ArrowLeft, Grid, Smile, Rocket, Mail, Trash2, MessageCircle, FileText } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";

// Admin Auth Hook
import { useAdminAuth } from "@/hooks/useAdminAuth";

// Internal Components (always loaded - core UI)
import OSWindow from "./Window";
import DesktopIcon from "./DesktopIcon";
import Dock from "./Dock";
import MenuBar from "./MenuBar";

// UI Components - Lazy loaded (not needed immediately)
const Spotlight = dynamic(() => import("./Spotlight"), {
    loading: () => null,
    ssr: false
});

const MacFolder = dynamic(() => import("./MacFolder"), {
    loading: () => <div className="w-16 h-16 bg-gray-200/50 rounded-lg animate-pulse" />,
    ssr: false
});

// Window Content Components - Lazy loaded for faster initial paint
const AboutContent = dynamic(() => import("./AboutContent"), {
    loading: () => <div className="animate-pulse bg-gray-100 h-full w-full rounded" />,
    ssr: false
});

const ChatWindow = dynamic(() => import("./ChatWindow"), {
    loading: () => <div className="animate-pulse bg-gray-100 h-full w-full rounded" />,
    ssr: false
});


const ContactWindow = dynamic(() => import("./ContactWindow"), {
    loading: () => <div className="animate-pulse bg-gray-100 h-full w-full rounded" />,
    ssr: false
});

const ProjectsGridWindow = dynamic(() => import("./ProjectsGridWindow"), {
    loading: () => <div className="animate-pulse bg-gray-100 h-full w-full rounded" />,
    ssr: false
});

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
import type { AboutData, DesktopPreferences } from "@/types/about";
import type { ExperienceData } from "@/types/experience";
import type { HardSkillsData } from "@/types/hardSkill";
import type { Project, GalleryItem } from "@/types/projects";

// Refactored Imports
import DesktopErrorBoundary from "./DesktopErrorBoundary";
import { generateDesktopIcons } from "./utils/desktopLayoutUtils";
import { DraggableStickyNote } from "./DraggableStickyNote";

// UI Components (Extracted)
import AppIcon from "./ui/AppIcon";
import ProjectDetailWrapper from "./ui/ProjectDetailWrapper";
import BootSequence from "./ui/BootSequence";
import DynamicIsland from "./ui/DynamicIsland";

// Sub-components moved to separate files:
// - ProjectDetailWrapper -> ./ui/ProjectDetailWrapper.tsx
// - AppIcon -> ./ui/AppIcon.tsx

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

    const [isBooting, setIsBooting] = useState(true);
    const [showSpotlight, setShowSpotlight] = useState(false);

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
    const { isAdmin, csrfToken } = useAdminAuth();

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
    } = useStickyNotes(mounted, isAdmin);

    // Forces a re-render of layout if needed (e.g. after drag)
    const [manualRefreshSeed, setManualRefreshSeed] = useState(0);
    const triggerReposition = () => setManualRefreshSeed(prev => prev + 1);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd+K or Ctrl+K for Spotlight
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setShowSpotlight(prev => !prev);
            }
            // Esc to close Spotlight
            if (e.key === 'Escape' && showSpotlight) {
                setShowSpotlight(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showSpotlight]);

    const commercialProjects = useMemo(() => {
        if (aboutData?.desktopPreferences?.visibleProjectIds) {
            return projects.filter(p => aboutData.desktopPreferences?.visibleProjectIds.includes(p.id));
        }
        return projects.filter(p => p.type !== 'visual_art');
    }, [projects, aboutData]);

    const getCenterPosition = (w: number, h: number) => {
        if (typeof window === 'undefined') return { x: 0, y: 0 };
        const safeWidth = windowSize.width || window.innerWidth || 1200;
        const safeHeight = windowSize.height || window.innerHeight || 800;
        return { x: Math.max(0, (safeWidth - w) / 2), y: Math.max(30, (safeHeight - h) / 2) };
    };

    // Windows Init
    const initialWindows: WindowState[] = useMemo(() => [
        {
            id: "about",
            title: "Finder: About Me",
            isOpen: false,
            zIndex: 10,
            noPadding: true,
            initialPosition: { x: 100, y: 80 },
            width: 900,
            height: 600,
            content: <AboutContent aboutData={aboutData} experienceData={experienceData} hardSkillsData={hardSkillsData} projects={projects} />
        },
        {
            id: "projects",
            title: "Finder: Projects",
            isOpen: false,
            zIndex: 9,
            noPadding: true,
            initialPosition: { x: 150, y: 100 },
            width: 1000,
            height: 700,
            content: (
                <div className="w-full h-full overflow-y-auto bg-white custom-scrollbar">
                    <IndexClientWithAutoUpdate initialProjects={commercialProjects} />
                </div>
            )
        },
        {
            id: "trash-bin",
            title: "Recycle Bin",
            isOpen: false,
            zIndex: 1, // Default low z-index
            initialPosition: { x: 400, y: 250 },
            width: 400,
            height: 250,
            content: (
                <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                    <Trash2 size={48} className="text-gray-400 mb-2" />
                    <h3 className="font-bold text-lg mb-1">Access Denied</h3>
                    <p className="text-gray-500 text-sm">You cannot delete perfection.</p>
                </div>
            )
        }
    ], [aboutData, commercialProjects, experienceData, hardSkillsData, projects]);

    const {
        windows,
        openWindow,
        closeWindow,
        minimizeWindow,
        maximizeWindow,
        focusWindow,
        updateWindowPosition: internalUpdateWindowPosition,
        handleWindowResize,
        handleWindowResizeEnd, // Add this
        togglePin,
        bouncingDocId,
        resetWindows
    } = useWindowManager({ initialWindows, aboutData, projects, csrfToken });

    const handleUpdateWindowPosition = (id: string, x: number, y: number) => {
        internalUpdateWindowPosition(id, x, y);
        triggerReposition();
    };

    const isWindowOpen = (id: string) => windows.find(w => w.id === id)?.isOpen ?? false;

    // Wallpaper
    const [wallpaper, setWallpaper] = useState(() => {
        if (aboutData?.wallpaperConfig?.activeWallpaperId && aboutData?.wallpaperConfig?.collection) {
            const active = aboutData.wallpaperConfig.collection.find(w => w.id === aboutData?.wallpaperConfig?.activeWallpaperId);
            if (active) return active.url;
        }
        return "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop";
    });

    // Actions
    const handleGoHome = useCallback(() => router.push('/'), [router]);
    const resetDesktopAndClose = useCallback(() => resetWindows(), [resetWindows]);

    const openProjectWindow = (project: Project) => {
        openWindow(`project-${project.slug}`, {
            title: `Project: ${project.title}`,
            noPadding: true,
            width: 1000,
            height: 700,
            content: <ProjectDetailWrapper project={project} projects={projects} />
        });
    };

    const openLaunchpad = () => {
        openWindow('launchpad', {
            title: 'Launchpad',
            noPadding: true,
            width: 1100,
            height: 700,
            content: <ProjectsGridWindow projects={commercialProjects} onOpenProject={openProjectWindow} />
        });
    };

    const openChatWindow = (chatId?: string) => {
        openWindow('chat', {
            title: 'WhatsApp Live',
            noPadding: true,
            initialPosition: getCenterPosition(380, 600),
            width: 380,
            height: 600,
            content: <ChatWindow key={chatId || 'default'} settings={aboutData?.chatSettings} activeChatId={chatId} />
        });
    };

    // Toggle notes visibility (dock icon indicator follows this)
    const toggleNotesVisibility = () => {
        const nextState = !notesVisible;
        setNotesVisible(nextState);

        // If turning ON, and all notes are currently "deleted" (closed by visitor), restore them
        if (nextState) {
            const hasVisibleNotes = notes.some(n => !n.isDeleted);
            if (!hasVisibleNotes && notes.length > 0) {
                // Restore all notes for the visitor
                notes.forEach(n => restoreNote(n.id));
            }
        }

        // Trigger bounce animation on notes dock icon
        setNotesDockBouncing(true);
        setTimeout(() => setNotesDockBouncing(false), 600);
    };

    // Dock Configuration
    const dockItems = useMemo(() => {
        const defaultItems = [
            { id: "home", label: "Exit OS", icon: <AppIcon icon={ArrowLeft} color="from-zinc-700 to-zinc-900" />, onClick: handleGoHome },
            { id: "finder", label: "Finder", icon: <AppIcon icon={Smile} color="from-sky-400 to-blue-500" />, onClick: resetDesktopAndClose },
            { id: "about", label: "Profile", icon: <AppIcon icon={User} color="from-gray-300 to-gray-400" />, onClick: () => openWindow("about"), isOpen: isWindowOpen("about") },
            { id: "projects", label: "Launchpad", icon: <AppIcon icon={Rocket} color="from-red-400 to-pink-500" />, onClick: openLaunchpad, isOpen: isWindowOpen("launchpad") },

            { id: "whatsapp", label: "WhatsApp", icon: <AppIcon icon={MessageCircle} color="from-green-400 to-green-600" />, onClick: () => openChatWindow(), isOpen: isWindowOpen("chat") },
            { id: "notes", label: "Notes", icon: <AppIcon icon={FileText} color="from-yellow-300 to-orange-400" />, onClick: () => toggleNotesVisibility(), isOpen: notesVisible },
            { id: "trash", label: "Trash", icon: <AppIcon icon={Trash2} color="from-gray-400 to-gray-500" />, onClick: () => openWindow("trash-bin"), isOpen: isWindowOpen("trash-bin") },
        ];

        return defaultItems.filter(item => {
            if (!aboutData?.dockConfig) return true;
            const pref = aboutData.dockConfig[item.id];
            return pref ? !pref.isHidden : true;
        }).map(item => {
            const pref = aboutData?.dockConfig?.[item.id];
            let icon = item.icon;
            if (pref && pref.iconUrl) {
                icon = <AppIcon imageUrl={pref.iconUrl} />;
            }
            return {
                ...item,
                label: pref?.label || item.label,
                icon
            };
        });
    }, [aboutData, isWindowOpen, addNote, openWindow, openLaunchpad, openChatWindow, handleGoHome]);

    // --- ICON PERSISTENCE LOGIC START ---

    // Local state for icon positions (Optimistic UI)
    const [iconPositions, setIconPositions] = useState<Record<string, { x: number; y: number }>>({});

    // Initialize from props
    useEffect(() => {
        if (aboutData?.desktopPreferences?.iconPositions) {
            setIconPositions(aboutData.desktopPreferences.iconPositions);
        }
    }, [aboutData]);

    const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const handleIconPositionChange = (id: string, x: number, y: number) => {
        // 1. Optimistic Update
        const newPositions = { ...iconPositions, [id]: { x, y } };
        setIconPositions(newPositions);

        // 2. Persist if Admin (Debounced)
        if (isAdmin) {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

            saveTimeoutRef.current = setTimeout(async () => {
                try {
                    // Update layout preference with ALL current positions
                    const payload = {
                        desktopPreferences: {
                            ...aboutData?.desktopPreferences,
                            iconPositions: newPositions
                        }
                    };

                    await fetch('/api/admin/about/desktop', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-Token': csrfToken || ''
                        },
                        body: JSON.stringify(payload)
                    });
                    // Optional: Toast notification here
                } catch (error) {
                    console.error("Failed to save icon position", error instanceof Error ? error.message : error);
                }
            }, 1000); // 1-second debounce
        }
    };
    // --- ICON PERSISTENCE LOGIC END ---

    // Icons Layout
    // Optimized Layout: Only trigger reshuffle if "Obstacles" change.
    // We filter out irrelevant window changes (like project windows opening/closing).
    const obstacleSignature = useMemo(() => {
        // Optimized: Windows no longer affect icon layout (Static Layout)

        // 1. Sticky Notes State (Position & Deletion)
        const notesState = notes
            .filter(n => !n.isDeleted)
            .map(n => `${n.id}:${n.x},${n.y}`)
            .join('|');

        return `static-windows|${notesState}`;
    }, [notes]);

    const projectIcons = useMemo(() => {
        if (!mounted || !commercialProjects.length || !windowSize.width) return [];

        // Merge props prefs with local state overrides
        const mergedPreferences: DesktopPreferences = {
            visibleProjectIds: aboutData?.desktopPreferences?.visibleProjectIds || [],
            maxIcons: aboutData?.desktopPreferences?.maxIcons || 100,
            layout: aboutData?.desktopPreferences?.layout || 'grid',
            iconPositions: iconPositions
        };

        // Pass to utility (it will filter internally again, but at least we control WHEN this runs)
        return generateDesktopIcons(
            windowSize,
            windows,
            notes,
            commercialProjects,
            mergedPreferences,
            handleGoHome
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mounted, windowSize.width, windowSize.height, obstacleSignature, commercialProjects, aboutData, handleGoHome, iconPositions]); // Added iconPositions dependency

    // Effects for Lock & Cleanup controlled by useDesktopLock hook now


    // SSR Skeleton: Show a basic visual immediately to improve LCP
    // Before: `return null` caused 17s LCP (blank screen until JS hydrates)
    if (!mounted) {
        return (
            <div className="fixed inset-0 w-full h-full overflow-hidden select-none bg-gradient-to-br from-gray-900 via-gray-800 to-black">
                {/* Fake Menu Bar */}
                <div className="absolute top-0 left-0 right-0 h-7 bg-black/60 backdrop-blur-xl z-50 flex items-center px-4">
                    <div className="w-4 h-4 bg-white/80 rounded-full mr-2" />
                    <div className="w-16 h-3 bg-white/30 rounded" />
                </div>
                {/* Skeleton Grid */}
                <div className="absolute inset-0 pt-10 pb-20 px-4 grid grid-cols-4 gap-4 opacity-50">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                            <div className="w-16 h-16 bg-white/10 rounded-xl animate-pulse" />
                            <div className="w-12 h-2 bg-white/20 rounded" />
                        </div>
                    ))}
                </div>
                {/* Fake Dock */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 h-[88px] w-[544px] bg-white/10 backdrop-blur-xl rounded-[24px] border border-white/20 shadow-lg" />
            </div>
        );
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
            {/* Boot Sequence Overlay */}
            <AnimatePresence>
                {isBooting && (
                    <BootSequence onComplete={() => {
                        setIsBooting(false);
                    }} />
                )}
            </AnimatePresence>

            {/* Main Desktop Content */}
            <motion.div
                className="relative w-full h-full overflow-hidden select-none"
                initial="booting"
                animate={isBooting ? "booting" : "ready"}
                variants={desktopVariants}
            >
                {/* Wallpaper */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src={wallpaper}
                        alt="Desktop Wallpaper"
                        fill
                        priority
                        quality={85}
                        sizes="100vw"
                        className="object-cover transition-all duration-700"
                        style={{ filter: `blur(${aboutData?.wallpaperConfig?.blur || 0}px)` }}
                    />
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] backface-invisible will-change-transform" />
                </div>

                {/* Layer 1: Desktop Icons & Sticky Notes */}
                <div className="absolute inset-0 z-10 pointer-events-auto">
                    {projectIcons.map((icon: any) => {
                        const isFolder = icon.type === 'folder';

                        return (
                            <DesktopIcon
                                key={icon.id}
                                {...icon}
                                icon={!isFolder ? icon.icon : undefined}
                                isMobile={isMobile}
                                priority={icon.priority} // Pass LCP priority
                                onPositionChange={handleIconPositionChange} // Pass persistence handler
                                onClick={() => {
                                    if (isFolder && icon.action) icon.action();
                                    else if (icon.type === 'project') openProjectWindow(icon.data);
                                }}
                            >
                                {isFolder && <MacFolder size={0.85} isStatic={true} />}
                            </DesktopIcon>
                        );
                    })}

                    {/* Sticky Notes - Only show when toggled visible */}
                    {notesVisible && (
                        <>
                            {notes.filter(n => !n.isDeleted).map(note => (
                                <DraggableStickyNote
                                    key={note.id}
                                    note={note}
                                    updateNote={updateNote}
                                    bringToFrontNote={bringToFrontNote}
                                    deleteNote={(id) => {
                                        deleteNote(id);
                                        // If this was the last visible note, turn off the dock indicator
                                        const visibleCount = notes.filter(n => !n.isDeleted).length;
                                        if (visibleCount <= 1) {
                                            setNotesVisible(false);
                                        }
                                    }}
                                    permanentDeleteNote={permanentDeleteNote}
                                    restoreNote={restoreNote}
                                    isAdmin={isAdmin}
                                />
                            ))}
                        </>
                    )}
                </div>

                {/* Layer 2: Windows */}
                <div className="absolute inset-0 z-20 pointer-events-none">
                    <AnimatePresence>
                        {windows.map(w => (
                            w.isOpen && !w.isMinimized && (
                                <OSWindow
                                    key={w.id}
                                    id={w.id}
                                    isOpen={w.isOpen}
                                    title={w.title}
                                    isMinimized={w.isMinimized}
                                    onClose={() => closeWindow(w.id)}
                                    onMinimize={() => minimizeWindow(w.id)}
                                    onMaximize={() => maximizeWindow(w.id)}
                                    onFocus={() => focusWindow(w.id)}
                                    onUpdatePosition={(x, y) => handleUpdateWindowPosition(w.id, x, y)}
                                    onResize={(width, height) => handleWindowResize(w.id, width, height)}
                                    onResizeEnd={(width, height) => handleWindowResizeEnd(w.id, width, height)}
                                    isPinned={isAdmin && w.isPinned}
                                    onTogglePin={isAdmin ? () => togglePin(w.id) : undefined}
                                    isAdmin={isAdmin}
                                    initialPosition={w.initialPosition}
                                    width={w.width || 800}
                                    height={w.height || 600}
                                    zIndex={w.zIndex}
                                    noPadding={w.noPadding}
                                >
                                    {w.content}
                                </OSWindow>
                            )
                        ))}
                    </AnimatePresence>
                </div>

                {/* Layer 3: UI Overlays (Dock, MenuBar, Spotlight, DynamicIsland) */}
                <div className="absolute inset-0 z-30 pointer-events-none">
                    {/* Dynamic Island - High Z-index */}
                    <DynamicIsland
                        activeWindow={windows.filter(w => w.isOpen && !w.isMinimized).sort((a, b) => b.zIndex - a.zIndex)[0]?.title || null}
                        isBooting={isBooting}
                        onOpenChat={openChatWindow}
                    />

                    <div className="pointer-events-auto">
                        <MenuBar
                            activeWindow={windows.filter(w => w.isOpen && !w.isMinimized).sort((a, b) => b.zIndex - a.zIndex)[0]?.title || "Finder"}
                            onAbout={() => openWindow("about")}
                            onSearch={() => setShowSpotlight(true)}
                            availability={aboutData?.hero?.availability}
                        />
                    </div>

                    <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-auto pb-safe">
                        <Dock
                            items={dockItems}
                            bouncingId={notesDockBouncing ? 'notes' : bouncingDocId}
                            isMobile={isMobile}
                        />
                    </div>

                    {showSpotlight && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-auto z-[9999]">
                            <Spotlight
                                isOpen={showSpotlight}
                                onClose={() => setShowSpotlight(false)}
                                projects={commercialProjects}
                                onOpenProject={openProjectWindow}
                                onOpenApp={(id) => openWindow(id)}
                            />
                        </div>
                    )}
                </div>
            </motion.div>
        </DesktopErrorBoundary>
    );
}
