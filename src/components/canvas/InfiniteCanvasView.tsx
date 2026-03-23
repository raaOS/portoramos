'use client'

import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Project } from '@/types/projects'
import Image from 'next/image'

type Props = {
    projects: Project[]
}

// --- Lunardi-style configuration (CSS 3D Edition) ---
const PERSPECTIVE = 1000
const CELL_SIZE = 2200          // Tighter density for more projects
const RENDER_RADIUS = 2         // 5^3 = 125 clusters
const MOUSE_SENSITIVITY = 1.2
const SCROLL_SENSITIVITY = 1.5
const VELOCITY_DECAY = 0.90     // Snappier, less "heavy" inertia
const VELOCITY_LERP = 0.1

// Simple deterministic hash for seeded randoms
function hash3D(x: number, y: number, z: number): number {
    const h = Math.sin(x * 12.9898 + y * 78.233 + z * 45.123) * 43758.5453123
    return h - Math.floor(h)
}

function getCoverUrl(project: Project): string {
    return project.cover || '/og-image.png'
}

function isVideoUrl(url: string): boolean {
    return /\.(mp4|webm|ogg)$/i.test(url)
}

type VirtualItem = {
    key: string
    project: Project
    x: number
    y: number
    z: number
    scale: number
    rotation: number
    dist?: number
}

