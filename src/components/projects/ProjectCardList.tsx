'use client';

import Link from 'next/link';
import { Project } from '@/types/projects';
import Media from '@/components/shared/Media';
import { resolveCover } from '@/lib/images';
import { Heart, Share2, ArrowRight } from 'lucide-react';
import { useImageProtection } from '@/hooks/useImageProtection';

interface ProjectCardListProps {
    project: Project;
    priority?: boolean;
    videoEnabled?: boolean;
    highlightedTag?: string;
}

export default function ProjectCardList({
    project,
    priority = false,
    videoEnabled = true,
    highlightedTag
}: ProjectCardListProps) {
    const { slug, title, description, tags, likes, shares, client } = project;
    const cover = resolveCover(project);
    const shouldAutoplay = videoEnabled && (project.autoplay ?? true);
    const { toast, handleContextMenu } = useImageProtection();

    const displayTag = highlightedTag && tags?.some(t => t.toLowerCase() === highlightedTag.toLowerCase())
        ? tags.find(t => t.toLowerCase() === highlightedTag.toLowerCase())
        : tags?.[0];

    return (
        <Link 
            href={`/projects/${slug}`}
            className="group block w-full mb-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 transform-gpu"
        >
            <div className="flex flex-col sm:flex-row h-full">
                {/* Image Section */}
                <div className="w-full sm:w-48 md:w-64 h-48 sm:h-auto relative flex-shrink-0" onContextMenu={handleContextMenu}>
                    <Media
                        kind={cover.kind}
                        src={cover.src}
                        poster={cover.poster}
                        alt={title}
                        width={400}
                        height={300}
                        priority={priority}
                        lazy={!priority}
                        autoplay={shouldAutoplay}
                        muted={project.muted ?? true}
                        loop={project.loop ?? true}
                        playsInline={project.playsInline ?? true}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    {toast && (
                        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center gap-2 z-20">
                            <span className="text-2xl">{toast.emoji}</span>
                            <p className="text-white text-[10px] font-bold text-center px-2">{toast.text}</p>
                        </div>
                    )}
                    
                    {displayTag && (
                        <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 dark:bg-black/90 rounded text-[9px] font-bold uppercase tracking-widest text-neutral-800 dark:text-neutral-200 backdrop-blur-sm">
                            {displayTag}
                        </div>
                    )}
                </div>

                {/* Content Section */}
                <div className="flex-1 p-5 md:p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest leading-none">{client || 'Project'}</p>
                            <div className="flex items-center gap-3 text-neutral-400">
                                <div className="flex items-center gap-1">
                                    <Heart className="w-3.5 h-3.5 fill-current text-rose-500/80" />
                                    <span className="text-xs font-medium leading-none">{likes || 0}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Share2 className="w-3.5 h-3.5 text-sky-500/80" />
                                    <span className="text-xs font-medium leading-none">{shares || 0}</span>
                                </div>
                            </div>
                        </div>
                        <h3 className="text-lg md:text-xl font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 transition-colors duration-300 mb-2">
                            {title}
                        </h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                            {description}
                        </p>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-sm font-bold text-neutral-900 dark:text-neutral-100 group-hover:translate-x-1 transition-transform duration-300">
                        View Project <ArrowRight className="w-4 h-4 text-blue-600" />
                    </div>
                </div>
            </div>
        </Link>
    );
}
