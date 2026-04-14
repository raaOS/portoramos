"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import type { GalleryItem } from '@/types/projects'
import Media from '@/components/shared/Media'
import { useNavbarVisibility } from '@/contexts/NavbarVisibilityContext'

// Note: GalleryItemErrorBoundary was removed — it listened to global window 'error'
// events which caused false positives from unrelated scripts. The Media component
// handles its own load errors via onError callbacks.

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
    const el = viewerRef.current as HTMLDivElement & {
      webkitRequestFullscreen?: () => void;
      msRequestFullscreen?: () => void;
    } | null;
    if (!el) return
    try {
      if (el.requestFullscreen) {
        el.requestFullscreen()
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen()
      } else if (el.msRequestFullscreen) {
        el.msRequestFullscreen()
      }
    } catch {
      // Failed to enter fullscreen
    }
  }, [])

  useEffect(() => {
    requestAnimationFrame(() => setIsClient(true))
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