export default function InfiniteCanvasView({ projects }: Props) {
    const containerRef = useRef<HTMLDivElement>(null)
    const router = useRouter()

    // 3D Camera State (Managed via Refs for performance)
    const camRef = useRef({ x: 0, y: 0, z: 0 })
    const velRef = useRef({ x: 0, y: 0, z: 0 })
    const targetCamRef = useRef({ x: 0, y: 0, z: 0 }) // For smooth interpolation
    const lastMousePos = useRef({ x: 0, y: 0 })
    const isDragging = useRef(false)
    const scrollDeltaRef = useRef({ x: 0, y: 0, z: 0 })
    const animFrameRef = useRef<number>(0)

    // DOM Refs
    const cardsRef = useRef<Map<string, HTMLDivElement>>(new Map())
    const activeItemsRef = useRef<VirtualItem[]>([])
    const cellProjectMapRef = useRef<Map<string, string>>(new Map())
    const visualStateRef = useRef<Map<string, { opacity: number }>>(new Map())

    // We need to keep track of currently active project instances
    const [activeItems, setActiveItems] = useState<VirtualItem[]>([])
    const projectById = useMemo(() => new Map(projects.map((project) => [project.id, project])), [projects])

    useEffect(() => {
        activeItemsRef.current = activeItems
    }, [activeItems])

    // Calculate visible items based on camera position
    // Debounced to prevent blocking main thread during rapid scrolling
    const updateVisibleItems = useCallback(() => {
        if (projects.length === 0) return

        // Use targetCamRef for predicting where the camera WILL be, not just where it IS.
        // This prevents items from spawning late and popping in during fast scrolls.
        const cx = targetCamRef.current.x
        const cy = targetCamRef.current.y
        const cz = targetCamRef.current.z

        const centerCellX = Math.floor(cx / CELL_SIZE)
        const centerCellY = Math.floor(cy / CELL_SIZE)
        const centerCellZ = Math.floor(cz / CELL_SIZE)

        const nextItems: VirtualItem[] = []

        // Helper: deterministic integer hash for a cell → project index
        // Uses large primes to spread nearby cells across the project list evenly
        const cellToProjectIdx = (gx: number, gy: number, gz: number): number => {
            // Mix coordinates with large primes to avoid adjacent cells getting similar values
            let h = ((gx * 73856093) ^ (gy * 19349663) ^ (gz * 83492791)) >>> 0
            h = ((h >> 16) ^ h) * 0x45d9f3b
            h = ((h >> 16) ^ h) * 0x45d9f3b
            h = (h >> 16) ^ h
            return (h >>> 0) % projects.length
        }

        // Helper: get project index for a neighbor cell (without allocation)
        const getNeighborProjectIdx = (gx: number, gy: number, gz: number): number => {
            const cachedId = cellProjectMapRef.current.get(`${gx}_${gy}_${gz}`)
            if (cachedId) {
                const idx = projects.findIndex(p => p.id === cachedId)
                if (idx >= 0) return idx
            }
            return cellToProjectIdx(gx, gy, gz)
        }

        for (let x = -RENDER_RADIUS; x <= RENDER_RADIUS; x++) {
            for (let y = -RENDER_RADIUS; y <= RENDER_RADIUS; y++) {
                for (let z = -RENDER_RADIUS; z <= RENDER_RADIUS; z++) {
                    const gx = centerCellX + x
                    const gy = centerCellY + y
                    const gz = centerCellZ + z

                    const s2 = hash3D(gx + 1, gy, gz)
                    const s3 = hash3D(gx, gy + 1, gz)
                    const s4 = hash3D(gx, gy, gz + 1)

                    const itemX = gx * CELL_SIZE + (s2 * 1.2 - 0.6) * CELL_SIZE
                    const itemY = gy * CELL_SIZE + (s3 * 1.2 - 0.6) * CELL_SIZE
                    const itemZ = gz * CELL_SIZE + (s4 * 1.2 - 0.6) * CELL_SIZE

                    const dist = Math.sqrt(
                        Math.pow(itemX - cx, 2) +
                        Math.pow(itemY - cy, 2) +
                        Math.pow(itemZ - cz, 2)
                    )

                    const key = `${gx}_${gy}_${gz}`
                    let chosenIdx = cellToProjectIdx(gx, gy, gz)

                    // Check 6 direct face-neighbors to avoid same project in adjacent cells
                    // (checking all 26 is overkill; 6 face-neighbors covers the visible clusters)
                    const neighborOffsets = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]
                    const neighborIndices = new Set<number>()
                    for (const [ox, oy, oz] of neighborOffsets) {
                        neighborIndices.add(getNeighborProjectIdx(gx + ox, gy + oy, gz + oz))
                    }

                    // If our chosen project conflicts with a neighbor, step forward until clear
                    if (projects.length > 1) {
                        for (let attempt = 0; attempt < projects.length; attempt++) {
                            if (!neighborIndices.has(chosenIdx)) break
                            chosenIdx = (chosenIdx + 1) % projects.length
                        }
                    }

                    const project = projects[chosenIdx]
                    cellProjectMapRef.current.set(key, project.id)

                    nextItems.push({
                        key,
                        project,
                        x: itemX,
                        y: itemY,
                        z: itemZ,
                        scale: 1,
                        rotation: 0,
                        dist
                    })
                }
            }
        }

        const culledItems = nextItems
            .sort((a, b) => (a.dist || 0) - (b.dist || 0))
            .slice(0, 100)

        // Fast diff: compare by key+project sets instead of O(n) string join
        const previousItems = activeItemsRef.current
        let changed = previousItems.length !== culledItems.length
        if (!changed) {
            for (let i = 0; i < culledItems.length; i++) {
                if (culledItems[i].key !== previousItems[i].key || culledItems[i].project.id !== previousItems[i].project.id) {
                    changed = true
                    break
                }
            }
        }

        if (changed) {
            // Clean up stale cellProjectMap entries to prevent memory leak
            const activeKeys = new Set(culledItems.map(item => item.key))
            for (const key of cellProjectMapRef.current.keys()) {
                if (!activeKeys.has(key)) {
                    cellProjectMapRef.current.delete(key)
                }
            }
            // Clean up stale visualState entries
            for (const key of visualStateRef.current.keys()) {
                if (!activeKeys.has(key)) {
                    visualStateRef.current.delete(key)
                }
            }

            activeItemsRef.current = culledItems
            setActiveItems(culledItems)
        }
    }, [projectById, projects])

    // Main Engine Loop
    useEffect(() => {
        let lastTime = performance.now()

        const loop = (currentTime: number) => {
            // Delta time for frame-rate independent physics
            const dt = Math.min(currentTime - lastTime, 32) // Cap at 32ms (~30fps) to avoid huge jumps on lag
            lastTime = currentTime

            // Adjust sensitivity based on frame time (normalize to ~60fps / 16.6ms)
            const timeScale = dt / 16.66

            // 1. Process Input Velocity
            velRef.current.x += scrollDeltaRef.current.x * SCROLL_SENSITIVITY
            velRef.current.y += scrollDeltaRef.current.y * SCROLL_SENSITIVITY
            velRef.current.z += scrollDeltaRef.current.z * SCROLL_SENSITIVITY
            scrollDeltaRef.current = { x: 0, y: 0, z: 0 }

            // Apply friction (frame-rate independent approximation)
            velRef.current.x *= Math.pow(VELOCITY_DECAY, timeScale)
            velRef.current.y *= Math.pow(VELOCITY_DECAY, timeScale)
            velRef.current.z *= Math.pow(VELOCITY_DECAY, timeScale)

            // Update target camera with velocity
            if (!isDragging.current) {
                targetCamRef.current.x += velRef.current.x * timeScale
                targetCamRef.current.y += velRef.current.y * timeScale
                targetCamRef.current.z += velRef.current.z * timeScale
            } else {
                targetCamRef.current.z += velRef.current.z * timeScale
            }

            // Lerp camera to target (frame-rate independent)
            // Use higher lerp during drag for responsive 1:1 tracking; smooth lerp for inertia
            const baseLerp = isDragging.current ? 0.45 : VELOCITY_LERP
            const lerpFactor = 1 - Math.pow(1 - baseLerp, timeScale)
            camRef.current.x += (targetCamRef.current.x - camRef.current.x) * lerpFactor
            camRef.current.y += (targetCamRef.current.y - camRef.current.y) * lerpFactor
            camRef.current.z += (targetCamRef.current.z - camRef.current.z) * lerpFactor

            const { x: cx, y: cy, z: cz } = camRef.current

            // ... (rest of loop remains the same)
            // For simplicity in this version, we update activeItems state which is heavy but reliable
            // In a pro version we'd use a pooling system for DOM nodes.
            // Let's use a simple distance check to trigger a re-render.

            // 3. Update DOM nodes
            const currentItems = activeItemsRef.current
            currentItems.forEach((item) => {
                const node = cardsRef.current.get(item.key)
                if (!node) return

                const dx = item.x - cx
                const dy = item.y - cy
                const dz = item.z - cz

                // Smooth Depth Fading (Tympanus style - natural and seamless)
                let opacity = 1
                let blur = 0
                let grayscale = 0
                const scale = item.scale

                // 1. Fade out as it gets too close to the camera (flying past)
                if (dz > -500) {
                    opacity = 1 - Math.min(1, Math.max(0, (dz + 500) / 1300))
                    blur = Math.min(10, Math.max(0, (dz + 500) / 130))
                }

                // 2. Smooth grayscale transition as items move far away
                // Gradual transition over 1500px depth range to avoid abrupt color→gray flash
                if (dz < -3500) {
                    grayscale = Math.min(100, Math.max(0, (-dz - 3500) / 1500 * 100))
                }

                // 3. Fade out as it gets very far away (emerging from fog)
                if (dz < -5000) {
                    // Gradual fade out over 2000px depth
                    opacity = 1 - Math.min(1, Math.max(0, (-dz - 5000) / 2000))
                    // Increase blur to simulate atmospheric fog/depth of field
                    blur = Math.max(blur, Math.min(15, Math.max(0, (-dz - 5000) / 200)))
                }

                // Add a very subtle radial fade just at the extreme edges of the screen to prevent hard clipping
                // Adjusted for 3D perspective to be less aggressive
                const scaleFactor = PERSPECTIVE / Math.max(1, PERSPECTIVE - dz)
                const px = dx * scaleFactor
                const py = dy * scaleFactor
                // Perlebar batas clipping samping (nx, ny) agar item tidak fade-out saat masih agak di tengah layar
                const nx = px / 2200 // Screen width approx (wider to prevent early side-fading)
                const ny = py / 1400 // Screen height approx
                const radialDist = Math.sqrt(nx * nx + ny * ny)

                if (radialDist > 1.0) {
                    // Smooth quadratic fade at the edges
                    const edgeFade = 1 - Math.min(1, Math.pow((radialDist - 1.0) / 0.8, 2))
                    opacity *= edgeFade
                }

                // Jangan set opacity jadi 0 secara kaku di sini, biarkan opacity smoothing yang mengaturnya di bawah
                // Ini mencegah elemen berkedip (mati-nyala) di perbatasan -7300
                if (dz > 1500 || dz < -8000) {
                    opacity = 0
                }

                // Initialise new items at their target opacity (not 0) to prevent flash-in
                const prevVisual = visualStateRef.current.get(item.key)
                const startOpacity = prevVisual ? prevVisual.opacity : opacity

                // Gunakan faktor interpolasi (lerp) yang lebih responsif agar opacity cepat mengejar target saat scroll cepat
                const opacityDiff = Math.abs(opacity - startOpacity)

                // Matikan lerp (pakai target langsung) jika item jauh di belakang untuk menghindari efek blinking ghost
                // Also skip lerp when item first appears (prevVisual is undefined) to prevent fade-in flicker
                const opLerpFactor = (!prevVisual || dz < -5000) ? 1 : (opacityDiff > 0.5 ? 0.8 : 0.4)

                const smoothedOpacity = startOpacity + (opacity - startOpacity) * opLerpFactor
                visualStateRef.current.set(item.key, { opacity: smoothedOpacity })

                if (smoothedOpacity <= 0.01) {
                    if (node.style.visibility !== 'hidden') {
                        node.style.visibility = 'hidden'
                        node.style.opacity = '0'
                    }
                    return
                }

                if (node.style.visibility === 'hidden') {
                    node.style.visibility = 'visible'
                }
                node.style.opacity = smoothedOpacity.toFixed(3)

                // Construct filter string
                let filterStr = ''

                if (blur > 0.1) filterStr += `blur(${Math.min(8, blur).toFixed(1)}px) `
                if (grayscale > 0) filterStr += `grayscale(${Math.round(grayscale)}%) `
                // Use '' not 'none' — some browsers still run the filter pipeline on 'none'
                node.style.filter = filterStr || ''

                // Pause/play videos based on depth — no need to decode frames for grayscale/hidden items
                const video = node.querySelector('video') as HTMLVideoElement | null
                if (video) {
                    if (grayscale >= 80 || smoothedOpacity <= 0.01) {
                        if (!video.paused) video.pause()
                    } else {
                        if (video.paused) video.play().catch(() => { })
                    }
                }

                node.style.transform = `translate3d(calc(-50% + ${dx.toFixed(1)}px), calc(-50% + ${dy.toFixed(1)}px), ${dz.toFixed(1)}px) scale(${scale})`
                node.style.zIndex = String(10000 + (dz | 0))
            })

            animFrameRef.current = requestAnimationFrame(loop)
        }

        animFrameRef.current = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(animFrameRef.current)
    }, [])

    // Update instances when camera moves significantly
    useEffect(() => {
        const timer = setTimeout(updateVisibleItems, 0)
        const interval = setInterval(updateVisibleItems, 200)
        return () => {
            clearTimeout(timer)
            clearInterval(interval)
        }
    }, [updateVisibleItems])

    // Input Handlers
    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        // 1. Disable global scroll when in 3D Mode
        const originalStyle = window.getComputedStyle(document.body).overflow
        document.body.style.overflow = 'hidden'

        const onWheel = (e: WheelEvent) => {
            // Priority capture
            e.preventDefault()

            // Scroll moves the camera forward/backward in Z-axis (like before)
            // Divide by 2 to make it less "terlalu cepat" (too fast)
            scrollDeltaRef.current.z += e.deltaY * 0.5
        }

        const onMouseDown = (e: MouseEvent) => {
            isDragging.current = true
            lastMousePos.current = { x: e.clientX, y: e.clientY }
        }

        const onMouseMove = (e: MouseEvent) => {
            if (!isDragging.current) return
            const dx = e.clientX - lastMousePos.current.x
            const dy = e.clientY - lastMousePos.current.y

            // Move target directly for 1:1 tracking
            targetCamRef.current.x -= dx * MOUSE_SENSITIVITY
            targetCamRef.current.y -= dy * MOUSE_SENSITIVITY

            // Set velocity for momentum after release
            velRef.current.x = -dx * MOUSE_SENSITIVITY
            velRef.current.y = -dy * MOUSE_SENSITIVITY

            lastMousePos.current = { x: e.clientX, y: e.clientY }
        }

        const onMouseUp = () => { isDragging.current = false }

        window.addEventListener('wheel', onWheel, { passive: false })
        container.addEventListener('mousedown', onMouseDown)
        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)

        return () => {
            document.body.style.overflow = originalStyle
            window.removeEventListener('wheel', onWheel)
            container.removeEventListener('mousedown', onMouseDown)
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onMouseUp)
        }
    }, [])

    if (projects.length === 0) return null

    return (
        <>
            <div
                ref={containerRef}
                className="w-full h-full overflow-hidden relative z-10 select-none bg-[#F0F0F0] cursor-grab active:cursor-grabbing"
                style={{
                    touchAction: 'none',
                    perspective: `${PERSPECTIVE}px`,
                    perspectiveOrigin: '50% 50%',
                }}
            >
                {/* 3D World */}
                <div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
                    {activeItems.map((item) => {
                        const coverUrl = getCoverUrl(item.project)
                        const isVideo = isVideoUrl(coverUrl)
                        const aspect = (item.project.coverWidth && item.project.coverHeight)
                            ? item.project.coverWidth / item.project.coverHeight
                            : 16 / 9

                        const baseWidth = 700
                        const h = baseWidth / aspect

                        return (
                            <div
                                key={item.key}
                                ref={(el) => {
                                    if (el) {
                                        cardsRef.current.set(item.key, el)
                                        return
                                    }
                                    cardsRef.current.delete(item.key)
                                    // Do NOT delete visualStateRef here — React may
                                    // unmount+remount during re-render; keeping the
                                    // last opacity prevents the item from flashing
                                    // back to 0 on re-mount.
                                }}
                                className="absolute left-1/2 top-1/2 will-change-transform"
                                style={{
                                    width: baseWidth,
                                    height: h,
                                    display: 'block',
                                    willChange: 'transform, opacity, filter',
                                    backfaceVisibility: 'hidden',
                                    contain: 'layout style paint',
                                }}
                                onClick={() => router.push(`/projects/${item.project.slug}`)}
                            >
                                <div className="relative w-full h-full group overflow-hidden rounded-lg">
                                    {/* Hapus background animate-pulse karena itu penyebab flicker putih saat Next.js me-render ulang gambar di DOM */}
                                    {isVideo ? (
                                        <video
                                            src={coverUrl}
                                            autoPlay
                                            muted
                                            loop
                                            playsInline
                                            className="absolute inset-0 w-full h-full object-cover"
                                        />
                                    ) : (
                                        <Image
                                            src={coverUrl}
                                            alt={item.project.title}
                                            fill
                                            className="absolute inset-0 object-cover transition-transform duration-500 group-hover:scale-105"
                                            unoptimized
                                            loading="eager"
                                        />
                                    )}

                                    {/* Minimalist Label */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <h3 className="text-black font-bold text-2xl px-4 text-center">{item.project.title}</h3>
                                        <p className="text-black/50 text-sm mt-1">{item.project.year}</p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* UI Helpers */}
                <div className="absolute bottom-10 left-10 flex flex-col gap-2 pointer-events-none">
                    <div className="text-[10px] font-mono text-black/20 uppercase tracking-[0.3em]">
                        Mode: Infinite Canvas
                    </div>
                    <div className="text-[10px] font-mono text-black/40 uppercase tracking-[0.3em]">
                        Drag to PAN / Scroll to ZOOM
                    </div>
                </div>
            </div>
        </>
    )
}
