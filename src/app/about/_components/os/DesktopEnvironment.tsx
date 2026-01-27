"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { User, ArrowLeft, Grid, Smile, Rocket, Mail, Trash2, MessageCircle, Image as ImageIcon, FileText } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

// Internal Components
import OSWindow from "./Window";
import DesktopIcon from "./DesktopIcon"; // Ensure this handles 'folder' | 'project'
import Dock from "./Dock";
import MenuBar from "./MenuBar";

// Window Content Components
import AboutContent from "./AboutContent";
import ProjectsGridWindow from "./ProjectsGridWindow";
import ContactWindow from "./ContactWindow";
import ChatWindow from "./ChatWindow";
import GalleryWindow from "./GalleryWindow";
import Spotlight from "./Spotlight";
import LockScreen from "./LockScreen";
import MacFolder from "./MacFolder";

import IndexClientWithAutoUpdate from "@/components/home/IndexClientWithAutoUpdate";
import ProjectDetailTwoColumn from "@/app/works/[slug]/ProjectDetailTwoColumn";

// Hooks & Types
import { useSystemSound } from "@/hooks/useSystemSound";
import { useWindowManager, WindowState } from "@/hooks/useWindowManager";
import type { AboutData } from "@/types/about";
import type { ExperienceData } from "@/types/experience";
import type { HardSkillsData } from "@/types/hardSkill";
import type { Project, GalleryItem } from "@/types/projects";

// Refactored Imports
import DesktopErrorBoundary from "./DesktopErrorBoundary";
import { useStickyNotes } from "./hooks/useStickyNotes";
import { generateDesktopIcons } from "./utils/desktopLayoutUtils";
import { DraggableStickyNote } from "./DraggableStickyNote";

// Helper
const isVideo = (url?: string) => url && /\.(mp4|webm|mov)$/i.test(url);

// --- Sub-Components ---

const ProjectDetailWrapper = ({ project, projects }: { project: Project, projects: Project[] }) => {
    const coverSrc = project.cover || '/placeholder.jpg';
    const cover: GalleryItem = {
        kind: isVideo(coverSrc) ? 'video' : 'image',
        src: coverSrc,
        alt: project.title
    };

    let gallery: GalleryItem[] = [];
    if (project.galleryItems && project.galleryItems.length > 0) {
        gallery = project.galleryItems;
    } else if (project.gallery && project.gallery.length > 0) {
        gallery = project.gallery.map(src => ({ kind: 'image', src: src, alt: project.title }));
    }

    const otherProjects = projects.filter(p => p.id !== project.id);
    const ratio = project.coverWidth && project.coverHeight ? project.coverWidth / project.coverHeight : 1.77;

    return (
        <ProjectDetailTwoColumn
            project={project}
            cover={cover}
            gallery={gallery}
            ratio={ratio}
            otherProjects={otherProjects}
            isWindowMode={true}
        />
    );
};

