import { useState, useEffect, useCallback } from 'react';
import type { NoteData } from '../StickyNoteItem';

const INITIAL_NOTES: NoteData[] = [
    {
        id: 'welcome-note',
        text: 'Halo! Selamat Datang di Ramos OS v2.0 🖥️✨\n\nSaya Ramos, seorang Graphic Designer & Visual Strategist.\n\nQuick Start:\n1. Buka folder "Projects" untuk lihat karya saya.\n2. Klik "Contact" di bawah untuk ngobrol.\n3. Drag note ini ke mana saja!\n\nSelamat mengeksplorasi!',
        date: new Date().toISOString(),
        color: '#fef08a',
        isStarred: true,
        isDeleted: false,
        x: typeof window !== 'undefined' ? (window.innerWidth - 300) / 2 : 100,
        y: typeof window !== 'undefined' ? (window.innerHeight - 350) / 2 : 100,
        width: 300,
        height: 350,
        zIndex: 100,
        isPinned: false
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

export const useStickyNotes = (mounted: boolean, isAdmin: boolean = false, csrfToken?: string) => {
    const [notes, setNotes] = useState<NoteData[]>([]);
    const [noteZIndex, setNoteZIndex] = useState(1);
    const [hasLoaded, setHasLoaded] = useState(false);

    // Load notes from server
    useEffect(() => {
        const loadNotes = async () => {
            try {
                // Add timestamp and force=true to prevent caching
                const response = await fetch(`/api/sticky-notes?t=${Date.now()}&force=true`);
                const data = await response.json();
                if (Array.isArray(data) && data.length > 0) {
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
                    // Show welcome note ONLY if no notes exist AND it's a first-time view this session
                    const hasSeenWelcome = sessionStorage.getItem('ramos_os_welcome_seen');
                    if (!hasSeenWelcome) {
                        setNotes(INITIAL_NOTES);
                        sessionStorage.setItem('ramos_os_welcome_seen', 'true');
                    } else {
                        setNotes([]);
                    }
                }
            } catch (error) {
                console.error("Failed to load notes from server", error instanceof Error ? error.message : error);
                setNotes(INITIAL_NOTES);
            } finally {
                setHasLoaded(true);
            }
        };
        loadNotes();
    }, []);

    // Auto-sync for Admins ONLY
    useEffect(() => {
        if (!mounted || !hasLoaded || !isAdmin || !csrfToken) return;

        const saveNotes = async () => {
            try {
                // We used to have a mobile guard here, but it might interfere with testing.
                // Instead, we skip auto-save ONLY if the notes array is empty and it wasn't empty before (to prevent accidental clears)
                // or if we detection a massive stack that clearly looks like mobile auto-layout.
                // For now, let's just allow it for the admin.

                await fetch('/api/sticky-notes', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken
                    },
                    body: JSON.stringify(notes)
                });
            } catch (error) {
                console.error("Failed to auto-save notes:", error instanceof Error ? error.message : error);
            }
        };

        const debouncedSave = setTimeout(saveNotes, 1500); // Slightly longer debounce
        return () => clearTimeout(debouncedSave);
    }, [notes, mounted, hasLoaded, isAdmin, csrfToken]);

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
        bringToFrontNote,
        setNotes
    };
};
