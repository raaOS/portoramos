"use client";

import React, { useState, useEffect, useMemo } from "react";
import { User, Briefcase, Terminal, Github, Linkedin, FileText, AlertTriangle, Home, ArrowLeft, Phone, Grid, Smile, Rocket, Mail, Trash2, Instagram, MessageCircle, Image as ImageIcon } from "lucide-react";
import OSWindow from "./Window";
import DesktopIcon from "./DesktopIcon";
import Dock from "./Dock";
import AboutContent from "./AboutContent"; // Import the new component
import MenuBar from "./MenuBar";

import IndexClientWithAutoUpdate from "@/components/home/IndexClientWithAutoUpdate";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { useRouter } from "next/navigation";
import type { AboutData } from "@/types/about";
import type { ExperienceData } from "@/types/experience";
import type { HardSkillsData } from "@/types/hardSkill";
import type { Project, GalleryItem } from "@/types/projects";
import ProjectDetailTwoColumn from "@/app/works/[slug]/ProjectDetailTwoColumn";
import ProjectsGridWindow from "./ProjectsGridWindow";
import ContactWindow from "./ContactWindow";
import TerminalWindow from "./TerminalWindow";
import ChatWindow from "./ChatWindow";
import GalleryWindow from "./GalleryWindow";
import LockScreen from "./LockScreen";
import Spotlight from "./Spotlight";
import StickyNoteItem, { NoteData } from "./StickyNoteItem";
import MacFolder from "./MacFolder";
import { useSystemSound } from "@/hooks/useSystemSound";
import { useWindowManager, WindowState } from "@/hooks/useWindowManager";

const isVideo = (url?: string) => url && /\.(mp4|webm|mov)$/i.test(url);

