import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { accessMock, refMock } = vi.hoisted(() => ({
  accessMock: vi.fn(),
  refMock: vi.fn(),
}));

vi.mock('fs', () => ({
  promises: {
    access: accessMock,
  },
}));

vi.mock('@/lib/database', () => ({
  db: {
    ref: refMock,
  },
  getDatabaseBackend: () => 'cloudflare-d1',
}));

import { GET } from './route';

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns ok when filesystem and database are healthy', async () => {
    accessMock.mockResolvedValue(undefined);
    refMock.mockReturnValue({
      once: vi.fn().mockResolvedValue({ val: () => 'ok' }),
    });

    const mockRequest = new Request('http://localhost/api/health');
    const response = await GET(mockRequest as unknown as NextRequest);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.filesystem).toBe('accessible');
    expect(body.database).toBe('connected');
    expect(body.memory.heapUsed).toBeDefined();
    expect(body.memory.rss).toBeDefined();
    expect(body.timestamp).toBeDefined();
  });

  it('returns degraded when filesystem is inaccessible', async () => {
    accessMock.mockRejectedValue(new Error('EACCES'));
    refMock.mockReturnValue({
      once: vi.fn().mockResolvedValue({ val: () => 'ok' }),
    });

    const mockRequest = new Request('http://localhost/api/health');
    const response = await GET(mockRequest as unknown as NextRequest);
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe('degraded');
    expect(body.filesystem).toBe('inaccessible');
  });

  it('returns degraded when database is disconnected', async () => {
    accessMock.mockResolvedValue(undefined);
    refMock.mockReturnValue({
      once: vi.fn().mockRejectedValue(new Error('Network error')),
    });

    const mockRequest = new Request('http://localhost/api/health');
    const response = await GET(mockRequest as unknown as NextRequest);
    const body = await response.json();

    expect(body.database).toBe('disconnected');
    expect(body.status).toBe('degraded');
  });
});
