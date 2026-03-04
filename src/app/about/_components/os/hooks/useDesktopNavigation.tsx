import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@/types/projects";
import type { ContactProfile } from "../data/mockChats";
import type { NoteData } from "../ui/elements/StickyNoteItem";
import { WindowState } from "@/hooks/useWindowManager";
import dynamic from "next/dynamic";

const ProjectDetailWrapper = dynamic(() => import("../ui/ProjectDetailWrapper"), {
    loading: () => <div className="animate-pulse bg-gray-100 dark:bg-gray-800 h-full w-full rounded" />,
    ssr: false
});

interface UseDesktopNavigationProps {
    openWindow: (id: string, options?: Partial<WindowState>) => void;
    resetWindows: () => void;
    dynamicContacts: Record<string, ContactProfile>;
    ChatWindow: React.ComponentType<{ activeChatId?: string | null; customContacts?: Record<string, ContactProfile> }>;
    notesVisible: boolean;
    setNotesVisible: (visible: boolean) => void;
    notes: NoteData[];
    projects: Project[];
    restoreNote: (id: string) => void;
    addNote: () => void;
    isAdmin: boolean;
    setNotesDockBouncing: (bouncing: boolean) => void;
}

export function useDesktopNavigation({
    openWindow,
    resetWindows,
    dynamicContacts,
    ChatWindow,
    notesVisible,
    setNotesVisible,
    notes,
    projects,
    restoreNote,
    addNote,
    isAdmin,
    setNotesDockBouncing
}: UseDesktopNavigationProps) {
    const router = useRouter();

    const handleGoHome = useCallback(() => router.push('/'), [router]);
    const resetDesktopAndClose = useCallback(() => resetWindows(), [resetWindows]);

    const openProjectWindow = useCallback((project: Project) => {
        openWindow("projects", {
            title: `Portfolio: ${project.title}`,
            content: <ProjectDetailWrapper project={project} projects={projects} />
        });
    }, [openWindow, projects]);

    // Klik Dynamic Island (dengan chatId spesifik) -> langsung buka chat
    const navToChat = useCallback((chatId?: string) => {
        openWindow("whatsapp", {
            content: <ChatWindow activeChatId={chatId || null} customContacts={dynamicContacts} />
        });
    }, [openWindow, dynamicContacts, ChatWindow]);

    // Klik Dock WA -> buka list view (tanpa activeChatId)
    const openWhatsAppList = useCallback(() => {
        openWindow("whatsapp", {
            content: <ChatWindow activeChatId={null} customContacts={dynamicContacts} />
        });
    }, [openWindow, dynamicContacts, ChatWindow]);

    const toggleNotesVisibility = useCallback(() => {
        const nextState = !notesVisible;
        setNotesVisible(nextState);

        if (nextState) {
            const hasVisibleNotes = notes.some(n => !n.isDeleted);
            if (!hasVisibleNotes) {
                if (notes.length > 0) {
                    notes.forEach(n => restoreNote(n.id));
                } else if (isAdmin) {
                    // Create new note if toggled ON and none exist
                    addNote();
                }
            }
        } else if (notesVisible && isAdmin) {
            // If already visible and clicked again in Admin mode, create a new one (macOS-like "New Note" shortcut)
            addNote();
            setNotesVisible(true); // Ensure it stays visible
        }

        setNotesDockBouncing(true);
        setTimeout(() => setNotesDockBouncing(false), 600);
    }, [notesVisible, setNotesVisible, notes, restoreNote, setNotesDockBouncing, isAdmin, addNote]);

    return {
        handleGoHome,
        resetDesktopAndClose,
        openProjectWindow,
        navToChat,
        openWhatsAppList,
        toggleNotesVisibility
    };
}
