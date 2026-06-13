/**
 * Guest message handler
 * Responds to non-admin messages
 */

import type { MessageToSend, ReplyMarkup } from '../types';
import { DEFAULT_SITE_URL } from '@/lib/constants';

export function handleGuestMessage(): MessageToSend[] {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL;

  const markup: ReplyMarkup = {
    inline_keyboard: [
      [
        { text: '📂 Lihat Portfolio', url: siteUrl },
        { text: '📩 Kontak Saya', url: `${siteUrl}/contact` },
      ],
    ],
  };

  return [
    {
      text:
        '👋 *Halo! Terima kasih sudah menghubungi.*\n\n' +
        'Saya adalah asisten virtual dari **Ramos**.\n' +
        'Silakan pilih menu di bawah:',
      reply_markup: markup,
    },
  ];
}
