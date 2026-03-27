import { Project } from '@/types/projects'

export const PERSPECTIVE = 1000
export const CELL_SIZE = 2600          // Consistent spread
export const RENDER_RADIUS = 3.2       // Wider field for 'full' feel (7x7x7)
export const MAX_ITEMS = 100           // Better density balance
export const MOUSE_SENSITIVITY = 1.2   // More response
export const SCROLL_SENSITIVITY = 1.4   // Finer zoom control
export const VELOCITY_DECAY = 0.96     // Premium glide
export const VELOCITY_LERP = 0.08      // Smoother camera lag
export const KEYBOARD_SPEED = 300
export const CARD_WIDTH = 700          // Consistent width for offset math

// Visibility & Scale Constraints
export const FADE_DISTANCE_NEAR = -200  // Final visibility cutoff before hitting camera
export const MAX_SCALE = 3.5            // Prevent cards from covering the entire screen

export type VirtualItem = {
    key: string
    project: Project
    x: number
    y: number
    z: number
    scale: number
    rotation: number
    h: number               // Pre-calculated height for center-offset optimization
    dist?: number
    initialTransform?: string
    initialOpacity?: number
}
