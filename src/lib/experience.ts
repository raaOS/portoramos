import fs from 'fs/promises';
import path from 'path';
import type { ExperienceData } from '@/types/experience';

/**
 * Path ke file JSON data pengalaman kerja.
 * File ini adalah fallback statis — data utama ada di Cloudflare D1
 * dan diakses melalui `experienceService`. Loader ini digunakan
 * khusus oleh halaman CV yang membutuhkan data dari file lokal.
 */
const EXPERIENCE_DATA_FILE = path.join(process.cwd(), 'src', 'data', 'experience.json');

/** Cache in-memory agar tidak baca file berulang dalam satu request cycle. */
let _cached: ExperienceData | null | undefined;
let _cachedAt = 0;

/** TTL cache: 60 detik — cukup untuk satu rendering cycle ISR. */
const CACHE_TTL_MS = 60_000;

/**
 * Memuat data pengalaman kerja dari file JSON statis.
 *
 * - Menggunakan in-memory cache (TTL 60s) untuk menghindari I/O berulang.
 * - Mengembalikan `null` jika file tidak ada atau parse gagal.
 * - Logging error di development untuk debugging.
 *
 * @returns Data pengalaman kerja, atau `null` jika tidak tersedia.
 *
 * @example
 * ```ts
 * const data = await loadExperienceData();
 * if (!data) {
 *   // fallback ke empty state
 * }
 * ```
 */
export async function loadExperienceData(): Promise<ExperienceData | null> {
  // Return cached value jika masih valid
  const now = Date.now();
  if (_cached !== undefined && now - _cachedAt < CACHE_TTL_MS) {
    return _cached;
  }

  try {
    const json = await fs.readFile(EXPERIENCE_DATA_FILE, 'utf8');
    const data = JSON.parse(json) as ExperienceData;

    _cached = data;
    _cachedAt = now;
    return data;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      const reason =
        error instanceof SyntaxError
          ? `JSON parse error in ${EXPERIENCE_DATA_FILE}`
          : `File not found or unreadable: ${EXPERIENCE_DATA_FILE}`;
      console.warn(`[loadExperienceData] ${reason}`);
    }

    _cached = null;
    _cachedAt = now;
    return null;
  }
}

/**
 * Invalidasi cache pengalaman kerja.
 * Panggil setelah data diperbarui (misalnya dari admin panel).
 */
export function invalidateExperienceCache(): void {
  _cached = undefined;
  _cachedAt = 0;
}
