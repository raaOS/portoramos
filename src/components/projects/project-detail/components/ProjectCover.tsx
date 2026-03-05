'use client';

import type { Project, GalleryItem } from '@/types/projects';
import { Compare } from '@/components/ui/Compare';
import Media from '@/components/shared/Media';
import { useImageProtection } from '@/hooks/useImageProtection';

interface ProjectCoverProps {
    project: Project;
    cover: GalleryItem;
    ratio: number;
}

export function ProjectCover({ project, cover, ratio }: ProjectCoverProps) {
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
