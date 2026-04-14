import { memo, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { getCoverUrl, isVideoUrl } from '@/utils/canvas-helpers'
import type { CanvasItem } from './infiniteCanvasEngine'

const CARD_WIDTH = 700

type CanvasCardProps = {
    item: CanvasItem
    isPriority: boolean
    registerCardRef: (key: string, element: HTMLDivElement | null) => void
    registerVideoRef: (key: string, element: HTMLVideoElement | null) => void
}

export function CanvasCardInner({
    item,
    isPriority,
    registerCardRef,
    registerVideoRef,
}: CanvasCardProps) {
    const router = useRouter()

    // Drag tracking to avoid accidental clicks when panning
    const pointerStart = useRef<{ x: number; y: number } | null>(null)
    const dragDistance = useRef(0)

    const coverUrl = getCoverUrl(item.project)
    const isVideo = isVideoUrl(coverUrl)
    const aspectRatio =
        item.project.coverWidth && item.project.coverHeight
            ? item.project.coverWidth / item.project.coverHeight
            : 16 / 9
    const eyebrow =
        item.project.type === 'commercial'
            ? 'Proyek Komersial'
            : item.project.type === 'visual_art'
                ? 'Karya Visual'
                : item.project.tags?.[0] ?? 'Project'
    const metaLine = `${item.project.client} • ${item.project.year}`

    return (
        <div
            ref={(element) => registerCardRef(item.key, element)}
            data-canvas-card={item.key}
            className="pointer-events-auto absolute left-1/2 top-1/2 cursor-pointer group"
            style={{
                width: CARD_WIDTH,
                height: CARD_WIDTH / aspectRatio,
                display: 'block',
                // willChange is set dynamically in updateDomNodes
                // only for visible items — saves VRAM on low-end GPUs
                backfaceVisibility: 'hidden',
                contain: 'layout paint style',
                visibility: 'hidden', // Start hidden, rAF loop will reveal
                opacity: 0,
            }}
            onPointerDown={(e) => {
                pointerStart.current = { x: e.clientX, y: e.clientY }
                dragDistance.current = 0
            }}
            onPointerUp={(e) => {
                if (!pointerStart.current) return
                const dx = e.clientX - pointerStart.current.x
                const dy = e.clientY - pointerStart.current.y
                dragDistance.current = Math.sqrt(dx * dx + dy * dy)
                pointerStart.current = null
            }}
            onClick={(e) => {
                // Ignore clicks if the user dragged the canvas more than 10 pixels
                if (dragDistance.current > 10) {
                    e.preventDefault()
                    return
                }
                router.push(`/projects/${item.project.slug}`)
            }}
        >
            <div className="relative h-full w-full overflow-hidden rounded-[18px] bg-black/5">
                {isVideo ? (
                    <video
                        ref={(element) => registerVideoRef(item.key, element)}
                        src={coverUrl}
                        muted
                        loop
                        playsInline
                        className="pointer-events-none absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                ) : (
                    <Image
                        src={coverUrl}
                        alt={item.project.title}
                        fill
                        className="pointer-events-none absolute inset-0 object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        sizes="(max-width: 768px) 100vw, 700px"
                        priority={isPriority}
                    />
                )}

                <div className="pointer-events-none absolute inset-0 rounded-[18px] bg-black/[0.02] transition-colors duration-300 group-hover:bg-black/[0.06]" />
                <div className="pointer-events-none absolute inset-0 rounded-[18px] ring-1 ring-inset ring-white/12 transition-all duration-300 group-hover:ring-white/45 group-hover:shadow-[0_0_0_1px_rgba(255,255,255,0.18),0_24px_60px_rgba(15,23,42,0.28)]" />
                <div className="pointer-events-none absolute inset-0 rounded-[18px] bg-gradient-to-t from-black/80 via-black/18 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5 sm:p-6">
                    <div className="max-w-[82%] translate-y-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                        <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-white/68">
                            {eyebrow}
                        </p>
                        <h3 className="mt-2 text-[24px] font-semibold leading-[1.02] text-white [text-shadow:0_8px_24px_rgba(0,0,0,0.35)]">
                            {item.project.title}
                        </h3>
                        <p className="mt-3 truncate text-[11px] uppercase tracking-[0.24em] text-white/64">
                            {metaLine}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export const CanvasCard = memo(CanvasCardInner)
