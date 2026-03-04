"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
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
    label: string;
    icon?: React.ReactNode;
    imageUrl?: string;
    videoUrl?: string;
    aspectRatio?: number;
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
    updateNote: (id: string, updates: Partial<NoteData>) => void;
    bringToFrontNote: (id: string) => void;
    deleteNote: (id: string) => void;
    permanentDeleteNote: (id: string) => void;
    restoreNote: (id: string) => void;
    addNote: () => void;
    openProjectWindow: (project: Project) => void;
    isAdmin: boolean;
    isReady?: boolean;
}

export default function DesktopIconsLayer({
    projectIcons,
    isMobile,
    notesVisible,
    notes,
    handleIconPositionChange,
    updateNote,
    bringToFrontNote,
    deleteNote,
    permanentDeleteNote,
    restoreNote,
    addNote,
    openProjectWindow,
    isAdmin,
    isReady = true
}: DesktopIconsLayerProps) {
    const router = useRouter();

    // Parent container animation variants for staggering
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.12, // 120ms delay between each icon dropping
                delayChildren: 1.2,    // Wait 1.2s before starting the stagger, letting the start screen portal expand first
            }
        }
    };

    // Very iOS-like spring animation
    const itemVariants = {
        hidden: {
            opacity: 0,
            scale: 0.5,
            y: -60 // Start higher to feel like a more significant drop
        },
        show: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 250,
                damping: 18,
                mass: 0.8
            }
        }
    };



    return (
        <div className="absolute inset-0 z-10 pointer-events-none">


            {/* Desktop Icons Grid */}
            <m.div
                className="pointer-events-none"
                variants={containerVariants}
                initial="hidden"
                animate={isReady ? "show" : "hidden"}
            >
                {projectIcons.map((icon) => (
                    <m.div
                        key={icon.id}
                        variants={itemVariants}
                        className="pointer-events-none"
                    >
                        <DesktopIcon
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
                    </m.div>
                ))}
            </m.div>

            {/* Sticky Notes Layer */}
            {notesVisible && (
                <m.div
                    className="z-20 pointer-events-none"
                    variants={containerVariants}
                    initial="hidden"
                    animate={isReady ? "show" : "hidden"}
                >
                    {notes.filter(n => !n.isDeleted).map((note) => (
                        <m.div
                            key={note.id}
                            variants={itemVariants}
                            className="pointer-events-none"
                        >
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
                        </m.div>
                    ))}
                </m.div>
            )}
        </div>
    );
}
