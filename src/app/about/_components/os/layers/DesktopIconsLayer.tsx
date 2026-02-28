"use client";

import React from "react";
import dynamic from "next/dynamic";
import DesktopIcon from "../ui/elements/DesktopIcon";
import { DraggableStickyNote } from "../ui/elements/DraggableStickyNote";
import type { NoteData } from "../ui/elements/StickyNoteItem";
import type { Project } from "@/types/projects";

const MacFolder = dynamic(() => import("../windows/MacFolder"), {
    loading: () => <div className="w-16 h-16 bg-gray-200/50 rounded-lg animate-pulse" />,
    ssr: false
});

interface ProjectIcon {
    id: string;
    x: number;
    y: number;
    icon?: React.ReactNode;
    type?: 'project' | 'folder' | string;
    data?: Project;
    action?: () => void;
    priority?: boolean;
}

interface DesktopIconsLayerProps {
    projectIcons: ProjectIcon[];
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
    addNote: () => void;
    isAdmin: boolean;
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
    addNote,
    isAdmin
}: DesktopIconsLayerProps) {
    return (
        <div className="absolute inset-0 z-10 pointer-events-none">
            {/* Desktop Icons Grid */}
            <div className="absolute inset-0 pointer-events-none">
                {projectIcons.map((icon) => (
                    <DesktopIcon
                        key={icon.id}
                        {...icon}
                        icon={!icon.type || icon.type !== 'folder' ? icon.icon : undefined}
                        isMobile={isMobile}
                        priority={icon.priority}
                        onPositionChange={handleIconPositionChange}
                        onClick={() => {
                            if (icon.type === 'project' && icon.data) {
                                openProjectWindow(icon.data);
                            } else if (icon.action) {
                                icon.action();
                            }
                        }}
                    >
                        {icon.type === 'folder' && <MacFolder size={0.85} isStatic={true} />}
                    </DesktopIcon>
                ))}
            </div>

            {/* Sticky Notes Layer */}
            {notesVisible && (
                <div className="absolute inset-0 pointer-events-none z-20">
                    {notes.filter(n => !n.isDeleted).map((note) => (
                        <DraggableStickyNote
                            key={note.id}
                            note={note}
                            updateNote={updateNote}
                            bringToFrontNote={bringToFrontNote}
                            deleteNote={deleteNote}
                            permanentDeleteNote={permanentDeleteNote}
                            restoreNote={restoreNote}
                            addNote={addNote}
                            isAdmin={isAdmin}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
