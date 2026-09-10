import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { CalendarDays, Images, ExternalLink } from 'lucide-react';
import type { ResolvedEventPage } from '@/types/event-page';
import type { GalleryItem } from '@/types/projects';
import { getProxiedUrl } from '@/lib/utils';

const _formatDate = (dateStr?: string) => {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/** Responsive masonry column count based on gallery size and screen size. */
function useMasonryColumns(fileCount: number, containerWidth: number) {
  if (containerWidth < 280 || fileCount <= 1) {
    return 1;
  }
  if (containerWidth < 480 || fileCount <= 2) {
    return 2;
  }
  if (containerWidth < 768) {
    return 3;
  }
  return 2; // Perfect count for span-5 container layout on desktop
}

export default function EventLandingPage({
  page,
  onOpenLightbox,
}: {
  page: ResolvedEventPage;
  onOpenLightbox: (items: GalleryItem[], index: number) => void;
}) {
  const cover = page.coverFile;
  const heroColor = page.headerColor || '#0f172a';

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setContainerWidth(entries[0].contentRect.width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const isCompact = containerWidth < 768;

  // Masonry: calculate based on local container width rather than viewport width
  const galleryWidth = isCompact ? containerWidth : (containerWidth * 5) / 12;
  const masonryColumns = useMasonryColumns(page.galleryFiles.length, galleryWidth);

  return (
    <article
      ref={containerRef}
      className="mx-auto max-w-5xl overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-[#111]"
    >
      {/* ── Hero Header ── */}
      <section
        className="relative min-h-[300px] overflow-hidden text-white"
        style={!cover ? { backgroundColor: heroColor } : undefined}
      >
        {!cover && (
          <div className="absolute inset-0 bg-gradient-to-tr from-black/30 via-transparent to-white/10 mix-blend-overlay" />
        )}
        {cover ? (
          <Image
            src={getProxiedUrl(cover.thumbnailUrl || cover.url)}
            alt={cover.name}
            fill
            priority
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-105"
            draggable={false}
            sizes="100vw"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
        <div className="relative z-10 flex min-h-[300px] flex-col justify-end p-6 sm:p-8">
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/90 backdrop-blur-md">
              <CalendarDays size={10} />
              {_formatDate(page.updatedAt)}
            </span>
          </div>

          <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-white drop-shadow-md sm:text-4xl">
            {page.title}
          </h1>

          {page.subtitle && (
            <p className="max-w-2xl text-sm font-light text-white/80 drop-shadow-sm sm:text-base">
              {page.subtitle}
            </p>
          )}
        </div>
      </section>

      {/* ── Main Layout Grid ── */}
      <div className={`grid gap-8 p-6 sm:p-8 ${isCompact ? 'grid-cols-1' : 'grid-cols-12'}`}>
        <div className={isCompact ? 'col-span-1 space-y-8' : 'col-span-7 space-y-8'}>
          {/* Overview */}
          <div className="rounded-xl border border-black/5 bg-slate-50/50 p-5 dark:border-white/5 dark:bg-white/[0.01]">
            <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-[#03AC0E]">
              Overview
            </h3>
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-300 sm:text-base">
              {page.description}
            </p>
          </div>

          {/* Sections Storytelling */}
          {page.sections.length > 0 && (
            <div className="space-y-8 pt-4">
              {page.sections.map((section) => {
                const files = page.sectionFiles[section.id] || [];
                return (
                  <div
                    key={section.id}
                    className="border-l-2 border-[#03AC0E]/30 py-1 pl-4 transition-all hover:border-[#03AC0E]"
                  >
                    {section.title && (
                      <h4 className="mb-2 text-base font-bold text-slate-900 dark:text-white sm:text-lg">
                        {section.title}
                      </h4>
                    )}
                    {section.body && (
                      <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                        {section.body}
                      </p>
                    )}
                    {files.length > 0 && (
                      <div
                        className={`mt-4 grid gap-3 ${files.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}
                      >
                        {files.map((file) => (
                          <button
                            key={file.id}
                            onClick={(e) => {
                              e.preventDefault();
                              const items = files.map((f) => ({
                                kind:
                                  f.fileType === 'video' ? ('video' as const) : ('image' as const),
                                src: f.url,
                                poster: f.thumbnailUrl || undefined,
                                alt: f.name,
                              }));
                              const idx = files.findIndex((f) => f.id === file.id);
                              onOpenLightbox(items, idx >= 0 ? idx : 0);
                            }}
                            className="group relative block w-full overflow-hidden rounded-none border border-black/5 bg-slate-100 text-left dark:border-white/5 dark:bg-white/[0.02]"
                          >
                            <Image
                              src={getProxiedUrl(file.thumbnailUrl || file.url)}
                              alt={file.name}
                              width={file.metadata?.width || 800}
                              height={file.metadata?.height || 600}
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              className="block h-auto w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                              loading="lazy"
                              onContextMenu={(e) => e.preventDefault()}
                            />
                            <span className="pointer-events-none absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/70 via-black/10 to-transparent p-3 text-[10px] font-semibold text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                              <span className="truncate">{file.name}</span>
                              <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Masonry Showcase Gallery */}
        <div className={isCompact ? 'col-span-1 space-y-6' : 'col-span-5 space-y-6'}>
          <div className="flex items-center gap-2 border-b border-black/5 pb-2 dark:border-white/5">
            <Images size={16} className="text-[#03AC0E]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Gallery Showcase
            </h3>
          </div>

          {page.galleryFiles.length > 0 ? (
            <div className="flex items-start gap-3">
              {Array.from({ length: masonryColumns }).map((_, colIndex) => {
                const columnFiles = page.galleryFiles.filter(
                  (_, fileIndex) => fileIndex % masonryColumns === colIndex
                );
                return (
                  <div key={colIndex} className="flex flex-1 flex-col gap-3">
                    {columnFiles.map((file) => (
                      <button
                        key={file.id}
                        onClick={(e) => {
                          e.preventDefault();
                          const items = page.galleryFiles.map((f) => ({
                            kind: f.fileType === 'video' ? ('video' as const) : ('image' as const),
                            src: f.url,
                            poster: f.thumbnailUrl || undefined,
                            alt: f.name,
                          }));
                          const idx = page.galleryFiles.findIndex((f) => f.id === file.id);
                          onOpenLightbox(items, idx >= 0 ? idx : 0);
                        }}
                        className="group relative block w-full overflow-hidden rounded-none border border-black/5 bg-slate-50 text-left dark:border-white/5 dark:bg-white/[0.01]"
                      >
                        <Image
                          src={getProxiedUrl(file.thumbnailUrl || file.url)}
                          alt={file.name}
                          width={file.metadata?.width || 800}
                          height={file.metadata?.height || 600}
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="block h-auto w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          loading="lazy"
                          onContextMenu={(e) => e.preventDefault()}
                        />
                        <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2.5 pt-8 text-[11px] font-semibold text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                          <span className="truncate">{file.name}</span>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" />
                        </span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-black/10 p-8 text-center text-xs text-slate-400 dark:border-white/10">
              No gallery images in this event page.
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
