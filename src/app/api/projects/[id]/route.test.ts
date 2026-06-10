import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  validateAdminRequestMock,
  getProjectsMock,
  updateProjectMock,
  deleteProjectMock,
  refMock,
  onceMock,
  valMock,
  setMock,
  sendTelegramAlertMock,
  revalidatePathMock,
  generateGenZCommentsMock,
} = vi.hoisted(() => ({
  validateAdminRequestMock: vi.fn(),
  getProjectsMock: vi.fn(),
  updateProjectMock: vi.fn(),
  deleteProjectMock: vi.fn(),
  refMock: vi.fn(),
  onceMock: vi.fn(),
  valMock: vi.fn(),
  setMock: vi.fn(),
  sendTelegramAlertMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  generateGenZCommentsMock: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  validateAdminRequest: validateAdminRequestMock,
}));

vi.mock('@/lib/services/projectService', () => ({
  projectService: {
    getProjects: getProjectsMock,
    updateProject: updateProjectMock,
    deleteProject: deleteProjectMock,
  },
}));

vi.mock('@/lib/database', () => ({
  db: {
    ref: refMock,
  },
}));

vi.mock('@/lib/telegram', () => ({
  sendTelegramAlert: sendTelegramAlertMock,
}));

vi.mock('@/lib/magic', () => ({
  generateGenZComments: generateGenZCommentsMock,
}));

vi.mock('next/cache', () => ({
  revalidatePath: revalidatePathMock,
}));

import { NextRequest } from 'next/server';
import { GET, PUT, DELETE } from './route';

const mockProject = {
  id: 'proj-1',
  slug: 'test-project',
  title: 'Test Project',
  client: 'Test Client',
  year: 2025,
  tags: ['web'],
  description: 'A test project',
  cover: '/r2/assets/test/cover.jpg',
  coverWidth: 800,
  coverHeight: 600,
  likes: 0,
  shares: 0,
  status: 'published' as const,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

function buildPut(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/projects/proj-1', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function buildDelete(): NextRequest {
  return new NextRequest('http://localhost/api/projects/proj-1', {
    method: 'DELETE',
  });
}

describe('GET /api/projects/[id]', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    valMock.mockReturnValue(mockProject);
    onceMock.mockResolvedValue({ val: valMock });
    refMock.mockReturnValue({ once: onceMock });
  });

  it('returns a single project from D1', async () => {
    const response = await GET(
      new NextRequest('http://localhost/api/projects/proj-1'),
      params('proj-1')
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.project.id).toBe('proj-1');
    expect(refMock).toHaveBeenCalledWith('projects/proj-1');
  });

  it('falls back to service when D1 returns null', async () => {
    valMock.mockReturnValue(null);
    getProjectsMock.mockResolvedValue({
      projects: [mockProject],
      lastUpdated: new Date().toISOString(),
    });

    const response = await GET(
      new NextRequest('http://localhost/api/projects/proj-1'),
      params('proj-1')
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.project.id).toBe('proj-1');
  });

  it('returns 404 when project not found anywhere', async () => {
    valMock.mockReturnValue(null);
    getProjectsMock.mockResolvedValue({
      projects: [{ ...mockProject, id: 'other' }],
      lastUpdated: new Date().toISOString(),
    });

    const response = await GET(
      new NextRequest('http://localhost/api/projects/proj-1'),
      params('proj-1')
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('Project not found');
  });

  it('returns 500 on unexpected error', async () => {
    refMock.mockReturnValue({
      once: vi.fn().mockRejectedValue(new Error('DB error')),
    });

    const response = await GET(
      new NextRequest('http://localhost/api/projects/proj-1'),
      params('proj-1')
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to load project');
  });
});

