'use client';

import { memo } from 'react';
import Image from 'next/image';
import { VirtualItem } from './InfiniteCanvasConstants';
import { getCoverPosterUrl, getPreviewCoverUrl, isVideoUrl } from '@/utils/canvas-helpers';

type ProjectCard3DProps = {
  item: VirtualItem;
  initialStyle?: {
    transform?: string;
    opacity?: number;
  };
  onRef: (el: HTMLDivElement | null) => void;
  onNavigate: (slug: string) => void;
};

const ProjectCard3D = memo(
  function ProjectCard3D({ item, initialStyle, onRef, onNavigate }: ProjectCard3DProps) {
    const coverUrl = getPreviewCoverUrl(item.project);
    const posterUrl = getCoverPosterUrl(item.project);
    const isVideo = isVideoUrl(coverUrl);
    const aspect =
      item.project.coverWidth && item.project.coverHeight
        ? item.project.coverWidth / item.project.coverHeight
        : 16 / 9;

    const baseWidth = 700;
    const h = baseWidth / aspect;

    return (
      <div
        ref={onRef}
        className="absolute left-1/2 top-1/2 will-change-transform"
        style={{
          width: baseWidth,
          height: h,
          display: 'block',
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          // Use initial style if provided, otherwise default to hidden to prevent pop-in
          visibility: (initialStyle?.opacity ?? 0) <= 0.001 ? 'hidden' : 'visible',
          opacity: initialStyle?.opacity ?? 0,
          // MATCH: Use numeric offsets like the engine for fallback consistency
          transform:
            initialStyle?.transform ||
            `translate3d(-350px, -${(h / 2).toFixed(1)}px, 9000px) scale(1)`,
          transformStyle: 'preserve-3d',
        }}
        onClick={() => onNavigate(item.project.slug)}
        role="button"
        aria-label={`View project: ${item.project.title}`}
        tabIndex={-1}
      >
        <div className="group relative h-full w-full overflow-hidden rounded-lg bg-white/5">
          {isVideo ? (
            <video
              src={coverUrl}
              poster={posterUrl}
              autoPlay
              muted
              loop
              playsInline
              preload="none"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <Image
              src={coverUrl}
              alt={item.project.title}
              fill
              className="absolute inset-0 object-cover transition-transform duration-500 group-hover:scale-105"
              unoptimized
              loading="eager"
              priority={false}
              sizes="700px"
            />
          )}

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-white/80 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <h3 className="px-4 text-center text-2xl font-bold text-black">{item.project.title}</h3>
            <p className="mt-1 text-sm text-black/50">{item.project.year}</p>
          </div>
        </div>
      </div>
    );
  },
  (prev, next) => {
    // STABILITY FIX: Only re-render if the cell key or project identity actually changes.
    return prev.item.key === next.item.key && prev.item.project.id === next.item.project.id;
  }
);

export default ProjectCard3D;
