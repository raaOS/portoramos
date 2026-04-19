import { useState, useEffect, useCallback, useRef } from 'react';
import type { NoteData } from '../ui/elements/StickyNoteItem';
import { useLayoutPersistence } from '../contexts/LayoutPersistenceContext';

// BUG FIX #5: Gunakan function untuk lazy initialization agar tidak SSR leak
// HYDRATION FIX: Generate client-specific values only when function is called (client-side)
const getInitialNotes = (): NoteData[] => {
    // Generate timestamp and position only on client to prevent hydration mismatch
    const isClient = typeof window !== 'undefined';
    return [
        {
            id: 'welcome-note',
            text: 'Halo! Selamat Datang di Ramos OS v2.0 🖥️✨\n\nSaya Ramos, seorang Graphic Designer & Visual Strategist.\n\nQuick Start:\n1. Buka folder "Projects" untuk lihat karya saya.\n2. Klik "Contact" di bawah untuk ngobrol.\n3. Drag note ini ke mana saja!\n\nSelamat mengeksplorasi!',
            date: isClient ? new Date().toISOString() : '2024-01-01T00:00:00.000Z', // Static date for SSR
            color: '#fef08a',
            isStarred: true,
            isDeleted: false,
            // BUG FIX #5: Safe window access dengan fallback yang lebih reasonable
            x: isClient ? Math.max(50, (window.innerWidth - 300) / 2) : 100,
            y: isClient ? Math.max(50, (window.innerHeight - 350) / 2) : 100,
            width: 300,
            height: 350,
            zIndex: 100,
            isPinned: false
        }
    ];
};

