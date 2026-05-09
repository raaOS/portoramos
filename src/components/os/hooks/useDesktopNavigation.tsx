import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@/types/projects";
import type { ContactProfile } from "../data/mockChats";
import type { NoteData } from "../ui/elements/StickyNoteItem";
import { WindowState } from "@/hooks/useWindowManager";
import dynamic from "next/dynamic";
import { useOSSystem } from "../context/OSSystemContext";

const ProjectDetailWrapper = dynamic(() => import("../ui/ProjectDetailWrapper"), {
    loading: () => <div className="animate-pulse bg-gray-100 dark:bg-gray-800 h-full w-full rounded" />,
    ssr: false
});

interface UseDesktopNavigationProps {
    openWindow: (id: string, options?: Partial<WindowState>) => void;
    resetWindows: () => void;
    dynamicContacts: Record<string, ContactProfile>;
    ChatWindow: React.ComponentType<{ activeChatId?: string | null; customContacts?: Record<string, ContactProfile>; initialProjects?: Project[] }>;
    _notes: NoteData[];
    projects: Project[];
    _restoreNote: (id: string) => void;
    _addNote: () => void;
    _isAdmin: boolean;
    setNotesDockBouncing: (bouncing: boolean) => void;
}

export function useDesktopNavigation({
    openWindow,
    resetWindows,
    dynamicContacts,
    ChatWindow,
    _notes,
    projects,
    _restoreNote,
    _addNote,
    _isAdmin,
    setNotesDockBouncing
}: UseDesktopNavigationProps) {
    const { notesVisible, setNotesVisible } = useOSSystem();
    const router = useRouter();

    const handleGoHome = useCallback(() => router.push('/'), [router]);
    const resetDesktopAndClose = useCallback(() => resetWindows(), [resetWindows]);

    const openProjectWindow = useCallback((project: Project, originRect?: { x: number; y: number; width: number; height: number }) => {
        openWindow(`project-${project.id}`, {
            title: `Portfolio: ${project.title}`,
            content: <ProjectDetailWrapper project={project} projects={projects} />,
            originRect,
            width: 900,
            height: 620,
            noPadding: true,
        });
    }, [openWindow, projects]);

    // Klik Dynamic Island (dengan chatId spesifik) -> langsung buka chat
    const navToChat = useCallback((chatId?: string) => {
        openWindow("whatsapp", {
            content: <ChatWindow activeChatId={chatId || null} customContacts={dynamicContacts} initialProjects={projects} />
        });
    }, [openWindow, dynamicContacts, ChatWindow, projects]);

    // Klik Dock WA -> buka list view (tanpa activeChatId)
    const openWhatsAppList = useCallback(() => {
        openWindow("whatsapp", {
            content: <ChatWindow activeChatId={null} customContacts={dynamicContacts} initialProjects={projects} />
        });
    }, [openWindow, dynamicContacts, ChatWindow, projects]);

    const openContactWindow = useCallback(() => {
        openWindow("contact");
    }, [openWindow]);

    // BUG FIX: Simplified toggle to pure visibility switch.
    // Previously, this would auto-add or auto-restore notes, causing duplicates.
    // Now it strictly respects the current state of 'notes' from CRUD/DB.
    const toggleNotesVisibility = useCallback(() => {
        setNotesVisible(!notesVisible);
        setNotesDockBouncing(true);
        setTimeout(() => setNotesDockBouncing(false), 600);
    }, [notesVisible, setNotesVisible, setNotesDockBouncing]);

    return {
        handleGoHome,
        resetDesktopAndClose,
        openProjectWindow,
        navToChat,
        openWhatsAppList,
        openContactWindow,
        toggleNotesVisibility
    };
}
