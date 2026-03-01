import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@/types/projects";
import type { ContactProfile } from "../data/mockChats";
import type { NoteData } from "../ui/elements/StickyNoteItem";

interface UseDesktopNavigationProps {
    openWindow: (id: string, options?: { content: React.ReactNode }) => void;
    resetWindows: () => void;
    dynamicContacts: Record<string, ContactProfile>;
    ChatWindow: React.ComponentType<{ activeChatId?: string | null; customContacts?: Record<string, ContactProfile> }>;
    notesVisible: boolean;
    setNotesVisible: (visible: boolean) => void;
    notes: NoteData[];
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
    restoreNote,
    addNote,
    isAdmin,
    setNotesDockBouncing
}: UseDesktopNavigationProps) {
    const router = useRouter();

    const handleGoHome = useCallback(() => router.push('/'), [router]);
    const resetDesktopAndClose = useCallback(() => resetWindows(), [resetWindows]);

    const openProjectWindow = useCallback((project: Project) => {
        router.push(`/projects/${project.slug}`);
    }, [router]);

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
