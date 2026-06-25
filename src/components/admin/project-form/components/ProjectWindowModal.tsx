import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ProjectWindowModalProps {
  title: string;
  onClose: () => void | Promise<void>;
  actions?: ReactNode;
  children: ReactNode;
}

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
}

export default function ProjectWindowModal({
  title,
  onClose,
  actions,
  children,
}: ProjectWindowModalProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef<DragState | null>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        void onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleTitlebarPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) return;

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
    };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleTitlebarPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    const maxX = window.innerWidth * 0.42;
    const maxY = window.innerHeight * 0.42;
    const nextX = dragState.originX + event.clientX - dragState.startX;
    const nextY = dragState.originY + event.clientY - dragState.startY;

    setPosition({
      x: Math.max(-maxX, Math.min(maxX, nextX)),
      y: Math.max(-maxY, Math.min(maxY, nextY)),
    });
  };

  const handleTitlebarPointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    dragStateRef.current = null;
    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center overflow-hidden bg-slate-950/45 p-0 backdrop-blur-[2px] md:p-6">
      <div className="absolute inset-0" onClick={() => void onClose()} />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-window-title"
        className="relative z-10 flex h-[100dvh] w-full flex-col overflow-hidden rounded-none border border-white/70 bg-white text-left shadow-2xl transition-shadow md:h-[min(860px,calc(100dvh-3rem))] md:max-w-[1268px] md:rounded-[18px]"
        style={{ transform: `translate3d(${position.x}px, ${position.y}px, 0)` }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className={`flex h-14 flex-shrink-0 touch-none select-none items-center justify-between gap-4 bg-white px-4 md:h-[58px] md:px-6 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onPointerDown={handleTitlebarPointerDown}
          onPointerMove={handleTitlebarPointerMove}
          onPointerUp={handleTitlebarPointerEnd}
          onPointerCancel={handleTitlebarPointerEnd}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden items-center gap-1.5 md:flex" aria-hidden="true">
              <span className="h-3 w-3 rounded-full bg-red-400" />
              <span className="h-3 w-3 rounded-full bg-amber-300" />
              <span className="h-3 w-3 rounded-full bg-emerald-400" />
            </div>
            <h3
              id="project-window-title"
              className="min-w-0 truncate text-base font-bold tracking-tight text-slate-900"
            >
              {title}
            </h3>
          </div>

          <button
            type="button"
            onClick={() => void onClose()}
            onPointerDown={(event) => event.stopPropagation()}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
            aria-label="Tutup form proyek"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white px-4 py-4 md:px-6 md:py-5"
          data-lenis-prevent
        >
          {children}
        </div>

        {actions && (
          <div className="flex-shrink-0 border-t border-slate-200 bg-slate-50/95 px-4 py-4 md:px-6">
            {actions}
          </div>
        )}
      </section>
    </div>,
    document.body
  );
}
