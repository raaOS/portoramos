"use client";

import React from "react";
import dynamic from "next/dynamic";
import DesktopIcon from "../DesktopIcon";
import { DraggableStickyNote } from "../DraggableStickyNote";
import type { NoteData } from "../StickyNoteItem";
import type { Project } from "@/types/projects";

const MacFolder = dynamic(() => import("../MacFolder"), {
    loading: () => <div className="w-16 h-16 bg-gray-200/50 rounded-lg animate-pulse" />,
    ssr: false
});

interface DesktopIconsLayerProps {
    projectIcons: any[];
    isMobile: boolean;
    notesVisible: boolean;
    notes: NoteData[];
    handleIconPositionChange: (id: string, x: number, y: number) => void;
    openProjectWindow: (project: Project) => void;
    updateNote: (id: string, updates: Partial<NoteData>) => void;
    bringToFrontNote: (id: string) => void;
    deleteNote: (id: string) => void;
    permanentDeleteNote: (id: string) => void;
    restoreNote: (id: string) => void;
    isAdmin: boolean;
    setNotesVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function DesktopIconsLayer({
    projectIcons,
    isMobile,
    notesVisible,
    notes,
    handleIconPositionChange,
    openProjectWindow,
    updateNote,
    bringToFrontNote,
    deleteNote,
    permanentDeleteNote,
    restoreNote,
    isAdmin,
    setNotesVisible
}: DesktopIconsLayerProps) {
    return (
        <div className="absolute inset-0 z-10 pointer-events-none">
            {projectIcons.map((icon: any) => {
                const isFolder = icon.type === 'folder';

                return (
                    <DesktopIcon
                        key={icon.id}
                        {...icon}
                        icon={!isFolder ? icon.icon : undefined}
                        isMobile={isMobile}
                        priority={icon.priority}
                        onPositionChange={handleIconPositionChange}
                        onClick={() => {
                            if (isFolder && icon.action) icon.action();
                            else if (icon.type === 'project') openProjectWindow(icon.data);
                        }}
                    >
                        {isFolder && <MacFolder size={0.85} isStatic={true} />}
                    </DesktopIcon>
                );
            })}

            {/* Sticky Notes - Only show when toggled visible */}
            {notesVisible && (
                <>
                    {notes.filter(n => !n.isDeleted).map(note => (
                        <DraggableStickyNote
                            key={note.id}
                            note={note}
                            updateNote={updateNote}
                            bringToFrontNote={bringToFrontNote}
                            deleteNote={(id) => {
                                deleteNote(id);
                                // If this was the last visible note, turn off the dock indicator
                                const visibleCount = notes.filter(n => !n.isDeleted).length;
                                if (visibleCount <= 1) {
                                    setNotesVisible(false);
                                }
                            }}
                            permanentDeleteNote={permanentDeleteNote}
                            restoreNote={restoreNote}
                            isAdmin={isAdmin}
                        />
                    ))}
                </>
            )}
        </div>
    );
}
