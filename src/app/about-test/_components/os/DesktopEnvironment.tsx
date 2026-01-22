"use client";

import React, { useState, useEffect } from "react";
import { User, Briefcase, Terminal, Github, Linkedin, FileText, AlertTriangle, Home, Phone, Grid, Smile, Rocket, Mail, Trash2, Instagram, MessageCircle, Image as ImageIcon } from "lucide-react";
import OSWindow from "./Window";
import DesktopIcon from "./DesktopIcon";
import Dock from "./Dock";
import AboutContent from "./AboutContent"; // Import the new component

import IndexClientWithAutoUpdate from "@/components/home/IndexClientWithAutoUpdate";
import { AnimatePresence } from "framer-motion";
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
    children: React.ReactNode;
    aboutData?: AboutData | null;
    experienceData?: ExperienceData | null;
    hardSkillsData?: HardSkillsData | null;
    projects: Project[];
}

export default function DesktopEnvironment({ children, aboutData, experienceData, hardSkillsData, projects }: DesktopEnvironmentProps) {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [windowSize, setWindowSize] = useState({ width: 1200, height: 800 });

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
        html.style.overflow = "hidden";
        body.style.overflow = "hidden";
        html.style.height = "100%";
        body.style.height = "100%";
        html.classList.add('lenis-stopped');

        const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            // Restore
            html.style.overflow = originalHtmlOverflow;
            body.style.overflow = originalBodyOverflow;
            html.style.height = originalHtmlHeight;
            body.style.height = originalBodyHeight;
            html.classList.remove('lenis-stopped');
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
                // Dynamically center 'about' window on mount
                if (w.id === 'about') {
                    return { ...w, initialPosition: { x: (window.innerWidth - 900) / 2, y: (window.innerHeight - 600) / 2 } };
                }
                if (w.id === 'projects') {
                    return { ...w, initialPosition: { x: (window.innerWidth - 1000) / 2, y: (window.innerHeight - 700) / 2 } };
                }
                if (w.id === 'error') {
                    return { ...w, initialPosition: { x: window.innerWidth / 2 - 200, y: window.innerHeight / 2 - 150 } };
                }
                return w;
            }));
        }
    }, [mounted]);


    // -- Actions --

    const openWindow = (id: string) => {
        setWindows(prev => prev.map(w => {
            if (w.id === id) {
                return { ...w, isOpen: true, isMinimized: false, zIndex: topZIndex + 1 };
            }
            return w;
        }));
        setTopZIndex(prev => prev + 1);
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
                    return { ...w, isOpen: true, isMinimized: false, zIndex: topZIndex + 1 };
                }
                return w;
            }));
            setTopZIndex(prev => prev + 1);
            return;
        }

        const newWindow: WindowState = {
            id: windowId,
            title: 'Launchpad',
            isOpen: true,
            zIndex: topZIndex + 1,
            noPadding: true,
            initialPosition: { x: (windowSize.width - 1100) / 2, y: (windowSize.height - 700) / 2 },
            width: 1100,
            height: 700,
            content: <ProjectsGridWindow projects={projects} onOpenProject={openProjectWindow} />
        };
        setWindows(prev => [...prev, newWindow]);
        setTopZIndex(prev => prev + 1);
    };

    // -- Mail Logic --
    const openContactWindow = () => {
        const windowId = 'mail';
        if (windows.find(w => w.id === windowId)) {
            setWindows(prev => prev.map(w => {
                if (w.id === windowId) {
                    return { ...w, isOpen: true, isMinimized: false, zIndex: topZIndex + 1 };
                }
                return w;
            }));
            setTopZIndex(prev => prev + 1);
            return;
        }

        const newWindow: WindowState = {
            id: windowId,
            title: 'New Message',
            isOpen: true,
            zIndex: topZIndex + 1,
            noPadding: true,
            initialPosition: { x: typeof window !== 'undefined' ? window.innerWidth / 2 - 250 : 200, y: typeof window !== 'undefined' ? window.innerHeight / 2 - 200 : 200 },
            width: 500,
            height: 400,
            content: <ContactWindow />
        };
        setWindows(prev => [...prev, newWindow]);
        setTopZIndex(prev => prev + 1);
    };

    // -- Chat Logic --
    const openChatWindow = () => {
        const windowId = 'chat';
        if (windows.find(w => w.id === windowId)) {
            setWindows(prev => prev.map(w => {
                if (w.id === windowId) {
                    return { ...w, isOpen: true, isMinimized: false, zIndex: topZIndex + 1 };
                }
                return w;
            }));
            setTopZIndex(prev => prev + 1);
            return;
        }

        const newWindow: WindowState = {
            id: windowId,
            title: 'WhatsApp Live',
            isOpen: true,
            zIndex: topZIndex + 1,
            noPadding: true,
            initialPosition: { x: typeof window !== 'undefined' ? (window.innerWidth - 380) / 2 : 100, y: typeof window !== 'undefined' ? (window.innerHeight - 600) / 2 : 100 },
            width: 380,
            height: 600,
            content: <ChatWindow />
        };
        setWindows(prev => [...prev, newWindow]);
        setTopZIndex(prev => prev + 1);
    };

    // -- Gallery Logic --
    const openGallery = () => {
        const windowId = 'gallery';
        if (windows.find(w => w.id === windowId)) {
            setWindows(prev => prev.map(w => {
                if (w.id === windowId) {
                    return { ...w, isOpen: true, isMinimized: false, zIndex: topZIndex + 1 };
                }
                return w;
            }));
            setTopZIndex(prev => prev + 1);
            return;
        }

        const newWindow: WindowState = {
            id: windowId,
            title: 'Photos',
            isOpen: true,
            zIndex: topZIndex + 1,
            noPadding: true,
            initialPosition: { x: typeof window !== 'undefined' ? (window.innerWidth - 900) / 2 : 100, y: typeof window !== 'undefined' ? (window.innerHeight - 600) / 2 : 100 },
            width: 900,
            height: 600,
            content: <GalleryWindow projects={projects} />
        };
        setWindows(prev => [...prev, newWindow]);
        setTopZIndex(prev => prev + 1);
    };

    // -- Terminal Logic --
    const openTerminal = () => {
        const windowId = 'terminal';
        if (windows.find(w => w.id === windowId)) {
            setWindows(prev => prev.map(w => {
                if (w.id === windowId) {
                    return { ...w, isOpen: true, isMinimized: false, zIndex: topZIndex + 1 };
                }
                return w;
            }));
            setTopZIndex(prev => prev + 1);
            return;
        }

        const newWindow: WindowState = {
            id: windowId,
            title: 'Terminal',
            isOpen: true,
            zIndex: topZIndex + 1,
            noPadding: true, // Terminal style usually full
            initialPosition: { x: typeof window !== 'undefined' ? (window.innerWidth - 600) / 2 : 100, y: typeof window !== 'undefined' ? (window.innerHeight - 400) / 2 : 100 },
            width: 600,
            height: 400,
            content: <TerminalWindow />
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
                    return { ...w, isOpen: true, isMinimized: false, zIndex: topZIndex + 1 };
                }
                return w;
            }));
            setTopZIndex(prev => prev + 1);
            return;
        }

        const newWindow: WindowState = {
            id: windowId,
            title: 'Recycle Bin',
            isOpen: true,
            zIndex: topZIndex + 1,
            initialPosition: { x: typeof window !== 'undefined' ? (window.innerWidth - 400) / 2 : 100, y: typeof window !== 'undefined' ? (window.innerHeight - 200) / 2 : 100 },
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
    };

    const dockItems = [
        { id: "finder", label: "Finder", icon: <AppIcon icon={Smile} color="from-sky-400 to-blue-500" />, onClick: resetDesktop }, // Finder acts as "Show Desktop"
        { id: "about", label: "Profile", icon: <AppIcon icon={User} color="from-gray-300 to-gray-400" />, onClick: () => openWindow("about"), isOpen: isWindowOpen("about") },
        { id: "projects", label: "Launchpad", icon: <AppIcon icon={Rocket} color="from-red-400 to-pink-500" />, onClick: openLaunchpad },
        { id: "gallery", label: "Photos", icon: <AppIcon icon={ImageIcon} color="from-indigo-400 to-blue-500" />, onClick: openGallery },
        { id: "whatsapp", label: "WhatsApp", icon: <AppIcon icon={MessageCircle} color="from-green-400 to-green-600" />, onClick: openChatWindow },
        { id: "instagram", label: "Instagram", icon: <AppIcon icon={Instagram} color="from-pink-500 to-purple-500" />, onClick: () => window.open("https://instagram.com", "_blank") },
        { id: "terminal", label: "Terminal", icon: <AppIcon icon={Terminal} color="from-gray-700 to-black" />, onClick: openTerminal },
        { id: "trash", label: "Trash", icon: <AppIcon icon={Trash2} color="from-gray-400 to-gray-500" />, onClick: openTrash },
    ];

    // -- Project Icons Logic --
    // Generate scattered positions for project icons
    const [projectIcons, setProjectIcons] = useState<any[]>([]);

    useEffect(() => {
        if (!mounted || !projects.length) return;

        const generatedIcons = projects.filter(p => p.status !== 'draft').map((project, index) => {
            // Basic random scattering with some padding from edges
            // x: 50 to width-150, y: 50 to height-200 (avoid dock)
            const x = 50 + Math.random() * (windowSize.width - 200);
            const y = 50 + Math.random() * (windowSize.height - 250);

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
                aspectRatio,
                x,
                y,
                action: () => openProjectWindow(project)
            };
        });

        // Add standard icons
        const standardIcons = [
            { id: "file-1", label: "About.txt", icon: <FileText />, x: 40, y: 40, action: () => openWindow("about") },
            { id: "link-1", label: "LinkedIn", icon: <Linkedin />, x: 40, y: 160, action: () => window.open("https://linkedin.com", "_blank") },
            { id: "trash", label: "Recycle Bin", icon: <div className="text-white/50"><Terminal /></div>, x: windowSize.width - 100, y: windowSize.height - 120, action: () => { } },
        ];

        setProjectIcons([...generatedIcons, ...standardIcons]);

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
                    return { ...w, isOpen: true, isMinimized: false, zIndex: topZIndex + 1 };
                }
                return w;
            }));
            setTopZIndex(prev => prev + 1);
            return;
        }

        // Add new window
        const newWindow: WindowState = {
            id: windowId,
            title: `Project: ${project.title}`,
            isOpen: true,
            zIndex: topZIndex + 1,
            noPadding: true,
            initialPosition: { x: (window.innerWidth - 1000) / 2, y: (window.innerHeight - 700) / 2 },
            width: 1000,
            height: 700,
            content: (
                <ProjectDetailWrapper project={project} projects={projects} />
            )
        };

        setWindows(prev => [...prev, newWindow]);
        setTopZIndex(prev => prev + 1);
    };




    // FORCE OVERLAY: fixed + z-[9999] to sit on top of everything
    return (
        <div className="fixed inset-0 z-[9999] w-full h-screen overflow-hidden select-none bg-black">

            {/* Layer 0: Background (Spline) */}
            <div className="absolute inset-0 z-0 pointer-events-none">
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
            </div>

            {/* Layer 2: Windows */}
            <div className="absolute inset-0 z-20 pointer-events-none">
                <AnimatePresence>
                    {mounted && windows.filter(w => w.isOpen).map(w => (
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
                                {w.content}
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
