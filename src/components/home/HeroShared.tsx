"use client"
import Media from '@/components/shared/Media'
import { useState, useEffect } from 'react'

export default function HeroShared({ layoutId, src, alt, kind = 'image', poster, priority = false, ratio, autoplay = true, muted = true, loop = true, playsInline = true, onVideoRef }: { layoutId: string; src: string; alt: string; kind?: 'image' | 'video'; poster?: string; priority?: boolean; ratio?: number; autoplay?: boolean; muted?: boolean; loop?: boolean; playsInline?: boolean; onVideoRef?: (ref: React.RefObject<HTMLVideoElement>) => void }) {
  const prefersReducedMotion = false // Simplified for now
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null)

  // Pass videoRef to parent component
  useEffect(() => {
    if (onVideoRef && videoRef) {
      onVideoRef({ current: videoRef });
    }
  }, [videoRef, onVideoRef]);

  // Determine object-fit strategy based on aspect ratio
  const getObjectFit = () => {
    if (!ratio) return 'object-cover'

    // Portrait videos (height > width) - use contain to keep original ratio
    if (ratio < 1) {
      return 'object-contain'
    }

    // Landscape/square videos - use cover for better visual
    return 'object-cover'
  }

  return (
    <div
      className="w-full h-full max-h-[80vh] portrait:max-h-[85vh]"
      style={{
        aspectRatio: ratio || 16 / 9,
      } as React.CSSProperties}
    >
      <Media
        layoutId={layoutId}
        kind={kind}
        src={src}
        poster={poster}
        alt={alt}
        priority={priority}
        lazy={false}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 800px"
        autoplay={!prefersReducedMotion && autoplay}
        muted={muted}
        loop={loop}
        playsInline={playsInline}
        className={`w-full h-full ${getObjectFit()}`}
        ref={kind === 'video' ? setVideoRef : undefined}
      />
    </div>
  )
}
