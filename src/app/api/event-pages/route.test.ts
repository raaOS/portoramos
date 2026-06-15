import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { validateAdminRequestMock, eventPageServiceMock } = vi.hoisted(() => ({
  validateAdminRequestMock: vi.fn(),
  eventPageServiceMock: {
    getAllPages: vi.fn(),
    getResolvedPageByFolderId: vi.fn(),
    upsertPage: vi.fn(),
    deletePage: vi.fn(),
  },
}));

vi.mock('@/lib/auth', () => ({
  validateAdminRequest: validateAdminRequestMock,
}));

vi.mock('@/lib/services/eventPageService', () => ({
  eventPageService: eventPageServiceMock,
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { GET, POST, DELETE } from './route';

describe('/api/event-pages', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('GET', () => {
    it('returns all pages for admin with ?all=true', async () => {
      validateAdminRequestMock.mockResolvedValue(true);
      const pages = [{ id: '1', title: 'Event 1' }];
      eventPageServiceMock.getAllPages.mockResolvedValue(pages);

      const request = new NextRequest('http://localhost/api/event-pages?all=true');
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.pages).toEqual(pages);
    });

    it('blocks non-admin from listing all pages', async () => {
      validateAdminRequestMock.mockResolvedValue(false);

      const request = new NextRequest('http://localhost/api/event-pages?all=true');
      const response = await GET(request);
      await response.json();

      expect(response.status).toBe(401);
    });

    it('requires folderId for non-admin requests', async () => {
      const request = new NextRequest('http://localhost/api/event-pages');
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe('folderId is required');
    });

    it('returns resolved page by folderId', async () => {
      const page = { id: '1', title: 'Test', folderId: 'folder-1' };
      eventPageServiceMock.getResolvedPageByFolderId.mockResolvedValue(page);

      const request = new NextRequest('http://localhost/api/event-pages?folderId=folder-1');
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.page).toEqual(page);
    });

    it('returns 500 on failure', async () => {
      eventPageServiceMock.getResolvedPageByFolderId.mockRejectedValue(new Error('Unexpected'));

      const request = new NextRequest('http://localhost/api/event-pages?folderId=folder-1');
      const response = await GET(request);
      await response.json();

      expect(response.status).toBe(500);
    });
  });

  describe('POST', () => {
    it('blocks unauthenticated requests', async () => {
      validateAdminRequestMock.mockResolvedValue(false);
      const request = new NextRequest('http://localhost/api/event-pages', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: 'Event' }),
      });

      const response = await POST(request);
      await response.json();

      expect(response.status).toBe(401);
    });

    it('creates a new event page', async () => {
      validateAdminRequestMock.mockResolvedValue(true);
      eventPageServiceMock.upsertPage.mockResolvedValue({
        page: { id: 'new-page', title: 'New Event' },
        isNew: true,
      });

      const request = new NextRequest('http://localhost/api/event-pages', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: 'New Event', folderId: 'folder-1', description: 'Desc' }),
      });
      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.title).toBe('New Event');
      expect(body.message).toContain('created');
    });

    it('updates an existing event page', async () => {
      validateAdminRequestMock.mockResolvedValue(true);
      eventPageServiceMock.upsertPage.mockResolvedValue({
        page: { id: 'existing', title: 'Updated Event' },
        isNew: false,
      });

      const request = new NextRequest('http://localhost/api/event-pages', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: 'existing',
          title: 'Updated Event',
          folderId: 'f1',
          description: 'D',
        }),
      });
      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.message).toContain('updated');
    });

    it('returns 400 for duplicate folder error', async () => {
      validateAdminRequestMock.mockResolvedValue(true);
      eventPageServiceMock.upsertPage.mockRejectedValue(
        new Error('Folder already has an event page')
      );

      const request = new NextRequest('http://localhost/api/event-pages', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: 'X', folderId: 'f1', description: 'D' }),
      });
      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toContain('already has');
    });
  });

  describe('DELETE', () => {
    it('blocks unauthenticated requests', async () => {
      validateAdminRequestMock.mockResolvedValue(false);
      const request = new NextRequest('http://localhost/api/event-pages?id=page-1');

      const response = await DELETE(request);
      await response.json();

      expect(response.status).toBe(401);
    });

    it('deletes a page successfully', async () => {
      validateAdminRequestMock.mockResolvedValue(true);
      eventPageServiceMock.deletePage.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost/api/event-pages?id=page-1');
      const response = await DELETE(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toContain('deleted');
    });

    it('returns 400 when id is missing', async () => {
      validateAdminRequestMock.mockResolvedValue(true);
      const request = new NextRequest('http://localhost/api/event-pages');

      const response = await DELETE(request);
      await response.json();

      expect(response.status).toBe(400);
    });

    it('returns 404 when page not found', async () => {
      validateAdminRequestMock.mockResolvedValue(true);
      eventPageServiceMock.deletePage.mockRejectedValue(new Error('Event page not found'));

      const request = new NextRequest('http://localhost/api/event-pages?id=missing');
      const response = await DELETE(request);
      await response.json();

      expect(response.status).toBe(404);
    });
  });
});
