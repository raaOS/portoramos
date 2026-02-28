import { describe, it, expect, vi, beforeEach } from 'vitest';
import { projectService } from '../projectService';
import { loadData, ensureDataDir } from '@/lib/backup';
import { githubService } from '@/lib/github';
import _projectsData from '@/data/projects.json';

// Mock dependencies
vi.mock('@/lib/backup', () => ({
    loadData: vi.fn(),
    saveData: vi.fn(),
    ensureDataDir: vi.fn(),
}));

vi.mock('@/lib/github', () => ({
    githubService: {
        getFile: vi.fn(),
        updateProjects: vi.fn(),
        deleteFile: vi.fn(),
    },
}));

vi.mock('@/data/projects.json', () => ({
    default: {
        projects: [
            {
                id: '1',
                slug: 'static-project',
                title: 'Static Project',
                status: 'published',
                order: 1,
                year: 2023,
                client: 'Static Client',
                cover: 'static.jpg',
                description: 'Static description',
                createdAt: '2023-01-01T00:00:00.000Z',
                updatedAt: '2023-01-01T00:00:00.000Z'
            }
        ],
        lastUpdated: '2023-01-01T00:00:00.000Z'
    }
}));

vi.mock('next/cache', () => ({
    revalidateTag: vi.fn(),
    revalidatePath: vi.fn(),
    unstable_cache: vi.fn((fn) => fn),
}));

describe('projectService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv('NODE_ENV', 'development');
    });

    describe('getProjects', () => {
        it('should load projects from local FS in development', async () => {
            const mockData = {
                projects: [
                    {
                        id: 'p1',
                        slug: 'project-1',
                        title: 'Project 1',
                        status: 'published',
                        order: 1,
                        year: 2024,
                        client: 'Client A',
                        cover: 'img.jpg',
                        description: 'Test description',
                        createdAt: '2024-01-01T00:00:00.000Z',
                        updatedAt: '2024-01-01T00:00:00.000Z'
                    }
                ],
                lastUpdated: '2024-01-01T00:00:00.000Z'
            };
            (loadData as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue(mockData);

            const result = await projectService.getProjects();

            expect(ensureDataDir).toHaveBeenCalled();
            expect(loadData).toHaveBeenCalled();
            expect(result.projects).toHaveLength(1);
            expect(result.projects[0].title).toBe('Project 1');
        });

        it('should load projects from GitHub in production', async () => {
            vi.stubEnv('NODE_ENV', 'production');
            const mockGhData = {
                content: {
                    projects: [
                        {
                            id: 'gh1',
                            slug: 'gh-project',
                            title: 'GH Project',
                            status: 'published',
                            order: 1,
                            year: 2024,
                            client: 'Client B',
                            cover: 'gh.jpg',
                            description: 'GH description',
                            createdAt: '2024-02-01T00:00:00.000Z',
                            updatedAt: '2024-02-01T00:00:00.000Z'
                        }
                    ],
                    lastUpdated: '2024-02-01T00:00:00.000Z'
                }
            };
            (githubService.getFile as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue(mockGhData);

            const result = await projectService.getProjects();

            expect(githubService.getFile).toHaveBeenCalled();
            expect(result.projects).toHaveLength(1);
            expect(result.projects[0].title).toBe('GH Project');
        });

        it('should fallback to static data if loading fails', async () => {
            (loadData as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue(null);

            const result = await projectService.getProjects();

            expect(result.projects).toHaveLength(1);
            expect(result.projects[0].title).toBe('Static Project');
        });

        it('should validate projects using Zod and filter invalid ones', async () => {
            const mockData = {
                projects: [
                    {
                        id: 'valid',
                        slug: 'valid',
                        title: 'Valid',
                        status: 'published',
                        order: 1,
                        year: 2024,
                        client: 'A',
                        cover: 'a.jpg',
                        description: 'Desc',
                        createdAt: '2024-01-01T00:00:00.000Z',
                        updatedAt: '2024-01-01T00:00:00.000Z'
                    },
                    { id: 'invalid', title: '', status: 'published' } // Missing required fields for Zod
                ],
                lastUpdated: '2024-01-01T00:00:00.000Z'
            };
            (loadData as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue(mockData);

            const result = await projectService.getProjects();

            expect(result.projects).toHaveLength(1);
            expect(result.projects[0].id).toBe('valid');
        });
    });
});
