/**
 * /apply command handler
 * Prepares a cover letter, ATS resume PDF, and intro message.
 */

import type { MessageToSend } from '../types';
import { sendImmediate } from '../sender';

/**
 * Marker zero-width invisible yang ditempel di pesan prompt ForceReply.
 * Webhook router pakai marker ini untuk mendeteksi kalau pesan masuk
 * adalah reply ke prompt /apply, sehingga teks balasan user otomatis
 * di-route balik ke handler ini sebagai input link/detail.
 *
 * Kombinasi `\u200B\u2063\u200B` dipilih karena:
 * - 3 char zero-width yang invisible di semua client Telegram
 * - urutan tidak akan muncul natural di pesan apapun
 * - tidak mengganggu Markdown parser Telegram
 */
export const APPLY_PROMPT_MARKER = '\u200B\u2063\u200B';

export async function handleApplyCommand(
  text: string,
  chatId: string,
  botToken: string,
  threadId?: number
): Promise<MessageToSend[]> {
  // Strip command prefix (kalau ada). Saat dipanggil dari reply ke ForceReply
  // prompt, text-nya cuma raw input user tanpa prefix `/apply`, jadi replace-nya
  // jadi no-op dan kita tetap dapat full input.
  const jobContent = text.replace(/^\/apply(@\w+)?\s*/i, '').trim();

  if (!jobContent) {
    // Empty argument → prompt user pakai ForceReply. Marker di awal teks
    // dipakai webhook router untuk routing balik ke handler ini saat user
    // membalas pesan prompt.
    const promptText =
      APPLY_PROMPT_MARKER +
      '📋 *Paste link loker di sini...*\n\n' +
      '_Reply ke pesan ini_ dengan:\n' +
      '• Link Instagram (`/p/`, `/reel/`, `/tv/`)\n' +
      '• Link Glints / Jobstreet / LinkedIn / Kalibrr\n' +
      '• Atau paste deskripsi loker langsung sebagai teks\n\n' +
      'Bot akan otomatis siapkan paket apply: CV ATS PDF, cover letter, pesan HR.';

    return [
      {
        text: promptText,
        reply_markup: {
          force_reply: true,
          selective: true,
          input_field_placeholder: 'https://... atau paste detail loker',
        },
      },
    ];
  }

  await sendImmediate(
    chatId,
    '*Menyiapkan paket apply: proposal, CV ATS, dan pesan HRD...*',
    botToken,
    threadId
  );

  try {
    const { jobHuntService } = await import('@/lib/services/jobHuntService');
    const applyPackage = await jobHuntService.prepareApplyPackage(jobContent);

    const { sendTelegramDocument } = await import('@/lib/telegram');
    const docResult = await sendTelegramDocument(
      applyPackage.pdfFilename,
      applyPackage.pdfBuffer,
      '*CV ATS untuk lowongan ini sudah siap.*'
    );

    const messages: MessageToSend[] = [
      {
        text: '*Apply Strategy:*\n\n' + applyPackage.analysis,
      },
      {
        text: '*Pesan pembuka ke HR / recruiter:*\n\n' + applyPackage.hrMessage,
      },
      {
        text: '*Cover Letter / Proposal:*\n\n' + applyPackage.proposal,
      },
    ];

    if (!docResult.success) {
      messages.unshift({
        text: '*PDF berhasil dibuat tapi gagal dikirim ke Telegram.*',
      });
    }

    messages.push({
      text: 'Paket apply siap. Untuk submit otomatis penuh, situs tujuan perlu dibuatkan connector khusus karena tiap portal punya login/form/captcha berbeda.',
    });

    return messages;
  } catch (err) {
    console.error('[Apply] Error:', err);
    const message = err instanceof Error ? err.message : String(err);

    if (message === 'INSTAGRAM_INVALID_URL') {
      return [
        {
          text: '*Link Instagram tidak valid*\n\nFormat yang didukung: `instagram.com/p/...`, `instagram.com/reel/...`, atau `instagram.com/tv/...`. Pastikan link-nya postingan publik, bukan story atau profile.',
        },
      ];
    }

    if (message === 'INSTAGRAM_EXTRACTION_FAILED' || message === 'INSTAGRAM_OCR_TIMEOUT') {
      return [
        {
          text: '*Gagal membaca konten dari Instagram*\n\nIG memblokir fetch atau caption + poster tidak menghasilkan teks yang cukup. Buka link-nya manual, copy caption + teks dari poster loker, lalu paste setelah `/apply` (tanpa link).',
        },
      ];
    }

    return [
      {
        text: '*Gagal menyiapkan paket apply*\n\nKalau pakai link dan situsnya memblokir crawler, paste deskripsi lowongannya langsung setelah `/apply`.',
      },
    ];
  }
}
