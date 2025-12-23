"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import type { GalleryItem } from '@/types/projects'
import Media from '@/components/shared/Media'
import { useNavbarVisibility } from '@/contexts/NavbarVisibilityContext'

// Error boundary component for gallery items
function GalleryItemErrorBoundary({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) {
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const handleError = () => setHasError(true)
    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  if (hasError) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

type Item = string | GalleryItem

type GalleryProps = {
  items?: Item[]
  autoplay?: boolean
  muted?: boolean
  loop?: boolean
  playsInline?: boolean
}

export default function Gallery({
  items = [],
  autoplay = true,
  muted = true,
  loop = true,
  playsInline = true
}: GalleryProps) {
  const list: GalleryItem[] = items.map((it) => (
    typeof it === 'string' ? { kind: 'image', src: it } : it
  ))
  const [open, setOpen] = useState<{ i: number } | null>(null)
  const [isClient, setIsClient] = useState(false)
  const viewerRef = useRef<HTMLDivElement | null>(null)
  const hasMany = list.length > 1
  const { hideNavbar, showNavbar } = useNavbarVisibility()

  const goPrev = useCallback(() => {
    setOpen((o) => !o ? o : ({ i: (o.i - 1 + list.length) % list.length }))
  }, [list.length])

  const goNext = useCallback(() => {
    setOpen((o) => !o ? o : ({ i: (o.i + 1) % list.length }))
  }, [list.length])

  const enterFullscreen = useCallback(() => {
    const el = viewerRef.current
    if (!el) return
    try {
      if (el.requestFullscreen) {
        el.requestFullscreen()
      } else if ((el as any).webkitRequestFullscreen) {
        ; (el as any).webkitRequestFullscreen()
      } else if ((el as any).msRequestFullscreen) {
        ; (el as any).msRequestFullscreen()
      }
    } catch (e) {
      // Failed to enter fullscreen
    }
  }, [])

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!open || !isClient) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        showNavbar()
        setOpen(null)
      }
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'ArrowRight') goNext()
      else if (e.key.toLowerCase() === 'f') enterFullscreen()
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, goPrev, goNext, enterFullscreen, isClient, showNavbar])

  // Show nothing until client is ready
  if (!isClient) {
    return null
  }

  return (
    <>
      <div className="grid md:grid-cols-2 gap-4 mt-8">
        {list.map((item, i) => {
          const ratio = (item.width && item.height) ? `${item.width} / ${item.height}` : '16 / 10'
          return (
            <button
              key={i}
              className="overflow-hidden rounded-lg block w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={() => {
                hideNavbar()
                setOpen({ i })
              }}
              title="Klik untuk perbesar"
              aria-label={`Open gallery item ${i + 1} in fullscreen`}
              type="button"
            >
              <div style={{ aspectRatio: ratio }}>
                <GalleryItemErrorBoundary
                  fallback={
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <p className="text-xs">Failed to load</p>
                      </div>
                    </div>
                  }
                >
                  <Media
                    kind={item.kind}
                    src={item.src}
                    poster={item.poster}
                    alt={`Gallery item ${i + 1} - ${item.kind === 'video' ? 'Video content' : 'Image content'}`}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    autoplay={autoplay}
                    muted={muted}
                    loop={loop}
                    playsInline={playsInline}
                    className="w-full h-full object-cover"
                  />
                </GalleryItemErrorBoundary>
              </div>
            </button>
          )
        })}
      </div>

      {open && list[open.i] && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75"
          onClick={() => {
            showNavbar()
            setOpen(null)
          }}
        >
          <div
            ref={viewerRef}
            className="relative max-w-5xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute -top-12 left-0 right-0 flex items-center justify-between px-1">
              <button
                className="text-white/80 hover:text-white text-sm underline focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded"
                onClick={() => {
                  showNavbar()
                  setOpen(null)
                }}
                aria-label="Close gallery"
                type="button"
              >
                Tutup (Esc)
              </button>
              <div className="flex items-center gap-3">
                {hasMany && (
                  <>
                    <button
                      className="text-white/80 hover:text-white text-sm underline focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded"
                      onClick={goPrev}
                      aria-label="Previous image"
                      type="button"
                    >
                      ← Prev
                    </button>
                    <button
                      className="text-white/80 hover:text-white text-sm underline focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded"
                      onClick={goNext}
                      aria-label="Next image"
                      type="button"
                    >
                      Next →
                    </button>
                  </>
                )}
                <button
                  className="text-white/80 hover:text-white text-sm underline focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded"
                  onClick={enterFullscreen}
                  aria-label="Enter fullscreen mode"
                  type="button"
                >
                  Fullscreen (F)
                </button>
              </div>
            </div>
            <div
              className="w-full"
              style={{
                aspectRatio: (list[open.i].width && list[open.i].height)
                  ? `${list[open.i].width} / ${list[open.i].height}`
                  : '16 / 9'
              }}
            >
              <Media
                kind={list[open.i].kind}
                src={list[open.i].src}
                poster={list[open.i].poster}
                alt={`Fullscreen gallery item ${open.i + 1} - ${list[open.i].kind === 'video' ? 'Video content' : 'Image content'}`}
                autoplay={list[open.i].kind === 'video'}
                muted={true}
                loop={false}
                playsInline={true}
                controls={true}
                className="w-full h-full object-contain bg-black"
              />
            </div>
            {hasMany && (
              <>
                <button
                  aria-label="Previous"
                  className="absolute inset-y-0 left-0 w-1/5 md:w-1/4 hover:bg-white/5 transition"
                  onClick={goPrev}
                />
                <button
                  aria-label="Next"
                  className="absolute inset-y-0 right-0 w-1/5 md:w-1/4 hover:bg-white/5 transition"
                  onClick={goNext}
                />
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
