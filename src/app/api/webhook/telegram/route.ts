import { NextResponse } from 'next/server';
import { randomInt } from 'node:crypto';
import { getTelegramConfigSafe, isValidTelegramWebhookSecret } from '@/lib/telegram';
import { checkRateLimit } from '@/lib/telegram/rateLimiter';
import { validateWebhookData } from '@/lib/telegram/validators';
import { checkIsAdmin, logWebhookDebug } from '@/lib/telegram/helpers';
import {
  sendImmediate,
  sendMessage,
  answerCallbackQuery,
  editMessageText,
} from '@/lib/telegram/sender';
import { db } from '@/lib/database';
import { hashPasswordScrypt } from '@/lib/auth';
import { chatStore } from '@/lib/chatStore';
import { cleanEnvVar } from '@/lib/utils/env';
import { logActivity } from '@/lib/services/auditLogger';
import type { MessageToSend } from '@/lib/telegram/types';
import { handleAiCommand, handleAdminReply, handleGuestMessage } from '@/lib/telegram/handlers';

/**
 * SECURITY HARDENED Telegram Webhook
 *
 * Features:
 * - Rate limiting per chat (anti-spam)
 * - Sanitized error messages (no sensitive data leaked)
 * - Input validation
 * - Proper error handling
 * - Modular command handlers
 */

interface AdminOtpSession {
  status?: string;
  purpose?: 'password' | 'pin';
  requestId?: string;
  expiresAt?: number;
  codeHash?: string;
}

type AdminOtpPurpose = NonNullable<AdminOtpSession['purpose']>;

function isAdminOtpPurpose(value: string): value is AdminOtpPurpose {
  return value === 'password' || value === 'pin';
}

function getAdminOtpPath(purpose?: AdminOtpPurpose) {
  if (purpose === 'password') return 'settings/adminPasswordOtp';
  if (purpose === 'pin') return 'settings/adminPinOtp';
  return null;
}

function getAdminOtpLabel(purpose?: AdminOtpPurpose) {
  return purpose === 'pin' ? 'PIN' : 'SANDI';
}

function parseCallbackData(data: string) {
  const [action = '', maybePurpose = '', ...rest] = data.split(':');
  if (!maybePurpose) {
    return { action, purpose: undefined, requestId: '' };
  }

  if (isAdminOtpPurpose(maybePurpose)) {
    return { action, purpose: maybePurpose, requestId: rest.join(':') };
  }

  return {
    action,
    purpose: undefined,
    requestId: [maybePurpose, ...rest].join(':'),
  };
}

function commandOf(text: string): string {
  return text.trim().split(/\s+/)[0].split('@')[0].toLowerCase();
}

function getPendingOtpSessionState(
  otpData: AdminOtpSession | null,
  requestId: string
): 'active' | 'expired' | 'stale' {
  if (!requestId || !otpData || typeof otpData !== 'object') {
    return 'stale';
  }

  if (otpData.status !== 'pending' || otpData.requestId !== requestId) {
    return 'stale';
  }

  if (typeof otpData.expiresAt !== 'number' || Date.now() > otpData.expiresAt) {
    return 'expired';
  }

  return 'active';
}

async function respondToInactiveOtpSession(
  state: 'expired' | 'stale',
  incomingChatId: string,
  messageId: number,
  callbackId: string,
  botToken: string,
  otpRef?: { remove: () => Promise<void> }
) {
  if (state === 'expired') {
    await otpRef?.remove();
    await editMessageText(
      incomingChatId,
      messageId,
      '**Sesi Kadaluarsa**\nSesi permintaan ganti sandi sudah tidak aktif.',
      botToken
    );
    await answerCallbackQuery(callbackId, botToken, {
      text: 'Sesi sudah kadaluarsa',
      showAlert: true,
    });
    return;
  }

  await editMessageText(
    incomingChatId,
    messageId,
    '**Sesi Tidak Valid**\nTombol ini berasal dari permintaan lama. Silakan request OTP ulang.',
    botToken
  );
  await answerCallbackQuery(callbackId, botToken, {
    text: 'Tombol lama tidak valid. Request OTP ulang.',
    showAlert: true,
  });
}

