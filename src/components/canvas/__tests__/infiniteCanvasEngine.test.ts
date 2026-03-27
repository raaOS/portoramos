import { describe, expect, it } from 'vitest'
import type { Project } from '@/types/projects'
import {
    CANVAS_CONSTANTS,
    assignProjectsToCells,
    buildCellPositions,
    computeVisualStyle,
    pruneAssignmentState,
    type CellPosition,
} from '../infiniteCanvasEngine'

function createProject(id: string): Project {
    return {
        id,
        title: `Project ${id}`,
        slug: `project-${id}`,
        client: 'Client',
        year: 2025,
        tags: ['design'],
        cover: '/image.jpg',
        autoplay: false,
        muted: true,
        loop: false,
        playsInline: true,
        coverWidth: 1200,
        coverHeight: 800,
        description: 'Description',
        order: 1,
        status: 'published',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
    }
}

describe('infiniteCanvasEngine', () => {
    it('membangun cell positions secara terurut berdasarkan jarak', () => {
        const positions = buildCellPositions({ x: 0, y: 0, z: 0 })

        expect(positions).toHaveLength((CANVAS_CONSTANTS.renderRadius * 2 + 1) ** 3)
        expect(positions[0].dist).toBeLessThanOrEqual(positions[positions.length - 1].dist)
    })

    it('mempertahankan assignment project untuk cell yang sama', () => {
        const projects = ['a', 'b', 'c', 'd'].map(createProject)
        const projectById = new Map(projects.map((project) => [project.id, project]))
        const cellPositions: CellPosition[] = [
            { key: '0_0_0', gx: 0, gy: 0, gz: 0, itemX: 0, itemY: 0, itemZ: 0, dist: 1 },
            { key: '0_0_1', gx: 0, gy: 0, gz: 1, itemX: 0, itemY: 0, itemZ: 1, dist: 2 },
        ]
        const persistedAssignments = new Map<string, string>([['0_0_0', 'c']])

        const result = assignProjectsToCells({
            cellPositions,
            projects,
            persistedAssignments,
            insertionOrder: ['0_0_0'],
            projectById,
        })

        expect(result.assignments.get('0_0_0')).toBe('c')
        expect(result.items[0].project.id).toBe('c')
    })

    it('mempertahankan assignment project ketika urutan jarak (priority) berubah', () => {
        const projects = ['a', 'b', 'c', 'd'].map(createProject)
        const projectById = new Map(projects.map((project) => [project.id, project]))

        // Awalnya 0_0_0 lebih dekat (dist: 1) daripada 0_0_1 (dist: 2)
        const cellPositions1: CellPosition[] = [
            { key: '0_0_0', gx: 0, gy: 0, gz: 0, itemX: 0, itemY: 0, itemZ: 0, dist: 1 },
            { key: '0_0_1', gx: 0, gy: 0, gz: 1, itemX: 0, itemY: 0, itemZ: 1, dist: 2 },
        ]

        const firstPass = assignProjectsToCells({
            cellPositions: cellPositions1,
            projects,
            persistedAssignments: new Map(),
            insertionOrder: [],
            projectById,
        })

        const p0 = firstPass.assignments.get('0_0_0')
        const p1 = firstPass.assignments.get('0_0_1')

        // Simulasi kamera bergerak sehingga 0_0_1 sekarang lebih dekat (dist: 1) daripada 0_0_0 (dist: 5)
        const cellPositions2: CellPosition[] = [
            { key: '0_0_1', gx: 0, gy: 0, gz: 1, itemX: 0, itemY: 0, itemZ: 1, dist: 1 },
            { key: '0_0_0', gx: 0, gy: 0, gz: 0, itemX: 0, itemY: 0, itemZ: 0, dist: 5 },
        ]

        const secondPass = assignProjectsToCells({
            cellPositions: cellPositions2,
            projects,
            persistedAssignments: firstPass.assignments,
            insertionOrder: firstPass.insertionOrder,
            projectById,
        })

        // Assignment harus tetap sama meskipun urutan pemrosesan (berdasarkan dist) berubah
        expect(secondPass.assignments.get('0_0_0')).toBe(p0)
        expect(secondPass.assignments.get('0_0_1')).toBe(p1)
    })

    it('memangkas cache lama tanpa menghapus key yang aktif', () => {
        const assignments = new Map<string, string>([
            ['old-1', 'a'],
            ['old-2', 'b'],
            ['active-1', 'c'],
            ['active-2', 'd'],
        ])
        const result = pruneAssignmentState({
            assignments,
            insertionOrder: ['old-1', 'old-2', 'active-1', 'active-2'],
            activeKeys: new Set(['active-1', 'active-2']),
            maxEntries: 2,
        })

        expect(result.assignments.has('active-1')).toBe(true)
        expect(result.assignments.has('active-2')).toBe(true)
        expect(result.assignments.size).toBeLessThan(assignments.size)
    })

    it('menghasilkan grayscale yang bertahap di sekitar threshold', () => {
        const item = {
            key: '0_0_0',
            project: createProject('a'),
            x: 0,
            y: 0,
            z: -4600,
            scale: 1,
            rotation: 0,
            dist: 4600,
        }

        const visual = computeVisualStyle({
            item,
            camera: { x: 0, y: 0, z: 0 },
            previousOpacity: 1,
            previousGrayscale: 0,
        })

        expect(visual.grayscale).toBeGreaterThan(0)
        expect(visual.grayscale).toBeLessThan(100)
        expect(visual.filter).toContain('grayscale(')
    })

    it('menandai item sebagai hidden ketika melewati clipping distance', () => {
        const item = {
            key: '0_0_0',
            project: createProject('a'),
            x: 0,
            y: 0,
            z: CANVAS_CONSTANTS.clipFar - 100,
            scale: 1,
            rotation: 0,
            dist: Math.abs(CANVAS_CONSTANTS.clipFar - 100),
        }

        const visual = computeVisualStyle({
            item,
            camera: { x: 0, y: 0, z: 0 },
            previousOpacity: 0,
            previousGrayscale: 0,
        })

        expect(visual.hidden).toBe(true)
        expect(visual.opacity).toBe(0)
    })

    it('menghaluskan transisi grayscale antar frame', () => {
        const item = {
            key: '0_0_0',
            project: createProject('a'),
            x: 0,
            y: 0,
            z: -5000,
            scale: 1,
            rotation: 0,
            dist: 5000,
        }

        const visual = computeVisualStyle({
            item,
            camera: { x: 0, y: 0, z: 0 },
            previousOpacity: 1,
            previousGrayscale: 40,
        })

        expect(visual.grayscale).toBeGreaterThan(40)
        expect(visual.grayscale).toBeLessThan(100)
    })
})
