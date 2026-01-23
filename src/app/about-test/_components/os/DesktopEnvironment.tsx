"use client";

import React, { useState, useEffect } from "react";
import { User, Briefcase, Terminal, Github, Linkedin, FileText, AlertTriangle, Home, Phone, Grid, Smile, Rocket, Mail, Trash2, Instagram, MessageCircle, Image as ImageIcon } from "lucide-react";
import OSWindow from "./Window";
import DesktopIcon from "./DesktopIcon";
import Dock from "./Dock";
import AboutContent from "./AboutContent"; // Import the new component
import MenuBar from "./MenuBar";

import IndexClientWithAutoUpdate from "@/components/home/IndexClientWithAutoUpdate";
import { AnimatePresence, motion } from "framer-motion";
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
import StickyNote from "./StickyNote";
import { useSystemSound } from "@/hooks/useSystemSound";


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

interface WindowState {
    id: string;
    title: string;
    isOpen: boolean;
    isMinimized?: boolean;
    isMaximized?: boolean;
    zIndex: number;
    noPadding?: boolean; // Added support
    content: React.ReactNode;
    initialPosition?: { x: number; y: number };
    width?: number;
    height?: number;
}

const AppIcon = ({ color, icon: Icon }: { color: string, icon: any }) => (
    <div className={`w-full h-full rounded-[14px] bg-gradient-to-b ${color} flex items-center justify-center shadow-lg relative`}>
        <div className="absolute inset-0 rounded-[14px] ring-1 ring-white/20 inset-ring pointer-events-none" />
        <Icon className="text-white drop-shadow-sm" size="55%" strokeWidth={2.5} />
    </div>
);

interface DesktopEnvironmentProps {
    children?: React.ReactNode;
    aboutData?: AboutData | null;
    experienceData?: ExperienceData | null;
    hardSkillsData?: HardSkillsData | null;
    projects: Project[];
}

