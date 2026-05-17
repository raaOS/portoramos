'use client';

import type { Project, GalleryItem } from '@/types/projects';
import { Compare } from '@/components/ui/Compare';
import Media from '@/components/shared/Media';
import { useImageProtection } from '@/hooks/useImageProtection';

interface ProjectCoverProps {
    project: Project;
    cover: GalleryItem;
    ratio: number;
    /**
     * Saat true, video cover di-render dengan native controls supaya user bisa
     * play/pause/scrub langsung dari window project tanpa harus buka lightbox.
     */
    isWindowMode?: boolean;
}

export function ProjectCover({ project, cover, ratio, isWindowMode = false }: ProjectCoverProps) {
    const { toast, handleContextMenu } = useImageProtection();

    return (
        <div className={`${ratio < 1 ? 'max-w-sm mx-auto' : ratio === 1 ? 'max-w-md mx-auto' : 'w-full'} p-4 lg:p-6`}>
            {project.comparison && project.comparison.beforeImage ? (
                <div 
                    className="w-full h-full relative rounded-xl overflow-hidden shadow-lg border border-black/5 dark:border-white/5 bg-gray-100 dark:bg-gray-800" 
                    style={{ aspectRatio: ratio }}
                >
                    <Compare
                        firstImage={project.comparison.beforeImage}
                        secondImage={project.comparison.afterImage || cover.src}
                        firstImageClassName="object-cover object-left-top"
                        secondImageClassname="object-cover object-left-top"
                        className="w-full h-full"
                        slideMode="hover"
                    />
                </div>
            ) : (
                <div 
                    className="relative rounded-xl overflow-hidden shadow-lg border border-black/5 dark:border-white/5 bg-gray-100 dark:bg-gray-800" 
                    style={{ aspectRatio: ratio }} 
                    onContextMenu={handleContextMenu}
                >
                    <Media
                        kind={cover.kind}
                        src={cover.src}
                        poster={cover.poster}
                        alt={project.title}
                        width={1600}
                        height={Math.round(1600 / ratio)}
                        priority={true}
                        className="w-full h-auto object-cover"
                        autoplay={project.autoplay ?? true}
                        muted={project.muted ?? true}
                        loop={project.loop ?? true}
                        playsInline={project.playsInline ?? true}
                        // Window mode: aktifkan native controls untuk video supaya
                        // user bisa play/pause/scrub langsung. Di full-page detail
                        // tetap clean (tanpa controls) — visitor pakai lightbox.
                        controls={isWindowMode && cover.kind === 'video'}
                    />
                    {/* Overlay hitam solid saat right-click */}
                    {toast && (
                        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center gap-3">
                            <span className="text-5xl">{toast.emoji}</span>
                            <p className="text-white text-sm font-bold text-center px-6 leading-relaxed">{toast.text}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
