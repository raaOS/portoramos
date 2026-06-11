import 'server-only';
import { db } from '@/lib/database';

/**
 * Banned words moderation service
 *
 * Single source of truth untuk daftar kata yang difilter di endpoint publik
 * (comments, feedback). Sebelumnya logic ini duplikat di kedua route handler,
 * yang rawan drift (mis. satu route update list, yang lain lupa).
 *
 * Storage:
 * - Primary: D1 key `settings/bannedWords` (array of lowercase strings)
 * - Fallback: hard-coded default list di bawah — dipakai kalau D1 kosong/gagal
 *
 * Default list disusun dari pola spam yang umum untuk visitor publik berbahasa
 * Indonesia (judol, slot, togel, dll) dan spam global (viagra, porn). Admin bisa
 * override via panel settings tanpa deploy.
 */

const DEFAULT_BANNED_WORDS: readonly string[] = [
  'judol',
  'slot',
  'gacor',
  'maxwin',
  'togel',
  'casino',
  'rtp',
  'pragmatic',
  'crypto',
  'bitcoin',
  'viagra',
  'bokep',
  'porn',
] as const;

let cached: { words: string[]; loadedAt: number } | null = null;
const CACHE_TTL_MS = 60_000;

/**
 * Reset cache — panggil setelah admin update bannedWords di D1.
 * Lokasi yang harus memanggil: route handler PUT /api/admin/settings atau
 * patcher di D1 admin tool.
 */
export function invalidateBannedWordsCache(): void {
  cached = null;
}

export async function getBannedWords(): Promise<string[]> {
  // Cache sederhana untuk hemat round-trip D1 per request.
  // D1 read di proxy/serverless bisa 30-80ms — cache 60s membantu.
  if (cached && Date.now() - cached.loadedAt < CACHE_TTL_MS) {
    return cached.words;
  }

  try {
    const snap = await db.ref('settings/bannedWords').once('value');
    if (snap.exists() && Array.isArray(snap.val())) {
      const words = snap.val() as string[];
      cached = { words, loadedAt: Date.now() };
      return words;
    }
    // Fallback: cek root settings object kalau sub-key tidak ada
    const rootSnap = await db.ref('settings').once('value');
    const settings = rootSnap.val();
    if (settings?.bannedWords && Array.isArray(settings.bannedWords)) {
      cached = { words: settings.bannedWords, loadedAt: Date.now() };
      return settings.bannedWords;
    }
  } catch (error) {
    console.warn(
      '[BannedWords] Failed to load from D1, using hardcoded default:',
      error instanceof Error ? error.message : error
    );
  }

  cached = { words: [...DEFAULT_BANNED_WORDS], loadedAt: Date.now() };
  return cached.words;
}

/**
 * Cek apakah `text` mengandung salah satu kata terlarang.
 * Case-insensitive substring match — sederhana tapi efektif untuk filter
 * spam kasar. Tidak cocok untuk evasion ("jud0l" vs "judol") — itu memerlukan
 * normalized comparison (hapus angka, leet-speak decode). Untuk saat ini
 * substring cukup karena list di-maintain manual oleh admin.
 */
export function containsBannedWord(text: string, banned: string[]): boolean {
  return typeof findBannedWord(text, banned) === 'string';
}

/**
 * Cari kata terlarang pertama yang terkandung dalam `text`.
 * Mengembalikan string kata terlarang jika ditemukan, atau undefined jika bersih.
 */
export function findBannedWord(text: string, banned: string[]): string | undefined {
  const lower = text.toLowerCase();
  return banned.find((word) => word && lower.includes(word.toLowerCase()));
}

export const BANNED_WORDS_DEFAULTS = DEFAULT_BANNED_WORDS;
