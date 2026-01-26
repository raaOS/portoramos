"use client";

import React, { useState, useEffect } from 'react';
import { useDragControls } from 'framer-motion';
import { Search, Plus, Trash2, Star, ArrowLeft } from 'lucide-react';
import StickyNoteItem, { NoteData } from './StickyNoteItem';
import { v4 as uuidv4 } from 'uuid';

const INITIAL_NOTES: NoteData[] = [
    { id: '1', text: 'Welcome to Sticky Notes! 📝\n\nClick the + button to add a new note.', date: new Date().toISOString(), color: '#fef08a', isStarred: false, isDeleted: false },
    { id: '2', text: 'Try changing my color or starring me! ⭐', date: new Date().toISOString(), color: '#bfdbfe', isStarred: true, isDeleted: false },
];

export default function StickyNotesApp() {
    const [notes, setNotes] = useState<NoteData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [filterStarred, setFilterStarred] = useState(false);
    const [showDeleted, setShowDeleted] = useState(false);

    // Load from Backend on mount
    useEffect(() => {
        const loadNotes = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/sticky-notes');
                if (response.ok) {
                    const data = await response.json();
                    setNotes(data || []);
                }
            } catch (e) {
                console.error("Failed to load notes", e);
            } finally {
                setLoading(false);
            }
        };
        loadNotes();
    }, []);

    // Save to Backend on change
    const saveToBackend = async (data: NoteData[]) => {
        try {
            await fetch('/api/sticky-notes', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch (e) {
            console.error("Failed to save notes", e);
        }
    };

    const addNote = () => {
        const newNote: NoteData = {
            id: uuidv4(),
            text: '',
            date: new Date().toISOString(),
            color: '#fef08a', // Default yellow
            isStarred: false,
            isDeleted: false,
            fontFamily: 'inherit'
        };
        const updated = [newNote, ...notes];
        setNotes(updated);
        saveToBackend(updated);
    };

    const updateNote = (id: string, updates: Partial<NoteData>) => {
        const updated = notes.map(note => note.id === id ? { ...note, ...updates } : note);
        setNotes(updated);
        saveToBackend(updated);
    };

    const deleteNote = (id: string) => {
        updateNote(id, { isDeleted: true });
    };

    const restoreNote = (id: string) => {
        updateNote(id, { isDeleted: false });
    };

    const permanentDeleteNote = (id: string) => {
        setNotes(notes.filter(n => n.id !== id));
    };

    const filteredNotes = notes.filter(note => {
        // 1. Delete Status
        if (showDeleted) {
            if (!note.isDeleted) return false; // Only show deleted
        } else {
            if (note.isDeleted) return false; // Hide deleted
        }

        // 2. Star Status (only applies if not showing deleted)
        if (!showDeleted && filterStarred && !note.isStarred) return false;

        // 3. Search Text
        if (searchText && !note.text.toLowerCase().includes(searchText.toLowerCase())) return false;

        return true;
    });

    return (
        <div className="w-full h-full bg-gray-50 flex flex-col font-sans text-gray-800">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between p-6 bg-white shadow-sm z-10 gap-4">
                <h1 className="text-2xl font-bold tracking-tight text-gray-800">Sticky Notes</h1>

                {/* Search Bar */}
                <div className="relative flex-grow max-w-md w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search notes..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all"
                    />
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { setShowDeleted(false); setFilterStarred(!filterStarred); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${filterStarred && !showDeleted ? 'bg-orange-100 border-orange-200 text-orange-700' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                    >
                        <Star size={18} fill={filterStarred && !showDeleted ? "currentColor" : "none"} />
                        <span className="text-sm font-medium">Starred</span>
                    </button>

                    <button
                        onClick={() => { setFilterStarred(false); setShowDeleted(!showDeleted); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${showDeleted ? 'bg-red-100 border-red-200 text-red-700' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                    >
                        <Trash2 size={18} />
                        <span className="text-sm font-medium">{showDeleted ? "Hide Trash" : "Trash"}</span>
                    </button>

                    <button
                        onClick={addNote}
                        className="flex items-center justify-center w-10 h-10 rounded-full bg-black text-white hover:bg-gray-800 transition-colors shadow-md hover:shadow-lg"
                        title="Add New Note"
                    >
                        <Plus size={24} />
                    </button>
                </div>
            </div>

            {/* Main Content (Grid) */}
            <div className="flex-grow p-6 overflow-y-auto bg-gray-50/50">
                {showDeleted && (
                    <div className="mb-4 p-2 bg-red-50 border border-red-100 rounded-md text-red-600 text-sm text-center">
                        Viewing Deleted Notes. Restore them to edit.
                    </div>
                )}

                {filteredNotes.length === 0 ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                        {searchText ? (
                            <>
                                <Search size={48} className="mb-4" />
                                <p className="text-lg">No notes found matching "{searchText}"</p>
                            </>
                        ) : (
                            <>
                                <div className="text-6xl mb-4">📝</div>
                                <p className="text-xl font-medium">No notes here yet.</p>
                                <p className="mt-2">Click the + button to create one!</p>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-wrap items-start justify-center content-start gap-4 pb-20">
                        {filteredNotes.map(note => {
                            const dragControls = useDragControls();
                            return (
                                <StickyNoteItem
                                    key={note.id}
                                    note={note}
                                    onUpdate={updateNote}
                                    onDelete={deleteNote}
                                    onRestore={restoreNote}
                                    onPermanentDelete={permanentDeleteNote}
                                    dragControls={dragControls}
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
