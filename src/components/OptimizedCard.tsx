"use client"

import { memo, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import type { Project } from '@/types/projects'
import Media from '@/components/shared/Media'
import { resolveCover } from '@/lib/images'

interface OptimizedCardProps {
  project: Project;
  index: number;
}

// Memoized aspect ratio calculation
const calculateAspectRatio = (project: Project): number => {
  if (project.coverWidth && project.coverHeight) {
    const actualRatio = project.coverWidth / project.coverHeight

    // Common aspect ratios with tolerance
    const ratios = [
      { target: 16 / 9, name: '16:9' },    // 1.78
      { target: 4 / 5, name: '4:5' },      // 0.8 
      { target: 1, name: '1:1' },        // 1.0
      { target: 3 / 4, name: '3:4' },      // 0.75
      { target: 4 / 3, name: '4:3' },      // 1.33
      { target: 21 / 9, name: '21:9' },    // 2.33
    ]

    // Find closest standard ratio
    for (const ratio of ratios) {
      if (Math.abs(actualRatio - ratio.target) < 0.1) {
        return ratio.target
      }
    }

    // For non-standard ratios, constrain for better masonry
    if (actualRatio > 2.5) return 2.5  // Max landscape
    if (actualRatio < 0.6) return 0.6  // Max portrait

    return actualRatio
  }
  return 16 / 9 // Default ratio
}

// Memoized cover resolution
const getCoverData = (project: Project) => {
  return resolveCover(project)
}

const OptimizedCard = memo<OptimizedCardProps>(({ project, index }) => {
  const id = `cover-${project.slug}`

  // Memoize expensive calculations
  const cover = useMemo(() => getCoverData(project), [project])
  const ratio = useMemo(() => calculateAspectRatio(project), [project])

  // Memoize tags string
  const tagsString = useMemo(() =>
    project.tags?.join(', ') || '',
    [project.tags]
  )

  // Memoize click handler
  const handleClick = useCallback(() => {
    // Analytics or tracking could go here
  }, [])

  return (
    <Link href={`/works/${project.slug}`} className="block group" onClick={handleClick}>
      <motion.div
        layoutId={id}
        className="overflow-hidden rounded-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
      >
        <div style={{ aspectRatio: ratio }}>
          <Media
            kind={cover.kind}
            src={cover.src}
            poster={cover.poster}
            alt={project.title}
            sizes="(max-width:520px) 100vw, (max-width:1024px) 50vw, 33vw"

            autoplay={project.autoplay ?? true}
            muted={project.muted ?? true}
            loop={project.loop ?? true}
            playsInline={project.playsInline ?? true}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          />
        </div>
      </motion.div>
      <div className="mt-3 flex items-center justify-between">
        <h3 className="text-base font-medium">{project.title}</h3>
        {tagsString && (
          <span className="text-xs text-gray-500">{tagsString}</span>
        )}
      </div>
    </Link>
  )
})

OptimizedCard.displayName = 'OptimizedCard'

export default OptimizedCard