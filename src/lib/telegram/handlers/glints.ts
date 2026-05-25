/**
 * /glints command handler
 * Scans the Glints Design category and ranks roles for Ramos.
 */

import type { JobSearchResult } from '@/lib/services/jobHuntService';
import type { MessageToSend } from '../types';
import { sendImmediate } from '../sender';

function formatGlintsResults(results: JobSearchResult[]): string {
  if (results.length === 0) {
    return '_Glints sedang memblokir fetch otomatis atau belum ada data yang bisa diparse. Pakai link fallback di bawah, lalu kirim `/apply [link/detail]` untuk dibuatkan paket lamaran._';
  }

  return results
    .slice(0, 8)
    .map((job, index) => {
      const score = typeof job.score === 'number' ? `Match: ${job.score}%` : 'Match: n/a';
      const company = job.company ? ` - ${job.company}` : '';
      const location = job.location ? ` (${job.location})` : '';
      const redFlags = job.redFlags?.length ? `\n   Red flag: ${job.redFlags.join(', ')}` : '';
      return `${index + 1}. [${job.title}](${job.url})${company}${location}\n   ${score}${redFlags}`;
    })
    .join('\n\n');
}

export async function handleGlintsCommand(
  chatId: string,
  botToken: string,
  threadId?: number
): Promise<MessageToSend[]> {
  await sendImmediate(chatId, '*Scan Glints kategori Design...*', botToken, threadId);

  try {
    const { jobHuntService } = await import('@/lib/services/jobHuntService');
    const response = await jobHuntService.searchGlintsDesign();
    const searchLinks = response.searchLinks
      .map((link) => `- [${link.label}](${link.url})`)
      .join('\n');

    return [
      {
        text:
          '*Glints Design Shortlist*\n\n' +
          `${response.analysis}\n\n` +
          `*Hasil:*\n${formatGlintsResults(response.results)}\n\n` +
          `*Link fallback:*\n${searchLinks}\n\n` +
          'Lanjut apply: `/apply [link/detail lowongan]`',
      },
    ];
  } catch (err) {
    console.error('[Glints] Error:', err);
    return [
      {
        text: '*Gagal scan Glints Design*\n\nBuka fallback: https://glints.com/id/job-category/design lalu paste detail lowongan ke `/apply`.',
      },
    ];
  }
}
