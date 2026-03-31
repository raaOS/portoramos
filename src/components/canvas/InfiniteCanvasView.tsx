'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { LazyMotion, domAnimation } from 'framer-motion'
import type { Project } from '@/types/projects'
import {
    CANVAS_CONSTANTS,
    assignProjectsToCells,
    buildCellPositions,
    computeVisualStyle,
    pruneAssignmentState,
    type CanvasItem,
    type Point3D,
} from './infiniteCanvasEngine'

type Props = {
    projects: Project[]
}

const DRAG_SENSITIVITY = 1.2
const SCROLL_SENSITIVITY = 1.5
const VELOCITY_DECAY = 0.9
const VELOCITY_LERP = 0.1
const CARD_WIDTH = 700

function getCoverUrl(project: Project): string {
    return project.cover || '/og-image.png'
}

function isVideoUrl(url: string): boolean {
    return /\.(mp4|webm|ogg)$/i.test(url)
}

export default function InfiniteCanvasView({ projects }: Props) {
    const containerRef = useRef<HTMLDivElement>(null)
    const router = useRouter()
    const [renderedItems, setRenderedItems] = useState<CanvasItem[]>([])
    const renderedItemsRef = useRef<CanvasItem[]>([])

    const cameraRef = useRef<Point3D>({ x: 0, y: 0, z: 0 })
    const velocityRef = useRef<Point3D>({ x: 0, y: 0, z: 0 })
    const targetCameraRef = useRef<Point3D>({ x: 0, y: 0, z: 0 })
    const scrollDeltaRef = useRef<Point3D>({ x: 0, y: 0, z: 0 })
    const previousCullCameraRef = useRef<Point3D>({ x: 0, y: 0, z: 0 })
    const lastMousePositionRef = useRef({ x: 0, y: 0 })
    const isDraggingRef = useRef(false)
    const animationFrameRef = useRef<number>(0)

    const cardNodesRef = useRef<Map<string, HTMLDivElement>>(new Map())
    const videoNodesRef = useRef<Map<string, HTMLVideoElement>>(new Map())
    const visualStateRef = useRef<Map<string, { opacity: number; grayscale: number; hidden: boolean }>>(new Map())
    const assignmentRef = useRef<Map<string, string>>(new Map())
    const insertionOrderRef = useRef<string[]>([])
    const activeItemsRef = useRef<CanvasItem[]>([])

    const projectById = useMemo(() => new Map(projects.map((project) => [project.id, project])), [projects])
    const maxCachedAssignments = useMemo(
        () => Math.max(CANVAS_CONSTANTS.maxActiveItems * 3, projects.length * CANVAS_CONSTANTS.maxCacheMultiplier),
        [projects.length]
    )

    const syncVisibleItems = useCallback(() => {
        if (projects.length === 0) {
            activeItemsRef.current = []
            setRenderedItems([])
            return
        }

        const cellPositions = buildCellPositions(cameraRef.current)
        const nextState = assignProjectsToCells({
            cellPositions,
            projects,
            persistedAssignments: assignmentRef.current,
            insertionOrder: insertionOrderRef.current,
            projectById,
        })

        const activeKeys = new Set(nextState.items.map((item) => item.key))
        const prunedState = pruneAssignmentState({
            assignments: nextState.assignments,
            insertionOrder: nextState.insertionOrder,
            activeKeys,
            maxEntries: maxCachedAssignments,
        })

        assignmentRef.current = prunedState.assignments
        insertionOrderRef.current = prunedState.insertionOrder

        activeItemsRef.current = nextState.items

        // Update rendered items: Strict addition
        const nextItems = nextState.items
        setRenderedItems(prev => {
            const prevKeys = new Set(prev.map(i => i.key))
            
            // Only add new items that are not in the current rendered set
            const itemsToAdd = nextItems.filter(item => !prevKeys.has(item.key))
            
            if (itemsToAdd.length === 0) return prev

            const next = [...prev, ...itemsToAdd]
            renderedItemsRef.current = next
            return next
        })
    }, [maxCachedAssignments, projectById, projects])

    const updateDomNodes = useCallback(() => {
        const camera = cameraRef.current
        const activeKeys = new Set(activeItemsRef.current.map(i => i.key))
        const itemsToRemove: string[] = []
        const currentItems = renderedItemsRef.current

        for (const item of currentItems) {
            const node = cardNodesRef.current.get(item.key)
            if (!node) continue

            const previousState = visualStateRef.current.get(item.key) ?? { opacity: 0, grayscale: 0, hidden: false }
            const visualStyle = computeVisualStyle({
                item,
                camera,
                previousOpacity: previousState.opacity,
                previousGrayscale: previousState.grayscale,
            })

            const dz = item.z - camera.z
            
            // AGGRESSIVE PRUNING (OCCLUSION CULLING)
            // If item is:
            // 1. Far behind camera (dz > 1200) - HARD REMOVE
            // 2. Extremely far in the distance (dist > 9000)
            // 3. Not active and hidden (opacity near 0)
            const isFarBehind = dz > 1200
            const isTooFar = item.dist > 9000
            const isInactiveAndHidden = !activeKeys.has(item.key) && (visualStyle.hidden || visualStyle.opacity < 0.01)

            if (isFarBehind || isTooFar || isInactiveAndHidden) {
                itemsToRemove.push(item.key)
                
                // UNLOAD VIDEOS (Critical for memory)
                const videoNode = videoNodesRef.current.get(item.key)
                if (videoNode) {
                    videoNode.pause()
                    videoNode.src = "" // Explicitly clear src to trigger GC
                    videoNode.load()
                }

                node.style.visibility = 'hidden'
                node.style.display = 'none' 
                continue
            }

            visualStateRef.current.set(item.key, {
                opacity: visualStyle.opacity,
                grayscale: visualStyle.grayscale,
                hidden: visualStyle.hidden
            })

            if (visualStyle.hidden) {
                if (node.style.visibility !== 'hidden') {
                    node.style.visibility = 'hidden'
                    node.style.opacity = '0'
                    node.style.pointerEvents = 'none'
                }
                const videoNode = videoNodesRef.current.get(item.key)
                if (videoNode && !videoNode.paused) {
                    videoNode.pause()
                }
                continue
            }

            node.style.display = 'block'
            node.style.visibility = 'visible'
            node.style.opacity = visualStyle.opacity.toFixed(3)
            node.style.pointerEvents = 'auto'
            node.style.filter = visualStyle.filter
            node.style.transform = visualStyle.transform
            node.style.zIndex = visualStyle.zIndex

            const videoNode = videoNodesRef.current.get(item.key)
            if (videoNode) {
                if (visualStyle.opacity > 0.4 && activeKeys.has(item.key)) {
                    if (videoNode.paused) {
                        // Restore src if it was cleared
                        if (videoNode.src === "" || videoNode.src.endsWith("/")) {
                            videoNode.src = getCoverUrl(item.project)
                        }
                        void videoNode.play().catch(() => undefined)
                    }
                } else if (!videoNode.paused) {
                    videoNode.pause()
                }
            }
        }

        if (itemsToRemove.length > 0) {
            setRenderedItems(prev => {
                const next = prev.filter(item => !itemsToRemove.includes(item.key))
                renderedItemsRef.current = next
                return next
            })
            itemsToRemove.forEach(key => {
                visualStateRef.current.delete(key)
                cardNodesRef.current.delete(key)
                videoNodesRef.current.delete(key)
            })
        }
    }, [])

    useEffect(() => {
        if (projects.length === 0) return

        let lastTime = performance.now()
        const loop = (currentTime: number) => {
            const deltaTime = Math.min(currentTime - lastTime, CANVAS_CONSTANTS.maxDeltaTime)
            const timeScale = deltaTime / CANVAS_CONSTANTS.targetFrameTime
            lastTime = currentTime

            velocityRef.current.x += scrollDeltaRef.current.x * SCROLL_SENSITIVITY
            velocityRef.current.y += scrollDeltaRef.current.y * SCROLL_SENSITIVITY
            velocityRef.current.z += scrollDeltaRef.current.z * SCROLL_SENSITIVITY
            scrollDeltaRef.current = { x: 0, y: 0, z: 0 }

            velocityRef.current.x *= Math.pow(VELOCITY_DECAY, timeScale)
            velocityRef.current.y *= Math.pow(VELOCITY_DECAY, timeScale)
            velocityRef.current.z *= Math.pow(VELOCITY_DECAY, timeScale)

            if (!isDraggingRef.current) {
                targetCameraRef.current.x += velocityRef.current.x * timeScale
                targetCameraRef.current.y += velocityRef.current.y * timeScale
                targetCameraRef.current.z += velocityRef.current.z * timeScale
            } else {
                targetCameraRef.current.z += velocityRef.current.z * timeScale
            }

            const lerpFactor = 1 - Math.pow(1 - VELOCITY_LERP, timeScale)
            cameraRef.current.x += (targetCameraRef.current.x - cameraRef.current.x) * lerpFactor
            cameraRef.current.y += (targetCameraRef.current.y - cameraRef.current.y) * lerpFactor
            cameraRef.current.z += (targetCameraRef.current.z - cameraRef.current.z) * lerpFactor

            const cullDistanceSq = (
                (cameraRef.current.x - previousCullCameraRef.current.x) ** 2 +
                (cameraRef.current.y - previousCullCameraRef.current.y) ** 2 +
                (cameraRef.current.z - previousCullCameraRef.current.z) ** 2
            )

            if (cullDistanceSq > CANVAS_CONSTANTS.cullingDistanceThreshold ** 2) {
                previousCullCameraRef.current = { ...cameraRef.current }
                syncVisibleItems()
            }

            updateDomNodes()
            animationFrameRef.current = requestAnimationFrame(loop)
        }

        animationFrameRef.current = requestAnimationFrame(loop)
        const initialSyncFrame = requestAnimationFrame(() => {
            syncVisibleItems()
        })

        return () => {
            cancelAnimationFrame(initialSyncFrame)
            cancelAnimationFrame(animationFrameRef.current)
        }
    }, [projects.length, syncVisibleItems, updateDomNodes])

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const originalOverflow = window.getComputedStyle(document.body).overflow
        document.body.style.overflow = 'hidden'

        const handleWheel = (event: WheelEvent) => {
            event.preventDefault()
            // Swapped: Scroll DOWN = Move BACKWARD (Z increases)
            scrollDeltaRef.current.z += event.deltaY * 0.5
        }

        const handleMouseDown = (event: MouseEvent) => {
            if (event.button !== 0) return
            isDraggingRef.current = true
            lastMousePositionRef.current = { x: event.clientX, y: event.clientY }
        }

        const handleMouseMove = (event: MouseEvent) => {
            if (!isDraggingRef.current) return
            const deltaX = event.clientX - lastMousePositionRef.current.x
            const deltaY = event.clientY - lastMousePositionRef.current.y
            targetCameraRef.current.x -= deltaX * DRAG_SENSITIVITY
            targetCameraRef.current.y -= deltaY * DRAG_SENSITIVITY
            velocityRef.current.x = -deltaX * DRAG_SENSITIVITY
            velocityRef.current.y = -deltaY * DRAG_SENSITIVITY
            lastMousePositionRef.current = { x: event.clientX, y: event.clientY }
        }

        const handleMouseUp = () => { isDraggingRef.current = false }

        window.addEventListener('wheel', handleWheel, { passive: false })
        container.addEventListener('mousedown', handleMouseDown)
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)

        return () => {
            document.body.style.overflow = originalOverflow
            window.removeEventListener('wheel', handleWheel)
            container.removeEventListener('mousedown', handleMouseDown)
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [])

    if (projects.length === 0) return null

    return (
        <LazyMotion features={domAnimation}>
            <div
                ref={containerRef}
                className="relative z-10 h-full w-full cursor-grab overflow-hidden select-none bg-[#F0F0F0] active:cursor-grabbing"
                style={{
                    touchAction: 'none',
                    perspective: `${CANVAS_CONSTANTS.perspective}px`,
                    perspectiveOrigin: '50% 50%',
                }}
            >
                <div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
                    {renderedItems.map((item) => {
                        const coverUrl = getCoverUrl(item.project)
                        const isVideo = isVideoUrl(coverUrl)
                        const aspectRatio =
                            item.project.coverWidth && item.project.coverHeight
                                ? item.project.coverWidth / item.project.coverHeight
                                : 16 / 9

                        return (
                            <div
                                key={item.key}
                                ref={(element) => {
                                    if (element) cardNodesRef.current.set(item.key, element)
                                    else cardNodesRef.current.delete(item.key)
                                }}
                                className="absolute left-1/2 top-1/2"
                                style={{
                                    width: CARD_WIDTH,
                                    height: CARD_WIDTH / aspectRatio,
                                    display: 'block',
                                    willChange: 'transform, opacity',
                                    backfaceVisibility: 'hidden',
                                    contain: 'layout paint style',
                                    visibility: 'hidden', // Start hidden, loop will show it
                                    opacity: 0,
                                }}
                                onClick={() => router.push(`/projects/${item.project.slug}`)}
                            >
                                <div className="group relative h-full w-full overflow-hidden rounded-lg">
                                    {isVideo ? (
                                        <video
                                            ref={(element) => {
                                                if (element) videoNodesRef.current.set(item.key, element)
                                                else videoNodesRef.current.delete(item.key)
                                            }}
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
                                            priority={item.dist < 3000}
                                        />
                                    )}

                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                        <h3 className="px-4 text-center text-2xl font-bold text-black">{item.project.title}</h3>
                                        <p className="mt-1 text-sm text-black/50">{item.project.year}</p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="pointer-events-none absolute bottom-10 left-10 flex flex-col gap-2">
                    <div className="text-[10px] uppercase tracking-[0.3em] text-black/20">Mode: Infinite Canvas</div>
                    <div className="text-[10px] uppercase tracking-[0.3em] text-black/40">Drag to PAN / Scroll to ZOOM</div>
                </div>
            </div>
        </LazyMotion>
    )
}
