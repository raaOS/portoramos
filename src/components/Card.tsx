"use client"
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Project } from '@/types';
import Media from '@/components/Media'
import { resolveCover } from '@/lib/images'

export default function Card({ p, animate = true }: { p: Project; animate?: boolean }) {
  const id = `cover-${p.slug}`;
  const cover = resolveCover(p)
  const prefersReducedMotion = false // Simplified for now
  const shouldAutoplay = p.autoplay ?? true

  // Use exact aspect ratio from image dimensions - no cropping, no limits
  const calculateRatio = () => {
    if (p.coverWidth && p.coverHeight) {
      // Use the exact ratio from the image - no approximation, no limits
      return p.coverWidth / p.coverHeight
    }
    return 16 / 9 // Default ratio only if dimensions not available
  }

  const ratio = calculateRatio()

  // Configure motion props; disable on reduced motion or when explicitly requested
  const motionProps = (prefersReducedMotion || !animate)
    ? { initial: false as const }
    : { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } }

  return (
    <Link
      href={`/work/${p.slug}`}
      className="block group focus:outline-none rounded-2xl"
      aria-label={`View project: ${p.title}${p.description ? ` - ${p.description}` : ''}`}
      role="article"
    >
      <motion.div
        className="relative"
        whileHover="hover"
        whileTap="tap"
      >
        <motion.div
          layoutId={id}
          className="overflow-hidden rounded-2xl relative"
          {...motionProps}
          variants={{
            hover: {
              y: -8,
              transition: { duration: 0.3, ease: "easeOut" }
            },
            tap: { scale: 0.98 }
          }}
        >
          <div style={{ aspectRatio: ratio }} role="img" aria-label={`${p.title} project preview`}>
            <Media
              kind={cover.kind}
              src={cover.src}
              poster={cover.poster}
              alt={`${p.title} project preview${p.description ? ` - ${p.description}` : ''}`}
              sizes="(max-width:520px) 100vw, (max-width:1024px) 50vw, 33vw"
              width={p.coverWidth || 1600}
              height={p.coverHeight || 1000}
              priority={false}
              autoplay={shouldAutoplay}
              muted={p.muted ?? true}
              loop={p.loop ?? true}
              playsInline={p.playsInline ?? true}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Creative Agency Style Overlay */}
            <motion.div
              className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
            />

            {/* View Project Indicator */}
            <motion.div
              className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              initial={{ scale: 0.8, opacity: 0 }}
              whileHover={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="bg-white/90 backdrop-blur-sm rounded-full p-2">
                <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
      <div className="mt-3 flex items-center justify-between">
        <h3 className="card-title font-serif text-gray-900 dark:text-white" id={`title-${p.slug}`}>{p.title}</h3>
        {p.tags && p.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {p.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full"
                aria-label={`Project tag: ${tag}`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
