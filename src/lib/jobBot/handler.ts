import type { JobSearchResult } from '@/lib/services/jobHuntService';
import type { JobBotConfig } from './config';
import { answerJobBotCallback, sendJobBotDocument, sendJobBotMessage } from './sender';
import {
  getShortlistJob,
  markJobApplied,
  recordSeenJobs,
  saveShortlist,
  type SeenJobRecord,
} from './shortlistStore';

interface TelegramMessage {
  message_id?: number;
  text?: string;
  message_thread_id?: number;
  chat?: {
    id?: number | string;
    type?: string;
    title?: string;
  };
  from?: {
    id?: number | string;
    is_bot?: boolean;
    username?: string;
  };
  reply_to_message?: TelegramMessage;
}

export interface JobBotUpdate {
  message?: TelegramMessage;
  callback_query?: {
    id: string;
    data?: string;
    message?: TelegramMessage;
  };
}

function commandOf(text: string): string {
  return text.trim().split(/\s+/)[0].split('@')[0].toLowerCase();
}

function argText(text: string): string {
  return text
    .trim()
    .replace(/^\S+\s*/, '')
    .trim();
}

function getUrl(value: string): URL | null {
  try {
    return /^https?:\/\//i.test(value.trim()) ? new URL(value.trim()) : null;
  } catch {
    return null;
  }
}

function isListingUrl(url: URL): boolean {
  return (
    url.hostname.includes('glints.com') &&
    (url.pathname.includes('/job-category/') ||
      url.pathname.includes('/opportunities/jobs/explore') ||
      url.searchParams.has('keyword'))
  );
}

function isAllowedChat(message: TelegramMessage, config: JobBotConfig): boolean {
  const chatId = String(message.chat?.id ?? '');
  return chatId === config.adminChatId;
}

function shouldHandleThread(message: TelegramMessage, config: JobBotConfig): boolean {
  if (typeof config.threadId !== 'number') return true;
  return message.message_thread_id === config.threadId;
}

/**
 * Format job card untuk pesan /scan satu-per-satu.
 * Layout meniru tampilan card Glints (judul, perusahaan, gaji, kategori,
 * tipe kerja, edukasi, pengalaman, tanggal tayang/diperbarui).
 *
 * `previousSeenStatus` adalah snapshot status lowongan SEBELUM scan ini berjalan.
 * - null         → lowongan baru pertama kali muncul → badge "🆕 Baru"
 * - applied=true → user sudah pernah klik Cek        → badge "✅ Sudah dilamar"
 * - seenCount=N  → lowongan ini muncul ke-N kalinya  → badge "👁 Sudah dilihat (Nx)"
 */
function formatJobCard(
  number: number,
  job: JobSearchResult,
  previousSeenStatus: SeenJobRecord | null = null
): string {
  const lines: string[] = [];

  // Header: nomor + judul + status badge
  let statusBadge = '';
  if (previousSeenStatus?.applied) {
    statusBadge = ' ✅ Sudah dilamar';
  } else if (previousSeenStatus && previousSeenStatus.seenCount > 0) {
    statusBadge = ` 👁 Sudah dilihat (${previousSeenStatus.seenCount}x)`;
  } else {
    statusBadge = ' 🆕 Baru';
  }
  lines.push(`#${number}  ${job.title}${statusBadge}`);

  // Perusahaan (✅ untuk simulasi badge verified Glints)
  if (job.company) {
    lines.push(`✅ ${job.company}`);
  }

  lines.push('');

  // Gaji
  if (job.salary) {
    lines.push(`💰 ${job.salary}`);
  } else {
    lines.push('💰 Gaji tidak ditampilkan');
  }

  // Kategori
  if (job.category) {
    lines.push(`🏢 ${job.category}`);
  }

  // Tipe kerja + arrangement
  const workParts = [job.employmentType, job.workArrangement].filter(Boolean);
  if (workParts.length > 0) {
    lines.push(`⏳ ${workParts.join(' · ')}`);
  }

  // Edukasi minimal
  if (job.educationLevel) {
    lines.push(`🎓 ${job.educationLevel}`);
  }

  // Pengalaman
  if (job.experienceLevel) {
    lines.push(`💼 ${job.experienceLevel}`);
  }

  // Skill chip dari Glints
  if (job.skills) {
    lines.push(`🎨 ${job.skills}`);
  }

  // Lokasi (kalau ada dan belum tergambar di workArrangement)
  if (job.location) {
    lines.push(`📍 ${job.location}`);
  }

  // Timeline
  const timelineParts: string[] = [];
  if (job.postedAt) timelineParts.push(`Tayang ${job.postedAt}`);
  if (job.updatedAt) timelineParts.push(`Diperbarui ${job.updatedAt}`);
  if (timelineParts.length > 0) {
    lines.push('');
    lines.push(`🕒 ${timelineParts.join(' • ')}`);
  }

  // Match score + red flags
  lines.push('');
  const score = typeof job.score === 'number' ? `Match ${job.score}%` : 'Match n/a';
  lines.push(`⭐ ${score}`);
  if (job.redFlags?.length) {
    lines.push(`⚠️ Red flag: ${job.redFlags.join(', ')}`);
  }

  // Link
  lines.push('');
  lines.push(`🔗 ${job.url}`);

  return lines.join('\n');
}

