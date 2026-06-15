import React, { useMemo } from 'react';
import Image from 'next/image';
import { Play, Check, Pencil, Trash2 } from 'lucide-react';
import { Wallpaper } from '@/types/about';
import { isVideoLink } from '@/lib/media';
import { buildOptimizedUrl } from './WallpaperManager';

interface WallpaperCardProps {
  wp: Wallpaper;
  isActive: boolean;
  isHovered: boolean;
  isRenaming: boolean;
  renameDraft: string;
  startTimeDraft: string;
  renameInputRef: React.MutableRefObject<HTMLInputElement | null>;
  priority: boolean;
  onSelect: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onStartRename: () => void;
  onRenameDraftChange: (value: string) => void;
  onStartTimeDraftChange: (value: string) => void;
  onCommitRename: () => void;
  onCancelRename: () => void;
  onDelete: () => void;
}

export default function WallpaperCard({
  wp,
  isActive,
  isHovered,
  isRenaming,
  renameDraft,
  startTimeDraft,
  renameInputRef,
  priority,
  onSelect,
  onMouseEnter,
  onMouseLeave,
  onStartRename,
  onRenameDraftChange,
  onStartTimeDraftChange,
  onCommitRename,
  onCancelRename,
  onDelete,
}: WallpaperCardProps) {
  const isVideo = useMemo(() => isVideoLink(wp.url), [wp.url]);
  const videoSrc = useMemo(() => {
    if (!isVideo) return wp.url;
    if (wp.startTime !== undefined) {
      const baseUrl = wp.url.split('#')[0];
      return `${baseUrl}#t=${wp.startTime}`;
    }
    return wp.url;
  }, [wp.url, wp.startTime, isVideo]);

  // Click-to-play: video hanya start saat user hover atau wallpaper aktif.
  // Idle state cuma render poster (kalau ada) atau frame pertama lewat
  // <img>. Tanpa ini semua video preload metadata + autoplay → bandwidth.
  const shouldPlayVideo = isVideo && (isHovered || isActive);

  const optimizedImageSrc = useMemo(() => buildOptimizedUrl(wp.url), [wp.url]);
  const optimizedPosterSrc = useMemo(
    () => (wp.posterUrl ? buildOptimizedUrl(wp.posterUrl) : null),
    [wp.posterUrl]
  );

  return (
    <div
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`group relative aspect-video cursor-pointer overflow-hidden rounded-xl transition-all duration-300 ${
        isActive
          ? 'scale-[1.02] shadow-2xl shadow-blue-500/20 ring-4 ring-blue-500'
          : 'ring-1 ring-gray-200 hover:-translate-y-1 hover:shadow-xl'
      } `}
    >
      {isVideo ? (
        shouldPlayVideo ? (
          <video
            // hanya muncul saat hover/active → preload metadata di
            // titik ini sudah OK karena user benar-benar mau lihat
            src={videoSrc}
            poster={optimizedPosterSrc || undefined}
            muted
            loop
            autoPlay
            playsInline
            preload="metadata"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <>
            {optimizedPosterSrc ? (
              // Poster jpg yang dihasilkan saat upload — ringan,
              // dilewatkan ke next/image agar di-resize ke ukuran
              // card.
              <Image
                src={optimizedPosterSrc}
                alt={wp.name || 'Wallpaper preview'}
                fill
                sizes="(max-width: 768px) 100vw, 600px"
                quality={70}
                priority={priority}
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              // Tidak ada poster → fallback placeholder gelap +
              // tombol play, biar tidak men-download MP4 untuk
              // sekedar thumbnail.
              <div className="flex h-full w-full items-center justify-center bg-gray-900">
                <Play size={32} className="text-white/70" />
              </div>
            )}
            <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-sm">
              <Play size={10} /> Video
            </div>
          </>
        )
      ) : (
        <Image
          src={optimizedImageSrc}
          alt={wp.name || 'Wallpaper preview'}
          fill
          sizes="(max-width: 768px) 100vw, 600px"
          quality={70}
          priority={priority}
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      )}

      {/* Active Badge */}
      <div
        className={`absolute right-4 top-4 rounded-full bg-blue-500 p-2 text-white shadow-lg transition-transform duration-300 ${isActive ? 'scale-100' : 'scale-0'}`}
      >
        <Check size={16} strokeWidth={3} />
      </div>

      {/* Overlay & Info */}
      <div
        className={`absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent p-6 opacity-0 transition-opacity group-hover:opacity-100 ${isActive || isRenaming ? 'opacity-100' : ''}`}
      >
        {isRenaming ? (
          <div className="flex w-full flex-col gap-2" onClick={(e) => e.stopPropagation()}>
            <input
              ref={renameInputRef}
              type="text"
              value={renameDraft}
              maxLength={200}
              onChange={(e) => onRenameDraftChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onCommitRename();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  onCancelRename();
                }
              }}
              placeholder="Wallpaper name"
              className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white placeholder-white/50 drop-shadow-md backdrop-blur-md focus:border-white focus:outline-none"
            />
            {isVideo && (
              <div className="flex items-center gap-2">
                <span className="shrink-0 font-mono text-[10px] text-white/80">
                  Start Time (0-250s):
                </span>
                <input
                  type="number"
                  min="0"
                  max="250"
                  value={startTimeDraft}
                  onChange={(e) => onStartTimeDraftChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      onCommitRename();
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      onCancelRename();
                    }
                  }}
                  placeholder="14"
                  className="w-20 rounded-md border border-white/20 bg-white/10 px-2 py-1 text-xs font-medium text-white placeholder-white/50 drop-shadow-md backdrop-blur-md [appearance:textfield] focus:border-white focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </div>
            )}
            <div className="mt-1 flex justify-end gap-2">
              <button
                type="button"
                onClick={onCancelRename}
                className="rounded bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-white/20"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={onCommitRename}
                className="rounded bg-blue-500 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-blue-600"
              >
                Simpan
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="translate-y-2 transform text-lg font-medium text-white drop-shadow-md transition-transform group-hover:translate-y-0">
              {isActive ? 'Active Wallpaper' : wp.name || 'Wallpaper'}
            </p>
            <span className="mt-1 font-mono text-[10px] uppercase tracking-widest text-white/80">
              {isActive ? 'Applied' : 'Click to Apply'}
            </span>
          </>
        )}
      </div>

      {/* Edit & Delete Actions */}
      {!isRenaming && (
        <div className="absolute left-4 top-4 flex items-center gap-2 opacity-0 transition-all group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStartRename();
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:scale-110 hover:bg-blue-500 hover:text-white"
            title="Rename Wallpaper"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:scale-110 hover:bg-red-500 hover:text-white"
            title="Delete Wallpaper"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