export default function DesktopEnvironment({ children, aboutData, experienceData, hardSkillsData, projects }: DesktopEnvironmentProps) {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [windowSize, setWindowSize] = useState({ width: 1200, height: 800 });
    const [isLocked, setIsLocked] = useState(true);
    const [showSpotlight, setShowSpotlight] = useState(false);
    const { playOpen, playClose, playChime } = useSystemSound();

    // -- Personalization State --
    const [wallpaper, setWallpaper] = useState("https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop");
    const [accentColor, setAccentColor] = useState("bg-blue-500");

    const getCenterPosition = (w: number, h: number) => {
        if (typeof window === 'undefined') return { x: 0, y: 0 };
        const safeWidth = windowSize.width || window.innerWidth || 1200;
        const safeHeight = windowSize.height || window.innerHeight || 800;

        const x = Math.max(0, (safeWidth - w) / 2);
        const y = Math.max(30, (safeHeight - h) / 2);

        return { x, y };
    };

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
        style.innerHTML = `
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

    const [topZIndex, setTopZIndex] = useState(20);
    const [bouncingDocId, setBouncingDocId] = useState<string | null>(null);

    // -- Window Definitions --
    // We define them here to have access to props/router, but we only add them to state when opened.
    const windowDefinitions: WindowState[] = [
        {
            id: "about",
            title: "Finder: About Me",
            isOpen: false,
            zIndex: 10,
            noPadding: true,
            initialPosition: { x: typeof window !== 'undefined' ? (window.innerWidth - 900) / 2 : 100, y: typeof window !== 'undefined' ? (window.innerHeight - 600) / 2 : 80 },
            width: 900,
            height: 600,
            content: <AboutContent aboutData={aboutData} experienceData={experienceData} hardSkillsData={hardSkillsData} />
        },
        {
            id: "projects",
            title: "Finder: Projects",
            isOpen: false,
            zIndex: 9,
            noPadding: true, // Full width for content
            initialPosition: { x: typeof window !== 'undefined' ? (window.innerWidth - 1000) / 2 : 150, y: typeof window !== 'undefined' ? (window.innerHeight - 700) / 2 : 100 },
            width: 1000,
            height: 700,
            content: (
                <div className="w-full h-full overflow-y-auto bg-white custom-scrollbar">
                    {/* We pass the projects data directly to the component */}
                    <IndexClientWithAutoUpdate initialProjects={projects} />
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
    ];

    const [windows, setWindows] = useState<WindowState[]>(windowDefinitions);

    // Update positions once mounted
    useEffect(() => {
        if (mounted) {
            setWindows(prev => prev.map(w => {
                const width = w.width || 800;
                const height = w.height || 600;
                return { ...w, initialPosition: getCenterPosition(width, height) };
            }));
        }
    }, [mounted]);


    // -- Actions --

    const openWindow = (id: string, customWidth?: number, customHeight?: number) => {
        setWindows(prev => prev.map(w => {
            if (w.id === id) {
                const width = customWidth || w.width || 800;
                const height = customHeight || w.height || 600;
                const shouldCenter = !w.isOpen;
                return {
                    ...w,
                    isOpen: true,
                    isMinimized: false,
                    zIndex: topZIndex + 1,
                    initialPosition: shouldCenter ? getCenterPosition(width, height) : w.initialPosition
                };
            }
            return w;
        }));
        setTopZIndex(prev => prev + 1);
        playOpen();
    };

    const closeWindow = (id: string) => {
        setWindows(prev => prev.map(w => {
            if (w.id === id) {
                return { ...w, isOpen: false, isMinimized: false, isMaximized: false };
            }
            return w;
        }));

        // Recursive Close: If closing 'projects', also close 'project-viewer'
        if (id === 'projects') {
            setWindows(prev => prev.map(w => {
                if (w.id === 'project-viewer') {
                    return { ...w, isOpen: false };
                }
                return w;
            }));
        }
        playClose();
    };

    const minimizeWindow = (id: string) => {
        setWindows(prev => prev.map(w => {
            if (w.id === id) {
                return { ...w, isMinimized: true };
            }
            return w;
        }));

        // Trigger Dock Bounce
        setBouncingDocId(id);
        setTimeout(() => setBouncingDocId(null), 2000); // Reset after animation
    };

    const maximizeWindow = (id: string) => {
        setWindows(prev => prev.map(w => {
            if (w.id === id) {
                return { ...w, isMaximized: !w.isMaximized, zIndex: topZIndex + 1 };
            }
            return w;
        }));
        setTopZIndex(prev => prev + 1);
    };

    const focusWindow = (id: string) => {
        setWindows(prev => prev.map(w => {
            if (w.id === id) {
                return { ...w, zIndex: topZIndex + 1 };
            }
            return w;
        }));
        setTopZIndex(prev => prev + 1);
    };

    const updateWindowPosition = (id: string, x: number, y: number) => {
        setWindows(prev => prev.map(w => {
            if (w.id === id) {
                return { ...w, initialPosition: { x, y } };
            }
            return w;
        }));
    };

    const handleWindowResize = (id: string, width: number, height: number) => {
        setWindows(prev => prev.map(w => {
            if (w.id === id) {
                return { ...w, width, height };
            }
            return w;
        }));
    };

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

    const isWindowOpen = (id: string) => windows.find(w => w.id === id)?.isOpen ?? false;

    const resetDesktop = () => {
        setWindows(prev => prev.map(w => ({ ...w, isOpen: false, isMinimized: false, isMaximized: false })));
        setTopZIndex(20);
    };

    // -- Launchpad Logic --
    const openLaunchpad = () => {
        const windowId = 'launchpad';
        if (windows.find(w => w.id === windowId)) {
            // If found but closed, open it.
            setWindows(prev => prev.map(w => {
                if (w.id === windowId) {
                    return {
                        ...w,
                        isOpen: true,
                        isMinimized: false,
                        zIndex: topZIndex + 1,
                        initialPosition: !w.isOpen ? getCenterPosition(1100, 700) : w.initialPosition
                    };
                }
                return w;
            }));
            setTopZIndex(prev => prev + 1);
            if (!isWindowOpen(windowId)) playOpen();
            return;
        }

        const newWindow: WindowState = {
            id: windowId,
            title: 'Launchpad',
            isOpen: true,
            zIndex: topZIndex + 1,
            noPadding: true,
            initialPosition: getCenterPosition(1100, 700),
            width: 1100,
            height: 700,
            content: <ProjectsGridWindow projects={projects} onOpenProject={openProjectWindow} />
        };
        setWindows(prev => [...prev, newWindow]);
        setTopZIndex(prev => prev + 1);
        playOpen();
    };

    // -- Mail Logic --
    const openContactWindow = () => {
        const windowId = 'mail';
        if (windows.find(w => w.id === windowId)) {
            setWindows(prev => prev.map(w => {
                if (w.id === windowId) {
                    return {
                        ...w,
                        isOpen: true,
                        isMinimized: false,
                        zIndex: topZIndex + 1,
                        initialPosition: !w.isOpen ? getCenterPosition(500, 400) : w.initialPosition
                    };
                }
                return w;
            }));
            setTopZIndex(prev => prev + 1);
            if (!isWindowOpen(windowId)) playOpen();
            return;
        }

        const newWindow: WindowState = {
            id: windowId,
            title: 'New Message',
            isOpen: true,
            zIndex: topZIndex + 1,
            noPadding: true,
            initialPosition: getCenterPosition(500, 400),
            width: 500,
            height: 400,
            content: <ContactWindow />
        };
        setWindows(prev => [...prev, newWindow]);
        setTopZIndex(prev => prev + 1);
        playOpen();
    };

    // -- Chat Logic --
    const openChatWindow = () => {
        const windowId = 'chat';
        if (windows.find(w => w.id === windowId)) {
            setWindows(prev => prev.map(w => {
                if (w.id === windowId) {
                    return {
                        ...w,
                        isOpen: true,
                        isMinimized: false,
                        zIndex: topZIndex + 1,
                        initialPosition: !w.isOpen ? getCenterPosition(380, 600) : w.initialPosition
                    };
                }
                return w;
            }));
            setTopZIndex(prev => prev + 1);
            if (!isWindowOpen(windowId)) playOpen();
            return;
        }

        const newWindow: WindowState = {
            id: windowId,
            title: 'WhatsApp Live',
            isOpen: true,
            zIndex: topZIndex + 1,
            noPadding: true,
            initialPosition: getCenterPosition(380, 600),
            width: 380,
            height: 600,
            content: <ChatWindow />
        };
        setWindows(prev => [...prev, newWindow]);
        setTopZIndex(prev => prev + 1);
        playOpen();
    };

    // -- Gallery Logic --
    const [previewItem, setPreviewItem] = useState<{ src: string, kind: 'image' | 'video', title: string } | null>(null);

    const openPreview = (item: { src: string, kind: 'image' | 'video', title: string }) => {
        const windowId = 'preview-viewer';

        // Update item state first
        setPreviewItem(item);

        // Check if window exists
        if (windows.find(w => w.id === windowId)) {
            setWindows(prev => prev.map(w => {
                if (w.id === windowId) {
                    return {
                        ...w,
                        isOpen: true,
                        isMinimized: false,
                        zIndex: 9999,
                        title: item.title,
                        initialPosition: !w.isOpen ? getCenterPosition(800, 600) : w.initialPosition
                    };
                }
                return w;
            }));
            // setTopZIndex(prev => prev + 100);
            return;
        }

        const newWindow: WindowState = {
            id: windowId,
            title: item.title,
            isOpen: true,
            zIndex: 9999,
            noPadding: true,
            initialPosition: getCenterPosition(800, 600),
            width: 800,
            height: 600,
            content: (
                /* Content is dynamic based on previewItem, handled in render or we pass a component that reads state */
                <div className="w-full h-full bg-white flex items-center justify-center p-0 overflow-hidden relative">
                    {item.kind === 'video' ? (
                        <video src={item.src} controls autoPlay className="max-w-full max-h-full w-auto h-auto object-contain mx-auto" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            {/* Improved Image Rendering for contain-fit */}
                            <img src={item.src} alt={item.title} className="max-w-full max-h-full w-auto h-auto object-contain" />
                        </div>
                    )}
                </div>
            )
        };
        setWindows(prev => [...prev, newWindow]);
        setTopZIndex(prev => prev + 100);
        playOpen();
    };

    const openGallery = () => {
        const windowId = 'gallery';
        if (windows.find(w => w.id === windowId)) {
            setWindows(prev => prev.map(w => {
                if (w.id === windowId) {
                    return {
                        ...w,
                        isOpen: true,
                        isMinimized: false,
                        zIndex: topZIndex + 1,
                        initialPosition: !w.isOpen ? getCenterPosition(900, 600) : w.initialPosition
                    };
                }
                return w;
            }));
            setTopZIndex(prev => prev + 1);
            if (!isWindowOpen(windowId)) playOpen();
            return;
        }

        const newWindow: WindowState = {
            id: windowId,
            title: 'Photos',
            isOpen: true,
            zIndex: topZIndex + 1,
            noPadding: true,
            initialPosition: getCenterPosition(900, 600),
            width: 900,
            height: 600,
            content: <GalleryWindow projects={projects} onPreview={openPreview} />
        };
        setWindows(prev => [...prev, newWindow]);
        setTopZIndex(prev => prev + 1);
    };





    // -- Trash Logic --
    const openTrash = () => {
        const windowId = 'trash-bin';
        if (windows.find(w => w.id === windowId)) {
            setWindows(prev => prev.map(w => {
                if (w.id === windowId) {
                    return {
                        ...w,
                        isOpen: true,
                        isMinimized: false,
                        zIndex: topZIndex + 1,
                        initialPosition: !w.isOpen ? getCenterPosition(400, 250) : w.initialPosition
                    };
                }
                return w;
            }));
            setTopZIndex(prev => prev + 1);
            if (!isWindowOpen(windowId)) playOpen();
            return;
        }

        const newWindow: WindowState = {
            id: windowId,
            title: 'Recycle Bin',
            isOpen: true,
            zIndex: topZIndex + 1,
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
        };
        setWindows(prev => [...prev, newWindow]);
        setTopZIndex(prev => prev + 1);
        playOpen();
    };

    const dockItems = [
        { id: "finder", label: "Finder", icon: <AppIcon icon={Smile} color="from-sky-400 to-blue-500" />, onClick: resetDesktop },
        { id: "about", label: "Profile", icon: <AppIcon icon={User} color="from-gray-300 to-gray-400" />, onClick: () => openWindow("about"), isOpen: isWindowOpen("about") },
        { id: "projects", label: "Launchpad", icon: <AppIcon icon={Rocket} color="from-red-400 to-pink-500" />, onClick: openLaunchpad, isOpen: isWindowOpen("launchpad") },
        { id: "gallery", label: "Photos", icon: <AppIcon icon={ImageIcon} color="from-indigo-400 to-blue-500" />, onClick: openGallery, isOpen: isWindowOpen("gallery") },
        { id: "whatsapp", label: "WhatsApp", icon: <AppIcon icon={MessageCircle} color="from-green-400 to-green-600" />, onClick: openChatWindow, isOpen: isWindowOpen("chat") },
        { id: "trash", label: "Trash", icon: <AppIcon icon={Trash2} color="from-gray-400 to-gray-500" />, onClick: openTrash, isOpen: isWindowOpen("trash-bin") },
    ];

    // -- Sticky Notes Logic --
    const [notes, setNotes] = useState<{ id: string, x: number, y: number, text: string, rotation: number, color: string }[]>([
        { id: 'note-1', x: 100, y: 100, text: "Welcome to my OS! 🌟\n\nFeel free to drag me around.\n\n(Try changing my color!)", rotation: -2, color: 'bg-[#fef08a]' },
        { id: 'note-2', x: 300, y: 150, text: "Don't forget to check the Launchpad for projects!", rotation: 3, color: 'bg-[#bfdbfe]' },
    ]);

    const deleteNote = (id: string) => {
        setNotes(prev => prev.filter(n => n.id !== id));
    };

    // -- Project Icons Logic --
    // Generate scattered positions for project icons
    const [projectIcons, setProjectIcons] = useState<any[]>([]);

    useEffect(() => {
        if (!mounted || !projects.length) return;

        const generatedIcons = projects.filter(p => p.status !== 'draft').map((project, index) => {
            // Basic random scattering with some padding from edges
            // x: 50 to width-150, y: 50 to height-200 (avoid dock)
            const x = Math.random() * (windowSize.width - 100);
            const y = Math.random() * (windowSize.height - 160) + 60; // Offset for MenuBar + Dock

            // Video Detection Logic
            let videoUrl: string | undefined;
            if (isVideo(project.cover)) {
                videoUrl = project.cover;
            } else if (project.galleryItems?.some(i => i.kind === 'video')) {
                videoUrl = project.galleryItems.find(i => i.kind === 'video')?.src;
            } else if (project.gallery?.some(url => isVideo(url))) {
                videoUrl = project.gallery.find(url => isVideo(url));
            }

            // Resolve cover image - robust fallback (Ensure it's NOT a video)
            let coverImage = !isVideo(project.cover) ? project.cover : null;

            if (!coverImage) {
                // Try gallery items (image kind)
                const firstImageItem = project.galleryItems?.find(i => i.kind === 'image');
                if (firstImageItem) coverImage = firstImageItem.src;

                // Try gallery strings (non-video)
                if (!coverImage && project.gallery) {
                    coverImage = project.gallery.find(src => !isVideo(src)) || null;
                }

                // Fallback to video poster if available and coverImage is still null
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
                label: project.title,
                imageUrl: coverImage,
                videoUrl,
                icon: <FileText strokeWidth={1} />,
                aspectRatio,
                x,
                y,
                action: () => openProjectWindow(project)
            };
        });

        setProjectIcons([...generatedIcons]);

    }, [mounted, windowSize.width, windowSize.height, projects]); // Re-run if window size changes significantly or projects load


    // -- Project Window Logic --
    // We need to dynamically add windows for projects when clicked
    const openProjectWindow = (project: Project) => {
        const windowId = `project-${project.slug}`;

        // Check if already open
        if (windows.find(w => w.id === windowId)) {
            // Just focus it
            setWindows(prev => prev.map(w => {
                if (w.id === windowId) {
                    return {
                        ...w,
                        isOpen: true,
                        isMinimized: false,
                        zIndex: topZIndex + 1,
                        initialPosition: !w.isOpen ? getCenterPosition(1000, 700) : w.initialPosition
                    };
                }
                return w;
            }));
            setTopZIndex(prev => prev + 1);
            if (!isWindowOpen(windowId)) playOpen();
            return;
        }

        // Add new window
        const newWindow: WindowState = {
            id: windowId,
            title: `Project: ${project.title}`,
            isOpen: true,
            zIndex: topZIndex + 1,
            noPadding: true,
            initialPosition: getCenterPosition(1000, 700),
            width: 1000,
            height: 700,
            content: (
                <ProjectDetailWrapper project={project} projects={projects} />
            )
        };

        setWindows(prev => [...prev, newWindow]);
        setTopZIndex(prev => prev + 1);
        playOpen();
    };




    return (
        <div className="fixed inset-0 z-[9999] w-full h-screen overflow-hidden select-none">
            <LockScreen
                isLocked={isLocked}
                onUnlock={() => {
                    setIsLocked(false);
                    playChime();
                }}
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
                            // removed game and settings
                            if (id === 'mail') openContactWindow();
                            setShowSpotlight(false);
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Top Menu Bar */}
            <MenuBar onSearch={() => setShowSpotlight(true)} />

            {/* Layer 0: Background (Wallpaper + Blur) */}
            <div className="absolute inset-0 z-0 pointer-events-none bg-white">
                <img
                    src={wallpaper}
                    alt="Wallpaper"
                    className="w-full h-full object-cover scale-110 transition-all duration-700"
                />
                {children}
            </div>

            {/* Layer 1: Desktop Icons */}
            <div className="absolute inset-0 z-10 pointer-events-auto">
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
                    />
                ))}

                {/* Sticky Notes Layer */}
                {notes.map(note => (
                    <StickyNote
                        key={note.id}
                        id={note.id}
                        initialX={note.x}
                        initialY={note.y}
                        text={note.text}
                        rotation={note.rotation}
                        color={note.color}
                        onDelete={deleteNote}
                    />
                ))}
            </div>



            {/* Layer 2: Windows */}
            <div className="absolute inset-0 z-20 pointer-events-none">
                {/* Focus Blur Overlay (Inside Layer 2 for correct Stacking) */}
                <AnimatePresence>
                    {windows.find(w => w.id === 'preview-viewer' && w.isOpen && !w.isMinimized) && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-md pointer-events-auto transition-all duration-500"
                            style={{ zIndex: (windows.find(w => w.id === 'preview-viewer')?.zIndex || 100) - 1 }}
                            onClick={() => closeWindow('preview-viewer')}
                        />
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {mounted && windows.filter(w => w.isOpen).filter((w, index, self) => index === self.findIndex(t => t.id === w.id)).map(w => (
                        <div key={w.id} className="pointer-events-auto contents">
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
                                onUpdatePosition={(x, y) => updateWindowPosition(w.id, x, y)}
                                width={w.width}
                                height={w.height}
                                onResize={(wId, h) => handleWindowResize(w.id, wId, h)}
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
                        </div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Layer 3: Dock */}
            <Dock
                items={dockItems}
                bouncingId={bouncingDocId}
            />

        </div>
    );
}
