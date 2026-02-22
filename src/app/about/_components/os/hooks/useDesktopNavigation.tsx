import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@/types/projects";

interface UseDesktopNavigationProps {
    openWindow: (id: string, options?: any) => void;
    resetWindows: () => void;
    dynamicContacts: any;
    ChatWindow: React.ComponentType<any>;
    notesVisible: boolean;
    setNotesVisible: (visible: boolean) => void;
    notes: any[];
    restoreNote: (id: string) => void;
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
    restoreNote,
    setNotesDockBouncing
}: UseDesktopNavigationProps) {
    const router = useRouter();

    const handleGoHome = useCallback(() => router.push('/'), [router]);
    const resetDesktopAndClose = useCallback(() => resetWindows(), [resetWindows]);

    const openProjectWindow = useCallback((project: Project) => {
        router.push(`/projects/${project.slug}`);
    }, [router]);

    const navToChat = useCallback((chatId?: string) => {
        if (chatId) {
            openWindow("whatsapp", {
                content: <ChatWindow activeChatId={chatId} customContacts={dynamicContacts} />
            });
        } else {
            openWindow("whatsapp", {
                content: <ChatWindow customContacts={dynamicContacts} />
            });
        }
    }, [openWindow, dynamicContacts, ChatWindow]);

    const toggleNotesVisibility = useCallback(() => {
        const nextState = !notesVisible;
        setNotesVisible(nextState);

        if (nextState) {
            const hasVisibleNotes = notes.some(n => !n.isDeleted);
            if (!hasVisibleNotes && notes.length > 0) {
                notes.forEach(n => restoreNote(n.id));
            }
        }

        setNotesDockBouncing(true);
        setTimeout(() => setNotesDockBouncing(false), 600);
    }, [notesVisible, setNotesVisible, notes, restoreNote, setNotesDockBouncing]);

    return {
        handleGoHome,
        resetDesktopAndClose,
        openProjectWindow,
        navToChat,
        toggleNotesVisibility
    };
}
