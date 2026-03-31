'use client';

import type { Project, GalleryItem, GalleryGroup } from '@/types/projects';
import Media from '@/components/shared/Media';
import GalleryGroupCard from '@/components/projects/GalleryGroupCard';
import MasonryGrid from '@/components/layout/MasonryGrid';
import { useImageProtection } from '@/hooks/useImageProtection';
import { useMemo } from 'react';

interface ProjectGalleryProps {
    project: Project;
    gallery: GalleryItem[];
    onGroupClick: (group: GalleryGroup) => void;
}

export function ProjectGallery({ project, gallery, onGroupClick }: ProjectGalleryProps) {
    const { toast, handleContextMenu } = useImageProtection();

    const hasLegacyGallery = gallery && gallery.length > 0;
    const hasGroupedGallery = project.galleryGroups && project.galleryGroups.length > 0;

    if (!hasLegacyGallery && !hasGroupedGallery) return null;

    return (
        <div className="mt-0 font-sans">
            {/* Legacy Flat Gallery */}
            {hasLegacyGallery && (
                <div className="mb-12">
                    <h3 className="text-xs font-bold uppercase tracking-wider mb-6 text-gray-400">Project Gallery</h3>
                    <MasonryGrid columns="bottom">
                        {gallery.map((item, idx) => (
                            <GalleryItem
                                key={`gallery-item-${idx}`}
                                item={item}
                                projectTitle={project.title}
                                index={idx}
                                onContextMenu={handleContextMenu}
                                toast={toast}
                            />
                        ))}
                    </MasonryGrid>
                </div>
            )}

            {/* Grouped Gallery - Card Stack UI */}
            {hasGroupedGallery && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                    {project.galleryGroups!.map((group, gIdx) => (
                        <GalleryGroupCard
                            key={group.id || gIdx}
                            group={group}
                            onClick={() => onGroupClick(group)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// Separate component for gallery item to prevent unnecessary re-renders
interface GalleryItemProps {
    item: GalleryItem;
    projectTitle: string;
    index: number;
    onContextMenu: (e: React.MouseEvent) => void;
    toast: { emoji: string; text: string } | null;
}

function GalleryItem({ item, projectTitle, index, onContextMenu, toast }: GalleryItemProps) {
    // Memoize style object
    const style = useMemo(() => ({
        aspectRatio: item.width && item.height ? `${item.width}/${item.height}` : undefined,
        minHeight: (!item.width || !item.height) ? '300px' : 'auto'
    }), [item.width, item.height]);

    return (
        <div
            className={`relative rounded-xl overflow-hidden shadow-md border border-black/5 dark:border-white/5 bg-gray-50 dark:bg-gray-900/40 group mb-4`}
            style={style}
            onContextMenu={onContextMenu}
        >
            <Media
                kind={item.kind}
                src={item.src}
                poster={item.poster}
                alt={`${projectTitle} gallery ${index + 1}`}
                width={1200}
                height={item.height && item.width ? Math.round(1200 / (item.width / item.height)) : 800}
                lazy={true}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                autoplay={true}
                muted={true}
                loop={true}
                playsInline={true}
            />
            {toast && (
                <div className="absolute inset-0 bg-black flex flex-col items-center justify-center gap-2">
                    <span className="text-4xl">{toast.emoji}</span>
                    <p className="text-white text-xs font-bold text-center px-4 leading-snug">{toast.text}</p>
                </div>
            )}
        </div>
    );
}
