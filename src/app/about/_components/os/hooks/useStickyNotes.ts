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

// Helper debounce function
const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

export const useStickyNotes = (mounted: boolean, isAdmin: boolean = false) => {
    const [notes, setNotes] = useState<NoteData[]>([]);
    const [noteZIndex, setNoteZIndex] = useState(1);
    const [hasLoaded, setHasLoaded] = useState(false);

    // Load notes from server
    useEffect(() => {
        const loadNotes = async () => {
            try {
                // Add timestamp to prevent caching
                const response = await fetch(`/api/sticky-notes?t=${Date.now()}`);
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
            } finally {
                setHasLoaded(true);
            }
        };
        loadNotes();
    }, []);

    // Auto-sync for Admins ONLY
    useEffect(() => {
        if (!mounted || !hasLoaded || !isAdmin) return;

        const saveNotes = async () => {
            try {
                // We need to strip out any potentially "mobile adjusted" coordinates if we were to support mobile-admin editing
                // But for now, assuming Admin edits on Desktop primarily or accepts the mobile stack as new position if editing on mobile.
                // Given the requirement "Mobile logic auto-tidy ignoring x,y", we should technically NOT save mobile positions if they are just visual overrides.
                // However, the `notes` state currently HOLDS the overridden positions on mobile.
                // RISK: If Admin opens on Mobile, notes stack. Auto-save triggers. Stacked positions overwrites correct Desktop positions.
                // FIX: Only auto-save if NOT mobile OR be very careful.
                const isMobile = window.innerWidth < 768;
                if (isMobile) return; // Prevent overwriting desktop layout when viewing on mobile

                await fetch('/api/sticky-notes', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(notes)
                });
            } catch (error) {
                console.error("Failed to auto-save notes:", error);
            }
        };

        const debouncedSave = setTimeout(saveNotes, 1000);
        return () => clearTimeout(debouncedSave);
    }, [notes, mounted, hasLoaded, isAdmin]);

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
