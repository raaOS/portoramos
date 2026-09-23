import type { JobSearchResult } from './types';
import {
  USER_AGENT,
  GLINTS_DESIGN_URL,
  stripHtml,
  decodeHtml,
  uniqueResults,
} from './jobSearchHelpers';

export function scoreDesignJob(job: Pick<JobSearchResult, 'title' | 'snippet' | 'location'>): {
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

export function parseGlintsDesignHtml(html: string): JobSearchResult[] {
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

export async function fetchGlintsDesign(): Promise<JobSearchResult[]> {
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

export async function fetchRemoteOk(query: string): Promise<JobSearchResult[]> {
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

export async function fetchArbeitnow(query: string): Promise<JobSearchResult[]> {
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