function splitMessage(text: string, limit = 3500): string[] {
  if (text.length <= limit) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > limit) {
    const boundary = Math.max(
      remaining.lastIndexOf('\n\n', limit),
      remaining.lastIndexOf('\n', limit),
      remaining.lastIndexOf(' ', limit)
    );
    const splitAt = boundary > 500 ? boundary : limit;
    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }

  if (remaining) chunks.push(remaining);
  return chunks;
}

async function send(config: JobBotConfig, text: string, threadId?: number) {
  for (const chunk of splitMessage(text)) {
    await sendJobBotMessage(
      config.botToken,
      config.adminChatId,
      chunk,
      threadId ?? config.threadId
    );
  }
}

/**
 * Marker zero-width yang ditempel di awal pesan prompt ForceReply.
 * Saat user reply ke pesan ini, dispatcher mendeteksi marker di
 * `reply_to_message.text` dan men-route balik ke handler `/cek` dengan
 * teks balasan user dijadikan argumen.
 */
const CEK_PROMPT_MARKER = '\u200B\u2063\u200B';

/**
 * Pending-cek state: in-memory map dari `${chatId}:${threadId}` ke
 * timestamp expiry. Dipakai sebagai fallback kalau user tidak benar-benar
 * "reply" ke prompt (banyak kasus user di desktop/web Telegram cuma
 * mengetik di input field tanpa hold-reply, jadi pesan masuk sebagai
 * pesan biasa, bukan reply_to_message).
 *
 * TTL 5 menit sudah cukup luas — kalau user lebih lama dari itu state
 * di-clear dan user ketik ulang `/cek` saja. State juga di-consume
 * (delete) saat input pertama valid masuk supaya pesan random berikutnya
 * tidak tertangkap.
 */
const PENDING_CEK_TTL_MS = 5 * 60 * 1000;
const pendingCekState = new Map<string, number>();

function pendingKey(chatId: string, threadId?: number): string {
  return `${chatId}:${threadId ?? 'main'}`;
}

function setPendingCek(chatId: string, threadId?: number) {
  pendingCekState.set(pendingKey(chatId, threadId), Date.now() + PENDING_CEK_TTL_MS);
}

function consumePendingCek(chatId: string, threadId?: number): boolean {
  const key = pendingKey(chatId, threadId);
  const expiry = pendingCekState.get(key);
  if (!expiry) return false;
  pendingCekState.delete(key);
  if (Date.now() > expiry) return false;
  return true;
}

async function sendCekForceReplyPrompt(config: JobBotConfig, threadId?: number) {
  const text =
    CEK_PROMPT_MARKER +
    '*Paste link loker di sini...*\n\n' +
    '_Reply ke pesan ini_ dengan:\n' +
    '• Link Instagram (`/p/`, `/reel/`, `/tv/`) — di-OCR otomatis\n' +
    '• Link Glints / JobStreet / LinkedIn / Kalibrr\n' +
    '• Atau paste deskripsi loker langsung sebagai teks\n\n' +
    'Bot akan mengecek lowongan dan menyiapkan CV ATS PDF, cover letter, pesan HR.';

  await sendJobBotMessage(config.botToken, config.adminChatId, text, threadId ?? config.threadId, {
    force_reply: true,
    selective: true,
    input_field_placeholder: 'https://instagram.com/p/... atau detail loker',
  });

  // Catat state pending. Pesan non-command berikutnya dari topic ini
  // (dalam window 5 menit) akan diperlakukan sebagai input cek, baik
  // user benar-benar "reply" ke prompt atau hanya mengetik biasa.
  setPendingCek(config.adminChatId, threadId ?? config.threadId);
}