export async function POST(request: Request) {
  try {
    // Check bot configuration
    const configCheck = await getTelegramConfigSafe();
    if (!configCheck.configured) {
      console.error('[Telegram Webhook] Bot not configured:', configCheck.error);
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    // Get bot token (internal use only)
    const fullConfig = await import('@/lib/telegram').then((m) => {
      const validation = m.validateConfig();
      return validation.valid ? validation.config : null;
    });

    if (!fullConfig) {
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
    }

    const { botToken, chatId: adminChatId, groupId } = fullConfig;
    const providedSecret = request.headers.get('x-telegram-bot-api-secret-token');

    if (!isValidTelegramWebhookSecret(botToken, providedSecret)) {
      return NextResponse.json({ error: 'Unauthorized webhook request' }, { status: 401 });
    }

    // Parse and validate body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const validation = validateWebhookData(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const webhookBody = body as {
      message?: Record<string, unknown>;
      callback_query?: Record<string, unknown>;
    };

    // --- CALLBACK QUERY HANDLING (Inline Buttons) ---
    if (webhookBody.callback_query) {
      const cbQuery = webhookBody.callback_query as Record<string, unknown>;
      const callbackId = String(cbQuery['id'] || '');
      const data = String(cbQuery['data'] || '');
      const { action, purpose, requestId } = parseCallbackData(data);
      const otpPath = getAdminOtpPath(purpose);
      const cbMessage = cbQuery['message'] as Record<string, unknown> | undefined;
      const incomingChatId = String(
        cbMessage?.chat ? (cbMessage.chat as Record<string, unknown>).id : ''
      );
      const messageId = Number(cbMessage?.message_id);

      // Verify admin authorization for this action
      const isAdminAction = checkIsAdmin(incomingChatId, adminChatId, groupId);

      if (!isAdminAction) {
        await answerCallbackQuery(callbackId, botToken, { text: 'Unauthorized', showAlert: true });
        return NextResponse.json({ ok: true });
      }

      if ((action === 'otp_reject' || action === 'otp_approve') && !otpPath) {
        await answerCallbackQuery(callbackId, botToken, {
          text: 'Tombol OTP lama tidak valid. Request OTP ulang.',
          showAlert: true,
        });
        return NextResponse.json({ ok: true });
      }

      if (action === 'otp_reject') {
        if (!otpPath) return NextResponse.json({ ok: true });
        const otpRef = db.ref(otpPath);
        const otpSnap = await otpRef.once('value');
        const otpData = otpSnap.val() as AdminOtpSession | null;
        const sessionState = getPendingOtpSessionState(otpData, requestId);

        if (sessionState === 'active') {
          const sessionPurpose = otpData?.purpose ?? purpose;
          const purposeLabel = sessionPurpose === 'pin' ? 'PIN' : 'password';
          const purposeText = getAdminOtpLabel(sessionPurpose);
          // Update status ke rejected agar di-polling oleh UI
          await otpRef.set({
            status: 'rejected',
            purpose: sessionPurpose,
            requestId,
            expiresAt: Date.now() + 60 * 1000, // biarkan hidup 1 menit agar UI sempat polling
          });

          await editMessageText(
            incomingChatId,
            messageId,
            '🚨 **Akses Digagalkan!**\nUpaya ganti sandi telah diblokir. UI penyusup akan langsung dikunci.',
            botToken
          );
          await editMessageText(
            incomingChatId,
            messageId,
            `**Akses Digagalkan**\nUpaya ubah ${purposeText} telah diblokir.`,
            botToken
          );
          await answerCallbackQuery(callbackId, botToken, {
            text: `Ubah ${purposeText} diblokir`,
          });
          await logActivity(`Admin ${purposeLabel} OTP rejected from Telegram`, {
            category: 'admin',
            purpose: sessionPurpose,
            requestId,
            telegramChatId: incomingChatId,
          });
        } else {
          await respondToInactiveOtpSession(
            sessionState,
            incomingChatId,
            messageId,
            callbackId,
            botToken,
            otpRef
          );
        }
        return NextResponse.json({ ok: true });
      }

      if (action === 'otp_approve') {
        if (!otpPath) return NextResponse.json({ ok: true });
        const otpRef = db.ref(otpPath);
        const otpSnap = await otpRef.once('value');
        const otpData = otpSnap.val() as AdminOtpSession | null;
        const sessionState = getPendingOtpSessionState(otpData, requestId);

        if (sessionState === 'active') {
          const sessionPurpose = otpData?.purpose ?? purpose;
          const purposeLabel = sessionPurpose === 'pin' ? 'PIN' : 'password';
          const purposeText = getAdminOtpLabel(sessionPurpose);
          const salt = process.env.PASSWORD_SALT;
          if (!salt) {
            await answerCallbackQuery(callbackId, botToken, {
              text: 'Error konfigurasi server',
              showAlert: true,
            });
            return NextResponse.json({ ok: true });
          }

          // Generate OTP — pakai crypto.randomInt() (cryptographically secure).
          // Math.random() BUKAN CSPRNG; di teori bisa diprediksi untuk targeting
          // targeted admin. 6-digit OTP harus uniform distribution [100000, 1000000).
          const otpCode = randomInt(100000, 1000000).toString();
          const codeHash = hashPasswordScrypt(otpCode, salt);

          // Update status ke approved beserta Hash OTP-nya
          await otpRef.set({
            status: 'approved',
            purpose: sessionPurpose,
            requestId,
            codeHash: codeHash,
            expiresAt: Date.now() + 5 * 60 * 1000,
          });

          await editMessageText(
            incomingChatId,
            messageId,
            `✅ **Persetujuan Diterima**\n\nGunakan kode OTP berikut:\n\`${otpCode}\`\n\n(Berlaku 5 menit)`,
            botToken
          );
          await editMessageText(
            incomingChatId,
            messageId,
            `**OTP UBAH ${purposeText} DISETUJUI**\n\nGunakan kode OTP ${purposeText} berikut:\n\`${otpCode}\`\n\n(Berlaku 5 menit)`,
            botToken
          );
          await answerCallbackQuery(callbackId, botToken, {
            text: `OTP ${purposeText} disetujui`,
          });
          await logActivity(`Admin ${purposeLabel} OTP approved from Telegram`, {
            category: 'admin',
            purpose: sessionPurpose,
            requestId,
            telegramChatId: incomingChatId,
          });
        } else {
          await respondToInactiveOtpSession(
            sessionState,
            incomingChatId,
            messageId,
            callbackId,
            botToken,
            otpRef
          );
        }
        return NextResponse.json({ ok: true });
      }

      // Default jika callback tidak dikenali
      await answerCallbackQuery(callbackId, botToken, { text: 'Aksi tidak dikenal' });
      return NextResponse.json({ ok: true });
    }

    // --- MESSAGE HANDLING ---

    if (webhookBody.message && typeof webhookBody.message.text === 'string') {
      const msg = webhookBody.message as Record<string, unknown>;
      const incomingChatId = String((msg.chat as Record<string, unknown>)?.id ?? '');
      const text = String(msg.text ?? '').trim();
      const threadId =
        typeof msg.message_thread_id === 'number' ? msg.message_thread_id : undefined;

      const replyTo = msg.reply_to_message as Record<string, unknown> | undefined;
      const chatType = String((msg.chat as Record<string, unknown>)?.type ?? '');

      // Rate limiting check (now async - CLOUDFLARE_D1-backed)
      const rateLimit = await checkRateLimit(incomingChatId);
      if (!rateLimit.allowed) {
        console.warn(`[Telegram Webhook] Rate limit exceeded for chat ${incomingChatId}`);
        await sendImmediate(
          incomingChatId,
          '⏳ *Rate Limit*\n\nTerlalu banyak pesan. Mohon tunggu 1 menit.',
          botToken,
          threadId
        );
        return NextResponse.json({ ok: true });
      }

      // Check if admin
      const isAdmin = checkIsAdmin(incomingChatId, adminChatId, groupId);

      logWebhookDebug({
        incomingChatId,
        adminChatId,
        groupId,
        isAdmin,
        threadId,
        hasReplyTo: !!(msg.reply_to_message as Record<string, unknown>)?.message_id,
        text: text.substring(0, 30),
      });

      // Find visitor context
      let currentVisitorId: string | null = null;

      if (threadId) {
        currentVisitorId = await chatStore.getVisitorByThreadId(threadId);
      } else if (replyTo?.message_id) {
        const replyMsgId = Number(replyTo.message_id);
        currentVisitorId = await chatStore.getVisitorByMessageId(replyMsgId);
      }

      // Process messages to send
      const messagesToSend = await processMessage({
        text,
        isAdmin,
        currentVisitorId,
        threadId,
        chatType,
      });

      // Send all messages
      for (const msgToSend of messagesToSend) {
        await sendMessage(incomingChatId, msgToSend.text, botToken, {
          threadId,
          replyMarkup: msgToSend.reply_markup,
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Telegram Webhook] Critical error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

interface ProcessMessageParams {
  text: string;
  isAdmin: boolean;
  currentVisitorId: string | null;
  threadId?: number;
  chatType?: string;
}

async function processMessage({
  text,
  isAdmin,
  currentVisitorId,
  threadId,
  chatType,
}: ProcessMessageParams): Promise<MessageToSend[]> {
  const jobBotThreadIdRaw = cleanEnvVar('JOB_BOT_THREAD_ID');
  const jobBotThreadId = jobBotThreadIdRaw ? Number.parseInt(jobBotThreadIdRaw, 10) : NaN;
  const isJobBotThread = Number.isFinite(jobBotThreadId) && threadId === jobBotThreadId;

  // Main/CS bot owns visitor chat, security callbacks, and `/ai` only.
  // Job hunter commands live exclusively in the job bot topic.
  if (isJobBotThread) {
    return [];
  }

  if (isAdmin) {
    if (text.startsWith('/')) {
      const command = commandOf(text);

      switch (command) {
        case '/ai':
          return await handleAiCommand(
            currentVisitorId,
            chatStore as unknown as import('@/lib/telegram/types').ChatStoreInterface
          );

        default:
          return [];
      }
    } else if (currentVisitorId) {
      return await handleAdminReply(
        text,
        currentVisitorId,
        chatStore as unknown as import('@/lib/telegram/types').ChatStoreInterface
      );
    }

    return [];
  }

  if (chatType && chatType !== 'private') {
    return [];
  }

  console.log('[Webhook Debug] Guest message received (not admin)');
  return handleGuestMessage();
}
