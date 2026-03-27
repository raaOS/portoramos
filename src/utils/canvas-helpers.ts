import { Project } from '@/types/projects'

export function hash3D(x: number, y: number, z: number): number {
    // Chaotic hash combining sin and multiplication
    const h = Math.sin(x * 12.9898 + y * 78.233 + z * 45.123) * 43758.5453123
    return Math.abs(h % 1)
}

export function getCoverUrl(project: Project): string {
    return project.cover || '/og-image.png'
}

export function isVideoUrl(url: string): boolean {
    return /\.(mp4|webm|ogg)$/i.test(url)
}

/**
 * Deterministically maps a cell coordinate to a project index.
 */
export function cellToProjectIdx(gx: number, gy: number, gz: number, projectsLength: number): number {
    if (projectsLength <= 0) return 0
    // A robust 3D hash for better project distribution even with small lists
    const h1 = (gx * 73856093) ^ (gy * 19349663) ^ (gz * 83492791)
    const h2 = Math.sin(h1) * 10000
    const randomShift = Math.floor(Math.abs(Math.sin(gx + gy + gz) * 100))
    return Math.abs(Math.floor(h2) + randomShift) % projectsLength
}
