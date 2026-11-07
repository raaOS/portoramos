'use client';

// Fullscreen Media Viewer (lightbox) untuk aset Explorer.
// Muncul di ATAS semua window OS via portal ke document.body + Z_LAYERS.CRITICAL_MODAL:
// latar blur, tombol ✕, zoom (scroll / tombol / drag pan), navigasi ←→ antar
// file satu folder, dan strip thumbnail file lain di bawah.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { m, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, FileText, X, ZoomIn, ZoomOut } from 'lucide-react';
import { Z_LAYERS } from '../../utils/zIndexLayers';
import { soundManager } from '../../utils/SoundManager';
import type { ExplorerFile } from '@/types/explorer';
import {
  getExplorerFileDisplayName,
  getExplorerActualFormat,
} from '@/lib/utils/explorerName';
import ExplorerVideoPreview from './ExplorerVideoPreview';
import FileThumbnail from './FileThumbnail';

const MIN_SCALE = 1;
const MAX_SCALE = 5;

interface FullscreenMediaViewerProps {
  file: ExplorerFile | null;
  siblings: ExplorerFile[];
  onClose: () => void;
  onNavigate: (file: ExplorerFile) => void;
}

export default function FullscreenMediaViewer({
  file,
  siblings,
  onClose,
  onNavigate,
}: FullscreenMediaViewerProps) {
  const [mounted, setMounted] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(
    null
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR-safe portal mount (pola sama dengan FlowchartProcess)
    setMounted(true);
  }, []);

  const index = file ? siblings.findIndex((f) => f.id === file.id) : -1;
  const hasMultiple = siblings.length > 1;

  // Navigasi ke file lain + reset zoom/pan (dipakai panah & thumbnail)
  const navigateToFile = useCallback(
    (target: ExplorerFile) => {
      setScale(1);
      setOffset({ x: 0, y: 0 });
      onNavigate(target);
    },
    [onNavigate]
  );

  const goPrev = useCallback(() => {
    if (!file || !hasMultiple) return;
    const prevIndex = index <= 0 ? siblings.length - 1 : index - 1;
    soundManager.play('click');
    navigateToFile(siblings[prevIndex]);
  }, [file, hasMultiple, index, navigateToFile, siblings]);

  const goNext = useCallback(() => {
    if (!file || !hasMultiple) return;
    const nextIndex = index >= siblings.length - 1 ? 0 : index + 1;
    soundManager.play('click');
    navigateToFile(siblings[nextIndex]);
  }, [file, hasMultiple, index, navigateToFile, siblings]);

  // Zoom via scroll (native listener non-passive supaya bisa preventDefault
  // dan tidak menggulir latar di belakang lightbox / memicu Lenis).
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay || !file) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setScale((current) => {
        const next = current + (e.deltaY > 0 ? -0.2 : 0.2);
        const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
        if (clamped === MIN_SCALE) return MIN_SCALE;
        return clamped;
      });
    };

    overlay.addEventListener('wheel', handleWheel, { passive: false });
    return () => overlay.removeEventListener('wheel', handleWheel);
  }, [file]);

  // Keyboard: Escape tutup, panah kiri/kanan navigasi
  useEffect(() => {
    if (!file) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [file, goNext, goPrev, onClose]);

  // Pan (geser gambar saat di-zoom) — pointer events di media stage
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (scale <= MIN_SCALE) return;
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      dragRef.current = { startX: e.clientX, startY: e.clientY, baseX: offset.x, baseY: offset.y };
    },
    [offset.x, offset.y, scale]
  );

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    setOffset({
      x: drag.baseX + (e.clientX - drag.startX),
      y: drag.baseY + (e.clientY - drag.startY),
    });
  }, []);

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const zoomIn = useCallback(() => {
    soundManager.play('click');
    setScale((s) => Math.min(MAX_SCALE, s + 0.5));
  }, []);

  const zoomOut = useCallback(() => {
    soundManager.play('click');
    setScale((s) => {
      const next = Math.max(MIN_SCALE, s - 0.5);
      if (next === MIN_SCALE) setOffset({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const isImage = file?.fileType === 'image';
  const isVideo = file?.fileType === 'video';
  const isZoomable = Boolean(isImage || isVideo);

  const content = useMemo(() => {
    if (!file) return null;
    if (isImage) {
      return (
        <img
          src={file.url}
          alt={getExplorerFileDisplayName(file)}
          draggable={false}
          className="max-h-full max-w-full select-none object-contain shadow-2xl"
          style={{ transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)` }}
        />
      );
    }
    if (isVideo) {
      return (
        <div
          className="h-full w-full"
          style={{ transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)` }}
        >
          <ExplorerVideoPreview key={file.id} file={file} />
        </div>
      );
    }
    return null;
  }, [file, isImage, isVideo, offset.x, offset.y, scale]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {file && (
        <m.div
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          data-lenis-prevent
          className="fixed inset-0 flex flex-col bg-black/70 backdrop-blur-2xl"
          style={{ zIndex: Z_LAYERS.CRITICAL_MODAL }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          {/* Backdrop click-to-close layer (di bawah konten) */}
          <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

          {/* Top bar: nama file + format + close */}
          <div className="relative z-10 flex shrink-0 items-center justify-between gap-4 px-5 py-4 text-white">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {getExplorerFileDisplayName(file)}
              </p>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-white/50">
                {getExplorerActualFormat(file)}
                {siblings.length > 1 ? ` • ${index + 1}/${siblings.length}` : ''}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {isZoomable && (
                <>
                  <button
                    onClick={zoomOut}
                    disabled={scale <= MIN_SCALE}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 active:scale-95 disabled:opacity-30"
                    aria-label="Perkecil"
                    title="Zoom out (scroll bawah)"
                  >
                    <ZoomOut size={18} />
                  </button>
                  <button
                    onClick={zoomIn}
                    disabled={scale >= MAX_SCALE}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 active:scale-95 disabled:opacity-30"
                    aria-label="Perbesar"
                    title="Zoom in (scroll atas)"
                  >
                    <ZoomIn size={18} />
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 active:scale-95"
                aria-label="Tutup"
                title="Tutup (Esc)"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Media stage (tengah) */}
          <div className="relative z-10 min-h-0 flex-1">
            <div
              className={`flex h-full w-full items-center justify-center p-6 sm:p-10 ${
                scale > MIN_SCALE ? 'cursor-grab active:cursor-grabbing' : ''
              }`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onDoubleClick={() => {
                if (scale > MIN_SCALE) {
                  setScale(1);
                  setOffset({ x: 0, y: 0 });
                } else {
                  setScale(2);
                }
              }}
            >
              {content}
            </div>

            {/* Navigasi kiri/kanan */}
            {hasMultiple && (
              <>
                <button
                  onClick={goPrev}
                  className="absolute left-3 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition-all hover:scale-110 hover:bg-white/20 active:scale-95 sm:left-6 sm:h-14 sm:w-14"
                  aria-label="File sebelumnya"
                  title="Sebelumnya (←)"
                >
                  <ChevronLeft size={26} />
                </button>
                <button
                  onClick={goNext}
                  className="absolute right-3 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition-all hover:scale-110 hover:bg-white/20 active:scale-95 sm:right-6 sm:h-14 sm:w-14"
                  aria-label="File berikutnya"
                  title="Berikutnya (→)"
                >
                  <ChevronRight size={26} />
                </button>
              </>
            )}
          </div>

          {/* Strip thumbnail file lain (bawah) */}
          {hasMultiple && (
            <div className="relative z-10 shrink-0 border-t border-white/10 bg-black/30 px-4 py-3">
              <div className="flex items-center justify-center gap-2.5 overflow-x-auto py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {siblings.map((sibling) => {
                  const isActive = sibling.id === file.id;
                  return (
                    <button
                      key={sibling.id}
                      onClick={() => {
                        if (!isActive) {
                          soundManager.play('click');
                          navigateToFile(sibling);
                        }
                      }}
                      title={getExplorerFileDisplayName(sibling)}
                      className={`group flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-lg border p-1 transition-all duration-200 sm:h-[4.5rem] sm:w-16 ${
                        isActive
                          ? 'border-blue-400/60 bg-blue-500/20 ring-2 ring-blue-400/50'
                          : 'border-white/10 bg-white/5 opacity-60 hover:opacity-100 hover:ring-1 hover:ring-white/30'
                      }`}
                    >
                      <div className="pointer-events-none flex h-11 w-10 items-center justify-center overflow-hidden rounded sm:h-12 sm:w-11">
                        <FileThumbnail file={sibling} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Petunjuk singkat */}
          <div className="pointer-events-none relative z-10 hidden shrink-0 items-center justify-center gap-4 pb-2 text-[10px] font-medium text-white/40 sm:flex">
            <span>Scroll = zoom</span>
            <span className="flex items-center gap-1">
              <FileText size={10} /> Klik thumbnail = pilih file
            </span>
            <span>Esc = tutup</span>
          </div>
        </m.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
