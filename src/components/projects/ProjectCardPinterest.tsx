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
    highlightedTag?: string;
}

export default function ProjectCardPinterest({
    project,
    priority = false,
    videoEnabled = true,
    interactive = true,
    highlightedTag
}: ProjectCardPinterestProps) {
    const { slug, title, tags, likes, shares } = project;
    const cover = resolveCover(project);
    const shouldAutoplay = videoEnabled && (project.autoplay ?? true);

    // Calculate aspect ratio for the image/video container
    const width = project.coverWidth || 800;
    const height = (project.coverHeight && project.coverHeight > 0) ? project.coverHeight : 600;
    const ratio = (width > 0 && height > 0) ? (width / height) : (4 / 3);

    // SMART TAG DISPLAY LOGIC:
    // This logic ensures that if the user is filtering by a specific tag (e.g., "Design"),
    // that specific tag is the one displayed on the card, rather than just the first tag
    // in the list. This provides better feedback to the user on why the card matches.
    // - If highlightedTag matches one of the project's tags -> Show it.
    // - Else -> Show the first tag (default).
    const displayTag = highlightedTag && tags?.some(t => t.toLowerCase() === highlightedTag.toLowerCase())
        ? tags.find(t => t.toLowerCase() === highlightedTag.toLowerCase())
        : tags?.[0];

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
                        // Sweet Spot: Request 384px (Matches next.config.mjs imageSizes)
                        // Balances sharpness with file size.
                        width={384}
                        height={Math.round(384 / ratio)}
                        priority={priority}
                        lazy={!priority}
                        quality={75}
                        autoplay={shouldAutoplay}
                        muted={project.muted ?? true}
                        loop={project.loop ?? true}
                        playsInline={project.playsInline ?? true}
                        className="w-full h-full object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                </div>
            </div>

            {/* Project Info */}
            <div className="mt-3 px-1 space-y-1">
                <div className="flex items-baseline justify-between gap-4">
                    <p className="font-medium text-sm text-gray-900 dark:text-gray-100 leading-tight group-hover:underline decoration-1 underline-offset-2 truncate">
                        {title}
                    </p>
                    {displayTag && (
                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 whitespace-nowrap shrink-0">{displayTag}</p>
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
