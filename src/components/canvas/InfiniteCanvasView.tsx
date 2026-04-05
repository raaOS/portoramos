'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Project } from '@/types/projects'
import { getCoverUrl, isVideoUrl } from '@/utils/canvas-helpers'
import {
    CANVAS_CONSTANTS,
    assignProjectsToCells,
    buildCellPositions,
    computeVisualStyle,
    pruneAssignmentState,
    type CanvasItem,
    type Point3D,
} from './infiniteCanvasEngine'
import { useCanvasInput } from '@/hooks/canvas/useCanvasInput'
import { CanvasCard } from './CanvasCard'

type Props = {
    projects: Project[]
}

// — Rendering & culling thresholds —
const REMOVAL_BATCH_INTERVAL = 100 // ms — batch DOM removals to avoid per-frame React re-renders
const MAX_PRIORITY_IMAGES = 3
const CULLING_BEHIND_THRESHOLD = 1200
const CULLING_DISTANCE_THRESHOLD = 9000
const PRIORITY_IMAGE_DISTANCE = 3000
const VIDEO_VISIBILITY_OPACITY = 0.4

// — Input physics tuning —
const SCROLL_SENSITIVITY = 1.5
const VELOCITY_DECAY = 0.95     // longer premium glide after release
const VELOCITY_LERP = 0.2       // camera follows mouse faster

export default function InfiniteCanvasView({ projects }: Props) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [renderedItems, setRenderedItems] = useState<CanvasItem[]>([])
    const renderedItemsRef = useRef<CanvasItem[]>([])

    // — Camera state —
    const cameraRef = useRef<Point3D>({ x: 0, y: 0, z: 0 })
    const velocityRef = useRef<Point3D>({ x: 0, y: 0, z: 0 })
    const targetCameraRef = useRef<Point3D>({ x: 0, y: 0, z: 0 })
    const scrollDeltaRef = useRef<Point3D>({ x: 0, y: 0, z: 0 })
    const previousCullCameraRef = useRef<Point3D>({ x: 0, y: 0, z: 0 })

    // — Input state —
    const isDraggingRef = useRef(false)
    const animationFrameRef = useRef<number>(0)

    // Hook bindings for physics input (Mouse, touch, wheel)
    useCanvasInput({
        containerRef,
        targetCameraRef,
        velocityRef,
        scrollDeltaRef,
        isDraggingRef
    })

    // — DOM node references —
    const cardNodesRef = useRef<Map<string, HTMLDivElement>>(new Map())
    const videoNodesRef = useRef<Map<string, HTMLVideoElement>>(new Map())
    const visualStateRef = useRef<Map<string, { opacity: number; grayscale: number; hidden: boolean }>>(new Map())

    // — Assignment & ordering state —
    const assignmentRef = useRef<Map<string, string>>(new Map())
    const insertionOrderRef = useRef<string[]>([])
    const activeItemsRef = useRef<CanvasItem[]>([])

    // — Batch removal state (BUG FIX #1 + #3) —
    const pendingRemovalsRef = useRef<Set<string>>(new Set())
    const removalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

        const nextItems = nextState.items
        setRenderedItems(prev => {
            const prevKeys = new Set(prev.map(i => i.key))
            const itemsToAdd = nextItems.filter(item => !prevKeys.has(item.key))
            if (itemsToAdd.length === 0) return prev
            const next = [...prev, ...itemsToAdd]
            renderedItemsRef.current = next
            return next
        })
    }, [maxCachedAssignments, projectById, projects])

    const flushRemovals = useCallback(() => {
        const keysToRemove = pendingRemovalsRef.current
        if (keysToRemove.size === 0) {
            removalTimerRef.current = null
            return
        }

        const removalSet = new Set(keysToRemove)
        pendingRemovalsRef.current = new Set()
        removalTimerRef.current = null

        setRenderedItems(prev => {
            const next = prev.filter(item => !removalSet.has(item.key))
            renderedItemsRef.current = next
            return next
        })

        removalSet.forEach(key => {
            visualStateRef.current.delete(key)
            cardNodesRef.current.delete(key)
            videoNodesRef.current.delete(key)
        })
    }, [])

    const updateDomNodes = useCallback(() => {
        const camera = cameraRef.current
        const activeKeys = new Set(activeItemsRef.current.map(i => i.key))
        const currentItems = renderedItemsRef.current

        for (const item of currentItems) {
            const node = cardNodesRef.current.get(item.key)
            if (!node) continue

            if (pendingRemovalsRef.current.has(item.key)) continue

            const previousState = visualStateRef.current.get(item.key) ?? { opacity: 0, grayscale: 0, hidden: false }
            const visualStyle = computeVisualStyle({
                item,
                camera,
                previousOpacity: previousState.opacity,
                previousGrayscale: previousState.grayscale,
            })

            const dz = item.z - camera.z

            const isFarBehind = dz > CULLING_BEHIND_THRESHOLD
            const isTooFar = item.dist > CULLING_DISTANCE_THRESHOLD
            const isInactiveAndHidden = !activeKeys.has(item.key) && (visualStyle.hidden || visualStyle.opacity < 0.01)

            if (isFarBehind || isTooFar || isInactiveAndHidden) {
                node.style.visibility = 'hidden'
                node.style.display = 'none'
                node.style.willChange = 'auto'

                const videoNode = videoNodesRef.current.get(item.key)
                if (videoNode) {
                    videoNode.pause()
                    videoNode.src = ""
                    videoNode.load()
                }

                pendingRemovalsRef.current.add(item.key)
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
                    node.style.willChange = 'auto'
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
            node.style.willChange = 'transform'

            const videoNode = videoNodesRef.current.get(item.key)
            if (videoNode) {
                if (visualStyle.opacity > VIDEO_VISIBILITY_OPACITY && activeKeys.has(item.key)) {
                    if (videoNode.paused) {
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

        if (pendingRemovalsRef.current.size > 0 && !removalTimerRef.current) {
            removalTimerRef.current = setTimeout(flushRemovals, REMOVAL_BATCH_INTERVAL)
        }
    }, [flushRemovals])

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
            if (removalTimerRef.current) {
                clearTimeout(removalTimerRef.current)
                removalTimerRef.current = null
            }
        }
    }, [projects.length, syncVisibleItems, updateDomNodes])

    if (projects.length === 0) return null

    let priorityCount = 0

    return (
        <div
            ref={containerRef}
            data-canvas-viewport
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
                    const shouldPriority = !isVideo && item.dist < PRIORITY_IMAGE_DISTANCE && priorityCount < MAX_PRIORITY_IMAGES
                    if (shouldPriority) priorityCount++

                    return (
                        <CanvasCard 
                            key={item.key} 
                            item={item} 
                            isPriority={shouldPriority}
                            registerCardRef={(key, el) => {
                                if (el) cardNodesRef.current.set(key, el)
                                else cardNodesRef.current.delete(key)
                            }}
                            registerVideoRef={(key, el) => {
                                if (el) videoNodesRef.current.set(key, el)
                                else videoNodesRef.current.delete(key)
                            }}
                        />
                    )
                })}
            </div>

            <div className="pointer-events-none absolute bottom-10 left-10 flex flex-col gap-2">
                <div className="text-[10px] uppercase tracking-[0.3em] text-black/20">Mode: Infinite Canvas</div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-black/40">Drag to PAN / Scroll to ZOOM</div>
            </div>
        </div>
    )
}