describe('PUT /api/projects/[id]', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    validateAdminRequestMock.mockResolvedValue(true);
    updateProjectMock.mockResolvedValue(mockProject);
    sendTelegramAlertMock.mockResolvedValue(undefined);
    valMock.mockReturnValue([]);
    onceMock.mockResolvedValue({ val: valMock });
    refMock.mockReturnValue({ once: onceMock, set: setMock });
    setMock.mockResolvedValue(undefined);
  });

  it('rejects unauthenticated updates', async () => {
    validateAdminRequestMock.mockResolvedValue(false);
    const response = await PUT(
      buildPut({ id: 'proj-1', title: 'Test' }) as never,
      params('proj-1')
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized or invalid CSRF token');
  });

  it('rejects invalid payload with validation details', async () => {
    const response = await PUT(buildPut({ id: '', title: '' }) as never, params(''));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Validation Failed');
    expect(body.details).toBeDefined();
  });

  it('updates a project and revalidates paths', async () => {
    updateProjectMock.mockResolvedValue({ ...mockProject, title: 'Updated Project' });

    const response = await PUT(
      buildPut({ id: 'proj-1', title: 'Updated Project' }) as never,
      params('proj-1')
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.project.title).toBe('Updated Project');
    expect(revalidatePathMock).toHaveBeenCalledWith('/', 'layout');
    expect(revalidatePathMock).toHaveBeenCalledWith('/projects');
    expect(revalidatePathMock).toHaveBeenCalledWith('/admin');
  });

  it('returns 404 when project not found for update', async () => {
    updateProjectMock.mockResolvedValue(null);
    const response = await PUT(
      buildPut({ id: 'proj-1', title: 'Test' }) as never,
      params('proj-1')
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('Project not found or update failed');
  });

  it('sends Telegram alert with changed fields', async () => {
    updateProjectMock.mockResolvedValue({
      ...mockProject,
      title: 'New Title',
      client: 'New Client',
    });

    await PUT(
      buildPut({ id: 'proj-1', title: 'New Title', client: 'New Client' }) as never,
      params('proj-1')
    );

    expect(sendTelegramAlertMock).toHaveBeenCalled();
    const call = sendTelegramAlertMock.mock.calls[0][0];
    expect(call).toContain('PROJECT UPDATED');
  });

  it('appends comments when initialCommentCount > 0', async () => {
    generateGenZCommentsMock.mockReturnValue([
      { id: 1, text: 'Love it!', isMe: false, time: '12:00' },
    ]);
    updateProjectMock.mockResolvedValue(mockProject);
    valMock.mockReturnValue([{ id: 0, text: 'Existing', isMe: false, time: '11:00' }]);

    await PUT(
      buildPut({ id: 'proj-1', title: 'Test', initialCommentCount: 1 }) as never,
      params('proj-1')
    );

    expect(generateGenZCommentsMock).toHaveBeenCalledWith('test-project', 1);
    expect(setMock).toHaveBeenCalled();
  });

  it('handles unexpected error in update', async () => {
    updateProjectMock.mockRejectedValue(new Error('Crash'));
    const response = await PUT(
      buildPut({ id: 'proj-1', title: 'Test' }) as never,
      params('proj-1')
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Crash');
  });
});

describe('DELETE /api/projects/[id]', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    validateAdminRequestMock.mockResolvedValue(true);
    deleteProjectMock.mockResolvedValue(true);
    sendTelegramAlertMock.mockResolvedValue(undefined);
  });

  it('rejects unauthenticated deletes', async () => {
    validateAdminRequestMock.mockResolvedValue(false);
    const response = await DELETE(buildDelete() as never, params('proj-1'));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized or invalid CSRF token');
  });

  it('deletes a project and revalidates', async () => {
    const response = await DELETE(buildDelete() as never, params('proj-1'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe('Project deleted successfully');
    expect(deleteProjectMock).toHaveBeenCalledWith('proj-1');
    expect(revalidatePathMock).toHaveBeenCalled();
    expect(sendTelegramAlertMock).toHaveBeenCalled();
  });

  it('returns 404 when project not found for delete', async () => {
    deleteProjectMock.mockResolvedValue(false);
    const response = await DELETE(buildDelete() as never, params('proj-1'));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('Project not found or delete failed');
  });

  it('handles unexpected delete error', async () => {
    deleteProjectMock.mockRejectedValue(new Error('Crash'));
    const response = await DELETE(buildDelete() as never, params('proj-1'));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Crash');
  });
});
