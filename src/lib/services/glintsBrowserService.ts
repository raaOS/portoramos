import path from 'node:path';
import { access, mkdir } from 'node:fs/promises';
import type { JobSearchResult } from './jobHuntService';

const DEFAULT_STORAGE_STATE_PATH = path.join(
  process.cwd(),
  '.job-bot',
  'glints-storage-state.json'
);
const DEFAULT_PROFILE_PATH = path.join(process.cwd(), '.job-bot', 'glints-chrome-profile');

function storageStatePath(): string {
  return process.env.GLINTS_STORAGE_STATE_PATH || DEFAULT_STORAGE_STATE_PATH;
}

export function glintsProfilePath(): string {
  return process.env.GLINTS_PROFILE_PATH || DEFAULT_PROFILE_PATH;
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function isBlockedPage(text: string, title: string): boolean {
  const haystack = `${title}\n${text}`.toLowerCase();
  return /firewall|access denied|captcha|verify you are human|just a moment|blocked/.test(haystack);
}

function normalizeJobUrl(href: string): string {
  // Glints kadang menaruh href ber-encoded (&amp;) lewat SSR / hydration mismatch.
  const decoded = href.replace(/&amp;/g, '&');
  const url = decoded.startsWith('http')
    ? new URL(decoded)
    : new URL(decoded, 'https://glints.com');
  url.search = '';
  return url.toString();
}

/**
 * Word-boundary aware term matcher.
 * Mencegah false positive seperti "international" -> "intern", atau "promotion" -> "motion".
 * Haystack diasumsikan sudah lowercase.
 */
function hasTerm(haystack: string, term: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`).test(haystack);
}

/**
 * Scoring profile untuk Ramos.
 *
 * Skill utama: Photoshop (foto editing, retouching, manipulation, image editing).
 * Tools pendukung: Canva, Affinity Designer.
 * Tools minor: CapCut (bobot kecil supaya tidak menarik lowongan murni video).
 * Domain: graphic design online & offline (sosmed, banner, packaging, layout, dll).
 *
 * Sikap terhadap Illustrator: soft penalty (tetap ditampilkan, ranking turun).
 * Sikap terhadap video / motion / 3D: hard penalty (turun jauh tapi tidak hard-exclude,
 * supaya lowongan campuran "Photoshop + video editing" tetap muncul di bawah).
 */
/**
 * Parse blok teks card Glints untuk ekstrak field-field tambahan.
 *
 * Format card Glints saat ini (compact, satu baris setelah collapse whitespace):
 *   "Desain Grafis Gaji Tidak Ditampilkan Perusahaan Premium Penuh Waktu 1-3 tahun
 *    Minimal Diploma (D1 - D4) Adobe Premiere Pro+4 PT Habbie Bangun Aromatik
 *    (Habbie Aromatic) Yogyakarta, DI Yogyakarta"
 *
 * Format alternatif (pakai Rupiah):
 *   "Graphic Design Internship Rp 2,9 jt-2,9 jt Penuh Waktu Magang Hybrid
 *    Minimal Diploma (D1 - D4) Pengalaman kurang dari 1 tahun Tayang 8 hari yang lalu
 *    Diperbarui 2 jam yang lalu KSB Indonesia Jakarta Selatan"
 */
function parseGlintsCardBlock(
  rawText: string,
  jobUrl: string
): {
  title: string;
  company?: string;
  salary?: string;
  employmentType?: string;
  workArrangement?: string;
  category?: string;
  experienceLevel?: string;
  educationLevel?: string;
  postedAt?: string;
  updatedAt?: string;
  location?: string;
  skills?: string;
} {
  const text = rawText.replace(/\s+/g, ' ').trim();

  // Salary: format kompak "Rp 2,9 jt-2,9 jt" / "Rp 5 jt-6 jt" / "Rp 1 jt"
  //         atau lengkap "Rp 2.900.000 - 2.900.001/Bulan"
  //         atau "Gaji Tidak Ditampilkan"
  const salaryFullMatch = text.match(
    /Rp\s?[\d.,]+\s?(?:rb|jt)?(?:\s?[-–]\s?[\d.,]+\s?(?:rb|jt)?)?(?:\s?\/\s?(?:Bulan|Jam|Hari|Minggu|Tahun|Proyek))?/i
  );
  const salaryHiddenMatch = text.match(/Gaji\s+Tidak\s+Ditampilkan/i);
  const salaryMatch = salaryFullMatch ?? salaryHiddenMatch;
  const salary = salaryMatch?.[0]?.trim();

  // Employment type. Glints sering meng-collapse text tanpa spasi (mis. "Penuh Waktu1–3 tahun"),
  // jadi pakai lookahead non-word, bukan \b yang gagal di antara "u" dan digit.
  const employmentMatch = text.match(
    /(Penuh Waktu|Paruh Waktu|Magang|Kontrak|Freelance)(?=[^a-zA-Z]|$)/i
  );
  const employmentType = employmentMatch?.[0];

  // Work arrangement
  const arrangementMatch = text.match(/(Hybrid|Remote|Kerja di lokasi|WFO|WFH)(?=[^a-zA-Z]|$)/i);
  const workArrangement = arrangementMatch?.[0];

  // Education: "Minimal SMA/SMK", "Minimal Diploma (D1 - D4)", "Minimal Sarjana (S1)", "Minimal S1", dll
  const educationMatch = text.match(
    /Minimal\s+(?:SMA\/SMK|SMA|SMK|Diploma\s*\([^)]+\)|Diploma|Sarjana\s*\([^)]+\)|Sarjana|S1|S2|S3|D[1-4])/i
  );
  const educationLevel = educationMatch?.[0]?.trim();

  // Experience: 2 format - dengan prefix "Pengalaman ..." atau tanpa prefix "1-3 tahun".
  // Glints sering pakai en-dash (–, U+2013) atau em-dash (—, U+2014), juga sering tanpa spasi
  // di sekitar dash ("1–3 tahun") karena collapse whitespace.
  const dashClass = '[-–—\\u2013\\u2014]';
  const experienceFullMatch = text.match(
    new RegExp(
      `Pengalaman\\s*(?:kurang dari\\s*\\d+\\s*tahun|\\d+\\s*${dashClass}\\s*\\d+\\s*tahun|\\d+\\+?\\s*tahun|tidak diperlukan)`,
      'i'
    )
  );
  // Untuk match tanpa prefix "Pengalaman", cari pola "<digit>(spasi atau langsung)<dash>(spasi atau langsung)<digit> tahun"
  // tanpa harus ada \s sebelumnya (text bisa langsung terhubung dari kata sebelumnya).
  const experienceShortMatch = text.match(
    new RegExp(
      `(\\d+\\s*${dashClass}\\s*\\d+\\s*tahun|kurang dari\\s+\\d+\\s+tahun|\\d+\\+?\\s+tahun|tidak diperlukan)`,
      'i'
    )
  );
  let experienceLevel: string | undefined;
  if (experienceFullMatch) {
    experienceLevel = experienceFullMatch[0].trim();
  } else if (experienceShortMatch) {
    experienceLevel = `Pengalaman ${experienceShortMatch[1].trim()}`;
  }
  // Normalize en-dash / em-dash ke regular hyphen agar tampilan rapi di Telegram
  if (experienceLevel) {
    experienceLevel = experienceLevel.replace(/[\u2013\u2014]/g, '-').replace(/\s+/g, ' ');
  }

  // Posted / Updated (jarang muncul di listing card, lebih ke detail page)
  const postedMatch = text.match(/Tayang\s+([^·•\n]+?yang lalu|hari ini|kemarin)/i);
  const updatedMatch = text.match(/Diperbarui\s+([^·•\n]+?yang lalu|hari ini|kemarin)/i);
  const postedAt = postedMatch?.[1]?.trim();
  const updatedAt = updatedMatch?.[1]?.trim();

  // Skills: Glints menampilkan skill chip dengan format "Skill Name+N" (N adalah jumlah skill tersembunyi).
  // Contoh nyata: "Adobe Photoshop+2", "Brand Management+12", "Graphic Design+3", "AutoCAD+2",
  // "Time Management Character Design+8" (multi-skill), "Creative Marketing+2".
  // Cari setelah education marker supaya tidak menyerap kata "SMK"/"S1" yang menempel.
  const skillsSearchStart = educationMatch
    ? (educationMatch.index ?? 0) + educationMatch[0].length
    : 0;
  const skillsRegion = text.slice(skillsSearchStart);
  const skillsLocalMatch = skillsRegion.match(/([A-Z][\w\s.&]{2,80}?\+\d+)/);
  const skills = skillsLocalMatch?.[1]?.trim();
  const skillsAbsoluteStart = skillsLocalMatch
    ? skillsSearchStart + (skillsLocalMatch.index ?? 0)
    : -1;
  const skillsAbsoluteEnd = skillsLocalMatch
    ? skillsAbsoluteStart + skillsLocalMatch[0].length
    : -1;

  // Lokasi: prioritaskan format "Kota, Provinsi" karena lebih spesifik.
  // Format Glints: "Jakarta Timur, DKI Jakarta", "Bandung, Jawa Barat", "Kab. Bogor, Jawa Barat",
  // "Kab. Sidoarjo, Jawa Timur", "Yogyakarta, DI Yogyakarta", "Semarang, Jawa Tengah".
  const cityProvinceMatch = text.match(
    /((?:Kab\.|Kota)?\s*(?:Jakarta|Tangerang|Bekasi|Depok|Bogor|Bandung|Surabaya|Yogyakarta|Bali|Denpasar|Medan|Semarang|Malang|Makassar|Batam|Solo|Sidoarjo|Pekanbaru|Padang|Pontianak|Banjarmasin|Balikpapan|Samarinda|Manado|Palembang|Lampung)(?:\s+(?:Pusat|Selatan|Utara|Barat|Timur))?),\s*((?:DI\s+|DKI\s+)?(?:Yogyakarta|Jakarta|Jawa\s+(?:Barat|Tengah|Timur)|Sumatra\s+(?:Utara|Selatan|Barat)|Sumatera\s+(?:Utara|Selatan|Barat)|Bali|Banten|Sulawesi\s+(?:Selatan|Utara)|Kalimantan\s+(?:Selatan|Timur|Barat)|Riau|Lampung))/i
  );
  const cityOnlyMatch = text.match(
    /\b(Jakarta(?:\s+(?:Pusat|Selatan|Utara|Barat|Timur))?|Tangerang(?:\s+Selatan)?|Bekasi|Depok|Bogor|Bandung|Surabaya|Yogyakarta|Bali|Denpasar|Medan|Semarang|Malang|Makassar|Batam|Kab\.\s+\w+|Kota\s+\w+)\b/i
  );
  let location: string | undefined;
  if (cityProvinceMatch) {
    location = `${cityProvinceMatch[1].replace(/\s+/g, ' ').trim()}, ${cityProvinceMatch[2].trim()}`;
  } else if (cityOnlyMatch) {
    location = cityOnlyMatch[0];
  }

  // Title + company:
  // Title biasanya muncul di awal text sebelum salary/employment-type pertama.
  // Company biasanya ada DI ANTARA skills/education dan location, atau tepat sebelum lokasi.
  const cutIndices = [
    salaryMatch?.index,
    employmentMatch?.index,
    arrangementMatch?.index,
    educationMatch?.index,
    experienceFullMatch?.index,
    experienceShortMatch?.index,
    postedMatch?.index,
    updatedMatch?.index,
    skillsAbsoluteStart >= 0 ? skillsAbsoluteStart : undefined,
  ].filter((value): value is number => typeof value === 'number');
  const headEnd = cutIndices.length > 0 ? Math.min(...cutIndices) : Math.min(text.length, 140);
  const head = text.slice(0, headEnd).trim();
  // Bersihkan badge "Perusahaan Premium" yang kadang nyangkut di head
  const title = head
    .replace(/Perusahaan Premium/gi, '')
    .trim()
    .slice(0, 90);

  // Company: cari segmen di antara sinyal terakhir (skills/edukasi/dll) dan lokasi.
  // Real Glints: "...Adobe Photoshop+2 KSB Indonesia Jakarta Timur, DKI Jakarta"
  let company: string | undefined;
  const locationIndex = cityProvinceMatch?.index ?? cityOnlyMatch?.index;
  const lastSignalEnd = Math.max(
    skillsAbsoluteEnd,
    educationMatch ? (educationMatch.index ?? 0) + educationMatch[0].length : -1,
    experienceFullMatch ? (experienceFullMatch.index ?? 0) + experienceFullMatch[0].length : -1,
    experienceShortMatch ? (experienceShortMatch.index ?? 0) + experienceShortMatch[0].length : -1,
    updatedMatch ? (updatedMatch.index ?? 0) + updatedMatch[0].length : -1,
    postedMatch ? (postedMatch.index ?? 0) + postedMatch[0].length : -1,
    employmentMatch ? (employmentMatch.index ?? 0) + employmentMatch[0].length : -1,
    arrangementMatch ? (arrangementMatch.index ?? 0) + arrangementMatch[0].length : -1
  );

  if (lastSignalEnd > 0 && typeof locationIndex === 'number' && locationIndex > lastSignalEnd) {
    const slice = text.slice(lastSignalEnd, locationIndex).trim();
    const cleaned = slice
      .replace(/^Perusahaan\s+Premium/i, '')
      .replace(/^[,·•]+/, '')
      .replace(/^Verified\s+/i, '')
      .trim();
    if (cleaned.length > 1 && cleaned.length < 120) {
      company = cleaned;
    }
  }

  // Fallback company: cari pola PT/CV/Tbk apa saja di text
  if (!company) {
    const ptMatch = text.match(
      /\b((?:PT|CV|UD|PD)\.?\s+[A-Z][\w\s&\-.()'"]{2,80}?)(?=\s+(?:Yogyakarta|Jakarta|Tangerang|Bekasi|Depok|Bogor|Bandung|Surabaya|Bali|Medan|Semarang|Malang|Makassar|Batam|Sidoarjo|Kab\.|Kota|$))/
    );
    if (ptMatch) company = ptMatch[1].trim();
  }

  return {
    title,
    company,
    salary,
    employmentType,
    workArrangement,
    category: undefined, // Glints listing card tidak menampilkan kategori secara konsisten
    experienceLevel,
    educationLevel,
    postedAt,
    updatedAt,
    location,
    skills,
  };
}

/**
 * Scoring profile untuk Ramos.
 *
 * Skill utama: Photoshop (foto editing, retouching, manipulation, image editing).
 * Tools pendukung: Canva, Affinity Designer.
 * Tools minor: CapCut (bobot kecil supaya tidak menarik lowongan murni video).
 * Domain: graphic design online & offline (sosmed, banner, packaging, layout, dll).
 *
 * Sikap terhadap Illustrator: soft penalty (tetap ditampilkan, ranking turun).
 * Sikap terhadap video / motion / 3D: hard penalty (turun jauh tapi tidak hard-exclude,
 * supaya lowongan campuran "Photoshop + video editing" tetap muncul di bawah).
 */
function scoreJob(title: string, text: string): { score: number; redFlags: string[] } {
  const haystack = `${title} ${text}`.toLowerCase();
  let score = 50;

  // Skill utama Ramos - bobot tertinggi
  const photoshopTerms = [
    'photoshop',
    'adobe photoshop',
    'photo editing',
    'photo manipulation',
    'retouching',
    'image editing',
  ];

  // Role desain umum yang relevan
  const roleTerms = [
    'graphic designer',
    'graphic design',
    'visual designer',
    'visual design',
    'social media designer',
    'sosmed designer',
    'desainer grafis',
  ];

  // Domain / deliverable yang dikuasai (online + offline)
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

  // Tools pendukung yang dikuasai
  const supportingTools = ['canva', 'affinity designer', 'affinity'];

  // Tools minor (sedikit dikuasai) - bobot kecil
  const minorTools = ['capcut'];

  // Soft penalty: Illustrator masih boleh muncul tapi turun ranking
  const softNegatives = ['illustrator', 'adobe illustrator'];

  // Hard penalty: video / motion / 3D
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

  // Role / level negatif (dipertahankan dari versi sebelumnya, plus varian)
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

  for (const term of photoshopTerms) {
    if (hasTerm(haystack, term)) score += 15;
  }
  for (const term of roleTerms) {
    if (hasTerm(haystack, term)) score += 12;
  }
  for (const term of domainTerms) {
    if (hasTerm(haystack, term)) score += 6;
  }
  for (const term of supportingTools) {
    if (hasTerm(haystack, term)) score += 6;
  }
  for (const term of minorTools) {
    if (hasTerm(haystack, term)) score += 3;
  }

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

export async function ensureGlintsSessionDir(): Promise<string> {
  const statePath = storageStatePath();
  await mkdir(path.dirname(statePath), { recursive: true });
  await mkdir(glintsProfilePath(), { recursive: true });
  return statePath;
}

export async function hasGlintsSession(): Promise<boolean> {
  return exists(storageStatePath());
}

export async function extractGlintsJobText(url: string): Promise<string> {
  const statePath = storageStatePath();

  if (!(await exists(statePath))) {
    throw new Error('GLINTS_SESSION_MISSING');
  }

  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      storageState: statePath,
      locale: 'id-ID',
      timezoneId: 'Asia/Jakarta',
    });
    const page = await context.newPage();

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined);

    const title = await page.title().catch(() => '');
    const mainText = await page
      .locator('main')
      .innerText({ timeout: 10_000 })
      .catch(async () => {
        return page.locator('body').innerText({ timeout: 10_000 });
      });

    if (!mainText || mainText.trim().length < 200) {
      throw new Error('GLINTS_EXTRACTION_EMPTY');
    }

    if (isBlockedPage(mainText, title)) {
      throw new Error('GLINTS_BROWSER_BLOCKED');
    }

    return [`Source: ${url}`, title ? `Page title: ${title}` : '', mainText]
      .filter(Boolean)
      .join('\n\n')
      .slice(0, 14_000);
  } finally {
    await browser.close();
  }
}

// Glints listing endpoint resmi untuk kategori Design dengan sort terbaru.
// HierarchicalJobCategoryIds adalah UUID kategori "Design" dari Glints.
// sortBy=LATEST memastikan kita selalu prioritaskan lowongan yang baru di-publish,
// menggantikan default `/job-category/design` yang bisa berubah di sisi Glints.
const GLINTS_DESIGN_LATEST_URL =
  'https://glints.com/id/opportunities/jobs/explore?slug=design&country=ID&HierarchicalJobCategoryIds=0a9f9b0d-d2b1-44f0-8851-81129cf49970&sortBy=LATEST';

export async function scanGlintsDesignJobs(): Promise<JobSearchResult[]> {
  const statePath = storageStatePath();

  if (!(await exists(statePath))) {
    throw new Error('GLINTS_SESSION_MISSING');
  }

  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      storageState: statePath,
      locale: 'id-ID',
      timezoneId: 'Asia/Jakarta',
    });
    const page = await context.newPage();
    await page.goto(GLINTS_DESIGN_LATEST_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined);

    // Trigger lazy-render seluruh card: scroll perlahan dari atas ke bawah, lalu kembali.
    // Tanpa ini, kebanyakan card hanya merender title + salary (JobTitleSalaryWrapper),
    // sedangkan OpportunityUpper (info lengkap: employment, edukasi, experience, dll)
    // baru di-hydrate setelah card masuk viewport.
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        const totalHeight = document.body.scrollHeight;
        let position = 0;
        const step = 600;
        const interval = setInterval(() => {
          window.scrollBy(0, step);
          position += step;
          if (position >= totalHeight + 200) {
            clearInterval(interval);
            window.scrollTo(0, 0);
            resolve();
          }
        }, 250);
      });
    });
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);
    await page.waitForTimeout(500);

    const title = await page.title().catch(() => '');
    const bodyText = await page
      .locator('body')
      .innerText({ timeout: 10_000 })
      .catch(() => '');
    if (isBlockedPage(bodyText, title)) {
      throw new Error('GLINTS_BROWSER_BLOCKED');
    }

    const jobs = await page.locator('a[href*="/opportunities/jobs/"]').evaluateAll((anchors) => {
      // Strategi: walk up sampai ketemu container card terluar.
      // Glints saat ini punya struktur:
      //   CompactOpportunityCard__OpportunityCard (luar, lengkap dengan logo/badge perusahaan)
      //     └─ CompactOpportunityCard__OpportunityUpper-sc-dkg8my-23 (info lengkap)
      //          ├─ CompactOpportunityCard__JobTitleSalaryWrapper-sc-dkg8my-10 (title + salary)
      //          ├─ employment / experience / education / skill chip
      //          └─ company name + lokasi
      //
      // Yang kita butuh adalah OpportunityUpper karena di situlah semua field
      // tervisualisasi sebagai text. Walker default berhenti di JobTitleSalaryWrapper
      // karena sudah ketemu "Rp" duluan, padahal text-nya cuma title + salary.
      //
      // Helper diinline (tidak nested function declaration) supaya tidak terkena
      // bug tsx 4.x __name decorator saat dikirim ke browser context.

      const signalPatterns = [
        /Rp\s*[\d.,]+/i, // salary
        /\b(?:Penuh Waktu|Paruh Waktu|Magang|Kontrak|Freelance)\b/i, // employment type
        /\b(?:Hybrid|Remote|Kerja di lokasi|WFO|WFH)\b/i, // arrangement
        /Minimal\s+(?:SMA|SMK|Diploma|S[123]|D[1-4])/i, // education
        /(?:\d+\s*[-–]\s*\d+\s*tahun|kurang dari\s+\d+\s*tahun)/i, // experience
        /Tayang|Diperbarui/i, // timeline
        /Perusahaan Premium|\bPT\b|\bCV\b/i, // company badge
      ];

      return anchors.map((anchor) => {
        const element = anchor as HTMLAnchorElement;

        // Tahap 1: walk up cari ancestor dengan className mengandung "OpportunityUpper".
        //          Ini container yang berisi semua info card (title, salary, employment,
        //          edukasi, experience, skill chip, company, lokasi).
        let card: Element | null = null;
        let cursor: Element | null = element;
        for (let depth = 0; depth < 10; depth += 1) {
          if (!cursor || !cursor.parentElement) break;
          cursor = cursor.parentElement;
          const cls = typeof cursor.className === 'string' ? cursor.className : '';
          if (/OpportunityUpper/i.test(cls)) {
            card = cursor;
            break;
          }
        }

        // Tahap 2: kalau OpportunityUpper tidak ketemu (mungkin Glints rename class),
        //          fallback ke OpportunityCard luar (bukan inner Wrapper).
        if (!card) {
          cursor = element;
          for (let depth = 0; depth < 10; depth += 1) {
            if (!cursor || !cursor.parentElement) break;
            cursor = cursor.parentElement;
            const cls = typeof cursor.className === 'string' ? cursor.className : '';
            if (/OpportunityCard/i.test(cls) && !/Wrapper|JobTitle|Salary/i.test(cls)) {
              card = cursor;
              break;
            }
          }
        }

        // Tahap 3: kalau dua-duanya gagal, walk up berdasarkan jumlah sinyal terpenuhi.
        if (!card) {
          let bestContainer: Element = element;
          let bestSignals = 0;
          let walker: Element | null = element;
          for (let depth = 0; depth < 10; depth += 1) {
            if (!walker || !walker.parentElement) break;
            walker = walker.parentElement;
            const text = walker.textContent || '';
            let signals = 0;
            for (const pattern of signalPatterns) {
              if (pattern.test(text)) signals += 1;
            }
            if (signals > bestSignals) {
              bestSignals = signals;
              bestContainer = walker;
              if (signals >= 4) break; // good enough
            }
          }
          card = bestContainer;
        }

        return {
          href: element.href,
          text: (card.textContent || element.textContent || '').replace(/\s+/g, ' ').trim(),
        };
      });
    });

    const seen = new Set<string>();
    const results: JobSearchResult[] = [];

    for (const job of jobs) {
      const url = normalizeJobUrl(job.href);
      if (seen.has(url) || job.text.length < 20) continue;
      seen.add(url);

      const parsed = parseGlintsCardBlock(job.text, url);
      const scored = scoreJob(parsed.title, job.text);

      results.push({
        title: parsed.title,
        company: parsed.company,
        location: parsed.location,
        source: 'Glints Design',
        url,
        snippet: job.text.slice(0, 320),
        score: scored.score,
        redFlags: scored.redFlags,
        salary: parsed.salary,
        employmentType: parsed.employmentType,
        workArrangement: parsed.workArrangement,
        category: parsed.category,
        experienceLevel: parsed.experienceLevel,
        educationLevel: parsed.educationLevel,
        postedAt: parsed.postedAt,
        updatedAt: parsed.updatedAt,
        skills: parsed.skills,
      });
    }

    return results.sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 12);
  } finally {
    await browser.close();
  }
}
