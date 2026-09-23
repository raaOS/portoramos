import { memo, useRef } from 'react';
import Image from 'next/image';
import { useTransitionRouter } from 'next-view-transitions';
import { getCoverPosterUrl, getPreviewCoverUrl, isVideoUrl } from '@/utils/canvas-helpers';
import { saveCameraState } from '@/lib/canvasCameraPersistence';
import type { CanvasItem } from './infiniteCanvasEngine';
import type { Project } from '@/types/projects';

const CARD_WIDTH = 700;

type CanvasCardProps = {
  item: CanvasItem;
  isPriority: boolean;
  registerCardRef: (key: string, element: HTMLDivElement | null) => void;
  registerVideoRef: (key: string, element: HTMLVideoElement | null) => void;
  initialStyle?: React.CSSProperties;
  isTransitionTarget?: boolean;
  getCamera?: () => { x: number; y: number; z: number };
  onSelectProject?: (
    project: Project,
    originRect?: { x: number; y: number; width: number; height: number }
  ) => void;
};

export function CanvasCardInner({
  item,
  isPriority,
  registerCardRef,
  registerVideoRef,
  initialStyle,
  getCamera,
  onSelectProject,
}: CanvasCardProps) {
  const router = useTransitionRouter();

  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const dragDistance = useRef(0);

  const coverUrl = getPreviewCoverUrl(item.project);
  const posterUrl = getCoverPosterUrl(item.project);
  const isVideo = isVideoUrl(coverUrl);
  const aspectRatio =
    item.project.coverWidth && item.project.coverHeight
      ? item.project.coverWidth / item.project.coverHeight
      : 16 / 9;

  const innerMediaStyle = {
    aspectRatio: `${aspectRatio}`,
  };

  return (
    <div
      ref={(element) => registerCardRef(item.key, element)}
      data-canvas-card={item.key}
      className="absolute left-0 top-0 cursor-pointer overflow-hidden border border-black/10 bg-white/50 shadow-md backdrop-blur-sm transition-[border-color,box-shadow] duration-200 hover:border-black/30 hover:shadow-xl dark:border-white/10 dark:bg-black/50 dark:hover:border-white/30"
      style={{
        width: `${CARD_WIDTH}px`,
        ...initialStyle,
      }}
      onPointerDown={(e) => {
        pointerStart.current = { x: e.clientX, y: e.clientY };
        dragDistance.current = 0;
      }}
      onPointerMove={(e) => {
        if (!pointerStart.current) return;
        const dx = e.clientX - pointerStart.current.x;
        const dy = e.clientY - pointerStart.current.y;
        dragDistance.current = Math.hypot(dx, dy);
      }}
      onPointerUp={() => {
        pointerStart.current = null;
      }}
      onClick={(e) => {
        // Ignore clicks if the user dragged the canvas more than 10 pixels
        if (dragDistance.current > 10) {
          e.preventDefault();
          return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const originRect = {
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        };

        if (onSelectProject) {
          onSelectProject(item.project, originRect);
        } else {
          const camera = getCamera?.();
          if (camera) {
            saveCameraState(camera, item.project.slug, item.key);
          }
          router.push(`/projects/${item.project.slug}`);
        }
      }}
    >
      <div
        className="relative h-full w-full overflow-hidden bg-black/5"
        style={innerMediaStyle}
      >
        {isVideo ? (
          <video
            ref={(element) => registerVideoRef(item.key, element)}
            data-src={coverUrl}
            poster={posterUrl}
            muted
            loop
            playsInline
            className="h-full w-full object-cover"
          />
        ) : (
          <Image
            src={coverUrl}
            alt={item.project.title}
            width={CARD_WIDTH}
            height={Math.round(CARD_WIDTH / aspectRatio)}
            priority={isPriority}
            loading={isPriority ? 'eager' : 'lazy'}
            quality={60}
            className="h-full w-full object-cover"
            sizes="(max-width: 768px) 100vw, 700px"
          />
        )}
      </div>
    </div>
  );
}

export const CanvasCard = memo(CanvasCardInner, (prevProps, nextProps) => {
  return (
    prevProps.item.project.id === nextProps.item.project.id &&
    prevProps.item.key === nextProps.item.key &&
    prevProps.isPriority === nextProps.isPriority &&
    prevProps.isTransitionTarget === nextProps.isTransitionTarget &&
    prevProps.onSelectProject === nextProps.onSelectProject
  );
});
