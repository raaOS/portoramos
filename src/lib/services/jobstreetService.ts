/**
 * JobStreet (id.jobstreet.com) listing scanner.
 */

import type { JobSearchResult } from './jobHuntService';
import {
  USER_AGENT,
  JOBSTREET_DESIGN_URL,
  isBlockedPage,
  normalizeJobUrl,
  scoreJob,
  parseJobstreetCard,
} from './jobstreet/jobstreetCardParser';
import {
  extractJobstreetDetail,
  type JobstreetDetail,
} from './jobstreet/jobstreetDetailExtractor';

export type { JobstreetDetail };
export { extractJobstreetDetail };

/**
 * Scan listing JobStreet kategori graphic designer (Jakarta).
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
    return await scanWithPlaywright();
  }

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

    const cards = await page.locator('a[href*="/id/job/"]').evaluateAll((anchors) => {
      const result: Array<{ href: string; text: string }> = [];
      const seenHrefs = new Set<string>();

      for (const anchor of anchors) {
        const element = anchor as HTMLAnchorElement;
        const href = element.href.replace(/[?#].*$/, '');
        if (seenHrefs.has(href)) continue;
        seenHrefs.add(href);

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
