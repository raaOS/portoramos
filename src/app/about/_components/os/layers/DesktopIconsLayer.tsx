"use client";

import React from "react";
import dynamic from "next/dynamic";
import { m, LayoutGroup } from "framer-motion";
import DesktopIcon from "../ui/elements/DesktopIcon";
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
    isReady?: boolean;
    handleIconPositionChange: (id: string, x: number, y: number) => void;
    openProjectWindow: (project: Project) => void;
}

export default function DesktopIconsLayer({
    projectIcons,
    isMobile,
    isReady = true,
    handleIconPositionChange,
    openProjectWindow,
}: DesktopIconsLayerProps) {
    // Debug log to verify this version of the file is being served

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
            scale: 0.3, // Start small for "pop" effect
            y: 0,       // EXPLICITLY set y to 0 to prevent any "drop from -60" inheritance
        },
        show: {
            opacity: 1,
            scale: 1,
            y: 0,       // EXPLICITLY set y to 0
            transition: {
                type: "spring",
                stiffness: 400, // Even snappier for "pop"
                damping: 30,    // More damping for premium feel
                mass: 1
            }
        }
    };

    return (
        <div className="absolute inset-0 pointer-events-none">
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
                        style={{
                            position: "absolute",
                            left: icon.x,
                            top: icon.y,
                        }}
                    >
                        <DesktopIcon
                            {...icon}
                            x={0}
                            y={0}
                            icon={!icon.type || icon.type !== 'folder' ? icon.icon : undefined}
                            isMobile={isMobile}
                            priority={icon.priority}
                            onPositionChange={(id, relX, relY) => {
                                handleIconPositionChange(id, icon.x + relX, icon.y + relY);
                            }}
                            onClick={() => {
                                if (icon.data) {
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

        </div>
    );
}
