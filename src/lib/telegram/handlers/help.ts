/**
 * /help command handler
 */

import type { MessageToSend } from '../types';

export function handleHelpCommand(): MessageToSend[] {
  return [
    {
      text:
        '*Admin Commands*\n\n' +
        '`/glints` - Scan Glints kategori Design dan ranking loker cocok\n' +
        '`/jobs [keyword]` - Cari loker dari sumber publik + link situs loker/sosmed\n' +
        '`/apply [link/detail]` - Siapkan paket apply: proposal, CV ATS, pesan HRD\n' +
        '   _Link Instagram (`/p/`, `/reel/`, `/tv/`) sekarang didukung lewat OCR poster._\n' +
        '`/resume [detail]` - AI bikin Resume ATS (PDF) + Pesan HRD\n' +
        '`/prop [detail]` - AI bikin Proposal Lamaran\n' +
        '`/leads` - Cek 5 pesan terakhir\n' +
        '`/help` - Tampilkan menu ini\n' +
        '`/ai` - Aktifkan ulang AI Auto-Responder',
    },
  ];
}