async function sendWithButtons(
  config: JobBotConfig,
  text: string,
  buttonRows: Array<Array<{ text: string; callbackData?: string; url?: string }>>,
  threadId?: number
) {
  const inline_keyboard = buttonRows.map((row) =>
    row.map((btn) => {
      if (btn.url) {
        return { text: btn.text, url: btn.url };
      }
      return { text: btn.text, callback_data: btn.callbackData ?? '' };
    })
  );
  await sendJobBotMessage(config.botToken, config.adminChatId, text, threadId ?? config.threadId, {
    inline_keyboard,
  });
}


/**
 * Sumber scan yang didukung. Bot menampilkan picker saat user kirim /scan,
 * lalu callback `scanSrc:{source}` jalankan flow yang sesuai.
 */
type ScanSource = 'glints' | 'jobstreet';

const SCAN_SOURCE_LABELS: Record<ScanSource, string> = {
  glints: 'Glints Design',
  jobstreet: 'JobStreet (Jakarta)',
};

const SCAN_SOURCE_OPEN_BUTTONS: Record<ScanSource, string> = {
  glints: '📱 Buka di App',
  jobstreet: '🔗 Buka di JobStreet',
};

async function handleScan(config: JobBotConfig, threadId?: number) {
  await sendWithButtons(
    config,
    '*Pilih sumber lowongan untuk di-scan:*',
    [
      [
        { text: '🟦 Glints Design', callbackData: 'scanSrc:glints' },
        { text: '🟧 JobStreet Jakarta', callbackData: 'scanSrc:jobstreet' },
      ],
    ],
    threadId
  );
}

