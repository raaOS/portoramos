/**
 * /jobs command handler
 * Finds job leads and returns curated search links.
 */

import type { JobSearchResult } from '@/lib/services/jobHuntService';
import type { MessageToSend } from '../types';
import { sendImmediate } from '../sender';

function formatJobResults(results: JobSearchResult[]): string {
  if (results.length === 0) {
    return '_Belum ada hasil API publik yang cocok. Pakai link pencarian manual di bawah untuk portal Indonesia dan sosmed._';
  }

  return results
    .map((job, index) => {
      const company = job.company ? ` - ${job.company}` : '';
      const location = job.location ? ` (${job.location})` : '';
      const snippet = job.snippet ? `\n   ${job.snippet}` : '';
      return `${index + 1}. [${job.title}](${job.url})${company}${location}\n   Source: ${job.source}${snippet}`;
    })
    .join('\n\n');
}

export async function handleJobsCommand(
  text: string,
  chatId: string,
  botToken: string,
  threadId?: number
): Promise<MessageToSend[]> {
  const query = text.replace('/jobs', '').trim();

  await sendImmediate(chatId, '*Mencari loker dan menyusun shortlist...*', botToken, threadId);

  try {
    const { jobHuntService } = await import('@/lib/services/jobHuntService');
    const response = await jobHuntService.searchJobs(query);
    const searchLinks = response.searchLinks
      .map((link) => `- [${link.label}](${link.url})`)
      .join('\n');

    return [
      {
        text:
          `*Job Hunt:* ${response.query}\n\n` +
          `${response.analysis}\n\n` +
          `*Shortlist:*\n${formatJobResults(response.results)}\n\n` +
          `*Cari manual cepat:*\n${searchLinks}\n\n` +
          'Untuk apply: kirim `/apply [link/detail lowongan]`',
      },
    ];
  } catch (err) {
    console.error('[Jobs] Error:', err);
    return [
      {
        text: '*Gagal mencari loker*\n\nCoba lagi dengan keyword lebih spesifik, misalnya `/jobs graphic designer remote Indonesia`.',
      },
    ];
  }
}
