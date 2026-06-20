import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { validateAdminRequestMock, generateViralMetricsMock, generateGenZCommentsMock } = vi.hoisted(
  () => ({
    validateAdminRequestMock: vi.fn(),
    generateViralMetricsMock: vi.fn(),
    generateGenZCommentsMock: vi.fn(),
  })
);

vi.mock('@/lib/auth', () => ({
  validateAdminRequest: validateAdminRequestMock,
}));

vi.mock('@/lib/magic', () => ({
  generateViralMetrics: generateViralMetricsMock,
  generateGenZComments: generateGenZCommentsMock,
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
  });

  it('rejects unauthenticated requests', async () => {
    validateAdminRequestMock.mockResolvedValue(false);
    const res = await POST(buildPostRequest({ slug: 'my-project' }));
    expect(res.status).toBe(401);
  });

  it('performs pure in-memory generation with generated metrics and mock comments', async () => {
    const res = await POST(buildPostRequest({ slug: 'my-project' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.metrics).toEqual(mockMetrics);
    expect(body.commentCount).toBe(mockComments.length);
    expect(body.comments).toEqual(mockComments);

    expect(generateViralMetricsMock).toHaveBeenCalledTimes(1);
    expect(generateGenZCommentsMock).toHaveBeenCalledWith('my-project', 5, 'casual', true);
  });

  it('uses default slug temp-slug when request slug is missing or empty', async () => {
    const res = await POST(buildPostRequest({}));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(generateGenZCommentsMock).toHaveBeenCalledWith('temp-slug', 5, 'casual', true);
  });

  it('uses passed metrics (likes and shares) instead of generating random ones', async () => {
    const customLikes = 150;
    const customShares = 45;
    const res = await POST(
      buildPostRequest({
        slug: 'my-project',
        likes: customLikes,
        shares: customShares,
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.metrics).toEqual({ likes: customLikes, shares: customShares });
  });

  it('uses custom comment settings from request parameters', async () => {
    const customCount = 8;
    const customTone = 'tech';
    const customReply = false;
    const res = await POST(
      buildPostRequest({
        slug: 'my-project',
        commentCount: customCount,
        tone: customTone,
        reply: customReply,
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(generateGenZCommentsMock).toHaveBeenCalledWith(
      'my-project',
      customCount,
      customTone,
      customReply
    );
  });

  it('catches internal errors and returns 500 without leaking details', async () => {
    generateViralMetricsMock.mockImplementation(() => {
      throw new Error('Simulation failed');
    });
    const res = await POST(buildPostRequest({ slug: 'my-project' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to complete magic operation');
    expect(body).not.toHaveProperty('stack');
  });
});