async function executeScan(source: ScanSource, config: JobBotConfig, threadId?: number) {
  const sourceLabel = SCAN_SOURCE_LABELS[source];
  await send(config, `*Scan ${sourceLabel} dimulai...*`, threadId);

  const { jobHuntService } = await import('@/lib/services/jobHuntService');
  const response =
    source === 'glints'
      ? await jobHuntService.searchGlintsDesign()
      : await jobHuntService.searchJobstreetDesign();

  await saveShortlist(response.results);

  if (response.results.length === 0) {
    const links = response.searchLinks.map((link) => `- ${link.label}: ${link.url}`).join('\n');
    await send(
      config,
      `${sourceLabel} Shortlist\n\n` + `${response.analysis}\n\n` + `Fallback:\n${links}`,
      threadId
    );
    return;
  }

  // Record riwayat scan; previousState dipakai supaya badge "Baru" / "Sudah dilihat"
  // di-render berdasarkan kondisi SEBELUM scan ini ditambahkan ke history.
  const previousState = await recordSeenJobs(response.results);

  // Statistik ringkas untuk header
  let newCount = 0;
  let appliedCount = 0;
  let repeatCount = 0;
  for (const job of response.results) {
    const prev = previousState.get(job.url.replace(/[?#].*$/, '')) ?? null;
    if (!prev) newCount += 1;
    else if (prev.applied) appliedCount += 1;
    else repeatCount += 1;
  }

  await send(
    config,
    `Ditemukan ${response.results.length} lowongan ` +
      `(🆕 ${newCount} baru, 👁 ${repeatCount} berulang, ✅ ${appliedCount} sudah dilamar). ` +
      'Klik Cek di lowongan yang mau diproses.',
    threadId
  );

  for (const [index, job] of response.results.entries()) {
    const number = index + 1;
    const prev = previousState.get(job.url.replace(/[?#].*$/, '')) ?? null;
    // Tombol kedua adalah link ke detail page. Untuk Glints, link akan otomatis
    // dibuka di aplikasi mobile Glints (universal link). Untuk JobStreet, link
    // ke halaman web detail (yang punya tombol "Lamaran Cepat" sungguhan).
    // JobStreet juga mendapat tombol "📋 Detail" untuk lihat Tanggung Jawab +
    // Kualifikasi tanpa harus commit ke cek flow.
    const buttonRow: Array<{ text: string; callbackData?: string; url?: string }> = [
      { text: `Cek #${number}`, callbackData: `cek:${number}` },
    ];
    if (source === 'jobstreet') {
      buttonRow.push({ text: '📋 Detail', callbackData: `detail:${number}` });
    }
    buttonRow.push({ text: SCAN_SOURCE_OPEN_BUTTONS[source], url: job.url });

    await sendWithButtons(config, formatJobCard(number, job, prev), [buttonRow], threadId);
  }
}

async function handleCek(config: JobBotConfig, text: string, threadId?: number) {
  const detail = argText(text);
  if (!detail) {
    // Empty argument → ForceReply prompt. User cukup tap pesan, ketik
    // link/deskripsi, kirim. Dispatcher men-route balasan kembali ke
    // handler ini sebagai input.
    await sendCekForceReplyPrompt(config, threadId);
    return;
  }

  const url = getUrl(detail);
  if (url && isListingUrl(url)) {
    await send(
      config,
      'Link itu halaman daftar/kategori, bukan lowongan spesifik.\n\n' +
        'Pakai alur ini:\n' +
        '1. Kirim /scan untuk cari shortlist Glints Design.\n' +
        '2. Buka salah satu lowongan dari hasil scan.\n' +
        '3. Kirim /cek [link lowongan spesifik] atau paste deskripsi lowongannya.\n\n' +
        'Kalau Glints memblokir bot saat baca link, paste isi lowongannya langsung setelah /cek.',
      threadId
    );
    return;
  }

  await send(config, '*Mengecek lowongan dan menyiapkan paket apply...*', threadId);
  const { jobHuntService } = await import('@/lib/services/jobHuntService');

  // Tandai applied di seen-store untuk URL spesifik (idempoten kalau sudah ditandai
  // dari callback). Untuk paste deskripsi non-URL kita skip — tidak ada URL kanonik.
  if (url) {
    await markJobApplied(url.toString());
  }

  let applyPackage;
  try {
    applyPackage = await jobHuntService.prepareApplyPackage(detail);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === 'GLINTS_SESSION_MISSING') {
      await send(
        config,
        'Session Glints belum ada.\n\n' +
          'Jalankan sekali di terminal:\n' +
          'npm run job-bot:glints-login\n\n' +
          'Login manual di browser yang terbuka. Setelah session tersimpan, ulangi /cek [link Glints].',
        threadId
      );
      return;
    }

    if (message === 'GLINTS_BROWSER_BLOCKED' || message === 'GLINTS_EXTRACTION_EMPTY') {
      await send(
        config,
        'Browser session Glints terbuka, tapi detail lowongan belum bisa dibaca jelas.\n\n' +
          'Coba refresh session:\n' +
          'npm run job-bot:glints-login\n\n' +
          'Atau paste deskripsi lowongan langsung setelah /cek.',
        threadId
      );
      return;
    }

    if (/Gagal membaca URL|403|401|blocked|firewall/i.test(message)) {
      await send(
        config,
        'Bot belum bisa membaca link itu langsung. Biasanya karena situs loker memblokir crawler/login.\n\n' +
          'Solusi cepat:\n' +
          '1. Buka lowongan di browser.\n' +
          '2. Copy judul, company, requirement, dan job description.\n' +
          '3. Kirim ulang: /cek [paste deskripsi lowongan]\n\n' +
          'Nanti bot tetap bisa bikin CV ATS + cover letter dari teks lowongannya.',
        threadId
      );
      return;
    }

    if (/API key not valid|quota|Too Many Requests|GEMINI_API_KEY/i.test(message)) {
      await send(
        config,
        'Detail lowongan sudah bisa diproses, tapi AI generator gagal karena GEMINI_API_KEY/quota bermasalah.\n\n' +
          'Perbaiki API key/quota Gemini dulu, lalu ulangi /cek. Untuk sementara bot belum bisa bikin CV ATS + cover letter tanpa AI.',
        threadId
      );
      return;
    }

    throw error;
  }
  const documentResponse = await sendJobBotDocument(
    config.botToken,
    config.adminChatId,
    applyPackage.pdfFilename,
    applyPackage.pdfBuffer,
    '*CV ATS untuk lowongan ini sudah siap.*',
    threadId ?? config.threadId
  );

  if (!documentResponse.ok) {
    await send(config, '*PDF dibuat tapi gagal dikirim ke Telegram.*', threadId);
  }

  await send(config, '*Apply Strategy:*\n\n' + applyPackage.analysis, threadId);
  await send(config, '*Pesan HR / recruiter:*\n\n' + applyPackage.hrMessage, threadId);
  await send(config, '*Cover Letter / Proposal:*\n\n' + applyPackage.proposal, threadId);
}

async function handleCekUrl(config: JobBotConfig, url: string, threadId?: number) {
  await handleCek(config, `/cek ${url}`, threadId);
}

async function handleScanSourceCallback(
  config: JobBotConfig,
  callbackId: string,
  data: string,
  message?: TelegramMessage
) {
  const threadId = message?.message_thread_id ?? config.threadId;
  const sourceRaw = data.replace('scanSrc:', '');
  const source: ScanSource | null =
    sourceRaw === 'glints' || sourceRaw === 'jobstreet' ? sourceRaw : null;

  if (!source) {
    await answerJobBotCallback(config.botToken, callbackId, 'Sumber scan tidak dikenal.');
    return;
  }

  await answerJobBotCallback(config.botToken, callbackId, `Scan ${SCAN_SOURCE_LABELS[source]}`);
  await executeScan(source, config, threadId);
}

async function handleDetailCallback(
  config: JobBotConfig,
  callbackId: string,
  data: string,
  message?: TelegramMessage
) {
  const threadId = message?.message_thread_id ?? config.threadId;
  const index = Number.parseInt(data.replace('detail:', ''), 10);
  const job = Number.isFinite(index) ? await getShortlistJob(index) : null;

  if (!job) {
    await answerJobBotCallback(
      config.botToken,
      callbackId,
      'Shortlist tidak ditemukan. Jalankan /scan lagi.'
    );
    return;
  }

  if (job.source !== 'JobStreet') {
    await answerJobBotCallback(
      config.botToken,
      callbackId,
      'Detail hanya tersedia untuk JobStreet.'
    );
    return;
  }

  await answerJobBotCallback(config.botToken, callbackId, `Memuat detail #${index}...`);
  await send(config, `*Detail #${index}: ${job.title}*\n_Memuat dari JobStreet..._`, threadId);

  try {
    const { extractJobstreetDetail } = await import('@/lib/services/jobstreetService');
    const detail = await extractJobstreetDetail(job.url);

    const lines: string[] = [];
    lines.push(`*Detail #${index}: ${job.title}*`);
    if (job.company) lines.push(`✅ ${job.company}`);
    lines.push('');

    // Tanggung jawab — max 5 bullet
    if (detail.responsibilities.length > 0) {
      lines.push('📌 *Tanggung Jawab:*');
      const top = detail.responsibilities.slice(0, 5);
      for (const item of top) {
        lines.push(`• ${item}`);
      }
      if (detail.responsibilities.length > 5) {
        lines.push(
          `_...dan ${detail.responsibilities.length - 5} lainnya. Lihat selengkapnya di JobStreet._`
        );
      }
    } else {
      lines.push(
        '📌 *Tanggung Jawab:* _(tidak terdeteksi di halaman, lihat langsung di JobStreet)_'
      );
    }

    lines.push('');

    // Kualifikasi — max 5 bullet
    if (detail.qualifications.length > 0) {
      lines.push('🎓 *Kualifikasi:*');
      const top = detail.qualifications.slice(0, 5);
      for (const item of top) {
        lines.push(`• ${item}`);
      }
      if (detail.qualifications.length > 5) {
        lines.push(
          `_...dan ${detail.qualifications.length - 5} lainnya. Lihat selengkapnya di JobStreet._`
        );
      }
    } else {
      lines.push('🎓 *Kualifikasi:* _(tidak terdeteksi di halaman, lihat langsung di JobStreet)_');
    }

    lines.push('');
    lines.push(`🔗 ${job.url}`);

    await send(config, lines.join('\n'), threadId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[JobBot] Detail extraction failed:', message);
    await send(
      config,
      `*Gagal memuat detail #${index}.*\nBuka langsung di JobStreet: ${job.url}`,
      threadId
    );
  }
}

async function handleCekCallback(
  config: JobBotConfig,
  callbackId: string,
  data: string,
  message?: TelegramMessage
) {
  const threadId = message?.message_thread_id ?? config.threadId;
  const index = Number.parseInt(data.replace('cek:', ''), 10);
  const job = Number.isFinite(index) ? await getShortlistJob(index) : null;

  if (!job) {
    await answerJobBotCallback(
      config.botToken,
      callbackId,
      'Shortlist tidak ditemukan. Jalankan /scan lagi.'
    );
    await send(config, 'Shortlist tidak ditemukan. Jalankan /scan lagi.', threadId);
    return;
  }

  // Tandai applied di seen-store SEBELUM proses (supaya kalau ada error di tengah,
  // user tetap tahu lowongan ini dia sudah klik). Idempoten.
  await markJobApplied(job.url);

  await answerJobBotCallback(config.botToken, callbackId, `Cek #${index} diproses`);
  await send(config, `Memproses cek #${index}: ${job.title}`, threadId);
  await handleCekUrl(config, job.url, threadId);
}

export async function handleJobBotUpdate(
  update: JobBotUpdate,
  config: JobBotConfig
): Promise<void> {
  if (update.callback_query?.data) {
    const callback = update.callback_query;
    const data = callback.data;
    if (!data) return;
    const callbackMessage = callback.message;

    if (callbackMessage && !isAllowedChat(callbackMessage, config)) return;
    if (callbackMessage && !shouldHandleThread(callbackMessage, config)) return;

    if (data.startsWith('cek:')) {
      await handleCekCallback(config, callback.id, data, callbackMessage);
    } else if (data.startsWith('scanSrc:')) {
      await handleScanSourceCallback(config, callback.id, data, callbackMessage);
    } else if (data.startsWith('detail:')) {
      await handleDetailCallback(config, callback.id, data, callbackMessage);
    }
    return;
  }

  const message = update.message;
  const text = message?.text?.trim();

  if (!message || !text) return;
  if (!isAllowedChat(message, config)) return;
  if (!shouldHandleThread(message, config)) return;

  const threadId = message.message_thread_id ?? config.threadId;

  // ForceReply intercept: kalau pesan ini adalah reply ke prompt `/cek`
  // (text prompt dibungkus CEK_PROMPT_MARKER), perlakukan teks user
  // sebagai argumen `/cek` dan dispatch lewat handler reguler.
  const replyTo = message.reply_to_message;
  const repliedFromBot = replyTo?.from?.is_bot === true;
  const repliedText = typeof replyTo?.text === 'string' ? replyTo.text : '';
  const isReplyToCekPrompt = !!replyTo && repliedFromBot && repliedText.startsWith(CEK_PROMPT_MARKER);

  // Fallback pending-state: kalau bukan command dan kita baru saja kirim
  // prompt cek ke topic ini, treat input sebagai argumen cek meski
  // pesan tidak benar-benar "reply" ke prompt. Banyak client Telegram
  // (terutama desktop/web) tidak otomatis lock reply mode setelah
  // ForceReply, jadi user yang ketik biasa saja juga harus tertangkap.
  const chatIdStr = String(message.chat?.id ?? '');
  const startsAsCommand = text.startsWith('/');
  const isPendingCekFallback = !startsAsCommand && consumePendingCek(chatIdStr, threadId);

  if (isReplyToCekPrompt || isPendingCekFallback) {
    try {
      await handleCek(config, `/cek ${text}`, threadId);
    } catch (error) {
      console.error('[JobBot] Cek (reply) error:', error);
      await send(config, '*Job bot error.* Coba lagi atau cek log server.', threadId);
    }
    return;
  }

  const command = commandOf(text);
  const shortCommandsAllowed = typeof config.threadId === 'number' && threadId === config.threadId;

  try {
    if (!shortCommandsAllowed) {
      return;
    }

    switch (command) {
      case '/scan':
        await handleScan(config, threadId);
        break;
      case '/cek':
        await handleCek(config, text, threadId);
        break;
    }
  } catch (error) {
    console.error('[JobBot] Handler error:', error);
    await send(config, '*Job bot error.* Coba lagi atau cek log server.', threadId);
  }
}
