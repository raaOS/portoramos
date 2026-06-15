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
  const coverFrameClassName = `relative overflow-hidden ${
    isWindowMode ? 'rounded-none' : 'rounded-xl'
  } border border-black/5 bg-gray-100 shadow-lg dark:border-white/5 dark:bg-gray-800`;
  const comparisonMediaClassName = isWindowMode
    ? 'rounded-none object-cover object-left-top'
    : 'object-cover object-left-top';
  const coverMediaClassName = isWindowMode
    ? 'h-auto w-full rounded-none object-cover'
    : 'h-auto w-full object-cover';

  return (
    <div
      className={`${ratio < 1 ? 'mx-auto max-w-sm' : ratio === 1 ? 'mx-auto max-w-md' : 'w-full'} p-4 lg:p-6`}
    >
      {project.comparison && project.comparison.beforeImage ? (
        <div className={`h-full w-full ${coverFrameClassName}`} style={{ aspectRatio: ratio }}>
          <Compare
            firstImage={project.comparison.beforeImage}
            secondImage={project.comparison.afterImage || cover.src}
            firstImageClassName={comparisonMediaClassName}
            secondImageClassname={comparisonMediaClassName}
            className={isWindowMode ? 'h-full w-full rounded-none' : 'h-full w-full'}
            slideMode="hover"
          />
        </div>
      ) : (
        <div
          className={coverFrameClassName}
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
            className={`${coverMediaClassName} ${
              isWindowMode && cover.kind === 'video' ? 'project-window-video' : ''
            }`}
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
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black">
              <span className="text-5xl">{toast.emoji}</span>
              <p className="px-6 text-center text-sm font-bold leading-relaxed text-white">
                {toast.text}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
