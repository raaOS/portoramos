import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  validateAdminRequest: vi.fn(),
  refOnce: vi.fn(),
  refExists: vi.fn(),
  refUpdate: vi.fn(),
  refRemove: vi.fn(),
  refMock: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  validateAdminRequest: mocks.validateAdminRequest,
}));

vi.mock('@/lib/database', () => ({
  db: {
    ref: mocks.refMock,
  },
}));

import { PATCH, DELETE } from './route';
import { NextRequest } from 'next/server';

function makeRef(overrides: Record<string, unknown> = {}) {
  return {
    once: mocks.refOnce,
    update: mocks.refUpdate,
    remove: mocks.refRemove,
    ...overrides,
  };
}

describe('PATCH /api/feedback/[id]', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.validateAdminRequest.mockResolvedValue(false);
    mocks.refOnce.mockResolvedValue({ exists: () => true, val: () => ({ status: 'pending' }) });
    mocks.refUpdate.mockResolvedValue(undefined);
    mocks.refMock.mockReturnValue(makeRef());
  });

  it('returns 401 when not authenticated as admin', async () => {
    const request = new NextRequest('http://localhost/api/feedback/abc', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'approved' }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: 'abc' }) });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.errorCode).toBe('UNAUTHORIZED');
  });

  it('returns 400 when feedback id is missing', async () => {
    mocks.validateAdminRequest.mockResolvedValue(true);

    const request = new NextRequest('http://localhost/api/feedback/', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'approved' }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: '' }) });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Missing feedback id');
  });

  it('returns 400 when body is not valid JSON', async () => {
    mocks.validateAdminRequest.mockResolvedValue(true);

    const request = new NextRequest('http://localhost/api/feedback/abc', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: 'not-json',
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: 'abc' }) });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Invalid JSON body');
  });

  it('returns 400 when status value is invalid', async () => {
    mocks.validateAdminRequest.mockResolvedValue(true);

    const request = new NextRequest('http://localhost/api/feedback/abc', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'invalid_status' }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: 'abc' }) });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.errorCode).toBe('VALIDATION_ERROR');
  });

  it('returns 404 when feedback is not found', async () => {
    mocks.validateAdminRequest.mockResolvedValue(true);
    mocks.refOnce.mockResolvedValue({ exists: () => false, val: () => null });

    const request = new NextRequest('http://localhost/api/feedback/abc', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'approved' }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: 'abc' }) });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.errorCode).toBe('NOT_FOUND');
  });

  it('successfully updates feedback status', async () => {
    mocks.validateAdminRequest.mockResolvedValue(true);

    const request = new NextRequest('http://localhost/api/feedback/abc', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'approved', isPublic: true }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: 'abc' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('abc');
    expect(body.data.status).toBe('approved');
    expect(body.data.isPublic).toBe(true);
    expect(mocks.refUpdate).toHaveBeenCalled();
  });
});

describe('DELETE /api/feedback/[id]', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.validateAdminRequest.mockResolvedValue(false);
    mocks.refOnce.mockResolvedValue({ exists: () => true, val: () => ({ status: 'pending' }) });
    mocks.refRemove.mockResolvedValue(undefined);
    mocks.refMock.mockReturnValue(makeRef());
  });

  it('returns 401 when not authenticated as admin', async () => {
    const request = new NextRequest('http://localhost/api/feedback/abc', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: Promise.resolve({ id: 'abc' }) });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.errorCode).toBe('UNAUTHORIZED');
  });

  it('returns 400 when feedback id is missing', async () => {
    mocks.validateAdminRequest.mockResolvedValue(true);

    const request = new NextRequest('http://localhost/api/feedback/', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: Promise.resolve({ id: '' }) });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Missing feedback id');
  });

  it('returns 404 when feedback is not found', async () => {
    mocks.validateAdminRequest.mockResolvedValue(true);
    mocks.refOnce.mockResolvedValue({ exists: () => false, val: () => null });

    const request = new NextRequest('http://localhost/api/feedback/abc', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: Promise.resolve({ id: 'abc' }) });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.errorCode).toBe('NOT_FOUND');
  });

  it('successfully deletes feedback', async () => {
    mocks.validateAdminRequest.mockResolvedValue(true);

    const request = new NextRequest('http://localhost/api/feedback/abc', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: Promise.resolve({ id: 'abc' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('abc');
    expect(body.message).toBe('Feedback deleted');
    expect(mocks.refRemove).toHaveBeenCalled();
  });
});
