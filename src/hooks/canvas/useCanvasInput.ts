import { useCallback, useEffect, useRef, type MutableRefObject, type RefObject } from 'react'
import type { Point3D } from '@/components/canvas/infiniteCanvasEngine'

type UseCanvasInputProps = {
    containerRef: RefObject<HTMLElement | null>
    targetCameraRef: MutableRefObject<Point3D>
    velocityRef: MutableRefObject<Point3D>
    scrollDeltaRef: MutableRefObject<Point3D>
    isDraggingRef: MutableRefObject<boolean>
}

// — Input tuning —
const DRAG_SENSITIVITY = 1.5    // more 1:1 hand-to-camera feel
const WHEEL_DELTA_MULTIPLIER = 0.5
const PINCH_ZOOM_MULTIPLIER = 2
const VELOCITY_SMOOTH_FACTOR = 0.5 // more responsive velocity transitions

export function useCanvasInput({
    containerRef,
    targetCameraRef,
    velocityRef,
    scrollDeltaRef,
    isDraggingRef
}: UseCanvasInputProps) {
    const lastMousePositionRef = useRef({ x: 0, y: 0 })
    const pinchStartDistRef = useRef<number | null>(null) // Touch/pinch for mobile

    // Shared pan-delta logic used by both mouse and touch handlers (DRY)
    const applyPanDelta = useCallback((deltaX: number, deltaY: number) => {
        targetCameraRef.current.x -= deltaX * DRAG_SENSITIVITY
        targetCameraRef.current.y -= deltaY * DRAG_SENSITIVITY
        // SMOOTHNESS FIX: Blend velocity instead of overwriting to reduce drag jitter
        // (exponential moving average prevents sudden velocity spikes from hand tremor)
        const targetVelX = -deltaX * DRAG_SENSITIVITY
        const targetVelY = -deltaY * DRAG_SENSITIVITY
        velocityRef.current.x += (targetVelX - velocityRef.current.x) * VELOCITY_SMOOTH_FACTOR
        velocityRef.current.y += (targetVelY - velocityRef.current.y) * VELOCITY_SMOOTH_FACTOR
    }, [targetCameraRef, velocityRef])

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const originalOverflow = window.getComputedStyle(document.body).overflow
        document.body.style.overflow = 'hidden'

        // Scope wheel listener to container instead of window
        // This prevents blocking scroll on other page elements (e.g. dropdowns, overlays)
        const handleWheel = (event: WheelEvent) => {
            event.preventDefault()
            scrollDeltaRef.current.z += event.deltaY * WHEEL_DELTA_MULTIPLIER
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
            applyPanDelta(deltaX, deltaY)
            lastMousePositionRef.current = { x: event.clientX, y: event.clientY }
        }

        const handleMouseUp = () => { isDraggingRef.current = false }

        // Touch support for mobile devices
        const handleTouchStart = (event: TouchEvent) => {
            if (event.touches.length === 1) {
                isDraggingRef.current = true
                const touch = event.touches[0]
                lastMousePositionRef.current = { x: touch.clientX, y: touch.clientY }
            } else if (event.touches.length === 2) {
                isDraggingRef.current = false
                const dx = event.touches[0].clientX - event.touches[1].clientX
                const dy = event.touches[0].clientY - event.touches[1].clientY
                pinchStartDistRef.current = Math.sqrt(dx * dx + dy * dy)
            }
        }

        const handleTouchMove = (event: TouchEvent) => {
            event.preventDefault()
            if (event.touches.length === 1 && isDraggingRef.current) {
                const touch = event.touches[0]
                const deltaX = touch.clientX - lastMousePositionRef.current.x
                const deltaY = touch.clientY - lastMousePositionRef.current.y
                applyPanDelta(deltaX, deltaY)
                lastMousePositionRef.current = { x: touch.clientX, y: touch.clientY }
            } else if (event.touches.length === 2 && pinchStartDistRef.current !== null) {
                const dx = event.touches[0].clientX - event.touches[1].clientX
                const dy = event.touches[0].clientY - event.touches[1].clientY
                const currentDist = Math.sqrt(dx * dx + dy * dy)
                const delta = (pinchStartDistRef.current - currentDist) * PINCH_ZOOM_MULTIPLIER
                scrollDeltaRef.current.z += delta
                pinchStartDistRef.current = currentDist
            }
        }

        const handleTouchEnd = () => {
            isDraggingRef.current = false
            pinchStartDistRef.current = null
        }

        // Wheel scoped to container, not window
        container.addEventListener('wheel', handleWheel, { passive: false })
        container.addEventListener('mousedown', handleMouseDown)
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
        // Touch event listeners
        container.addEventListener('touchstart', handleTouchStart, { passive: false })
        container.addEventListener('touchmove', handleTouchMove, { passive: false })
        container.addEventListener('touchend', handleTouchEnd)

        return () => {
            document.body.style.overflow = originalOverflow
            container.removeEventListener('wheel', handleWheel)
            container.removeEventListener('mousedown', handleMouseDown)
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
            container.removeEventListener('touchstart', handleTouchStart)
            container.removeEventListener('touchmove', handleTouchMove)
            container.removeEventListener('touchend', handleTouchEnd)
        }
    // All mutable state accessed via refs (.current), so empty deps is intentional
    // — re-subscribing event listeners on every render would cause flicker
    }, [applyPanDelta]) // eslint-disable-line react-hooks/exhaustive-deps
}
