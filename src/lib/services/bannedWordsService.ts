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

const LEET_CHAR_MAP: Record<string, string> = {
  '0': 'o',
  '3': 'e',
  '4': 'a',
  '@': 'a',
  '5': 's',
  $: 's',
  '7': 't',
  '+': 't',
  '8': 'b',
  '9': 'g',
};

function normalizeForStorage(word: string): string {
  return word.trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizeForMatch(value: string, oneAs: 'i' | 'l'): string {
  return value
    .toLowerCase()
    .split('')
    .map((char) => {
      if (char === '1' || char === '!') return oneAs;
      return LEET_CHAR_MAP[char] ?? char;
    })
    .join('')
    .replace(/[^a-z0-9]+/g, '')
    .replace(/(.)\1{2,}/g, '$1');
}

function buildTextMatchVariants(text: string): Set<string> {
  const oneAsI = normalizeForMatch(text, 'i');
  const oneAsL = normalizeForMatch(text, 'l');

  return new Set([
    oneAsI,
    oneAsL,
    oneAsI.replace(/(.)\1+/g, '$1'),
    oneAsL.replace(/(.)\1+/g, '$1'),
  ]);
}

/**
 * Reset cache — panggil setelah admin update bannedWords di D1.
 * Lokasi yang harus memanggil: route handler PUT /api/admin/settings atau
 * patcher di D1 admin tool.
 */
export function invalidateBannedWordsCache(): void {
  cached = null;
}

export function normalizeBannedWords(words: string[]): string[] {
  return Array.from(new Set(words.map(normalizeForStorage).filter(Boolean)));
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
      const words = normalizeBannedWords(snap.val() as string[]);
      cached = { words, loadedAt: Date.now() };
      return words;
    }
    // Fallback: cek root settings object kalau sub-key tidak ada
    const rootSnap = await db.ref('settings').once('value');
    const settings = rootSnap.val();
    if (settings?.bannedWords && Array.isArray(settings.bannedWords)) {
      const words = normalizeBannedWords(settings.bannedWords);
      cached = { words, loadedAt: Date.now() };
      return words;
    }
  } catch (error) {
    console.warn(
      '[BannedWords] Failed to load from D1, using hardcoded default:',
      error instanceof Error ? error.message : error
    );
  }

  cached = { words: normalizeBannedWords([...DEFAULT_BANNED_WORDS]), loadedAt: Date.now() };
  return cached.words;
}

/**
 * Cek apakah `text` mengandung salah satu kata terlarang.
 * Memakai substring case-insensitive plus normalized comparison untuk evasion
 * kasar seperti leet-speak, pemisah karakter, dan huruf berulang.
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
  const matchVariants = buildTextMatchVariants(text);

  return normalizeBannedWords(banned).find((word) => {
    if (!word) return false;

    if (lower.includes(word)) {
      return true;
    }

    const normalizedWordI = normalizeForMatch(word, 'i');
    const normalizedWordL = normalizeForMatch(word, 'l');

    return Array.from(matchVariants).some(
      (variant) =>
        (normalizedWordI && variant.includes(normalizedWordI)) ||
        (normalizedWordL && variant.includes(normalizedWordL))
    );
  });
}

export const BANNED_WORDS_DEFAULTS = DEFAULT_BANNED_WORDS;
