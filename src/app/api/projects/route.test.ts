import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  validateAdminRequestMock,
  getProjectsMock,
  createProjectMock,
  refMock,
  setMock,
  sendTelegramAlertMock,
  revalidatePathMock,
  generateGenZCommentsMock,
} = vi.hoisted(() => ({
  validateAdminRequestMock: vi.fn(),
  getProjectsMock: vi.fn(),
  createProjectMock: vi.fn(),
  refMock: vi.fn(),
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
    createProject: createProjectMock,
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

import { GET, POST } from './route';

const validProjectPayload = {
  title: 'Test Project',
  client: 'Test Client',
  year: 2025,
  tags: ['web', 'design'],
  description: 'A test project description',
  cover: '/r2/assets/projects/test/cover.jpg',
  likes: 0,
  shares: 0,
  status: 'published' as const,
};

const mockProject = {
  id: 'proj-1',
  slug: 'test-project',
  title: 'Test Project',
  client: 'Test Client',
  year: 2025,
  tags: ['web', 'design'],
  description: 'A test project description',
  cover: '/r2/assets/projects/test/cover.jpg',
  coverWidth: 800,
  coverHeight: 600,
  likes: 0,
  shares: 0,
  status: 'published' as const,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

function buildGet(url: string): Request {
  return new Request(`http://localhost/api/projects${url}`, { method: 'GET' });
}

function buildPost(body: unknown): Request {
  return new Request('http://localhost/api/projects', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('GET /api/projects', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getProjectsMock.mockResolvedValue({
      projects: [mockProject],
      lastUpdated: '2025-01-01T00:00:00Z',
    });
  });

  it('returns project list with resolved URLs', async () => {
    const response = await GET(buildGet('?status=published') as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.projects).toHaveLength(1);
    expect(body.data.lastUpdated).toBe('2025-01-01T00:00:00Z');
  });

  it('passes status filter to service', async () => {
    await GET(buildGet('?status=draft') as never);
    expect(getProjectsMock).toHaveBeenCalledWith('draft', false);
  });

  it('passes fresh flag to service', async () => {
    await GET(buildGet('?fresh=true') as never);
    expect(getProjectsMock).toHaveBeenCalledWith(undefined, true);
  });

  it('returns server error on service failure', async () => {
    getProjectsMock.mockRejectedValue(new Error('DB down'));
    const response = await GET(buildGet('') as never);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to load projects');
  });
});

describe('POST /api/projects', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    validateAdminRequestMock.mockResolvedValue(true);
    createProjectMock.mockResolvedValue(mockProject);
    sendTelegramAlertMock.mockResolvedValue(undefined);
    refMock.mockReturnValue({ set: setMock });
    setMock.mockResolvedValue(undefined);
    generateGenZCommentsMock.mockReturnValue([]);
  });

  it('rejects unauthenticated requests', async () => {
    validateAdminRequestMock.mockResolvedValue(false);
    const response = await POST(buildPost(validProjectPayload) as never);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Invalid or missing CSRF token');
  });

  it('rejects invalid payloads', async () => {
    const response = await POST(buildPost({}) as never);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Validation failed');
    expect(createProjectMock).not.toHaveBeenCalled();
  });

  it('creates a project and triggers revalidation', async () => {
    const response = await POST(buildPost(validProjectPayload) as never);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('proj-1');
    expect(createProjectMock).toHaveBeenCalled();
    expect(revalidatePathMock).toHaveBeenCalledWith('/', 'layout');
    expect(revalidatePathMock).toHaveBeenCalledWith('/projects');
    expect(revalidatePathMock).toHaveBeenCalledWith('/admin');
  });

  it('sends Telegram alert on creation', async () => {
    await POST(buildPost(validProjectPayload) as never);
    expect(sendTelegramAlertMock).toHaveBeenCalled();
  });

  it('does not generate comments when initialCommentCount is 0', async () => {
    await POST(buildPost(validProjectPayload) as never);
    expect(generateGenZCommentsMock).not.toHaveBeenCalled();
  });

  it('generates comments when initialCommentCount > 0', async () => {
    generateGenZCommentsMock.mockReturnValue([
      { id: 1, text: 'Nice!', isMe: false, time: '12:00' },
    ]);

    await POST(buildPost({ ...validProjectPayload, initialCommentCount: 2 }) as never);

    expect(generateGenZCommentsMock).toHaveBeenCalledWith('test-project', 2);
    expect(refMock).toHaveBeenCalledWith('comments/test-project');
  });

  it('handles service ZodError as validation error', async () => {
    const { ZodError } = await import('zod');
    createProjectMock.mockRejectedValue(new ZodError([]));
    const response = await POST(buildPost(validProjectPayload) as never);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns server error on unexpected failure', async () => {
    createProjectMock.mockRejectedValue(new Error('Unexpected'));
    const response = await POST(buildPost(validProjectPayload) as never);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to create project');
  });

  it('converts year correctly when passed as number', async () => {
    await POST(buildPost({ ...validProjectPayload, year: 2025 }) as never);

    const callArg = createProjectMock.mock.calls[0][0];
    expect(callArg.year).toBe(2025);
  });
});
