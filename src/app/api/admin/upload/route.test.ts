import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const {
  validateAdminMock,
  isConfiguredMock,
  missingKeysMock,
  uploadToR2Mock,
  deleteFromR2Mock,
  buildR2PublicUrlMock,
} = vi.hoisted(() => ({
  validateAdminMock: vi.fn(),
  isConfiguredMock: vi.fn(),
  missingKeysMock: vi.fn(),
  uploadToR2Mock: vi.fn(),
  deleteFromR2Mock: vi.fn(),
  buildR2PublicUrlMock: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  validateAdminRequest: validateAdminMock,
}));

vi.mock('@/lib/r2Storage', () => ({
  buildR2PublicUrl: buildR2PublicUrlMock,
  deleteFromR2: deleteFromR2Mock,
  getMissingR2EnvKeys: missingKeysMock,
  isR2StorageConfigured: isConfiguredMock,
  uploadToR2: uploadToR2Mock,
}));

import { POST, DELETE } from './route';

function buildRequestWithFormData(
  fileData: { name: string; type: string; data: BufferSource } | null,
  searchParams: URLSearchParams = new URLSearchParams(),
  method: string = 'POST'
): NextRequest {
  const url = `http://localhost/api/upload?${searchParams.toString()}`;
  const file = fileData ? new File([fileData.data], fileData.name, { type: fileData.type }) : null;
  const fd = new FormData();
  if (file) fd.set('file', file);
  const req = new NextRequest(url, { method, body: fd as unknown as BodyInit });
  vi.spyOn(req, 'formData').mockResolvedValue(fd);
  return req;
}

describe('/api/upload', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    isConfiguredMock.mockReturnValue(true);
  });

  describe('POST', () => {
    it('blocks unauthenticated requests', async () => {
      validateAdminMock.mockResolvedValue(false);

      const req = buildRequestWithFormData({
        name: 'test.png',
        type: 'image/png',
        data: new Uint8Array(10),
      });
      const response = await POST(req as never);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
    });

    it('returns 400 when no file is uploaded', async () => {
      validateAdminMock.mockResolvedValue(true);

      const req = buildRequestWithFormData(null);
      const response = await POST(req as never);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe('No file uploaded');
    });

    it('returns 400 for invalid file type', async () => {
      validateAdminMock.mockResolvedValue(true);

      const req = buildRequestWithFormData({
        name: 'bad.exe',
        type: 'application/x-msdownload',
        data: new Uint8Array(10),
      });
      const response = await POST(req as never);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe('Invalid file type');
    });

    it('returns 400 for invalid custom filename characters', async () => {
      validateAdminMock.mockResolvedValue(true);

      const sp = new URLSearchParams({ filename: 'bad!@#file' });
      const req = buildRequestWithFormData(
        { name: 'test.png', type: 'image/png', data: new Uint8Array(10) },
        sp
      );
      const response = await POST(req as never);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toContain('Invalid filename');
    });

    it('returns 500 when R2 is not configured', async () => {
      validateAdminMock.mockResolvedValue(true);
      isConfiguredMock.mockReturnValue(false);
      missingKeysMock.mockReturnValue(['R2_ACCOUNT_ID']);

      const req = buildRequestWithFormData({
        name: 'test.png',
        type: 'image/png',
        data: new Uint8Array(10),
      });
      const response = await POST(req as never);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toContain('R2_ACCOUNT_ID');
    });

    it('rejects oversized images', async () => {
      validateAdminMock.mockResolvedValue(true);

      const req = buildRequestWithFormData({
        name: 'large.jpg',
        type: 'image/jpeg',
        data: new Uint8Array(31 * 1024 * 1024),
      });
      const response = await POST(req as never);
      const body = await response.json();

      expect(response.status).toBe(413);
      expect(body.error).toContain('melewati batas');
    });

    it('rejects oversized videos', async () => {
      validateAdminMock.mockResolvedValue(true);

      const req = buildRequestWithFormData({
        name: 'large.mp4',
        type: 'video/mp4',
        data: new Uint8Array(61 * 1024 * 1024),
      });
      const response = await POST(req as never);
      const body = await response.json();

      expect(response.status).toBe(413);
      expect(body.error).toContain('melewati batas');
    });

    it('rejects oversized audio', async () => {
      validateAdminMock.mockResolvedValue(true);

      const req = buildRequestWithFormData({
        name: 'large.mp3',
        type: 'audio/mpeg',
        data: new Uint8Array(26 * 1024 * 1024),
      });
      const response = await POST(req as never);
      const body = await response.json();

      expect(response.status).toBe(413);
      expect(body.error).toContain('melewati batas');
    });

    it('rejects GIF wallpaper uploads', async () => {
      validateAdminMock.mockResolvedValue(true);

      const sp = new URLSearchParams({ folder: 'wallpapers' });
      const req = buildRequestWithFormData(
        { name: 'anim.gif', type: 'image/gif', data: new Uint8Array(100) },
        sp
      );
      const response = await POST(req as never);
      const body = await response.json();

      expect(response.status).toBe(415);
      expect(body.error).toContain('tidak didukung');
    });

    it('rejects SVG wallpaper uploads', async () => {
      validateAdminMock.mockResolvedValue(true);

      const sp = new URLSearchParams({ folder: 'wallpapers' });
      const req = buildRequestWithFormData(
        { name: 'icon.svg', type: 'image/svg+xml', data: new Uint8Array(50) },
        sp
      );
      const response = await POST(req as never);
      await response.json();

      expect(response.status).toBe(415);
    });

    it('handles direct upload with skipImageOptimization flag', async () => {
      validateAdminMock.mockResolvedValue(true);
      uploadToR2Mock.mockResolvedValue({ url: 'https://example.com/r2/projects/myfile.png' });
      buildR2PublicUrlMock.mockReturnValue('https://example.com/r2/projects/myfile.png');

      const sp = new URLSearchParams({ filename: 'myfile', skipImageOptimization: '1' });
      const req = buildRequestWithFormData(
        { name: 'photo.png', type: 'image/png', data: new Uint8Array(100) },
        sp
      );
      const response = await POST(req as never);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.url).toBeDefined();
      expect(body.finalFilename).toBe('myfile.png');
    });
  });

  describe('DELETE', () => {
    it('blocks unauthenticated requests', async () => {
      validateAdminMock.mockResolvedValue(false);

      const request = new NextRequest('http://localhost/api/upload?path=assets/test.png');
      const response = await DELETE(request as never);
      await response.json();

      expect(response.status).toBe(401);
    });

    it('returns 400 when path is missing', async () => {
      validateAdminMock.mockResolvedValue(true);

      const request = new NextRequest('http://localhost/api/upload');
      const response = await DELETE(request as never);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe('Missing storage path');
    });

    it('returns 403 for forbidden path prefix', async () => {
      validateAdminMock.mockResolvedValue(true);

      const request = new NextRequest('http://localhost/api/upload?path=malicious/file.txt');
      const response = await DELETE(request as never);
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error).toBe('Forbidden path');
    });

    it('deletes a file from allowed path successfully', async () => {
      validateAdminMock.mockResolvedValue(true);
      deleteFromR2Mock.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost/api/upload?path=assets/media/old-file.png');
      const response = await DELETE(request as never);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(deleteFromR2Mock).toHaveBeenCalledWith('assets/media/old-file.png');
    });
  });
});
