'use client';

import type { Project, GalleryItem } from '@/types/projects';
import { Compare } from '@/components/ui/compare';
import Media from '@/components/shared/Media';
import { useImageProtection } from '@/hooks/useImageProtection';
import {
  PROJECT_COVER_TRANSITION_ATTRIBUTE,
  PROJECT_COVER_TRANSITION_NAME,
} from '@/lib/projectCoverTransition';

interface ProjectCoverProps {
  project: Project;
  cover: GalleryItem;
  ratio: number;
  /**
   * Saat true, video cover di-render dengan native controls supaya user bisa
   * play/pause/scrub langsung dari window project tanpa harus buka lightbox.
   */
  isWindowMode?: boolean;
  /**
   * Mengaktifkan view-transition-name 'project-cover' pada cover frame
   * untuk shared element morph saat navigasi antar halaman.
   * Default: true saat !isWindowMode, false saat isWindowMode.
   * Bisa di-override secara eksplisit saat komponen parent membutuhkan
   * isWindowMode=true untuk styling tapi tetap ingin morph transition aktif.
   */
  enableViewTransition?: boolean;
}

export function ProjectCover({ project, cover, ratio, isWindowMode = false, enableViewTransition }: ProjectCoverProps) {
  const { toast, handleContextMenu } = useImageProtection();
  const coverFrameClassName = `relative overflow-hidden rounded-none border border-black/5 bg-gray-100 dark:border-white/5 dark:bg-gray-800 ${isWindowMode ? 'shadow-lg' : 'shadow-none'}`;
  const comparisonMediaClassName = 'rounded-none object-cover object-left-top';
  const coverMediaClassName = 'h-auto w-full rounded-none object-cover';

  // Default: enable VT when not in window mode, but allow explicit override
  const shouldEnableVT = enableViewTransition ?? !isWindowMode;
  const viewTransitionStyle = shouldEnableVT
    ? { viewTransitionName: PROJECT_COVER_TRANSITION_NAME }
    : {};
  const transitionAttribute = shouldEnableVT ? { [PROJECT_COVER_TRANSITION_ATTRIBUTE]: '' } : {};

  return (
    <div
      className={`${ratio < 1 ? 'mx-auto max-w-sm' : ratio === 1 ? 'mx-auto max-w-md' : 'w-full'} p-4 lg:p-6`}
    >
      {project.comparison && project.comparison.beforeImage ? (
        <div
          className={`h-full w-full ${coverFrameClassName}`}
          style={{ aspectRatio: ratio, ...viewTransitionStyle } as React.CSSProperties}
          {...transitionAttribute}
        >
          <Compare
            firstImage={project.comparison.beforeImage}
            secondImage={project.comparison.afterImage || cover.src}
            firstMediaType={project.comparison.beforeType}
            secondMediaType={
              project.comparison.afterImage ? project.comparison.afterType : cover.kind
            }
            firstImageClassName={comparisonMediaClassName}
            secondImageClassname={comparisonMediaClassName}
            className={isWindowMode ? 'h-full w-full rounded-none' : 'h-full w-full'}
            slideMode="hover"
          />
        </div>
      ) : (
        <div
          className={coverFrameClassName}
          style={{ aspectRatio: ratio, ...viewTransitionStyle } as React.CSSProperties}
          onContextMenu={handleContextMenu}
          {...transitionAttribute}
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
