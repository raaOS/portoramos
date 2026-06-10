import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

const {
  validateAdminRequestMock,
  generateViralMetricsMock,
  generateGenZCommentsMock,
  projectServiceUpdateMock,
  dbRefSetMock,
} = vi.hoisted(() => ({
  validateAdminRequestMock: vi.fn(),
  generateViralMetricsMock: vi.fn(),
  generateGenZCommentsMock: vi.fn(),
  projectServiceUpdateMock: vi.fn(),
  dbRefSetMock: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  validateAdminRequest: validateAdminRequestMock,
}));

vi.mock('@/lib/magic', () => ({
  generateViralMetrics: generateViralMetricsMock,
  generateGenZComments: generateGenZCommentsMock,
}));

vi.mock('@/lib/services/projectService', () => ({
  projectService: { updateProject: projectServiceUpdateMock },
}));

const mockDbRef = {
  set: dbRefSetMock,
};

vi.mock('@/lib/database', () => ({
  db: { ref: vi.fn(() => mockDbRef) },
}));

import { POST } from './route';

function buildPostRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/admin/projects/magic-complete', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const mockMetrics = { likes: 20, shares: 3 };
const mockComments = [{ id: 'c-1', text: 'Keren!', name: 'Test', likes: 5, replies: [] }];

describe('POST /api/admin/projects/magic-complete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateAdminRequestMock.mockResolvedValue(true);
    generateViralMetricsMock.mockReturnValue(mockMetrics);
    generateGenZCommentsMock.mockReturnValue(mockComments);
    projectServiceUpdateMock.mockResolvedValue({ id: 'proj-1', ...mockMetrics });
    dbRefSetMock.mockResolvedValue(undefined);
  });

  it('rejects unauthenticated requests', async () => {
    validateAdminRequestMock.mockResolvedValue(false);
    const res = await POST(buildPostRequest({ projectId: 'proj-1', slug: 'my-project' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 when projectId is missing', async () => {
    const res = await POST(buildPostRequest({ slug: 'my-project' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Missing');
  });

  it('returns 400 when slug is missing', async () => {
    const res = await POST(buildPostRequest({ projectId: 'proj-1' }));
    expect(res.status).toBe(400);
  });

  it('returns 404 when project is not found', async () => {
    projectServiceUpdateMock.mockResolvedValue(null);
    const res = await POST(buildPostRequest({ projectId: 'proj-1', slug: 'my-project' }));
    expect(res.status).toBe(404);
  });

  it('generates metrics, updates project, and writes comments on success', async () => {
    const res = await POST(buildPostRequest({ projectId: 'proj-1', slug: 'my-project' }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.metrics).toEqual(mockMetrics);
    expect(body.commentCount).toBe(mockComments.length);

    expect(generateViralMetricsMock).toHaveBeenCalledTimes(1);
    expect(projectServiceUpdateMock).toHaveBeenCalledWith('proj-1', {
      id: 'proj-1',
      ...mockMetrics,
    });
    expect(generateGenZCommentsMock).toHaveBeenCalledWith('my-project');
    expect(dbRefSetMock).toHaveBeenCalledWith(mockComments);
  });

  it('catches internal errors and returns 500 without leaking details', async () => {
    projectServiceUpdateMock.mockRejectedValue(new Error('Database explosion'));
    const res = await POST(buildPostRequest({ projectId: 'proj-1', slug: 'my-project' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to complete magic operation');
    expect(body).not.toHaveProperty('stack');
  });
});
