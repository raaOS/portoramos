import { generateText } from '@/lib/gemini';
import { isInstagramUrl, extractInstagramJobText } from './instagramExtractService';

export interface JobSearchResult {
  title: string;
  company?: string;
  location?: string;
  source: string;
  url: string;
  snippet?: string;
  score?: number;
  redFlags?: string[];
  /** Contoh: "Rp 2.900.000 - 2.900.001/Bulan" atau "Gaji Tidak Ditampilkan" */
  salary?: string;
  /** Contoh: "Penuh Waktu", "Magang", "Paruh Waktu", "Kontrak", "Freelance" */
  employmentType?: string;
  /** Contoh: "Remote", "Hybrid", "Kerja di lokasi", "WFO", "WFH" */
  workArrangement?: string;
  /** Contoh: "Desain > Desainer Grafis & Brand" */
  category?: string;
  /** Contoh: "Pengalaman 1 - 3 tahun" atau "kurang dari 1 tahun" */
  experienceLevel?: string;
  /** Contoh: "Minimal Diploma (D1 - D4)" */
  educationLevel?: string;
  /** Contoh: "8 hari yang lalu" */
  postedAt?: string;
  /** Contoh: "2 jam yang lalu" */
  updatedAt?: string;
  /** Contoh: "Adobe Premiere Pro+4" - skill chip dari listing card Glints */
  skills?: string;
}

export interface JobSearchResponse {
  query: string;
  results: JobSearchResult[];
  searchLinks: Array<{ label: string; url: string }>;
  analysis: string;
}

export interface ApplyPackage {
  proposal: string;
  hrMessage: string;
  analysis: string;
  pdfBuffer: Buffer;
  /** Filename PDF yang sudah disesuaikan dengan job (mis. "Resume_Ramos_ATS_<Title>_<Company>.pdf"). */
  pdfFilename: string;
  sourceText: string;
}

const DEFAULT_ROLE = 'graphic designer visual designer remote Indonesia';
const GLINTS_DESIGN_URL = 'https://glints.com/id/job-category/design';
const USER_AGENT = 'Mozilla/5.0 (compatible; RamosPortfolioJobBot/1.0; +https://portfolio.local)';

const SOURCE_LINKS = [
  {
    label: 'JobStreet',
    buildUrl: (query: string) =>
      `https://id.jobstreet.com/id/${encodeURIComponent(query).replace(/%20/g, '-')}-jobs`,
  },
  {
    label: 'LinkedIn',
    buildUrl: (query: string) =>
      `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query)}&location=Indonesia`,
  },
  {
    label: 'Glints',
    buildUrl: (query: string) =>
      `https://glints.com/id/opportunities/jobs/explore?keyword=${encodeURIComponent(query)}`,
  },
  {
    label: 'Kalibrr',
    buildUrl: (query: string) =>
      `https://www.kalibrr.com/job-board/te/${encodeURIComponent(query)}`,
  },
  {
    label: 'Google',
    buildUrl: (query: string) =>
      `https://www.google.com/search?q=${encodeURIComponent(`${query} site:id.jobstreet.com OR site:glints.com OR site:kalibrr.com OR site:linkedin.com/jobs`)}`,
  },
  {
    label: 'X/Twitter',
    buildUrl: (query: string) =>
      `https://twitter.com/search?q=${encodeURIComponent(`"${query}" loker OR hiring Indonesia`)}&f=live`,
  },
];

