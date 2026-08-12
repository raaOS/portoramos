import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { validateAdminRequestMock, explorerServiceMock } = vi.hoisted(() => ({
  validateAdminRequestMock: vi.fn(),
  explorerServiceMock: {
    getAllNodes: vi.fn(),
    getNodes: vi.fn(),
    getPath: vi.fn(),
    createFolder: vi.fn(),
    createFile: vi.fn(),
    renameNode: vi.fn(),
    moveNode: vi.fn(),
    deleteNode: vi.fn(),
  },
}));

vi.mock('@/lib/auth', () => ({
  validateAdminRequest: validateAdminRequestMock,
}));

vi.mock('@/lib/services/explorerService', () => ({
  explorerService: explorerServiceMock,
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { GET, POST, PATCH, DELETE } from './route';

describe('/api/explorer', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('GET', () => {
    it('returns nodes for a given parentId', async () => {
      const mockNodes = [{ id: 'node-1', name: 'Folder1', type: 'folder' }];
      explorerServiceMock.getNodes.mockResolvedValue(mockNodes);

      const request = new NextRequest('http://localhost/api/explorer?parentId=root');
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.nodes).toEqual(mockNodes);
    });

    it('returns empty path for root parentId', async () => {
      const mockNodes: Array<unknown> = [];
      explorerServiceMock.getNodes.mockResolvedValue(mockNodes);

      const request = new NextRequest('http://localhost/api/explorer?parentId=root');
      const response = await GET(request);
      const body = await response.json();

      expect(body.data.path).toEqual([]);
    });

    it('returns path when path=true and parentId is set', async () => {
      const mockNodes = [{ id: 'child-1', name: 'file.png', type: 'file' }];
      const mockPath = [{ id: 'parent-1', name: 'Parent', type: 'folder' }];
      explorerServiceMock.getNodes.mockResolvedValue(mockNodes);
      explorerServiceMock.getPath.mockResolvedValue(mockPath);

      const request = new NextRequest('http://localhost/api/explorer?parentId=parent-1&path=true');
      const response = await GET(request);
      const body = await response.json();

      expect(body.data.nodes).toEqual(mockNodes);
      expect(body.data.path).toEqual(mockPath);
    });

    it('returns all nodes for admin with ?all=true', async () => {
      validateAdminRequestMock.mockResolvedValue(true);
      const allNodes = [
        { id: '1', name: 'Root', type: 'folder' },
        { id: '2', name: 'File', type: 'file' },
      ];
      explorerServiceMock.getAllNodes.mockResolvedValue(allNodes);

      const request = new NextRequest('http://localhost/api/explorer?all=true');
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.nodes).toEqual(allNodes);
    });

    it('blocks non-admin from getting all nodes', async () => {
      validateAdminRequestMock.mockResolvedValue(false);

      const request = new NextRequest('http://localhost/api/explorer?all=true');
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
    });

    it('returns 500 on unexpected error', async () => {
      explorerServiceMock.getNodes.mockRejectedValue(new Error('DB failure'));

      const request = new NextRequest('http://localhost/api/explorer?parentId=root');
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe('Failed to load explorer nodes');
    });
  });

  describe('POST', () => {
    it('blocks unauthenticated requests', async () => {
      validateAdminRequestMock.mockResolvedValue(false);
      const request = new NextRequest('http://localhost/api/explorer', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Test' }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
    });

    it('creates a folder successfully', async () => {
      validateAdminRequestMock.mockResolvedValue(true);
      explorerServiceMock.createFolder.mockResolvedValue({
        id: 'new-folder',
        name: 'New Folder',
      });

      const request = new NextRequest('http://localhost/api/explorer', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'New Folder', parentId: 'root' }),
      });
      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('New Folder');
      expect(body.message).toContain('Folder');
    });

    it('returns 400 when folder name is missing', async () => {
      validateAdminRequestMock.mockResolvedValue(true);

      const request = new NextRequest('http://localhost/api/explorer', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'folder' }),
      });
      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toContain('Folder name');
    });

    it('returns 400 for invalid node type', async () => {
      validateAdminRequestMock.mockResolvedValue(true);

      const request = new NextRequest('http://localhost/api/explorer', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'invalid' }),
      });
      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toContain('Invalid node type');
    });

    it('creates a file entry successfully', async () => {
      validateAdminRequestMock.mockResolvedValue(true);
      explorerServiceMock.createFile.mockResolvedValue({
        id: 'file-1',
        name: 'photo.png',
        url: '/r2/assets/file.png',
      });

      const request = new NextRequest('http://localhost/api/explorer', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type: 'file',
          name: 'photo.png',
          url: '/r2/assets/file.png',
          fileType: 'image',
          parentId: 'folder-1',
        }),
      });
      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('photo.png');
    });
  });

  describe('PATCH', () => {
    it('blocks unauthenticated requests', async () => {
      validateAdminRequestMock.mockResolvedValue(false);
      const request = new NextRequest('http://localhost/api/explorer', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: 'node-1', action: 'rename', name: 'New Name' }),
      });

      const response = await PATCH(request);
      await response.json();

      expect(response.status).toBe(401);
    });

    it('renames a node successfully', async () => {
      validateAdminRequestMock.mockResolvedValue(true);
      explorerServiceMock.renameNode.mockResolvedValue({
        id: 'node-1',
        name: 'Renamed',
      });

      const request = new NextRequest('http://localhost/api/explorer', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: 'node-1', action: 'rename', name: 'Renamed' }),
      });
      const response = await PATCH(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('Renamed');
    });

    it('moves a node successfully', async () => {
      validateAdminRequestMock.mockResolvedValue(true);
      explorerServiceMock.moveNode.mockResolvedValue({
        id: 'node-1',
        parentId: 'folder-2',
      });

      const request = new NextRequest('http://localhost/api/explorer', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: 'node-1', action: 'move', parentId: 'folder-2' }),
      });
      const response = await PATCH(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns 400 for invalid action', async () => {
      validateAdminRequestMock.mockResolvedValue(true);

      const request = new NextRequest('http://localhost/api/explorer', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: 'node-1', action: 'invalid' }),
      });
      const response = await PATCH(request);
      await response.json();

      expect(response.status).toBe(400);
    });

    it('returns 400 when ID is missing', async () => {
      validateAdminRequestMock.mockResolvedValue(true);

      const request = new NextRequest('http://localhost/api/explorer', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'rename' }),
      });
      const response = await PATCH(request);
      await response.json();

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE', () => {
    it('blocks unauthenticated requests', async () => {
      validateAdminRequestMock.mockResolvedValue(false);
      const request = new NextRequest('http://localhost/api/explorer?id=node-1');

      const response = await DELETE(request);
      await response.json();

      expect(response.status).toBe(401);
    });

    it('deletes a node successfully', async () => {
      validateAdminRequestMock.mockResolvedValue(true);
      explorerServiceMock.deleteNode.mockResolvedValue({
        deletedCount: 1,
        deletedIds: ['node-1'],
      });

      const request = new NextRequest('http://localhost/api/explorer?id=node-1');
      const response = await DELETE(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.deletedIds).toEqual(['node-1']);
      expect(body.message).toContain('deleted');
    });

    it('returns 400 when ID is missing', async () => {
      validateAdminRequestMock.mockResolvedValue(true);
      const request = new NextRequest('http://localhost/api/explorer');

      const response = await DELETE(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toContain('ID is required');
    });

    it('returns 404 when node not found', async () => {
      validateAdminRequestMock.mockResolvedValue(true);
      explorerServiceMock.deleteNode.mockRejectedValue(new Error('Node not found'));

      const request = new NextRequest('http://localhost/api/explorer?id=missing');
      const response = await DELETE(request);
      await response.json();

      expect(response.status).toBe(404);
    });
  });
});
