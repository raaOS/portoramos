import { memo, useRef } from 'react';
import Image from 'next/image';
import { useTransitionRouter } from 'next-view-transitions';
import { getCoverPosterUrl, getPreviewCoverUrl, isVideoUrl } from '@/utils/canvas-helpers';
import type { CanvasItem } from './infiniteCanvasEngine';

const CARD_WIDTH = 700;

type CanvasCardProps = {
  item: CanvasItem;
  isPriority: boolean;
  registerCardRef: (key: string, element: HTMLDivElement | null) => void;
  registerVideoRef: (key: string, element: HTMLVideoElement | null) => void;
  initialStyle?: React.CSSProperties;
};

export function CanvasCardInner({
  item,
  isPriority,
  registerCardRef,
  registerVideoRef,
  initialStyle,
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
  const eyebrow =
    item.project.type === 'commercial'
      ? 'Proyek Komersial'
      : item.project.type === 'visual_art'
        ? 'Karya Visual'
        : (item.project.tags?.[0] ?? 'Project');
  const metaLine = `${item.project.client} • ${item.project.year}`;

  return (
    <div
      ref={(element) => registerCardRef(item.key, element)}
      data-canvas-card={item.key}
      className="group pointer-events-auto absolute left-1/2 top-1/2 cursor-pointer"
      style={{
        width: CARD_WIDTH,
        height: CARD_WIDTH / aspectRatio,
        display: 'block',
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        contain: 'layout paint style',
        visibility: 'hidden', // Start hidden, rAF loop will reveal
        opacity: 0,
        ...initialStyle,
      }}
      onPointerDown={(e) => {
        pointerStart.current = { x: e.clientX, y: e.clientY };
        dragDistance.current = 0;
      }}
      onPointerUp={(e) => {
        if (!pointerStart.current) return;
        const dx = e.clientX - pointerStart.current.x;
        const dy = e.clientY - pointerStart.current.y;
        dragDistance.current = Math.sqrt(dx * dx + dy * dy);
        pointerStart.current = null;
      }}
      onClick={(e) => {
        // Ignore clicks if the user dragged the canvas more than 10 pixels
        if (dragDistance.current > 10) {
          e.preventDefault();
          return;
        }
        router.push(`/projects/${item.project.slug}`);
      }}
    >
      <div className="relative h-full w-full overflow-hidden rounded-[18px] bg-black/5">
        {isVideo ? (
          <video
            ref={(element) => registerVideoRef(item.key, element)}
            data-src={coverUrl}
            poster={posterUrl}
            muted
            loop
            playsInline
            preload="none"
            {...({ fetchPriority: isPriority ? 'high' : 'low' } as any)}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <Image
            src={coverUrl}
            alt={item.project.title}
            fill
            className="pointer-events-none absolute inset-0 object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, 700px"
            priority={isPriority}
            loading={isPriority ? 'eager' : 'lazy'}
            {...({ fetchPriority: isPriority ? 'high' : 'auto' } as any)}
          />
        )}

        <div className="pointer-events-none absolute inset-0 rounded-[18px] bg-black/[0.02] transition-colors duration-300 group-hover:bg-black/[0.06]" />
        <div className="ring-white/12 pointer-events-none absolute inset-0 rounded-[18px] ring-1 ring-inset transition-all duration-300 group-hover:shadow-[0_0_0_1px_rgba(255,255,255,0.18),0_24px_60px_rgba(15,23,42,0.28)] group-hover:ring-white/45" />
        <div className="via-black/18 pointer-events-none absolute inset-0 rounded-[18px] bg-gradient-to-t from-black/80 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5 sm:p-6">
          <div className="max-w-[82%] translate-y-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <p className="text-white/68 text-[10px] font-medium uppercase tracking-[0.32em]">
              {eyebrow}
            </p>
            <h2 className="mt-2 text-[24px] font-semibold leading-[1.02] text-white [text-shadow:0_8px_24px_rgba(0,0,0,0.35)]">
              {item.project.title}
            </h2>
            <p className="text-white/64 mt-3 truncate text-[11px] uppercase tracking-[0.24em]">
              {metaLine}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export const CanvasCard = memo(CanvasCardInner);
