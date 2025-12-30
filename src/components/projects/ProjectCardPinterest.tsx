'use client';

import Link from 'next/link';
import { Project } from '@/types/projects';
import Media from '@/components/shared/Media';
import { resolveCover } from '@/lib/images';
import { Heart, Share2 } from 'lucide-react';

interface ProjectCardPinterestProps {
    project: Project;
    priority?: boolean;
    videoEnabled?: boolean;
    interactive?: boolean;
}

export default function ProjectCardPinterest({
    project,
    priority = false,
    videoEnabled = true,
    interactive = true
}: ProjectCardPinterestProps) {
    const { slug, title, tags, likes, shares } = project;
    const cover = resolveCover(project);
    const shouldAutoplay = videoEnabled && (project.autoplay ?? true);

    // Calculate aspect ratio for the image/video container
    const width = project.coverWidth || 800;
    const height = project.coverHeight || 600;
    const ratio = width / height;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Component: any = interactive ? Link : 'div';
    const hrefProps = interactive ? { href: `/works/${slug}` } : {};

    return (
        <Component {...hrefProps} className={`block mb-6 relative z-0 ${interactive ? 'group hover:z-10' : ''}`}>
            {/* ... (keep media container) ... */}
            <div
                className={`relative overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800 transition-transform duration-300 ${interactive ? 'hover:scale-[1.02]' : ''}`}
                style={{
                    aspectRatio: ratio,
                    contain: 'layout style paint'
                }}
            >
                <div className="absolute inset-0">
                    <Media
                        kind={cover.kind}
                        src={cover.src}
                        poster={cover.poster}
                        alt={title}
                        // Sweet Spot: Request 400px. 
                        // Balances sharpness (1.6x density) with file size for Lighthouse.
                        width={400}
                        height={Math.round(400 / ratio)}
                        priority={priority}
                        lazy={!priority}
                        autoplay={shouldAutoplay}
                        muted={project.muted ?? true}
                        loop={project.loop ?? true}
                        playsInline={project.playsInline ?? true}
                        className="w-full h-full object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    />
                </div>
            </div>

            {/* Project Info */}
            <div className="mt-3 px-1 space-y-1">
                <div className="flex items-baseline justify-between gap-4">
                    <p className="font-medium text-sm text-gray-900 dark:text-gray-100 leading-tight group-hover:underline decoration-1 underline-offset-2 truncate">
                        {title}
                    </p>
                    {tags?.[0] && (
                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 whitespace-nowrap shrink-0">{tags[0]}</p>
                    )}
                </div>

                {/* Metrics bar */}
                <div className="flex items-center gap-3 text-gray-500">
                    <div className="flex items-center gap-1">
                        <Heart className="w-3 h-3 fill-current text-rose-500" />
                        <span className="text-[10px] font-medium">{likes || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Share2 className="w-3 h-3 text-sky-500" />
                        <span className="text-[10px] font-medium">{shares || 0}</span>
                    </div>
                </div>
            </div>
        </Component>
    );
}
