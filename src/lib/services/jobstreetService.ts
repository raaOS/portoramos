/**
 * JobStreet (id.jobstreet.com) listing scanner.
 *
 * Berbeda dengan Glints, JobStreet:
 * - Listing publik bisa diakses tanpa login
 * - 1 halaman = 30+ lowongan, server-side rendered (tidak butuh scroll trigger)
 * - Format card berisi semua info dalam 1 string text:
 *     "Listed more than two days ago{Title}di {Company}Ini adalah lowongan kerja {Type}{Lokasi}Rp {min} – Rp {max} per month..."
 *
 * Auth: tidak diperlukan untuk listing. Auto-fill form (level 2) butuh
 * login SEEK terpisah; tidak diimplementasikan di file ini.
 */

import type { JobSearchResult } from './jobHuntService';
import path from 'node:path';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * URL listing graphic designer + Jakarta. Variant `/in-Jakarta` adalah pola
 * URL-friendly yang server-side rendered. Format `?keywords=&jobLocation=`
 * juga work tapi otomatis di-rewrite ke pola di atas oleh JobStreet.
 */
const JOBSTREET_DESIGN_URL = 'https://id.jobstreet.com/id/graphic-designer-jobs/in-Jakarta';

function isBlockedPage(text: string, title: string): boolean {
  const haystack = `${title}\n${text}`.toLowerCase();
  return /access denied|cloudflare|captcha|verify you are human|just a moment|rate.limit/i.test(
    haystack
  );
}

function normalizeJobUrl(href: string): string {
  const decoded = href.replace(/&amp;/g, '&');
  const url = decoded.startsWith('http')
    ? new URL(decoded)
    : new URL(decoded, 'https://id.jobstreet.com');
  url.search = '';
  url.hash = '';
  return url.toString();
}

/**
 * Word-boundary aware term matcher. Identik dengan glintsBrowserService.
 */
