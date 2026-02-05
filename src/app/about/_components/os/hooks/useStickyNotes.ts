import { useState, useEffect, useCallback } from 'react';
import type { NoteData } from '../StickyNoteItem';

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

export const useStickyNotes = (mounted: boolean) => {
    const [notes, setNotes] = useState<NoteData[]>([]);
    const [noteZIndex, setNoteZIndex] = useState(1);

    // Load notes from server
    useEffect(() => {
        const loadNotes = async () => {
            try {
                const response = await fetch('/api/sticky-notes');
                const data = await response.json();
                if (Array.isArray(data)) {
                    // Mobile adjustment: pull notes to visible area
                    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
                    const adjustedData = data.map((n, i) => {
                        if (isMobile) {
                            const w = n.width || 280;
                            const h = n.height || 280;
                            // Stack with slight offset
                            return {
                                ...n,
                                x: Math.max(0, (window.innerWidth - w) / 2) + (i * 10),
                                y: Math.max(50, (window.innerHeight - h) / 2) + (i * 10)
                            };
                        }
                        return n;
                    });

                    setNotes(adjustedData);
                    // Find max z-index to initialize counter
                    const maxZ = Math.max(...data.map(n => n.zIndex || 0), 0);
                    setNoteZIndex(maxZ + 1);
                } else {
                    setNotes(INITIAL_NOTES);
                }
            } catch (e) {
                console.error("Failed to load notes from server", e);
                setNotes(INITIAL_NOTES);
            }
        };
        loadNotes();
    }, []);

    // Auto-sync removed as per request. Visual changes (drag) are local-only for public users.
    // CRUD is handled exclusively in the Admin Panel.

    const addNote = useCallback(() => {
        const newNote: NoteData = {
            id: 'note-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            text: '',
            date: new Date().toISOString(),
            color: '#fef08a',
            isStarred: false,
            isDeleted: false,
            x: window.innerWidth < 768
                ? (window.innerWidth - 280) / 2
                : Math.random() * (window.innerWidth - 300),
            y: window.innerWidth < 768
                ? (window.innerHeight - 280) / 2
                : Math.random() * (window.innerHeight - 300),
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
    }, [noteZIndex]);

    const updateNote = useCallback((id: string, updates: Partial<NoteData>) => {
        setNotes(prev => prev.map(note => note.id === id ? { ...note, ...updates } : note));
    }, []);

    const deleteNote = useCallback((id: string) => {
        updateNote(id, { isDeleted: true });
    }, [updateNote]);

    const permanentDeleteNote = useCallback((id: string) => {
        setNotes(prev => prev.filter(n => n.id !== id));
    }, []);

    const restoreNote = useCallback((id: string) => {
        updateNote(id, { isDeleted: false });
    }, [updateNote]);

    const bringToFrontNote = useCallback((id: string) => {
        setNoteZIndex(prev => {
            const next = prev + 1;
            updateNote(id, { zIndex: next });
            return next;
        });
    }, [updateNote]);

    return {
        notes,
        addNote,
        updateNote,
        deleteNote,
        permanentDeleteNote,
        restoreNote,
        bringToFrontNote
    };
};