function normalizeQuery(input: string): string {
  const query = input.trim().replace(/\s+/g, ' ');
  return query || DEFAULT_ROLE;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&mdash;/g, '-')
    .replace(/&ndash;/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&mdash;/g, '-')
    .replace(/&ndash;/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTitle(html: string): string | null {
  const ogTitle = html.match(
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i
  )?.[1];
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
  return (ogTitle || title || null)?.replace(/\s+/g, ' ').trim() ?? null;
}

function toSearchLinks(query: string) {
  return SOURCE_LINKS.map((source) => ({
    label: source.label,
    url: source.buildUrl(query),
  }));
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'user-agent': USER_AGENT,
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Gagal membaca URL (${response.status})`);
  }

  const html = await response.text();
  const title = extractTitle(html);
  const text = stripHtml(html).slice(0, 9000);
  return title ? `${title}\n\n${text}` : text;
}

function isGlintsUrl(url: string): boolean {
  try {
    return new URL(url).hostname.includes('glints.com');
  } catch {
    return false;
  }
}

function uniqueResults(results: JobSearchResult[]): JobSearchResult[] {
  const seen = new Set<string>();
  return results.filter((result) => {
    const key = result.url.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function fallbackSearchAnalysis(
  query: string,
  results: JobSearchResult[],
  searchLinks: Array<{ label: string; url: string }>
): string {
  const topResults = results
    .slice(0, 5)
    .map(
      (job, index) =>
        `${index + 1}. ${job.title}${job.company ? ` - ${job.company}` : ''}${typeof job.score === 'number' ? ` (${job.score}%)` : ''}`
    )
    .join('\n');
  const fallbackLinks = searchLinks.map((link) => `- ${link.label}`).join(', ');

  return results.length > 0
    ? `AI ranking sedang tidak tersedia, jadi hasil diurutkan memakai scoring lokal.\n\nTop sementara untuk "${query}":\n${topResults}`
    : `AI ranking sedang tidak tersedia dan hasil otomatis kosong. Pakai link fallback berikut untuk cari manual cepat: ${fallbackLinks}.`;
}

function shouldUseAiAnalysis(): boolean {
  return process.env.JOB_BOT_USE_AI_ANALYSIS === 'true';
}

function scoreDesignJob(job: Pick<JobSearchResult, 'title' | 'snippet' | 'location'>): {
  score: number;
  redFlags: string[];
} {
  const haystack = `${job.title} ${job.snippet ?? ''} ${job.location ?? ''}`.toLowerCase();
  const positiveTerms = [
    'graphic designer',
    'graphic design',
    'visual designer',
    'brand designer',
    'creative designer',
    'social media',
    'packaging',
    'layout',
    'typography',
    'adobe photoshop',
    'adobe illustrator',
    'figma',
    'remote',
    'hybrid',
  ];
  const negativeTerms = [
    'sales',
    'engineering',
    'fashion merchandiser',
    'admin',
    'intern',
    'internship',
    'magang',
    'video editor',
    'motion graphic',
    'animator',
    '3d',
    'renovasi',
  ];

  let score = 50;
  const redFlags: string[] = [];

  for (const term of positiveTerms) {
    if (haystack.includes(term))
      score += term.includes('designer') || term.includes('graphic') ? 10 : 5;
  }

  for (const term of negativeTerms) {
    if (haystack.includes(term)) {
      score -= term === 'intern' || term === 'magang' ? 12 : 18;
      redFlags.push(term);
    }
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    redFlags: [...new Set(redFlags)],
  };
}

function parseGlintsDesignHtml(html: string): JobSearchResult[] {
  const anchorMatches = [
    ...html.matchAll(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi),
  ];
  const jobs: JobSearchResult[] = [];

  for (let index = 0; index < anchorMatches.length; index += 1) {
    const [, href, content] = anchorMatches[index];
    const title = stripHtml(content);
    const looksLikeJobTitle =
      /(designer|design|grafis|illustrator|ilustrator|ui\/ux|creative|stylist|animator)/i.test(
        title
      );
    const isNotCompanyNav =
      title.length >= 3 &&
      title.length <= 90 &&
      !/perusahaan|lowongan kerja|blog|masuk|daftar/i.test(title);

    if (!looksLikeJobTitle || !isNotCompanyNav) continue;

    const nextText = anchorMatches
      .slice(index + 1, index + 5)
      .map((match) => stripHtml(match[2]))
      .filter(Boolean);
    const context = stripHtml(
      html.slice(
        anchorMatches[index].index ?? 0,
        anchorMatches[index + 8]?.index ?? (anchorMatches[index].index ?? 0) + 1500
      )
    );
    const url = href.startsWith('http') ? href : new URL(href, 'https://glints.com').toString();
    const company = nextText.find(
      (item) => !/(jakarta|bali|jawa|tangerang|bekasi|depok|kab\.|kota|remote|hybrid)/i.test(item)
    );
    const location = nextText.find((item) =>
      /(jakarta|bali|jawa|tangerang|bekasi|depok|kab\.|kota|remote|hybrid)/i.test(item)
    );
    const scored = scoreDesignJob({ title: decodeHtml(title), snippet: context, location });

    jobs.push({
      title: decodeHtml(title),
      company: company ? decodeHtml(company) : undefined,
      location: location ? decodeHtml(location) : undefined,
      source: 'Glints Design',
      url,
      snippet: context.slice(0, 220),
      score: scored.score,
      redFlags: scored.redFlags,
    });
  }

  return uniqueResults(jobs)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 12);
}

async function fetchGlintsDesign(): Promise<JobSearchResult[]> {
  try {
    const response = await fetch(GLINTS_DESIGN_URL, {
      headers: {
        'user-agent': USER_AGENT,
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'id-ID,id;q=0.9,en;q=0.8',
      },
      cache: 'no-store',
    });

    if (!response.ok) return [];
    const html = await response.text();
    if (/Glints\s+-\s+Firewall/i.test(html)) return [];
    return parseGlintsDesignHtml(html);
  } catch {
    return [];
  }
}

async function fetchRemoteOk(query: string): Promise<JobSearchResult[]> {
  try {
    const response = await fetch('https://remoteok.com/api', {
      headers: {
        'user-agent': USER_AGENT,
        accept: 'application/json',
      },
      cache: 'no-store',
    });
    if (!response.ok) return [];
    const data = (await response.json()) as Array<Record<string, unknown>>;
    const terms = query.toLowerCase().split(' ').filter(Boolean);
    return data
      .slice(1)
      .filter((job) => {
        const haystack =
          `${job.position ?? ''} ${job.company ?? ''} ${Array.isArray(job.tags) ? job.tags.join(' ') : ''}`.toLowerCase();
        return terms.some((term) => haystack.includes(term));
      })
      .slice(0, 6)
      .map((job) => ({
        title: String(job.position ?? 'Untitled role'),
        company: typeof job.company === 'string' ? job.company : undefined,
        location: typeof job.location === 'string' ? job.location : 'Remote',
        source: 'RemoteOK',
        url: String(job.url ?? 'https://remoteok.com'),
        snippet: Array.isArray(job.tags) ? job.tags.slice(0, 6).join(', ') : undefined,
      }));
  } catch {
    return [];
  }
}

async function fetchArbeitnow(query: string): Promise<JobSearchResult[]> {
  try {
    const response = await fetch('https://www.arbeitnow.com/api/job-board-api', {
      headers: { accept: 'application/json', 'user-agent': USER_AGENT },
      cache: 'no-store',
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as { data?: Array<Record<string, unknown>> };
    const terms = query.toLowerCase().split(' ').filter(Boolean);
    return (payload.data ?? [])
      .filter((job) => {
        const haystack =
          `${job.title ?? ''} ${job.company_name ?? ''} ${job.location ?? ''} ${Array.isArray(job.tags) ? job.tags.join(' ') : ''}`.toLowerCase();
        return terms.some((term) => haystack.includes(term));
      })
      .slice(0, 6)
      .map((job) => ({
        title: String(job.title ?? 'Untitled role'),
        company: typeof job.company_name === 'string' ? job.company_name : undefined,
        location: typeof job.location === 'string' ? job.location : 'Remote',
        source: 'Arbeitnow',
        url: String(job.url ?? 'https://www.arbeitnow.com/jobs'),
        snippet: Array.isArray(job.tags) ? job.tags.slice(0, 6).join(', ') : undefined,
      }));
  } catch {
    return [];
  }
}

export const jobHuntService = {
  async searchJobs(input: string): Promise<JobSearchResponse> {
    const query = normalizeQuery(input);
    const [glintsDesign, remoteOk, arbeitnow] = await Promise.all([
      /glints|design|designer|grafis|graphic|visual/i.test(query)
        ? fetchGlintsDesign()
        : Promise.resolve([]),
      fetchRemoteOk(query),
      fetchArbeitnow(query),
    ]);

    const results = uniqueResults([...glintsDesign, ...remoteOk, ...arbeitnow]).slice(0, 10);
    const searchLinks = toSearchLinks(query);
    const prompt = `
            Anda adalah job hunting assistant untuk Ramos, Graphic/Visual Designer senior di Indonesia.
            Query: ${query}
            Hasil lowongan terstruktur: ${JSON.stringify(results)}
            Link pencarian manual: ${JSON.stringify(searchLinks)}

            Tugas:
            1. Ringkas strategi cari kerja untuk query ini.
            2. Ranking hasil yang tersedia berdasarkan kecocokan untuk Graphic/Visual Designer.
            3. Sebutkan kata kunci pencarian tambahan untuk situs loker Indonesia dan sosmed.
            4. Jangan mengarang lowongan baru di luar data/link yang diberikan.
            5. Jawab singkat dalam Bahasa Indonesia, format Telegram Markdown.
        `;

    let analysis = fallbackSearchAnalysis(query, results, searchLinks);
    if (shouldUseAiAnalysis()) {
      try {
        analysis = await generateText(prompt);
      } catch (error) {
        console.warn('[JobHuntService] AI analysis unavailable, using local fallback:', error);
      }
    }
    return { query, results, searchLinks, analysis };
  },

  async searchGlintsDesign(): Promise<JobSearchResponse> {
    const query = 'Glints Design - Graphic Designer / Visual Designer';
    let results: JobSearchResult[] = [];

    try {
      const { scanGlintsDesignJobs } = await import('./glintsBrowserService');
      results = await scanGlintsDesignJobs();
    } catch (error) {
      console.warn(
        '[JobHuntService] Glints browser scan unavailable, falling back to public fetch:',
        error
      );
      results = await fetchGlintsDesign();
    }

    const searchLinks = [
      { label: 'Glints Design Category', url: GLINTS_DESIGN_URL },
      {
        label: 'Glints Graphic Designer Search',
        url: 'https://glints.com/id/opportunities/jobs/explore?keyword=graphic%20designer',
      },
      {
        label: 'Glints Visual Designer Search',
        url: 'https://glints.com/id/opportunities/jobs/explore?keyword=visual%20designer',
      },
    ];
    const prompt = `
            Anda adalah job hunting assistant untuk Ramos, Graphic/Visual Designer senior.
            Target: Glints kategori Design.
            Hasil parse Glints: ${JSON.stringify(results)}
            Link fallback: ${JSON.stringify(searchLinks)}

            Rules Ramos:
            - Prioritaskan Graphic Designer, Visual Designer, Brand Designer, Creative Designer, Social Media Asset.
            - Hindari sales, engineering, admin, magang, fashion merchandising, motion/video berat, animator, 3D.
            - Remote/hybrid lebih menarik, tapi WFO Jakarta/Tangerang/Bekasi/Depok masih boleh jika role bagus.
            - Jangan mengarang lowongan jika hasil parse kosong.

            Output:
            1. Jelaskan apakah hasil otomatis berhasil atau perlu buka link fallback.
            2. Jika ada hasil, beri prioritas top 5 berdasarkan score.
            3. Beri rekomendasi tindakan berikutnya.
            Jawab singkat dalam Bahasa Indonesia, format Telegram Markdown.
        `;

    let analysis = fallbackSearchAnalysis(query, results, searchLinks);
    if (shouldUseAiAnalysis()) {
      try {
        analysis = await generateText(prompt);
      } catch (error) {
        console.warn(
          '[JobHuntService] Glints AI analysis unavailable, using local fallback:',
          error
        );
      }
    }
    return { query, results, searchLinks, analysis };
  },

  async searchJobstreetDesign(): Promise<JobSearchResponse> {
    const query = 'JobStreet - Graphic Designer / Visual Designer (Jakarta)';
    let results: JobSearchResult[] = [];

    try {
      const { scanJobstreetDesignJobs } = await import('./jobstreetService');
      results = await scanJobstreetDesignJobs();
    } catch (error) {
      console.warn('[JobHuntService] JobStreet scan unavailable:', error);
    }

    const searchLinks = [
      {
        label: 'JobStreet Graphic Designer Jakarta',
        url: 'https://id.jobstreet.com/id/graphic-designer-jobs/in-Jakarta',
      },
      {
        label: 'JobStreet Desain Grafis Jabodetabek',
        url: 'https://id.jobstreet.com/id/desain-grafis-jobs/in-Jakarta',
      },
      {
        label: 'JobStreet Visual Designer Indonesia',
        url: 'https://id.jobstreet.com/id/visual-designer-jobs',
      },
    ];

    const analysis = fallbackSearchAnalysis(query, results, searchLinks);
    return { query, results, searchLinks, analysis };
  },

  async prepareApplyPackage(input: string): Promise<ApplyPackage> {
    const trimmedInput = input.trim();
    let sourceText = trimmedInput;

    if (/^https?:\/\//i.test(trimmedInput)) {
      if (isGlintsUrl(trimmedInput)) {
        try {
          const { extractGlintsJobText } = await import('./glintsBrowserService');
          sourceText = await extractGlintsJobText(trimmedInput);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);

          if (
            message === 'GLINTS_SESSION_MISSING' ||
            message === 'GLINTS_BROWSER_BLOCKED' ||
            message === 'GLINTS_EXTRACTION_EMPTY'
          ) {
            throw error;
          }

          sourceText = await fetchText(trimmedInput);
        }
      } else if (isInstagramUrl(trimmedInput)) {
        // IG punya login wall agresif untuk fetch generic, jadi kita pakai
        // jalur khusus: OG meta + Gemini Vision OCR pada poster.
        // Error code-nya (INSTAGRAM_INVALID_URL / INSTAGRAM_EXTRACTION_FAILED)
        // dipropagate biar handler bisa kasih pesan spesifik ke user.
        sourceText = await extractInstagramJobText(trimmedInput);
      } else {
        sourceText = await fetchText(trimmedInput);
      }
    }

    if (!sourceText) {
      throw new Error('Detail lowongan kosong');
    }

    const applyPackage = await import('./jobApplyService').then(({ jobApplyService }) =>
      jobApplyService.prepare(sourceText)
    );

    return {
      proposal: applyPackage.proposal,
      hrMessage: applyPackage.hrMessage,
      analysis: applyPackage.analysis,
      pdfBuffer: applyPackage.pdfBuffer,
      pdfFilename: applyPackage.pdfFilename,
      sourceText,
    };
  },
};
