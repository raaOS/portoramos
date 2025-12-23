"use client"
import Link from 'next/link';
import type { Project } from '@/types/projects';
import Media from './Media'
import { resolveCover } from '@/lib/images'
import { ArrowUpRight } from 'lucide-react';

export default function Card({ p, animate = true }: { p: Project; animate?: boolean }) {
  const id = `cover-${p.slug}`;
  const cover = resolveCover(p)
  const prefersReducedMotion = false // Simplified for now
  const shouldAutoplay = p.autoplay ?? true
  const enableHover = animate && !prefersReducedMotion

  // Pinterest uses highly rounded corners
  const PIN_ROUNDNESS = "rounded-3xl";

  const calculateRatio = () => {
    if (p.coverWidth && p.coverHeight) {
      return p.coverWidth / p.coverHeight
    }
    return 16 / 9
  }

  const ratio = calculateRatio()

  return (
    <Link
      href={`/work/${p.slug}`}
      className="block group relative mb-4 break-inside-avoid"
      aria-label={`View project: ${p.title}`}
    >
      <div className={`relative overflow-hidden ${PIN_ROUNDNESS} bg-gray-100 dark:bg-gray-800`}>
        <div style={{ aspectRatio: ratio }} className="relative">
          <Media
            kind={cover.kind}
            src={cover.src}
            poster={cover.poster}
            alt={p.title}
            sizes="(max-width:520px) 100vw, (max-width:1024px) 50vw, 33vw"
            width={p.coverWidth || 1600}
            height={p.coverHeight || 1000}
            autoplay={shouldAutoplay}
            muted={p.muted ?? true}
            loop={p.loop ?? true}
            playsInline={p.playsInline ?? true}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />

          {/* Pinterest-style Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-6">
            <div className="self-end">
              <button className="bg-red-600 text-white font-bold px-5 py-3 rounded-full hover:bg-red-700 transform translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-75 shadow-lg">
                Save
              </button>
            </div>

            <div className="transform translate-y-[10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-100">
              <div className="bg-white/90 backdrop-blur-md self-start inline-flex items-center gap-2 px-4 py-2 rounded-full text-black font-medium text-sm shadow-sm hover:bg-white transition-colors">
                <span>View Project</span>
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Minimalist Info Below (Optional, Pinterest often hides this or keeps it very subtle) */}
      <div className="mt-2 px-1">
        <h3 className="font-medium text-sm text-gray-900 leading-tight group-hover:underline decoration-1 underline-offset-2">
          {p.title}
        </h3>
        {p.tags?.[0] && (
          <p className="text-xs text-gray-500 mt-0.5">{p.tags[0]}</p>
        )}
      </div>
    </Link>
  );
}
