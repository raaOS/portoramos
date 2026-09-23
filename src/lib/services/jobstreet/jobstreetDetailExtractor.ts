import path from 'node:path';
import { USER_AGENT, normalizeJobUrl } from './jobstreetCardParser';

export interface JobstreetDetail {
  url: string;
  responsibilities: string[];
  qualifications: string[];
  fetchedAt: string;
}

const DETAIL_CACHE_PATH = (() => {
  return path.join(process.cwd(), '.job-bot', 'jobstreet-detail-cache.json');
})();
const DETAIL_CACHE_TTL_MS = 60 * 60 * 1000; // 1 jam

interface DetailCacheStore {
  [url: string]: JobstreetDetail;
}

async function readDetailCache(): Promise<DetailCacheStore> {
  try {
    const { readFile } = await import('node:fs/promises');
    const raw = await readFile(DETAIL_CACHE_PATH, 'utf8');
    return JSON.parse(raw) as DetailCacheStore;
  } catch {
    return {};
  }
}

async function writeDetailCache(store: DetailCacheStore): Promise<void> {
  const { mkdir, writeFile } = await import('node:fs/promises');
  await mkdir(path.dirname(DETAIL_CACHE_PATH), { recursive: true });
  await writeFile(DETAIL_CACHE_PATH, JSON.stringify(store, null, 2));
}

export async function extractJobstreetDetail(jobUrl: string): Promise<JobstreetDetail> {
  const canonical = normalizeJobUrl(jobUrl);

  const cache = await readDetailCache();
  const cached = cache[canonical];
  if (cached) {
    const ageMs = Date.now() - new Date(cached.fetchedAt).getTime();
    if (ageMs < DETAIL_CACHE_TTL_MS) {
      return cached;
    }
  }

  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      locale: 'id-ID',
      timezoneId: 'Asia/Jakarta',
      viewport: { width: 1280, height: 1200 },
      userAgent: USER_AGENT,
    });
    const page = await context.newPage();
    await page.goto(canonical, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);
    await page.waitForTimeout(1500);

    const sections = await page.evaluate(() => {
      const allElements = Array.from(
        document.querySelectorAll('h1, h2, h3, h4, h5, h6, strong, b')
      );

      type Marker = { kind: 'tanggung_jawab' | 'kualifikasi' | 'stop'; element: Element };
      const markers: Marker[] = [];
      for (const el of allElements) {
        const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
        if (t.length < 3 || t.length > 60) continue;
        let kind: Marker['kind'] | null = null;
        if (/tanggung jawab|responsibilities|deskripsi pekerjaan/i.test(t)) kind = 'tanggung_jawab';
        else if (/kualifikasi|persyaratan|qualifications|requirements/i.test(t))
          kind = 'kualifikasi';
        else if (
          /pertanyaan dari|tentang perusahaan|about the company|manfaat|benefits|lokasi|location|skill yang dibutuhkan/i.test(
            t
          )
        )
          kind = 'stop';
        if (!kind) continue;
        markers.push({ kind, element: el });
      }

      const results: Array<{ kind: string; items: string[] }> = [];
      for (let i = 0; i < markers.length; i += 1) {
        const start = markers[i];
        if (start.kind === 'stop') continue;
        const next = markers[i + 1];

        const allLi = Array.from(document.querySelectorAll('li'));
        const startPos = start.element.getBoundingClientRect().top;
        const endPos = next ? next.element.getBoundingClientRect().top : Number.POSITIVE_INFINITY;

        const items: string[] = [];
        for (const li of allLi) {
          const rect = li.getBoundingClientRect();
          if (rect.top <= startPos) continue;
          if (rect.top >= endPos) continue;
          const text = (li.textContent || '').replace(/\s+/g, ' ').trim();
          if (text.length > 3 && text.length < 500) items.push(text);
          if (items.length >= 30) break;
        }

        results.push({ kind: start.kind, items });
      }
      return results;
    });

    let responsibilities: string[] = [];
    let qualifications: string[] = [];
    for (const s of sections) {
      if (s.kind === 'tanggung_jawab' && responsibilities.length === 0) {
        responsibilities = s.items;
      } else if (s.kind === 'kualifikasi' && qualifications.length === 0) {
        qualifications = s.items;
      }
    }

    const detail: JobstreetDetail = {
      url: canonical,
      responsibilities,
      qualifications,
      fetchedAt: new Date().toISOString(),
    };

    const fresh = await readDetailCache();
    fresh[canonical] = detail;
    await writeDetailCache(fresh);

    return detail;
  } finally {
    await browser.close();
  }
}
