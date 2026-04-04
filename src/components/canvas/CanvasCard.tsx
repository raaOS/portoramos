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

export function CanvasCard({
    item,
    isPriority,
    registerCardRef,
    registerVideoRef,
}: CanvasCardProps) {
    const router = useRouter()
    
    const coverUrl = getCoverUrl(item.project)
    const isVideo = isVideoUrl(coverUrl)
    const aspectRatio =
        item.project.coverWidth && item.project.coverHeight
            ? item.project.coverWidth / item.project.coverHeight
            : 16 / 9

    return (
        <div
            ref={(element) => registerCardRef(item.key, element)}
            className="absolute left-1/2 top-1/2"
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
            onClick={() => router.push(`/projects/${item.project.slug}`)}
        >
            <div className="group relative h-full w-full overflow-hidden rounded-lg">
                {isVideo ? (
                    <video
                        ref={(element) => registerVideoRef(item.key, element)}
                        src={coverUrl}
                        muted
                        loop
                        playsInline
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                ) : (
                    <Image
                        src={coverUrl}
                        alt={item.project.title}
                        fill
                        className="absolute inset-0 object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 700px"
                        priority={isPriority}
                    />
                )}

                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <h3 className="px-4 text-center text-2xl font-bold text-black">{item.project.title}</h3>
                    <p className="mt-1 text-sm text-black/50">{item.project.year}</p>
                </div>
            </div>
        </div>
    )
}