const AppIcon = ({ color, icon: Icon, imageUrl }: { color?: string, icon?: any, imageUrl?: string }) => {
    if (imageUrl) {
        return (
            <div className="w-full h-full flex items-center justify-center overflow-hidden rounded-xl">
                <img
                    src={imageUrl}
                    alt="icon"
                    className="w-full h-full object-cover scale-[1.01]"
                    style={{ imageRendering: 'auto', WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden' }}
                />
            </div>
        );
    }
    return (
        <div className={`w-full h-full rounded-xl bg-gradient-to-b ${color} flex items-center justify-center shadow-lg relative`}>
            <div className="absolute inset-0 rounded-xl ring-1 ring-white/20 inset-ring pointer-events-none" />
            <Icon className="text-white drop-shadow-sm" size="65%" strokeWidth={2} />
        </div>
    );
};

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
    const [mounted, setMounted] = useState(false);
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
    const [showSpotlight, setShowSpotlight] = useState(false);
    const [isLocked, setIsLocked] = useState(true);

    // Hooks
    const {
        notes,
        addNote,
        updateNote,
        deleteNote,
        permanentDeleteNote,
        restoreNote,
        bringToFrontNote
    } = useStickyNotes(mounted);

    // Forces a re-render of layout if needed (e.g. after drag)
    const [manualRefreshSeed, setManualRefreshSeed] = useState(0);
    const triggerReposition = () => setManualRefreshSeed(prev => prev + 1);

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
        togglePin,
        bouncingDocId,
        resetWindows
    } = useWindowManager({ initialWindows, aboutData, projects });

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

    const openChatWindow = () => {
        openWindow('chat', {
            title: 'WhatsApp Live',
            noPadding: true,
            initialPosition: getCenterPosition(380, 600),
            width: 380,
            height: 600,
            content: <ChatWindow settings={aboutData?.chatSettings} />
        });
    };

    const openGallery = () => {
        openWindow('gallery', {
            title: 'Photos',
            noPadding: true,
            width: 900,
            height: 600,
            content: <GalleryWindow projects={projects} onPreview={(item) => {
                openWindow('preview-viewer', {
                    title: item.title,
                    zIndex: 9999,
                    noPadding: true,
                    width: 800,
                    height: 600,
                    content: null
                });
            }} />
        });
    };

    // Dock Configuration
    const dockItems = useMemo(() => {
        const defaultItems = [
            { id: "home", label: "Exit OS", icon: <AppIcon icon={ArrowLeft} color="from-zinc-700 to-zinc-900" />, onClick: handleGoHome },
            { id: "finder", label: "Finder", icon: <AppIcon icon={Smile} color="from-sky-400 to-blue-500" />, onClick: resetDesktopAndClose },
            { id: "about", label: "Profile", icon: <AppIcon icon={User} color="from-gray-300 to-gray-400" />, onClick: () => openWindow("about"), isOpen: isWindowOpen("about") },
            { id: "projects", label: "Launchpad", icon: <AppIcon icon={Rocket} color="from-red-400 to-pink-500" />, onClick: openLaunchpad, isOpen: isWindowOpen("launchpad") },
            { id: "gallery", label: "Photos", icon: <AppIcon icon={ImageIcon} color="from-indigo-400 to-blue-500" />, onClick: openGallery, isOpen: isWindowOpen("gallery") },
            { id: "whatsapp", label: "WhatsApp", icon: <AppIcon icon={MessageCircle} color="from-green-400 to-green-600" />, onClick: openChatWindow, isOpen: isWindowOpen("chat") },
            { id: "notes", label: "Notes", icon: <AppIcon icon={FileText} color="from-yellow-300 to-orange-400" />, onClick: addNote, isOpen: isWindowOpen("sticky-notes") },
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
    }, [aboutData, isWindowOpen, addNote, openWindow, openLaunchpad, openGallery, openChatWindow, handleGoHome]);

    // Icons Layout
    // Optimized Layout: Only trigger reshuffle if "Obstacles" change.
    // We filter out irrelevant window changes (like project windows opening/closing).
    const obstacleSignature = useMemo(() => {
        // 1. Profile Window State (Position & Visibility)
        const profileWin = windows.find(w => w.id === 'about');
        const profileState = profileWin
            ? `${profileWin.initialPosition?.x},${profileWin.initialPosition?.y},${profileWin.isOpen},${profileWin.isMinimized}`
            : 'closed';

        // 2. Sticky Notes State (Position & Deletion)
        const notesState = notes
            .filter(n => !n.isDeleted)
            .map(n => `${n.id}:${n.x},${n.y}`)
            .join('|');

        return `${profileState}|${notesState}`;
    }, [windows, notes]);

    const projectIcons = useMemo(() => {
        if (!mounted || !commercialProjects.length || !windowSize.width) return [];

        // Pass to utility (it will filter internally again, but at least we control WHEN this runs)
        return generateDesktopIcons(
            windowSize,
            windows,
            notes,
            commercialProjects,
            aboutData?.desktopPreferences,
            handleGoHome
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mounted, windowSize.width, windowSize.height, obstacleSignature, commercialProjects, aboutData, handleGoHome]);

    // Effects for Lock & Cleanup
    useEffect(() => {
        setMounted(true);
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });

        const html = document.documentElement;
        const body = document.body;
        const originalStyles = {
            htmlOverflow: html.style.overflow,
            bodyOverflow: body.style.overflow,
            htmlHeight: html.style.height,
            bodyHeight: body.style.height
        };

        // Lock
        window.scrollTo(0, 0);
        html.style.overflow = "hidden";
        body.style.overflow = "hidden";
        html.style.height = "100%";
        body.style.height = "100%";
        html.classList.add('lenis-stopped');

        // Style Injection (Safe)
        const styleId = 'os-mode-reset';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                html, body {
                    overflow: hidden !important;
                    height: 100vh !important;
                    width: 100vw !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    overscroll-behavior: none !important;
                }
            `;
            document.head.appendChild(style);
        }

        const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);

            // Restore
            html.style.overflow = originalStyles.htmlOverflow;
            body.style.overflow = originalStyles.bodyOverflow;
            html.style.height = originalStyles.htmlHeight;
            body.style.height = originalStyles.bodyHeight;
            html.classList.remove('lenis-stopped');

            const styleTag = document.getElementById(styleId);
            if (styleTag) styleTag.remove();
        };
    }, []);

    if (!mounted) return null;

    return (
        <div className="relative w-full h-full overflow-hidden select-none bg-black">
            {/* Wallpaper */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-700"
                style={{ backgroundImage: `url(${wallpaper})` }}
            >
                <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
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
                            onClick={() => {
                                if (isFolder && icon.action) icon.action();
                                else if (icon.type === 'project') openProjectWindow(icon.data);
                            }}
                        >
                            {isFolder && <MacFolder size={0.85} isStatic={true} />}
                        </DesktopIcon>
                    );
                })}

                {notes.filter(n => !n.isDeleted).map(note => (
                    <DraggableStickyNote
                        key={note.id}
                        note={note}
                        updateNote={updateNote}
                        bringToFrontNote={bringToFrontNote}
                        deleteNote={deleteNote}
                        permanentDeleteNote={permanentDeleteNote}
                        restoreNote={restoreNote}
                    />
                ))}
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

            {/* Layer 3: UI Overlays (Dock, MenuBar, Spotlight) */}
            <div className="absolute inset-0 z-30 pointer-events-none">
                <div className="pointer-events-auto">
                    <MenuBar
                        activeWindow={windows.find(w => w.zIndex === Math.max(...windows.map(yw => yw.zIndex)))?.title || "Finder"}
                        onAbout={() => openWindow("about")}
                    />
                </div>

                <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-auto pb-safe">
                    <Dock
                        items={dockItems}
                        bouncingId={bouncingDocId}
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

            {/* Lock Screen */}
            <AnimatePresence>
                {isLocked && (
                    <LockScreen
                        onUnlock={() => setIsLocked(false)}
                        isLocked={isLocked}
                    // wallpaper={wallpaper} // Removed as it does not exist in LockScreenProps
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
