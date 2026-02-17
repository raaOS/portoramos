"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { User, ArrowLeft, Grid, Smile, Rocket, Mail, Trash2, MessageCircle, FileText, Image as ImageIcon, MessageSquare, StickyNote } from "lucide-react";
import { AnimatePresence, m, LazyMotion, domMax } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";

// Admin Auth Hook
import { useAdminAuth } from "@/hooks/useAdminAuth";

// Internal Components (always loaded - core UI)
import OSWindow from "./Window";
import DesktopIcon from "./DesktopIcon";
import OSDock from "./OSDock";
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
import type { AboutData, DesktopPreferences } from "@/types/about";
import type { ExperienceData } from "@/types/experience";
import type { HardSkillsData } from "@/types/hardSkill";
import type { Project, GalleryItem } from "@/types/projects";

// Refactored Imports
import DesktopErrorBoundary from "./DesktopErrorBoundary";
import { generateDesktopIcons } from "./utils/desktopLayoutUtils";
import { getDockItemConfig } from "./utils/dockUtils";
import { DraggableStickyNote } from "./DraggableStickyNote";
import { Testimonial, TestimonialData } from "@/types/testimonial";
import { convertTestimonialToContact, mergeContacts } from "./utils/chatUtils";
import { mockChats, ContactProfile } from "./data/mockChats";

// UI Components (Extracted)
import AppIcon from "./ui/AppIcon";
import ProjectDetailWrapper from "./ui/ProjectDetailWrapper";
const BootSequence = dynamic(() => import("./ui/BootSequence"), {
    loading: () => <div className="fixed inset-0 bg-black flex items-center justify-center"><div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" /></div>,
    ssr: false
});

const DynamicIsland = dynamic(() => import("./ui/DynamicIsland"), {
    loading: () => null,
    ssr: false
});

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
    } = useStickyNotes(mounted, isAdmin, csrfToken);

    // Dynamic Contacts (Mock + Testimonials)
    const [dynamicContacts, setDynamicContacts] = useState<Record<string, ContactProfile>>(mockChats);
    const [allContactsList, setAllContactsList] = useState<ContactProfile[]>([]);
    const [testimonialContacts, setTestimonialContacts] = useState<ContactProfile[]>([]);

    useEffect(() => {
        const fetchTestimonials = async () => {
            try {
                const res = await fetch('/api/testimonial');
                if (res.ok) {
                    const data: TestimonialData = await res.json();

                    // 1. Convert only active testimonials to contacts for notifications
                    const converted = (data.testimonials || [])
                        .filter(t => t.isActive !== false)
                        .map(convertTestimonialToContact);
                    setTestimonialContacts(converted);

                    // 2. Merge all contacts for the chat window
                    const merged = mergeContacts(mockChats, data.testimonials);
                    setDynamicContacts(merged);
                    setAllContactsList(Object.values(merged));
                }
            } catch (error) {
                console.error("Failed to fetch testimonials for chat", error);
            }
        };

        fetchTestimonials();
    }, []);

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
            id: "whatsapp",
            title: "WhatsApp",
            isOpen: false,
            zIndex: 11,
            noPadding: true,
            initialPosition: { x: 200, y: 120 },
            width: 450,
            height: 600,
            content: <ChatWindow customContacts={dynamicContacts} />
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
    ], [aboutData, commercialProjects, experienceData, hardSkillsData, projects, dynamicContacts]);

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

    // Navigation Helpers
    const openProjectWindow = useCallback((project: Project) => {
        router.push(`/projects/${project.slug}`);
    }, [router]);

    const navToChat = useCallback((chatId?: string) => {
        if (chatId) {
            openWindow("whatsapp", {
                // Pass the FULL contact list so chat window can resolve the ID
                content: <ChatWindow activeChatId={chatId} customContacts={dynamicContacts} />
            });
        } else {
            openWindow("whatsapp", {
                content: <ChatWindow customContacts={dynamicContacts} />
            });
        }
    }, [openWindow, dynamicContacts]);

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

    // Dock Configuration - Now using OSDock component for centralized management

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
            <div className="fixed inset-0 w-full h-full overflow-hidden select-none bg-[#050505]">
                {/* Wallpaper Blur Background Skeleton */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#1a1c2c] via-[#4a192c] to-[#121212] opacity-50" />

                {/* Fake Menu Bar */}
                <div className="absolute top-0 left-0 right-0 h-8 bg-white/10 backdrop-blur-xl z-50 flex items-center px-4 border-b border-white/10">
                    <div className="w-16 h-3 bg-white/20 rounded" />
                </div>

                {/* Skeleton Grid (Desktop Icons) */}
                <div className="absolute inset-0 pt-12 pb-24 px-6 grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-8 opacity-30">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 bg-white/10 rounded-2xl animate-pulse shadow-2xl" />
                            <div className="w-14 h-2 bg-white/20 rounded-full" />
                        </div>
                    ))}
                </div>

                {/* Fake Dock */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 h-20 w-[450px] bg-white/10 backdrop-blur-3xl rounded-[24px] border border-white/20 shadow-2xl" />
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
            <LazyMotion features={domMax}>
                {/* Boot Sequence Overlay */}
                <AnimatePresence>
                    {isBooting && (
                        <BootSequence onComplete={() => {
                            setIsBooting(false);
                        }} />
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
                    <div className="absolute inset-0 z-0">
                        <Image
                            src={wallpaper}
                            alt="Desktop Wallpaper"
                            fill
                            priority
                            loading="eager"
                            quality={90} // High quality for LCP, balanced with size
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
                            onOpenChat={navToChat}
                            customNotifications={testimonialContacts}
                        />

                        {/* MenuBar Container - pointer-events-none to let icons through */}
                        <div className="fixed top-0 left-0 right-0 z-[10000] pointer-events-none">
                            <MenuBar
                                activeWindow={windows.filter(w => w.isOpen && !w.isMinimized).sort((a, b) => b.zIndex - a.zIndex)[0]?.title || "Finder"}
                                onAbout={() => openWindow("about")}
                                onSearch={() => setShowSpotlight(true)}
                                availability={aboutData?.hero?.availability}
                            />
                        </div>

                        {/* Dock Container - pointer-events-none to let icons through */}
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none pb-safe">
                            <div className="pointer-events-auto">
                                {aboutData && (
                                    <OSDock
                                        aboutData={aboutData}
                                        onOpenWindow={openWindow}
                                        onOpenNotes={toggleNotesVisibility}
                                        onOpenTrash={() => openWindow("trash-bin")}
                                        isWindowOpen={isWindowOpen}
                                        notesVisible={notesVisible}
                                    />
                                )}
                            </div>
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
                </m.div >
            </LazyMotion >
        </DesktopErrorBoundary >
    );
}