// Wrapper to help bridge the types between OS random project and Detail Component
const ProjectDetailWrapper = ({ project, projects }: { project: Project, projects: Project[] }) => {
    // Construct GalleryItem for cover
    const coverSrc = project.cover || '/placeholder.jpg';

    const cover: GalleryItem = {
        kind: isVideo(coverSrc) ? 'video' : 'image',
        src: coverSrc,
        alt: project.title
    };

    // Construct GalleryItems for gallery
    let gallery: GalleryItem[] = [];
    if (project.galleryItems && project.galleryItems.length > 0) {
        gallery = project.galleryItems;
    } else if (project.gallery && project.gallery.length > 0) {
        gallery = project.gallery.map(src => ({
            kind: 'image',
            src: src,
            alt: project.title
        }));
    }

    // Filter other projects
    const otherProjects = projects.filter(p => p.id !== project.id);

    // Calc ratio if available, default to 16:9 (1.77)
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

const INITIAL_NOTES: NoteData[] = [
    {
        id: '1',
        text: 'Welcome to Sticky Notes! 📝\n\nClick the Dock icon to add a new note.',
        date: new Date().toISOString(),
        color: '#fef08a',
        isStarred: false,
        isDeleted: false,
        x: 100,
        y: 100
    }
];

const AppIcon = ({ color, icon: Icon, imageUrl }: { color?: string, icon?: any, imageUrl?: string }) => {
    if (imageUrl) {
        return (
            <div className="w-full h-full flex items-center justify-center overflow-hidden rounded-xl">
                <img
                    src={imageUrl}
                    alt="icon"
                    className="w-full h-full object-cover scale-[1.01]"
                    style={{
                        imageRendering: 'auto',
                        WebkitBackfaceVisibility: 'hidden',
                        backfaceVisibility: 'hidden'
                    }}
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

interface DesktopEnvironmentProps {
    children?: React.ReactNode;
    aboutData?: AboutData | null;
    experienceData?: ExperienceData | null;
    hardSkillsData?: HardSkillsData | null;
    projects: Project[];
}

// --- Sub-component to fix the "Rules of Hooks" violation ---
const DraggableStickyNote = ({
    note,
    updateNote,
    bringToFrontNote,
    deleteNote,
    permanentDeleteNote,
    restoreNote
}: {
    note: NoteData;
    updateNote: (id: string, updates: Partial<NoteData>) => void;
    bringToFrontNote: (id: string) => void;
    deleteNote: (id: string) => void;
    permanentDeleteNote: (id: string) => void;
    restoreNote: (id: string) => void;
}) => {
    const dragControls = useDragControls();

    return (
        <motion.div
            key={note.id}
            drag={!note.isPinned}
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            animate={{
                x: note.x || 100,
                y: note.y || 100,
                scale: 1,
                opacity: note.opacity || 1
            }}
            transition={{ type: "none" }}
            onDragStart={() => bringToFrontNote(note.id)}
            onDragEnd={(e, info) => {
                const newX = (note.x || 100) + info.offset.x;
                const newY = (note.y || 100) + info.offset.y;
                updateNote(note.id, { x: newX, y: newY });
            }}
            onPointerDown={() => bringToFrontNote(note.id)}
            className="absolute pointer-events-auto"
            style={{
                left: 0,
                top: 0,
                zIndex: note.isPinned ? 5000 + (note.zIndex || 0) : (note.zIndex || 1),
            }}
        >
            <StickyNoteItem
                note={note}
                onUpdate={updateNote}
                onDelete={deleteNote}
                onPermanentDelete={permanentDeleteNote}
                onRestore={restoreNote}
                dragControls={dragControls}
            />
        </motion.div>
    );
};

export default function DesktopEnvironment({ children, aboutData, experienceData, hardSkillsData, projects }: DesktopEnvironmentProps) {

    const router = useRouter();
    // -- Curation Logic --
    // Filter projects based on Admin Preferences (if available), otherwise default to commercial
    const commercialProjects = useMemo(() => {
        if (aboutData?.desktopPreferences?.visibleProjectIds) {
            // Admin mode: show specifically selected projects
            return projects.filter(p => aboutData.desktopPreferences?.visibleProjectIds.includes(p.id));
        }
        // Default mode: show all non-visual art
        return projects.filter(p => p.type !== 'visual_art');
    }, [projects, aboutData]);

    const [mounted, setMounted] = useState(false);
    const [windowSize, setWindowSize] = useState({ width: 1200, height: 800 });
    const [isLocked, setIsLocked] = useState(true);
    const [showSpotlight, setShowSpotlight] = useState(false);
    const { playChime } = useSystemSound();

    // Stable Seed for layout shuffling
    const [layoutSeed] = useState(() => Math.floor(Math.random() * 1000000));
    // Manual trigger for icon repositioning (e.g. on drag end)
    const [manualRefreshSeed, setManualRefreshSeed] = useState(0);
    const triggerReposition = () => setManualRefreshSeed(prev => prev + 1);

    // -- Sticky Notes State --
    const [notes, setNotes] = useState<NoteData[]>([]);

    const getCenterPosition = (w: number, h: number) => {
        if (typeof window === 'undefined') return { x: 0, y: 0 };
        const safeWidth = windowSize.width || window.innerWidth || 1200;
        const safeHeight = windowSize.height || window.innerHeight || 800;

        const x = Math.max(0, (safeWidth - w) / 2);
        const y = Math.max(30, (safeHeight - h) / 2);

        return { x, y };
    };

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
            noPadding: true, // Full width for content
            initialPosition: { x: 150, y: 100 },
            width: 1000,
            height: 700,
            content: (
                <div className="w-full h-full overflow-y-auto bg-white custom-scrollbar">
                    {/* We pass the projects data directly to the component */}
                    <IndexClientWithAutoUpdate initialProjects={commercialProjects} />
                </div>
            )
        },
        {
            id: "error",
            title: "System_Error.log",
            isOpen: false,
            zIndex: 11,
            initialPosition: { x: 200, y: 200 },
            content: (
                <div className="flex flex-col items-center text-center p-4">
                    <AlertTriangle size={40} className="text-yellow-500 mb-3" />
                    <h3 className="text-md font-bold text-black mb-1">Critical Creativity Overflow</h3>
                    <p className="text-xs text-gray-500 mb-4">
                        The system has detected an excessive amount of ideas.
                    </p>
                    <button className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 text-xs font-medium border border-gray-300 transition-colors">
                        Close
                    </button>
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
        togglePin,
        bouncingDocId,
        resetWindows
    } = useWindowManager({ initialWindows, aboutData, projects });

    const handleUpdateWindowPosition = (id: string, x: number, y: number) => {
        internalUpdateWindowPosition(id, x, y);
        triggerReposition();
    };

    const isWindowOpen = (id: string) => windows.find(w => w.id === id)?.isOpen ?? false;

    // Load notes from server
    useEffect(() => {
        const loadNotes = async () => {
            try {
                const response = await fetch('/api/sticky-notes');
                const data = await response.json();
                if (Array.isArray(data)) {
                    setNotes(data);
                } else {
                    setNotes(INITIAL_NOTES);
                }
            } catch (e) {
                console.error("Failed to load notes from server", e);
                setNotes(INITIAL_NOTES);
            } finally {
                setMounted(true);
            }
        };
        loadNotes();
    }, []);

    // Save notes to server (Auto-Sync)
    useEffect(() => {
        if (mounted && notes.length > 0) {
            const saveNotes = async () => {
                try {
                    await fetch('/api/sticky-notes', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(notes)
                    });
                } catch (e) {
                    console.error("Failed to sync notes to server", e);
                }
            };

            // Debounce save or just save for now
            const timer = setTimeout(saveNotes, 1000);
            return () => clearTimeout(timer);
        }
    }, [notes, mounted]);



    // REVISIT Hook Destructuring below:
    /* 
    const {
       ...
       topZIndex, 
       ...
    } = useWindowManager(...);
    */

    // But `setTopZIndex` is NOT exposed by my hook.
    // Sticky Notes need to increment ZIndex.
    // If I cannot increment the shared ZIndex, Notes will fall behind new windows.
    // I should probably expose `setTopZIndex` or a generic `bringToFront` method in hook?
    // Or just let Notes manage their own relative ZIndex and maybe base it on `topZIndex`?
    // If I create a new Note, I want it on top.

    // QUICK FIX: Let's assume Notes zIndex is independent or I just use a high base. 
    // BUT the original code interweaved them.
    // "zIndex: topZIndex + 1"

    // I will modify `useWindowManager` to export `topZIndex` and a method `nextZIndex()`?
    // Or just `setTopZIndex`?
    // For now, I will use a local state for Notes zIndex initialized high, but this breaks the interweaving.
    // BETTER: I'll stick to the plan but realize I need to expose `requestZIndex` or similar from the hook if I want to perfectly match "God Component" behavior.
    // HOWEVER, for this refactor I will assume Notes live in their own layer or similar?
    // Original: "Layer 2.5: Sticky Notes Widgets" was interleaved? 
    // No, looked like Layer 2 is Windows, Layer 2.5 is Notes?
    // Wait, Lines 1198 in original:
    // {/* Layer 2.5: Sticky Notes Widgets */}
    // <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">

    // But Windows were Layer 2.
    // The Z-index on the DIVs themselves:
    // Notes: "zIndex: note.isPinned ? 5000 + ... : note.zIndex"
    // Windows: "zIndex: w.zIndex"

    // If `topZIndex` is shared, they can interleave.
    // Since I can't easily change the hook signature right now without another tool call (and I want to be efficient),
    // and `notes` logic is remaining in `DesktopEnvironment`, I will implement a local zIndex tracker for Notes that starts where `windows` start, 
    // OR simply accept that Notes might not perfectly interleave with *newly opened* windows unless I sync them.
    // Actually, I can just use a large number for Notes or separate them.
    // The original code has "Layer 2.5" comment but structure was:
    // Layer 1: Desktop Icons
    // Layer 2.5: Sticky Notes (inside Layer 1?? No, parallel div).
    // Layer 2: Windows.
    // Wait, in the original code, `Sticky Notes` (line 1199) are inside `Layer 1` (line 1162)? 
    // "Layer 1: Desktop Icons" -> div -> Icons ... Notes.
    // "Layer 2: Windows" -> div.

    // Use `view_file` showed:
    // 1162: <div className="absolute inset-0 z-10 pointer-events-auto">
    // ... icons ...
    // 1199: <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden"> ... notes ... </div>
    // </div>
    // 1242: <div className="absolute inset-0 z-20 pointer-events-none"> ... windows ... </div>

    // So Windows (z-20 container) ALWAYS render above Desktop Icons (z-10 container).
    // Sticky Notes are inside the z-10 container.
    // So Windows ALWAYS cover Sticky Notes, regardless of individual z-index?
    // Unless the children have `z-index` that escapes the stacking context?
    // `absolute` children create their own stacking context if parent has z-index?
    // The parent (Layer 1) has `z-10`. The parent (Layer 2) has `z-20`.
    // So yes, Windows currently ALWAYS cover Notes in the original code. 
    // So sharing `topZIndex` between them was actually pointless for interleaving between Windows and Notes.
    // It only mattered for Note vs Note, or Window vs Window.
    // So I can safely manage Note Z-Index independently! Phew.

    const [noteZIndex, setNoteZIndex] = useState(1);

    const addNote = () => {
        const newNote: NoteData = {
            id: crypto.randomUUID(),
            text: '',
            date: new Date().toISOString(),
            color: '#fef08a', // Default yellow
            isStarred: false,
            isDeleted: false,
            x: Math.random() * (window.innerWidth - 300),
            y: Math.random() * (window.innerHeight - 300),
            width: 280,
            height: 280,
            isPinned: false,
            isCollapsed: false,
            opacity: 1,
            zIndex: noteZIndex + 1,
            fontFamily: 'inherit'
        };
        setNotes(prev => [newNote, ...prev]);
        setNoteZIndex(prev => prev + 1);
    };

    const updateNote = (id: string, updates: Partial<NoteData>) => {
        setNotes(prev => prev.map(note => note.id === id ? { ...note, ...updates } : note));
        // Only trigger reposition if movement occurred
        if (updates.x !== undefined || updates.y !== undefined) {
            triggerReposition();
        }
    };

    const deleteNote = (id: string) => {
        updateNote(id, { isDeleted: true });
    };

    const permanentDeleteNote = (id: string) => {
        setNotes(notes.filter(n => n.id !== id));
    };

    const restoreNote = (id: string) => {
        updateNote(id, { isDeleted: false });
    };

    const bringToFrontNote = (id: string) => {
        setNoteZIndex(prev => {
            const next = prev + 1;
            updateNote(id, { zIndex: next });
            return next;
        });
    };

    const [wallpaper, setWallpaper] = useState(() => {
        if (aboutData?.wallpaperConfig?.activeWallpaperId && aboutData?.wallpaperConfig?.collection) {
            const active = aboutData.wallpaperConfig.collection.find(w => w.id === aboutData?.wallpaperConfig?.activeWallpaperId);
            if (active) return active.url;
        }
        return "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop";
    });
    const [accentColor, setAccentColor] = useState("bg-blue-500");

    useEffect(() => {
        setMounted(true);
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });

        // Lock global scroll (Agresif: html + body + Lenis)
        const html = document.documentElement;
        const body = document.body;

        const originalHtmlOverflow = html.style.overflow;
        const originalBodyOverflow = body.style.overflow;
        const originalHtmlHeight = html.style.height;
        const originalBodyHeight = body.style.height;

        // Force lock
        window.scrollTo(0, 0); // Fix for "black area" / shifted layout
        html.style.overflow = "hidden";
        body.style.overflow = "hidden";
        html.style.height = "100%";
        body.style.height = "100%";
        html.classList.add('lenis-stopped');

        // Add a style tag to FORCE reset everything - The "Nuclear Option"
        const style = document.createElement('style');
        style.id = 'os-mode-reset';
        style.textContent = `
            html, body {
                overflow: hidden !important;
                height: 100vh !important;
                width: 100vw !important;
                margin: 0 !important;
                padding: 0 !important;
                position: fixed !important; /* Locks the viewport */
                top: 0 !important;
                left: 0 !important;
                overscroll-behavior: none !important;
            }
        `;
        document.head.appendChild(style);

        const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });

        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setShowSpotlight(prev => !prev);
            }
            if (e.key === 'Escape') {
                setShowSpotlight(false);
            }
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('keydown', handleKeyDown);
            // Restore
            html.style.overflow = originalHtmlOverflow;
            body.style.overflow = originalBodyOverflow;
            html.style.height = originalHtmlHeight;
            body.style.height = originalBodyHeight;
            html.classList.remove('lenis-stopped');

            const styleTag = document.getElementById('os-mode-reset');
            if (styleTag) styleTag.remove();
        };
    }, []);

    const getMinimizeTarget = (id: string) => {
        if (typeof document === 'undefined') return { x: 0, y: 0 };
        const elem = document.getElementById(`dock-item-${id}`);
        if (elem) {
            const rect = elem.getBoundingClientRect();
            // Return center of the icon
            return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        }

        // Fallback
        return { x: window.innerWidth / 2, y: window.innerHeight - 50 };
    };

    // -- Project Window Logic --
    const openProjectWindow = (project: Project) => {
        const windowId = `project-${project.slug}`;
        openWindow(windowId, {
            title: `Project: ${project.title}`,
            noPadding: true, // Content-based padding
            width: 1000,
            height: 700,
            content: <ProjectDetailWrapper project={project} projects={projects} />
        });
    };

    // -- Launchpad Logic --
    const openLaunchpad = () => {
        openWindow('launchpad', {
            title: 'Launchpad',
            noPadding: true,
            width: 1100,
            height: 700,
            content: <ProjectsGridWindow projects={commercialProjects} onOpenProject={openProjectWindow} />
        });
    };

    // -- Mail Logic --
    const openContactWindow = () => {
        openWindow('mail', {
            title: 'New Message',
            noPadding: true,
            initialPosition: getCenterPosition(500, 400),
            width: 500,
            height: 400,
            content: <ContactWindow />
        });
    };

    // -- Chat Logic --
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

    // -- Gallery Logic --
    const [previewItem, setPreviewItem] = useState<{ src: string, kind: 'image' | 'video', title: string } | null>(null);

    const openPreview = (item: { src: string, kind: 'image' | 'video', title: string }) => {
        setPreviewItem(item);
        openWindow('preview-viewer', {
            title: item.title,
            zIndex: 9999, // Force very high
            noPadding: true,
            width: 800,
            height: 600,
            // Content handled in render via previewItem state to ensure freshness
            // We pass generic here, but overrides in render loop
            content: null
        });
    };

    const openGallery = () => {
        openWindow('gallery', {
            title: 'Photos',
            noPadding: true,
            width: 900,
            height: 600,
            content: <GalleryWindow projects={projects} onPreview={openPreview} />
        });
    };

    // -- Trash Logic --
    const openTrash = () => {
        openWindow('trash-bin', {
            title: 'Recycle Bin',
            initialPosition: getCenterPosition(400, 250),
            width: 400,
            height: 250,
            content: (
                <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                    <Trash2 size={48} className="text-gray-400 mb-2" />
                    <h3 className="font-bold text-lg mb-1">Access Denied</h3>
                    <p className="text-gray-500 text-sm">You cannot delete perfection.</p>
                </div>
            )
        });
    };

    // -- Sticky Notes Logic --
    const openStickyNotes = () => {
        addNote();
    };

    const handleGoHome = () => {
        router.push('/');
    };

    const resetDesktopAndClose = () => {
        resetWindows();
        // Also could minimize all? 
    }

    const defaultDockItems = [
        { id: "home", label: "Exit OS", icon: <AppIcon icon={ArrowLeft} color="from-zinc-700 to-zinc-900" />, onClick: handleGoHome },
        { id: "finder", label: "Finder", icon: <AppIcon icon={Smile} color="from-sky-400 to-blue-500" />, onClick: resetDesktopAndClose },
        { id: "about", label: "Profile", icon: <AppIcon icon={User} color="from-gray-300 to-gray-400" />, onClick: () => openWindow("about"), isOpen: isWindowOpen("about") },
        { id: "projects", label: "Launchpad", icon: <AppIcon icon={Rocket} color="from-red-400 to-pink-500" />, onClick: openLaunchpad, isOpen: isWindowOpen("launchpad") },
        { id: "gallery", label: "Photos", icon: <AppIcon icon={ImageIcon} color="from-indigo-400 to-blue-500" />, onClick: openGallery, isOpen: isWindowOpen("gallery") },
        { id: "whatsapp", label: "WhatsApp", icon: <AppIcon icon={MessageCircle} color="from-green-400 to-green-600" />, onClick: openChatWindow, isOpen: isWindowOpen("chat") },
        { id: "notes", label: "Notes", icon: <AppIcon icon={FileText} color="from-yellow-300 to-orange-400" />, onClick: openStickyNotes, isOpen: isWindowOpen("sticky-notes") },
        { id: "trash", label: "Trash", icon: <AppIcon icon={Trash2} color="from-gray-400 to-gray-500" />, onClick: openTrash, isOpen: isWindowOpen("trash-bin") },
    ];

    const dockItems = defaultDockItems.filter(item => {
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

    // -- Project Icons Logic --
    // Generate scattered positions for project icons (CURATED ONLY)
    // Avoids tumpang tindih and overlap with pinned windows/widgets
    const [projectIcons, setProjectIcons] = useState<any[]>([]);

    useEffect(() => {
        if (!mounted || !commercialProjects.length || !windowSize.width) return;

        // 1. Identify "Forbidden Zones" (Obstacles)
        const obstacles: { x: number, y: number, w: number, h: number }[] = [];

        // Add ALL open windows to obstacles (not just pinned) to avoid overlap on load
        windows.filter(w => w.isOpen && !w.isMinimized).forEach(w => {
            obstacles.push({
                x: w.initialPosition?.x || 0,
                y: w.initialPosition?.y || 0,
                w: w.width || 800,
                h: w.height || 600
            });
        });

        // Add sticky notes to obstacles
        notes.filter(n => !n.isDeleted).forEach(n => {
            obstacles.push({
                x: n.x || 100,
                y: n.y || 100,
                w: n.width || 280,
                h: n.height || 280
            });
        });

        // 2. Define Desktop Grid
        const gridX = 110;
        const gridY = 140;
        const margin = 40;
        const topOffset = 60; // MenuBar
        const bottomOffset = 120; // Dock

        const cols = Math.floor((windowSize.width - margin * 2) / gridX);
        const rows = Math.floor((windowSize.height - topOffset - bottomOffset) / gridY);

        const availableSlots: { x: number, y: number }[] = [];

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = margin + c * gridX;
                const y = topOffset + margin / 2 + r * gridY;

                // Collision check (Box vs Box)
                const isBlocked = obstacles.some(obs => {
                    const bufferX = 20; // Spacing around windows horizontally
                    const bufferY = 20; // Spacing around windows vertically
                    return (
                        x + 80 > obs.x - bufferX && // Icon width is approx 80
                        x < obs.x + obs.w + bufferX &&
                        y + 100 > obs.y - bufferY && // Icon height is approx 100
                        y < obs.y + obs.h + bufferY
                    );
                });

                if (!isBlocked) {
                    availableSlots.push({ x, y });
                }
            }
        }

        // 3. True Random Slot Assignment (Shuffle logic)
        // Fisher-Yates shuffle for true randomness
        for (let i = availableSlots.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availableSlots[i], availableSlots[j]] = [availableSlots[j], availableSlots[i]];
        }

        let visibleProjects = commercialProjects.filter(p => p.status !== 'draft');

        if (aboutData?.desktopPreferences?.maxIcons) {
            visibleProjects = visibleProjects.slice(0, aboutData.desktopPreferences.maxIcons);
        }

        // 4. Combine Projects with specialized shortcuts
        const desktopItems = [
            {
                id: 'shortcut-home',
                type: 'folder',
                label: 'My Projects',
                action: handleGoHome
            },
            ...visibleProjects.map(p => ({ ...p, type: 'project' }))
        ];

        const generatedIcons = desktopItems.map((item: any, index: number) => {
            const slot = availableSlots.length > 0
                ? availableSlots.pop()!
                : {
                    x: windowSize.width - margin - gridX + (index * 10),
                    y: windowSize.height - bottomOffset - gridY + (index * 10)
                };

            const jitterX = (Math.random() * 20) - 10;
            const jitterY = (Math.random() * 20) - 10;

            const finalX = Math.max(20, Math.min(windowSize.width - 100, slot.x + jitterX));
            const finalY = Math.max(topOffset, Math.min(windowSize.height - bottomOffset, slot.y + jitterY));

            if (item.type === 'folder') {
                return {
                    id: item.id,
                    type: 'folder',
                    label: item.label,
                    x: finalX,
                    y: finalY,
                    action: item.action
                };
            }

            const project = item as Project;

            // Video Detection Logic
            let videoUrl: string | undefined;
            if (isVideo(project.cover)) {
                videoUrl = project.cover;
            } else if (project.galleryItems?.some(i => i.kind === 'video')) {
                videoUrl = project.galleryItems.find(i => i.kind === 'video')?.src;
            }

            // Resolve cover image
            let coverImage = !isVideo(project.cover) ? project.cover : null;
            if (!coverImage) {
                const firstImageItem = project.galleryItems?.find(i => i.kind === 'image');
                if (firstImageItem) coverImage = firstImageItem.src;
                if (!coverImage && project.galleryItems) {
                    const videoItem = project.galleryItems.find(i => i.kind === 'video');
                    if (videoItem?.poster) coverImage = videoItem.poster;
                }
            }

            if (!coverImage) coverImage = '/placeholder.jpg';

            const aspectRatio = project.coverWidth && project.coverHeight
                ? project.coverWidth / project.coverHeight
                : 0.8 + Math.random() * 0.8;

            return {
                id: `proj-${project.slug}`,
                type: 'project',
                label: project.title,
                imageUrl: coverImage,
                videoUrl,
                icon: <FileText strokeWidth={1} />,
                aspectRatio,
                x: finalX,
                y: finalY,
                action: () => openProjectWindow(project)
            };
        });

        setProjectIcons(generatedIcons);
    }, [mounted, commercialProjects, windowSize.width, windowSize.height, layoutSeed, manualRefreshSeed, aboutData, windows, notes]);


    return (
        <div className="fixed inset-0 z-[9999] w-full h-screen overflow-hidden select-none">
            <LockScreen
                isLocked={isLocked}
                onUnlock={() => {
                    setIsLocked(false);
                    playChime();
                }}
                preferences={aboutData?.lockScreenPreferences}
            />

            <AnimatePresence>
                {showSpotlight && (
                    <Spotlight
                        isOpen={showSpotlight}
                        onClose={() => setShowSpotlight(false)}
                        projects={projects}
                        onOpenProject={openProjectWindow}
                        onOpenApp={(id: string) => {
                            if (id === 'about') openWindow('about');
                            if (id === 'projects') openLaunchpad();
                            if (id === 'gallery') openGallery();
                            if (id === 'mail') openContactWindow();
                            setShowSpotlight(false);
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Top Menu Bar */}
            <div className="relative z-[10001] pointer-events-auto">
                <MenuBar onSearch={() => setShowSpotlight(true)} />
            </div>

            {/* Layer 0: Background (Wallpaper + Blur) */}
            <div className="absolute inset-0 z-0 pointer-events-none bg-white">
                <img
                    src={wallpaper}
                    alt="Wallpaper"
                    className="w-full h-full object-cover scale-110 transition-all duration-700"
                />
                {children}
            </div>

            {/* Layer 2: Windows (Z-20) */}
            <div className="absolute inset-0 z-20 pointer-events-none">
                <AnimatePresence>
                    {mounted && windows.filter(w => w.isOpen).filter((w, index, self) => index === self.findIndex(t => t.id === w.id)).map(w => (
                        <React.Fragment key={w.id}>
                            <OSWindow
                                id={w.id}
                                title={w.title}
                                isOpen={w.isOpen}
                                isMinimized={w.isMinimized}
                                isMaximized={w.isMaximized}
                                zIndex={w.zIndex}
                                onClose={() => closeWindow(w.id)}
                                onMinimize={() => minimizeWindow(w.id)}
                                onMaximize={() => maximizeWindow(w.id)}
                                onFocus={() => focusWindow(w.id)}
                                initialPosition={w.initialPosition}
                                minimizeTarget={getMinimizeTarget(w.id)}
                                noPadding={w.noPadding}
                                onUpdatePosition={(x, y) => handleUpdateWindowPosition(w.id, x, y)}
                                width={w.width}
                                height={w.height}
                                onResize={(wId, h) => handleWindowResize(w.id, wId, h)}
                                isPinned={w.isPinned}
                                onTogglePin={() => togglePin(w.id)}
                            >
                                {/* Dynamic Content Injection for Preview to ensure state freshness */}
                                {w.id === 'preview-viewer' && previewItem ? (
                                    <div className="w-full h-full bg-white flex items-center justify-center p-0 overflow-hidden relative">
                                        {previewItem.kind === 'video' ? (
                                            <video src={previewItem.src} controls autoPlay className="max-w-full max-h-full w-auto h-auto object-contain mx-auto shadow-2xl" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <img src={previewItem.src} alt={previewItem.title} className="max-w-full max-h-full w-auto h-auto object-contain shadow-2xl" />
                                            </div>
                                        )}
                                    </div>
                                ) : w.content}
                            </OSWindow>
                        </React.Fragment>
                    ))}
                </AnimatePresence>
            </div>

            {/* Layer 3: Pinned/Top Objects (Desktop Icons & Sticky Notes) */}
            <div className="absolute inset-0 z-30 pointer-events-none">
                {/* Desktop Icons - High Z-Index Layer */}
                <div className="absolute inset-0 z-20 pointer-events-none">
                    {projectIcons.map(icon => (
                        <DesktopIcon
                            key={icon.id}
                            id={icon.id}
                            label={icon.label}
                            icon={icon.icon}
                            imageUrl={icon.imageUrl}
                            x={icon.x}
                            y={icon.y}
                            onClick={icon.action}
                            size={icon.imageUrl || icon.videoUrl ? "medium" : undefined}
                            aspectRatio={icon.aspectRatio}
                            videoUrl={icon.videoUrl}
                        >
                            {icon.type === 'folder' && (
                                <div
                                    className="scale-[0.55] flex items-center justify-center"
                                    onPointerDown={(e) => e.stopPropagation()}
                                >
                                    <MacFolder
                                        label=""
                                        color="#FFD700"
                                        onClick={icon.action}
                                        isStatic={true}
                                        items={[
                                            <Home key="home" className="text-blue-500 p-1" />,
                                            <Grid key="grid" className="text-orange-500 p-1" />,
                                            <FileText key="file" className="text-green-500 p-1" />
                                        ]}
                                    />
                                </div>
                            )}
                        </DesktopIcon>
                    ))}
                </div>

                {/* Sticky Notes - High Z-Index Layer */}
                <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
                    {mounted && notes.filter(n => !n.isDeleted).map(note => (
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
            </div>

            {/* Dock */}
            <Dock
                items={dockItems}
                bouncingId={bouncingDocId}
                config={aboutData?.dockConfig}
            />
        </div>
    );
}