function hasTerm(haystack: string, term: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`).test(haystack);
}

/**
 * Scoring sama persis dengan Glints supaya konsistensi cross-platform.
 */
function scoreJob(title: string, text: string): { score: number; redFlags: string[] } {
  const haystack = `${title} ${text}`.toLowerCase();
  let score = 50;

  const photoshopTerms = [
    'photoshop',
    'adobe photoshop',
    'photo editing',
    'photo manipulation',
    'retouching',
    'retouch',
    'image editing',
    'digital imaging',
    'digital image',
  ];
  const roleTerms = [
    'graphic designer',
    'graphic design',
    'visual designer',
    'visual design',
    'social media designer',
    'sosmed designer',
    'desainer grafis',
    'desain grafis',
    'creative designer',
  ];
  const domainTerms = [
    'social media',
    'sosmed',
    'banner',
    'flyer',
    'poster',
    'brosur',
    'packaging',
    'layout',
    'typography',
    'logo',
    'brand',
    'branding',
    'feed',
    'carousel',
  ];
  const supportingTools = ['canva', 'affinity designer', 'affinity'];
  const minorTools = ['capcut'];
  const softNegatives = ['illustrator', 'adobe illustrator'];
  const hardNegatives = [
    'video editor',
    'video editing',
    'motion graphic',
    'motion designer',
    'motion',
    'animator',
    'animation',
    'animasi',
    '3d artist',
    '3d',
    'after effects',
    'premiere pro',
    'premiere',
    'blender',
    'cinema 4d',
    'maya',
    'autodesk',
  ];
  const roleNegatives = [
    'sales',
    'admin',
    'administrator',
    'administrative',
    'magang',
    'internship',
    'intern',
  ];

  const redFlags: string[] = [];

  for (const term of photoshopTerms) if (hasTerm(haystack, term)) score += 15;
  for (const term of roleTerms) if (hasTerm(haystack, term)) score += 12;
  for (const term of domainTerms) if (hasTerm(haystack, term)) score += 6;
  for (const term of supportingTools) if (hasTerm(haystack, term)) score += 6;
  for (const term of minorTools) if (hasTerm(haystack, term)) score += 3;

  for (const term of softNegatives) {
    if (hasTerm(haystack, term)) {
      score -= 8;
      redFlags.push(term);
    }
  }
  for (const term of hardNegatives) {
    if (hasTerm(haystack, term)) {
      score -= 20;
      redFlags.push(term);
    }
  }
  for (const term of roleNegatives) {
    if (hasTerm(haystack, term)) {
      const isEarlyCareer = term === 'magang' || term === 'intern' || term === 'internship';
      score -= isEarlyCareer ? 12 : 18;
      redFlags.push(term);
    }
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    redFlags: [...new Set(redFlags)],
  };
}

/**
 * Parse card text JobStreet ke field-field terstruktur.
 *
 * Format observasi (collapse whitespace):
 *   "Listed more than two days agoCreative Designerdi PT IndorescoIni adalah
 *    lowongan kerja Full timeJakarta Selatan, Jakarta RayaRp 5.500.000 – Rp
 *    7.500.000 per monthThe candidates will have an art supplies..."
 *
 * Posted timeline ada 3 varian: "Listed today", "Listed N days ago",
 * "Listed more than X days ago". Arrangement (Hibrid/Remote) muncul dalam
 * tanda kurung sesudah lokasi: "Jakarta Raya(Hibrid)".
 */
function parseJobstreetCard(rawText: string): {
  title: string;
  company?: string;
  salary?: string;
  employmentType?: string;
  workArrangement?: string;
  location?: string;
  postedAt?: string;
} {
  const text = rawText.replace(/\s+/g, ' ').trim();

  // Posted: "Listed today" | "Listed yesterday" | "Listed N days ago" | "Listed more than X days ago"
  const postedMatch = text.match(
    /Listed\s+(today|yesterday|more\s+than\s+\w+\s+days?\s+ago|\w+\s+days?\s+ago|\w+\s+hours?\s+ago)/i
  );
  const postedAt = postedMatch?.[1]?.trim();

  // Employment type marker: "Ini adalah lowongan kerja {type}"
  // JobStreet tipe (sesuai observasi): "Full time" / "Part time" / "Contract" /
  // "Kontrak/Temporer" / "Casual/Vacation" / "Temporary" / "Freelance" / "Casual".
  const employmentMatch = text.match(
    /Ini adalah lowongan kerja\s+(Full time|Part time|Contract\/Temp|Contract|Kontrak\/Temporer|Kontrak|Casual\/Vacation|Casual|Temporary|Temporer|Vacation|Freelance)/i
  );
  const employmentType = employmentMatch?.[1]?.trim();

  // Salary: "Rp 5.500.000 – Rp 7.500.000 per month" | "Rp X per month" | "Rp X – Rp Y per hour"
  const salaryMatch = text.match(
    /Rp\s*[\d.,]+(?:\s*[-–]\s*Rp\s*[\d.,]+)?\s+per\s+(?:month|hour|year|day|annum|tahun|bulan|jam)/i
  );
  const salary = salaryMatch?.[0]?.trim();

  // Work arrangement: "(Hibrid)" / "(Hybrid)" / "(Remote)" / "(WFH)" - dalam tanda kurung
  const arrangementMatch = text.match(/\((Hibrid|Hybrid|Remote|WFH|WFO)\)/i);
  const workArrangement = arrangementMatch?.[1]?.trim();

  // Lokasi: strategi paling reliable adalah ambil segmen text DI ANTARA employment-marker
  // dan salary-marker (kalau ada). JobStreet selalu tampilkan urutan:
  //   "Ini adalah lowongan kerja {Type}{Lokasi}{Salary}{...}"
  // dengan optional arrangement `(Hibrid)` di akhir lokasi.
  let location: string | undefined;
  const employmentEnd = employmentMatch
    ? (employmentMatch.index ?? 0) + employmentMatch[0].length
    : -1;
  const salaryStart = salaryMatch?.index ?? -1;

  if (employmentEnd > 0 && salaryStart > employmentEnd) {
    // Lokasi ada di antara employment dan salary
    location = text.slice(employmentEnd, salaryStart).trim();
  } else if (employmentEnd > 0) {
    // Tidak ada salary; lokasi terbatas pada pola kota+provinsi murni karena
    // text setelahnya bisa langsung lompat ke bullet point job description
    // tanpa whitespace pemisah (mis. "Jakarta Selatan, Jakarta RayaMengeksekusi...").
    // Strategi: greedy match pola "Kota[, Subkota...], Provinsi" + arrangement opsional.
    const tail = text.slice(employmentEnd);
    const locationPattern =
      /^([A-Z][\w\s]{2,40}(?:,\s*[A-Z][\w\s]{2,40})?,\s*(?:Jakarta\s+Raya|Jawa\s+(?:Barat|Tengah|Timur)|Banten|DI\s+Yogyakarta|DKI\s+Jakarta|Bali|Sumatera?\s+(?:Utara|Selatan|Barat)|Sulawesi\s+(?:Selatan|Utara)|Kalimantan\s+(?:Selatan|Timur|Barat)|Riau|Lampung)(?:\((?:Hibrid|Hybrid|Remote|WFH|WFO)\))?)/;
    const match = tail.match(locationPattern);
    if (match) {
      location = match[1].trim();
    } else {
      // Fallback: kota tunggal (mis. "Jakarta Raya")
      const single = tail.match(/^([A-Z][\w\s]{2,40})/);
      if (single) {
        // Validate: kalau text ini ternyata sambungan kalimat (bukan kota),
        // kita drop. Indikator: kata pertama termasuk kosakata umum non-kota.
        const candidate = single[1].trim();
        if (
          !/^(The|This|Working|Mendesain|Membuat|Create|We are|Looking|Mengeksekusi|High|Stable|Career)/i.test(
            candidate
          )
        ) {
          location = candidate;
        }
      }
    }
  } else {
    // Fallback: pattern matching kota + provinsi
    const fallback = text.match(
      /((?:Jakarta(?:\s+(?:Pusat|Selatan|Utara|Barat|Timur))?|Tangerang(?:\s+Selatan)?|Bekasi|Depok|Bogor|Bandung|Surabaya|Cempaka Putih|Mampang Prapatan|Kelapa Gading|[A-Z][\w\s]{2,30}),\s+(Jakarta\s+Raya|Jawa\s+(?:Barat|Tengah|Timur)|Banten|DI\s+Yogyakarta|DKI\s+Jakarta))/
    );
    if (fallback) location = `${fallback[1].trim()}, ${fallback[2].trim()}`;
  }

  // Cleanup lokasi:
  // - Buang prefix tipe employment yang masih nyangkut (mis. "Full time", "Temporer")
  // - Buang trailing "(Hibrid)" karena sudah di-extract terpisah
  // - Dedup ", Jakarta Raya, Jakarta Raya" -> ", Jakarta Raya"
  if (location) {
    location = location
      .replace(
        /^(Full time|Part time|Kontrak\/Temporer|Kontrak|Temporer|Contract\/Temp|Contract|Casual\/Vacation|Casual|Vacation|Temporary|Freelance)\s*/i,
        ''
      )
      .replace(/\((?:Hibrid|Hybrid|Remote|WFH|WFO)\)\s*$/i, '')
      .replace(/(,\s*Jakarta\s+Raya)\s*,\s*Jakarta\s+Raya\b/i, '$1')
      .replace(/(,\s*[\w\s]+?)\s*,\s*\1\s*$/i, '$1') // dedup generic "X, X" pattern
      .replace(/\s+/g, ' ')
      .trim();

    // Kalau setelah cleanup masih kosong / cuma whitespace, drop
    if (!location || location.length < 3) location = undefined;
  }

  // Title + company: format "{Title}di {Company}Ini adalah lowongan kerja..."
  // Marker awal: setelah postedAt match end
  const titleStart = postedMatch ? (postedMatch.index ?? 0) + postedMatch[0].length : 0;
  // Marker akhir: sebelum "Ini adalah lowongan kerja" atau employmentMatch
  const titleEnd = employmentMatch?.index ?? text.length;
  const titleCompanySegment = text.slice(titleStart, titleEnd).trim();

  // Split di "di " untuk pisahkan title dari company.
  // JobStreet pakai prefix "di " (lowercase) sebelum nama company.
  let title = '';
  let company: string | undefined;
  const diMatch = titleCompanySegment.match(/^(.+?)di\s+(.+)$/);
  if (diMatch) {
    title = diMatch[1].trim();
    company = diMatch[2].trim();
  } else {
    title = titleCompanySegment.slice(0, 90);
  }

  // Title cleanup: buang trailing whitespace dan limit panjang
  title = title.replace(/\s+/g, ' ').trim().slice(0, 90);
  if (company) {
    // Cleanup company:
    // - Buang badge urgensi: "Akan segera berakhir", "Dibutuhkan segera", dll
    // - Buang sufiks "Ini adalah lowongan kerja..." kalau employment tidak ke-detect
    //   tadi (kasus tipe lowongan unfamiliar; kita potong di sana supaya tidak nyangkut)
    company = company
      .replace(/(Akan segera berakhir|Dibutuhkan segera|Featured|Promoted).*$/i, '')
      .replace(/Ini adalah lowongan kerja.*$/i, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120);
    if (company.length < 2) company = undefined;
  }

  return {
    title,
    company,
    salary,
    employmentType,
    workArrangement,
    location,
    postedAt,
  };
}

/**
 * Scan listing JobStreet kategori graphic designer (Jakarta).
 * Tidak butuh session, fetch HTML langsung lebih cepat dan less suspicious
 * daripada Playwright. Pakai User-Agent realistis.
 */
export async function scanJobstreetDesignJobs(): Promise<JobSearchResult[]> {
  const response = await fetch(JOBSTREET_DESIGN_URL, {
    headers: {
      'user-agent': USER_AGENT,
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'accept-language': 'id-ID,id;q=0.9,en;q=0.8',
      'cache-control': 'no-cache',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`JOBSTREET_FETCH_FAILED_${response.status}`);
  }

  const html = await response.text();
  const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? '';
  if (isBlockedPage(html, title)) {
    throw new Error('JOBSTREET_BLOCKED');
  }

  // JobStreet listing card adalah <article> dengan link ke /id/job/{id}.
  // Strategi parse: cari semua link /id/job/{id}, walk up ke article terdekat,
  // ekstrak text content. Kita pakai regex sederhana karena Cheerio belum
  // dipakai di repo dan JobStreet HTML cukup deterministik.
  //
  // Pattern: <article ...> ... <a href="/id/job/{id}" ...> ... </article>
  // Daripada regex DOM yang fragile, kita pakai 2-pass:
  //   1) cari semua URL /id/job/{id} di HTML
  //   2) untuk tiap URL, cari article-block yang mengandung URL itu
  const jobIdRegex = /\/id\/job\/(\d+)(?=["?#])/g;
  const seen = new Set<string>();
  const jobIds: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = jobIdRegex.exec(html)) !== null) {
    const id = match[1];
    if (!seen.has(id)) {
      seen.add(id);
      jobIds.push(id);
    }
  }

  if (jobIds.length === 0) {
    // Fallback: HTML mungkin pakai client-side rendering. Jatuhkan ke Playwright.
    return await scanWithPlaywright();
  }

  // Untuk extract text per card, kita butuh DOM. Jadi kita tetap gunakan Playwright
  // dengan optimasi: tidak butuh login, tidak butuh scroll trigger karena JobStreet
  // server-side render listing.
  return await scanWithPlaywright();
}

async function scanWithPlaywright(): Promise<JobSearchResult[]> {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      locale: 'id-ID',
      timezoneId: 'Asia/Jakarta',
      viewport: { width: 1280, height: 900 },
      userAgent: USER_AGENT,
    });
    const page = await context.newPage();
    await page.goto(JOBSTREET_DESIGN_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
    await page.waitForLoadState('networkidle', { timeout: 12_000 }).catch(() => undefined);

    const title = await page.title().catch(() => '');
    const bodyText = await page
      .locator('body')
      .innerText({ timeout: 10_000 })
      .catch(() => '');
    if (isBlockedPage(bodyText, title)) {
      throw new Error('JOBSTREET_BLOCKED');
    }

    // Extract: untuk tiap anchor /id/job/{id}, walk up ke <article> terdekat,
    // ambil textContent. Helper diinline (tidak nested function) karena bug
    // tsx 4.x __name decorator di browser context.
    const cards = await page.locator('a[href*="/id/job/"]').evaluateAll((anchors) => {
      const result: Array<{ href: string; text: string }> = [];
      const seenHrefs = new Set<string>();

      for (const anchor of anchors) {
        const element = anchor as HTMLAnchorElement;
        const href = element.href.replace(/[?#].*$/, '');
        if (seenHrefs.has(href)) continue;
        seenHrefs.add(href);

        // Walk up sampai ketemu <article>
        let card: Element = element;
        for (let depth = 0; depth < 12; depth += 1) {
          if (!card.parentElement) break;
          card = card.parentElement;
          if (card.tagName === 'ARTICLE') break;
        }

        const text = (card.textContent || '').replace(/\s+/g, ' ').trim();
        if (text.length < 20) continue;

        result.push({ href, text });
      }
      return result;
    });

    const results: JobSearchResult[] = [];
    for (const card of cards) {
      const url = normalizeJobUrl(card.href);
      const parsed = parseJobstreetCard(card.text);
      const scored = scoreJob(parsed.title, card.text);

      results.push({
        title: parsed.title,
        company: parsed.company,
        location: parsed.location,
        source: 'JobStreet',
        url,
        snippet: card.text.slice(0, 320),
        score: scored.score,
        redFlags: scored.redFlags,
        salary: parsed.salary,
        employmentType: parsed.employmentType,
        workArrangement: parsed.workArrangement,
        postedAt: parsed.postedAt,
      });
    }

    return results.sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 12);
  } finally {
    await browser.close();
  }
}

/**
 * Detail page extraction: Tanggung Jawab + Kualifikasi.
 *
 * JobStreet detail page punya struktur heading yang bervariasi:
 *   - English: <h2>Responsibilities</h2> ... <h2>Qualifications</h2>
 *   - Indonesia: <strong>Tanggung Jawab</strong> ... <strong>Persyaratan</strong>
 *   - Mix: <h2>Tanggung Jawab</h2> ... <strong>Kualifikasi</strong>
 *
 * UL/OL bisa muncul di sibling, descendant, atau parent berbeda dari heading.
 * Strategi: cari semua heading match, lalu ambil <li> yang muncul DI ANTARA
 * heading dengan heading berikutnya (in-document order via getBoundingClientRect).
 *
 * Cache: hasil di-cache di .job-bot/jobstreet-detail-cache.json dengan TTL
 * 1 jam supaya klik Detail berkali-kali untuk lowongan sama tidak fetch ulang.
 */
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

  // Cache check
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
      // Helper diinline (tidak nested function declaration) untuk hindari
      // bug tsx 4.x __name decorator di browser context.
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
        // Stop markers untuk batas akhir section terakhir.
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

    // Pilih section pertama untuk tiap kind (kalau ada duplikat heading).
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

    // Update cache
    const fresh = await readDetailCache();
    fresh[canonical] = detail;
    await writeDetailCache(fresh);

    return detail;
  } finally {
    await browser.close();
  }
}
