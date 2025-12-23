'use client';

import Link from 'next/link';
import { Project } from '@/types/projects';
import Media from '@/components/shared/Media';
import { resolveCover } from '@/lib/images';

interface ProjectCardPinterestProps {
    project: Project;
    priority?: boolean;
}

export default function ProjectCardPinterest({ project, priority = false }: ProjectCardPinterestProps) {
    const { slug, title, tags } = project;
    const cover = resolveCover(project);
    const shouldAutoplay = project.autoplay ?? true;

    // Calculate aspect ratio for the image/video container
    const width = project.coverWidth || 800;
    const height = project.coverHeight || 600;
    const ratio = width / height;

    return (
        <Link href={`/work/${slug}`} className="block group mb-6">
            {/* Container with fixed aspect ratio to prevent CLS */}
            <div
                className="relative overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 transition-transform duration-300 hover:scale-[1.02]"
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
                        width={width}
                        height={height}
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

            {/* Project Info - fixed height to prevent CLS */}
            <div className="mt-3 px-1 flex items-baseline justify-between gap-4 min-h-[24px]">
                <p className="font-medium text-sm text-gray-900 leading-tight group-hover:underline decoration-1 underline-offset-2">
                    {title}
                </p>
                {tags?.[0] && (
                    <p className="text-xs text-gray-600 whitespace-nowrap shrink-0">{tags[0]}</p>
                )}
            </div>
        </Link>
    );
}
