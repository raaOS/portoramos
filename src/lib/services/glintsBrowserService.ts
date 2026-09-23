import type { JobSearchResult } from './jobHuntService';
import {
  isBlockedPage,
  normalizeJobUrl,
  scoreJob,
  parseGlintsCardBlock,
} from './glints/glintsCardParser';
import {
  storageStatePath,
  glintsProfilePath,
  exists,
  ensureGlintsSessionDir,
  hasGlintsSession,
} from './glints/glintsSessionManager';

export { glintsProfilePath, ensureGlintsSessionDir, hasGlintsSession };

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
      const signalPatterns = [
        /Rp\s*[\d.,]+/i,
        /\b(?:Penuh Waktu|Paruh Waktu|Magang|Kontrak|Freelance)\b/i,
        /\b(?:Hybrid|Remote|Kerja di lokasi|WFO|WFH)\b/i,
        /Minimal\s+(?:SMA|SMK|Diploma|S[123]|D[1-4])/i,
        /(?:\d+\s*[-–]\s*\d+\s*tahun|kurang dari\s+\d+\s*tahun)/i,
        /Tayang|Diperbarui/i,
        /Perusahaan Premium|\bPT\b|\bCV\b/i,
      ];

      return anchors.map((anchor) => {
        const element = anchor as HTMLAnchorElement;

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
              if (signals >= 4) break;
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
