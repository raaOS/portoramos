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
    <div
      className={`${ratio < 1 ? 'mx-auto max-w-sm' : ratio === 1 ? 'mx-auto max-w-md' : 'w-full'} p-4 lg:p-6`}
    >
      {project.comparison && project.comparison.beforeImage ? (
        <div
          className="relative h-full w-full overflow-hidden rounded-xl border border-black/5 bg-gray-100 shadow-lg dark:border-white/5 dark:bg-gray-800"
          style={{ aspectRatio: ratio }}
        >
          <Compare
            firstImage={project.comparison.beforeImage}
            secondImage={project.comparison.afterImage || cover.src}
            firstImageClassName="object-cover object-left-top"
            secondImageClassname="object-cover object-left-top"
            className="h-full w-full"
            slideMode="hover"
          />
        </div>
      ) : (
        <div
          className="relative overflow-hidden rounded-xl border border-black/5 bg-gray-100 shadow-lg dark:border-white/5 dark:bg-gray-800"
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
            className="h-auto w-full object-cover"
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
