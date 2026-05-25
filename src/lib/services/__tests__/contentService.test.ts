import { describe, it, expect, vi, beforeEach } from 'vitest';

const { refMock, setMock, onceMock } = vi.hoisted(() => ({
  refMock: vi.fn(),
  setMock: vi.fn(),
  onceMock: vi.fn(),
}));

vi.mock('@/lib/database', () => ({
  db: {
    ref: refMock,
  },
}));

import { ContentService, getCacheStats } from '../contentService';

interface Fallback {
  title: string;
  nested: { a: number; b: number };
  legacy: string;
}

const fallback: Fallback = {
  title: 'Fallback Title',
  nested: { a: 1, b: 2 },
  legacy: 'fallback-only',
};

describe('ContentService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    refMock.mockReturnValue({
      once: onceMock,
      set: setMock,
    });
  });

  describe('saveData', () => {
    it('caches the PAYLOAD (with updatedAt), not the raw data', async () => {
      // REGRESSION: Sebelum fix, cache berisi `data` tanpa updatedAt.
      // Konsekuensinya client komparasi lastUpdated jadi stale.
      onceMock.mockResolvedValue({ val: () => null });
      setMock.mockResolvedValue(undefined);

      const service = new ContentService<Fallback>('test-cache-payload.json', fallback);
      const success = await service.saveData({
        title: 'Updated',
        nested: { a: 10, b: 20 },
        legacy: 'x',
      });

      expect(success).toBe(true);
      expect(setMock).toHaveBeenCalledTimes(1);

      const payloadSent = setMock.mock.calls[0][0] as Record<string, unknown>;
      expect(payloadSent.updatedAt).toBeTypeOf('string');
      expect(payloadSent.title).toBe('Updated');

      // Saat getData dipanggil dalam TTL, cache hit harus include updatedAt.
      // Kita stub `once` supaya never called — kalau cache hit benar,
      // CLOUDFLARE_D1 tidak ter-query lagi.
      onceMock.mockClear();
      const cached = await service.getData();
      expect(onceMock).not.toHaveBeenCalled();
      expect((cached as unknown as { updatedAt?: string }).updatedAt).toBeTypeOf('string');
    });

    it('keeps arrays as-is (no updatedAt wrap)', async () => {
      // Arrays disimpan langsung supaya tidak jadi object dengan numeric keys
      setMock.mockResolvedValue(undefined);

      const arrayService = new ContentService<number[]>('test-array.json', []);
      await arrayService.saveData([1, 2, 3]);

      expect(setMock).toHaveBeenCalledWith([1, 2, 3]);
    });

    it('queues concurrent saves to prevent race conditions', async () => {
      let resolveFirst: () => void = () => {};
      setMock.mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            resolveFirst = resolve;
          })
      );
      setMock.mockImplementationOnce(() => Promise.resolve());

      const service = new ContentService<Fallback>('test-queue.json', fallback);

      const first = service.saveData({ ...fallback, title: 'First' });
      const second = service.saveData({ ...fallback, title: 'Second' });

      // Second belum jalan sebelum first selesai
      expect(setMock).toHaveBeenCalledTimes(1);

      resolveFirst();
      await first;
      await second;

      expect(setMock).toHaveBeenCalledTimes(2);
      // Urutan: first dulu, second setelahnya
      expect((setMock.mock.calls[0][0] as { title: string }).title).toBe('First');
      expect((setMock.mock.calls[1][0] as { title: string }).title).toBe('Second');
    });
  });

  describe('getData with deepMerge (default)', () => {
    it('merges CLOUDFLARE_D1 data on top of fallback', async () => {
      const CLOUDFLARE_D1Data = {
        title: 'From CLOUDFLARE_D1',
        nested: { a: 100 }, // b tidak di-override
        // `legacy` tidak ada di CLOUDFLARE_D1
      };
      onceMock.mockResolvedValue({ val: () => CLOUDFLARE_D1Data });

      const service = new ContentService<Fallback>('test-merge-default.json', fallback);
      const result = await service.getData(true);

      expect(result.title).toBe('From CLOUDFLARE_D1');
      expect(result.nested.a).toBe(100);
      expect(result.nested.b).toBe(2); // from fallback
      expect(result.legacy).toBe('fallback-only'); // from fallback
    });
  });

  describe('getData with skipFallbackMerge', () => {
    it('returns CLOUDFLARE_D1 data as-is tanpa merge', async () => {
      // REGRESSION: deep merge bisa restore field yang sudah dihapus admin
      // dari fallback JSON. skipFallbackMerge=true menghormati "CLOUDFLARE_D1 = SoT".
      const CLOUDFLARE_D1Data = {
        title: 'Only CLOUDFLARE_D1',
        nested: { a: 999, b: 999 },
        // legacy sengaja dihilangkan admin
      };
      onceMock.mockResolvedValue({ val: () => CLOUDFLARE_D1Data });

      const service = new ContentService<Fallback>(
        'test-skip-merge.json',
        fallback,
        undefined,
        true // skipFallbackMerge
      );
      const result = await service.getData(true);

      expect(result.title).toBe('Only CLOUDFLARE_D1');
      expect(result.nested.a).toBe(999);
      expect(result.nested.b).toBe(999);
      // legacy harus undefined, BUKAN `fallback-only`
      expect((result as Partial<Fallback>).legacy).toBeUndefined();
    });
  });

  describe('getData timeout', () => {
    it('returns fallback when CLOUDFLARE_D1 fetch exceeds timeout', async () => {
      // Simulate CLOUDFLARE_D1 hang forever
      onceMock.mockImplementation(() => new Promise(() => {}));

      const service = new ContentService<Fallback>('test-timeout.json', fallback);

      // Pakai fake timers untuk speed up 5s timeout
      vi.useFakeTimers();
      const promise = service.getData(true);
      await vi.advanceTimersByTimeAsync(5100);
      const result = await promise;
      vi.useRealTimers();

      expect(result).toEqual(fallback);
    });
  });

  describe('getCacheStats', () => {
    it('exposes cache metrics', () => {
      const stats = getCacheStats();
      expect(stats).toHaveProperty('size');
    });
  });
});
