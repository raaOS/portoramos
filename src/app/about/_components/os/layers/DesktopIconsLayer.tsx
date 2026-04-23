"use client";

import React from "react";
import dynamic from "next/dynamic";
import { m } from "motion/react";
import { useState } from "react";
import DesktopIcon from "../ui/elements/DesktopIcon";
import { useQuickLook } from "@/hooks/useQuickLook";
import QuickLookModal from "@/components/ui/QuickLookModal";
import { resolveCover } from "@/lib/images";
import type { Project } from "@/types/projects";
import { useDesktopWindowContext } from "../context/DesktopWindowContext";

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

function DesktopIconsLayer({
    projectIcons,
    isMobile,
    isReady = true,
    handleIconPositionChange,
    openProjectWindow,
}: DesktopIconsLayerProps) {
    const { windows } = useDesktopWindowContext();
    const [hoveredIconId, setHoveredIconId] = useState<string | null>(null);
    const [selectedIconId, setSelectedIconId] = useState<string | null>(null);
    const [quickLookIcon, setQuickLookIcon] = useState<ProjectIcon | null>(null);

    useQuickLook(!!hoveredIconId && !quickLookIcon, () => {
        const icon = projectIcons.find(p => p.id === hoveredIconId);
        if (icon) setQuickLookIcon(icon);
    });

    // Parent container animation variants for staggering
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08,
                delayChildren: 0.12,
            }
        }
    };

    // Very iOS-like spring animation
    const itemVariants = {
        hidden: {
            opacity: 0,
            scale: 0.3,
            y: 0,
        },
        show: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 400,
                damping: 30,
                mass: 1
            }
        }
    };

    return (
        <>
        <div 
            className="absolute inset-0 pointer-events-auto"
            onClick={() => setSelectedIconId(null)}
        >
            {/* Desktop Icons Grid */}
            <m.div
                className="pointer-events-none relative h-full w-full"
                variants={containerVariants}
                initial="hidden"
                animate={isReady ? "show" : "hidden"}
            >
                {projectIcons.map((icon) => {
                    const isSelected = selectedIconId === icon.id;
                    const isOpen = windows.some(w => w.id === icon.id || w.id.includes(icon.id));

                    return (
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
                                isSelected={isSelected}
                                onHoverStart={setHoveredIconId}
                                onHoverEnd={(id) => setHoveredIconId(prev => prev === id ? null : prev)}
                                onPositionChange={(id, relX, relY) => {
                                    handleIconPositionChange(id, icon.x + relX, icon.y + relY);
                                }}
                                onClick={() => {
                                    setSelectedIconId(icon.id);
                                }}
                                onDoubleClick={() => {
                                    if (icon.data) {
                                        openProjectWindow(icon.data);
                                    } else if (icon.action) {
                                        icon.action();
                                    }
                                }}
                            >
                                {icon.type === 'folder' && <MacFolder size={0.85} isStatic={true} open={isOpen} />}
                            </DesktopIcon>
                        </m.div>
                    );
                })}
            </m.div>

        </div>

            {/* Global Quick Look Modal for Desktop */}
            {quickLookIcon && (() => {
                let type = 'project';
                let url = '';
                
                if (quickLookIcon.data) {
                    const cover = resolveCover(quickLookIcon.data);
                    type = cover.kind;
                    url = cover.src;
                } else if (quickLookIcon.videoUrl) {
                    type = 'video';
                    url = quickLookIcon.videoUrl;
                } else if (quickLookIcon.imageUrl) {
                    type = 'image';
                    url = quickLookIcon.imageUrl;
                }

                return (
                    <QuickLookModal
                        isOpen={!!quickLookIcon}
                        onClose={() => setQuickLookIcon(null)}
                        title={quickLookIcon.data?.title || quickLookIcon.label || 'Quick Look'}
                        type={type as 'image' | 'video' | 'pdf' | 'text' | 'project'}
                        url={url}
                        metadata={quickLookIcon.data?.tags?.join(', ') || quickLookIcon.type}
                        onGoToDetail={() => {
                            setQuickLookIcon(null);
                            if (quickLookIcon.data) {
                                openProjectWindow(quickLookIcon.data);
                            } else if (quickLookIcon.action) {
                                quickLookIcon.action();
                            }
                        }}
                    />
                );
            })()}
        </>
    );
}

export default React.memo(DesktopIconsLayer);
