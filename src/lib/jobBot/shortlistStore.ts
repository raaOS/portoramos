/**
 * Shortlist Store — Penyimpanan data shortlist loker ke file JSON.
 * @module lib/jobBot/shortlistStore
 */
import path from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import type { JobSearchResult } from '@/lib/services/jobHuntService';

const STORE_PATH = path.join(process.cwd(), '.job-bot', 'shortlist.json');
const SEEN_STORE_PATH = path.join(process.cwd(), '.job-bot', 'seen-jobs.json');

interface ShortlistStore {
  updatedAt: string;
  jobs: JobSearchResult[];
}

/**
 * Riwayat lowongan yang pernah muncul di scan, di-key oleh canonical job URL.
 * Tujuan: kasih badge ke user supaya bisa bedakan lowongan baru vs yang sudah dilihat,
 * sekaligus track lowongan yang sudah di-apply.
 */
export interface SeenJobRecord {
  /** ISO timestamp pertama kali muncul di scan */
  firstSeenAt: string;
  /** ISO timestamp terakhir kali muncul di scan */
  lastSeenAt: string;
  /** Berapa kali lowongan ini muncul di scan (cumulative) */
  seenCount: number;
  /** True kalau user pernah klik tombol Cek untuk lowongan ini */
  applied: boolean;
  /** ISO timestamp saat user klik Cek */
  appliedAt?: string;
}

interface SeenStore {
  updatedAt: string;
  /** map: canonical job URL -> record */
  jobs: Record<string, SeenJobRecord>;
}

function canonicalUrl(url: string): string {
  // Buang query/hash supaya URL stabil antar scan (Glints sering tambah utm/traceInfo).
  try {
    const u = new URL(url);
    u.search = '';
    u.hash = '';
    return u.toString();
  } catch {
    return url;
  }
}

async function readShortlist(): Promise<ShortlistStore> {
  try {
    const raw = await readFile(STORE_PATH, 'utf8');
    return JSON.parse(raw) as ShortlistStore;
  } catch {
    return { updatedAt: new Date(0).toISOString(), jobs: [] };
  }
}

async function readSeenStore(): Promise<SeenStore> {
  try {
    const raw = await readFile(SEEN_STORE_PATH, 'utf8');
    return JSON.parse(raw) as SeenStore;
  } catch {
    return { updatedAt: new Date(0).toISOString(), jobs: {} };
  }
}

async function writeSeenStore(store: SeenStore): Promise<void> {
  await mkdir(path.dirname(SEEN_STORE_PATH), { recursive: true });
  await writeFile(SEEN_STORE_PATH, JSON.stringify(store, null, 2));
}

export async function saveShortlist(jobs: JobSearchResult[]): Promise<void> {
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
  await writeFile(
    STORE_PATH,
    JSON.stringify(
      {
        updatedAt: new Date().toISOString(),
        jobs,
      },
      null,
      2
    )
  );
}

export async function getShortlistJob(index: number): Promise<JobSearchResult | null> {
  const store = await readShortlist();
  return store.jobs[index - 1] ?? null;
}

/**
 * Update riwayat scan dengan daftar lowongan yang baru saja di-scan.
 * Returns map dari URL ke record (sebelum update) supaya caller bisa render
 * badge "Baru" vs "Sudah dilihat" berdasarkan state SEBELUM scan ini.
 */
export async function recordSeenJobs(
  jobs: JobSearchResult[]
): Promise<Map<string, SeenJobRecord | null>> {
  const store = await readSeenStore();
  const now = new Date().toISOString();
  const previousState = new Map<string, SeenJobRecord | null>();

  for (const job of jobs) {
    const key = canonicalUrl(job.url);
    const existing = store.jobs[key];
    previousState.set(key, existing ? { ...existing } : null);

    if (existing) {
      store.jobs[key] = {
        ...existing,
        lastSeenAt: now,
        seenCount: existing.seenCount + 1,
      };
    } else {
      store.jobs[key] = {
        firstSeenAt: now,
        lastSeenAt: now,
        seenCount: 1,
        applied: false,
      };
    }
  }

  store.updatedAt = now;
  await writeSeenStore(store);
  return previousState;
}

/**
 * Tandai sebuah lowongan sebagai sudah diproses oleh user.
 * Idempoten: aman dipanggil berulang.
 */
export async function markJobApplied(url: string): Promise<void> {
  const store = await readSeenStore();
  const key = canonicalUrl(url);
  const now = new Date().toISOString();
  const existing = store.jobs[key];

  if (existing) {
    store.jobs[key] = {
      ...existing,
      applied: true,
      appliedAt: existing.appliedAt ?? now,
      lastSeenAt: existing.lastSeenAt,
    };
  } else {
    // Edge case: user cek tanpa scan dulu (mis. /cek [url] manual).
    store.jobs[key] = {
      firstSeenAt: now,
      lastSeenAt: now,
      seenCount: 0,
      applied: true,
      appliedAt: now,
    };
  }

  store.updatedAt = now;
  await writeSeenStore(store);
}

/**
 * Cek status lowongan berdasarkan riwayat. Return null kalau belum pernah dilihat.
 */
export async function getSeenStatus(url: string): Promise<SeenJobRecord | null> {
  const store = await readSeenStore();
  return store.jobs[canonicalUrl(url)] ?? null;
}
