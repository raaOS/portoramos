import { generateText } from '@/lib/ai';
import { isInstagramUrl, extractInstagramJobText } from './instagramExtractService';
import type { JobSearchResult, JobSearchResponse, ApplyPackage } from './job-hunt/types';
import {
  GLINTS_DESIGN_URL,
  normalizeQuery,
  toSearchLinks,
  fetchText,
  isGlintsUrl,
  uniqueResults,
  fallbackSearchAnalysis,
  shouldUseAiAnalysis,
} from './job-hunt/jobSearchHelpers';
import {
  fetchGlintsDesign,
  fetchRemoteOk,
  fetchArbeitnow,
} from './job-hunt/jobSearchScrapers';

export type { JobSearchResult, JobSearchResponse, ApplyPackage };

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
