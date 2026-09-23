import type { JobSearchResult } from './types';

export const DEFAULT_ROLE = 'graphic designer visual designer remote Indonesia';
export const GLINTS_DESIGN_URL = 'https://glints.com/id/job-category/design';
export const USER_AGENT = 'Mozilla/5.0 (compatible; RamosPortfolioJobBot/1.0; +https://portfolio.local)';

export const SOURCE_LINKS = [
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

export function normalizeQuery(input: string): string {
  const query = input.trim().replace(/\s+/g, ' ');
  return query || DEFAULT_ROLE;
}

export function stripHtml(html: string): string {
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

export function decodeHtml(value: string): string {
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

export function extractTitle(html: string): string | null {
  const ogTitle = html.match(
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i
  )?.[1];
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
  return (ogTitle || title || null)?.replace(/\s+/g, ' ').trim() ?? null;
}

export function toSearchLinks(query: string) {
  return SOURCE_LINKS.map((source) => ({
    label: source.label,
    url: source.buildUrl(query),
  }));
}

export async function fetchText(url: string): Promise<string> {
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

export function isGlintsUrl(url: string): boolean {
  try {
    return new URL(url).hostname.includes('glints.com');
  } catch {
    return false;
  }
}

export function uniqueResults(results: JobSearchResult[]): JobSearchResult[] {
  const seen = new Set<string>();
  return results.filter((result) => {
    const key = result.url.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function fallbackSearchAnalysis(
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

export function shouldUseAiAnalysis(): boolean {
  return process.env.JOB_BOT_USE_AI_ANALYSIS === 'true';
}