// Helper debounce function - prefixed with _ to indicate it's reserved for future use
const _debounce = <T extends (...args: unknown[]) => ReturnType<T>>(func: T, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

export const useStickyNotes = (mounted: boolean, isAdmin: boolean = false, csrfToken?: string, requestNextZIndex?: (id?: string) => number) => {
    const [notes, setNotes] = useState<NoteData[]>([]);
    const [hasLoaded, setHasLoaded] = useState(false);
    const isModified = useRef(false);
    const notesRef = useRef(notes);

    // Sync notesRef with state
    notesRef.current = notes;

    const { registerFlush, unregisterFlush } = useLayoutPersistence();

    // Load notes from server
    useEffect(() => {
        const controller = new AbortController();
        
        const loadNotes = async () => {
            try {
                // Add timestamp and force=true to prevent caching
                const response = await fetch(`/api/sticky-notes?t=${Date.now()}&force=true`, {
                    signal: controller.signal
                });

                if (!response.ok) {
                    const text = await response.text();
                    console.error(`[StickyNotes] API Error (${response.status}):`, text.slice(0, 200));
                    throw new Error(`Server responded with status ${response.status}`);
                }

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
                    // Note: z-indexes are now managed by UnifiedZIndexContext
                    // We keep the zIndex values in notes for persistence, but the actual
                    // stacking is controlled by the unified system
                } else {
                    // Show welcome note ONLY if no notes exist AND it's a first-time view this session
                    // BUG FIX #2: try-catch untuk sessionStorage
                    try {
                        const hasSeenWelcome = sessionStorage.getItem('ramos_os_welcome_seen');
                        if (!hasSeenWelcome) {
                            setNotes(getInitialNotes());
                            sessionStorage.setItem('ramos_os_welcome_seen', 'true');
                        } else {
                            setNotes([]);
                        }
                    } catch (e) {
                        console.warn('[StickyNotes] Failed to access sessionStorage:', e);
                        setNotes(getInitialNotes());
                    }
                }
            } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') {
                    return;
                }
                console.error("Failed to load notes from server:", error instanceof Error ? error.message : error);
                setNotes(getInitialNotes());
            } finally {
                setHasLoaded(true);
            }
        };
        loadNotes();
        
        return () => controller.abort();
    }, []);

    // Auto-sync for Admins ONLY
    useEffect(() => {
        if (!mounted || !hasLoaded || !isAdmin || !csrfToken || !isModified.current) return;

        const controller = new AbortController();

        const saveNotes = async () => {
            try {
                let notesToPersist = [...notes];
                
                // GHOST BUG FIX: Prevent overwriting CRUD text edits from stale frontend state
                // We fetch the latest server state and ONLY apply our local positional/visual state before saving.
                try {
                    const response = await fetch(`/api/sticky-notes?force=true&t=${Date.now()}`, {
                        signal: controller.signal
                    });
                    if (response.ok) {
                        const serverData = await response.json();
                        if (Array.isArray(serverData)) {
                            notesToPersist = notes.map(localNote => {
                                const serverNote = serverData.find((sn: NoteData) => sn.id === localNote.id);
                                if (serverNote) {
                                    // Keep server's text, color, and star status, but apply our local drag/drop/resize state
                                    return {
                                        ...serverNote,
                                        x: localNote.x,
                                        y: localNote.y,
                                        width: localNote.width,
                                        height: localNote.height,
                                        zIndex: localNote.zIndex,
                                        isPinned: localNote.isPinned,
                                        isCollapsed: localNote.isCollapsed,
                                        opacity: localNote.opacity
                                    };
                                }
                                return localNote;
                            });
                        }
                    }
                } catch (e) {
                    if (e instanceof Error && e.name === 'AbortError') {
                        return;
                    }
                    console.warn("[StickyNotes] Safe merge failed", e);
                }

                await fetch('/api/sticky-notes', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken
                    },
                    credentials: 'include',
                    signal: controller.signal,
                    body: JSON.stringify(notesToPersist)
                });
                isModified.current = false;
            } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') {
                    return;
                }
                console.error("Failed to auto-save notes:", error instanceof Error ? error.message : error);
            }
        };

        const debouncedSave = setTimeout(saveNotes, 1500); // Slightly longer debounce
        return () => {
            clearTimeout(debouncedSave);
            controller.abort();
        };
    }, [notes, mounted, hasLoaded, isAdmin, csrfToken]);

    // Flusher for logout/exit
    // BUG FIX #3: Capture notes data di awal untuk mencegah race condition
    const flushNotes = useCallback(async () => {
        if (!isAdmin || !csrfToken || !isModified.current) return;

        // Capture current notes state immediately
        const notesToFlush = notesRef.current;
        
        try {
            await fetch('/api/sticky-notes', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                credentials: 'include',
                body: JSON.stringify(notesToFlush)
            });
            isModified.current = false;
        } catch (error) {
            console.error("[StickyNotes] Failed to flush notes:", error);
        }
    }, [isAdmin, csrfToken]);

    useEffect(() => {
        registerFlush('stickyNotes', flushNotes);
        return () => unregisterFlush('stickyNotes');
    }, [registerFlush, unregisterFlush, flushNotes]);

    const addNote = useCallback(() => {
        // HYDRATION FIX: Generate client-specific values only on client
        const isClient = typeof window !== 'undefined';
        const noteId = 'note-' + (isClient ? Date.now() : 0) + '-' + (isClient ? Math.random().toString(36).substr(2, 9) : 'xxxxxxxx');
        // Get z-index from unified system, passing the note ID
        const nextZ = requestNextZIndex ? requestNextZIndex(noteId) : 100;
        
        // HYDRATION FIX: Use consistent SSR-safe defaults, then update on client
        const newNote: NoteData = {
            id: noteId,
            text: '',
            date: isClient ? new Date().toISOString() : '2024-01-01T00:00:00.000Z',
            color: '#fef08a',
            isStarred: false,
            isDeleted: false,
            x: isClient 
                ? (window.innerWidth < 768
                    ? (window.innerWidth - 280) / 2
                    : Math.random() * (window.innerWidth - 300))
                : 100, // Consistent SSR fallback
            y: isClient
                ? (window.innerWidth < 768
                    ? (window.innerHeight - 280) / 2
                    : Math.random() * (window.innerHeight - 300))
                : 100, // Consistent SSR fallback
            width: 280,
            height: 280,
            isPinned: false,
            isCollapsed: false,
            opacity: 1,
            zIndex: nextZ,
            fontFamily: 'inherit'
        };
        setNotes(prev => [newNote, ...prev]);
        isModified.current = true;
    }, [requestNextZIndex]);

    const updateNote = useCallback((id: string, updates: Partial<NoteData>) => {
        setNotes(prev => prev.map(note => note.id === id ? { ...note, ...updates } : note));
        isModified.current = true;
        
        // Simpan posisi/size ke positionSync buffer jika admin
        if (isAdmin && (updates.x !== undefined || updates.y !== undefined || updates.width !== undefined || updates.height !== undefined)) {
            import('../utils/positionSync').then(({ saveNotePosition }) => {
                saveNotePosition(id, updates, isAdmin);
            });
        }
    }, [isAdmin]);

    const deleteNote = useCallback((id: string) => {
        updateNote(id, { isDeleted: true });
    }, [updateNote]);

    const permanentDeleteNote = useCallback((id: string) => {
        setNotes(prev => prev.filter(n => n.id !== id));
        isModified.current = true;
    }, []);

    const restoreNote = useCallback((id: string) => {
        updateNote(id, { isDeleted: false });
    }, [updateNote]);

    const bringToFrontNote = useCallback((id: string) => {
        // Get z-index from unified system, passing the note ID
        // The actual z-index is managed by UnifiedZIndexContext
        if (requestNextZIndex) {
            const nextZ = requestNextZIndex(id);
            updateNote(id, { zIndex: nextZ });
        }
    }, [updateNote, requestNextZIndex]);

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
