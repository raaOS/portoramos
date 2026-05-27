import { NextResponse } from 'next/server';
import { getTelegramConfigSafe, isValidTelegramWebhookSecret } from '@/lib/telegram';
import { checkRateLimit } from '@/lib/telegram/rateLimiter';
import { validateWebhookData } from '@/lib/telegram/validators';
import { checkIsAdmin, logWebhookDebug } from '@/lib/telegram/helpers';
import { sendImmediate, sendMessage, answerCallbackQuery, editMessageText } from '@/lib/telegram/sender';
import { db } from '@/lib/database';
import { hashPasswordScrypt } from '@/lib/auth';
import { chatStore } from '@/lib/chatStore';
import { cleanEnvVar } from '@/lib/utils/env';
import { logActivity } from '@/lib/services/auditLogger';
import type { MessageToSend } from '@/lib/telegram/types';
import {
  handleAiCommand,
  handleAdminReply,
  handleGuestMessage,
} from '@/lib/telegram/handlers';

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
  requestId?: string;
  expiresAt?: number;
  codeHash?: string;
}

function parseCallbackData(data: string) {
  const separatorIndex = data.indexOf(':');
  if (separatorIndex < 0) {
    return { action: data, requestId: '' };
  }

  return {
    action: data.slice(0, separatorIndex),
    requestId: data.slice(separatorIndex + 1),
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
  botToken: string
) {
  if (state === 'expired') {
    await db.ref('settings/adminOtp').remove();
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

    const webhookBody = body as { message?: Record<string, unknown>, callback_query?: Record<string, unknown> };

    // --- CALLBACK QUERY HANDLING (Inline Buttons) ---
    if (webhookBody.callback_query) {
      const cbQuery = webhookBody.callback_query as Record<string, unknown>;
      const callbackId = String(cbQuery['id'] || '');
      const data = String(cbQuery['data'] || '');
      const { action, requestId } = parseCallbackData(data);
      const cbMessage = cbQuery['message'] as Record<string, unknown> | undefined;
      const incomingChatId = String(cbMessage?.chat ? (cbMessage.chat as Record<string, unknown>).id : '');
      const messageId = Number(cbMessage?.message_id);
      
      // Verify admin authorization for this action
      const isAdminAction = checkIsAdmin(incomingChatId, adminChatId, groupId);

      if (!isAdminAction) {
        await answerCallbackQuery(callbackId, botToken, { text: 'Unauthorized', showAlert: true });
        return NextResponse.json({ ok: true });
      }

      if (action === 'otp_reject') {
        const otpSnap = await db.ref('settings/adminOtp').once('value');
        const otpData = otpSnap.val() as AdminOtpSession | null;
        const sessionState = getPendingOtpSessionState(otpData, requestId);

        if (sessionState === 'active') {
          // Update status ke rejected agar di-polling oleh UI
          await db.ref('settings/adminOtp').set({
            status: 'rejected',
            requestId,
            expiresAt: Date.now() + 60 * 1000, // biarkan hidup 1 menit agar UI sempat polling
          });

          await editMessageText(incomingChatId, messageId, '🚨 **Akses Digagalkan!**\nUpaya ganti sandi telah diblokir. UI penyusup akan langsung dikunci.', botToken);
          await answerCallbackQuery(callbackId, botToken, { text: 'Akses diblokir!' });
          await logActivity('Admin password OTP rejected from Telegram', {
            category: 'admin',
            requestId,
            telegramChatId: incomingChatId,
          });
        } else {
          await respondToInactiveOtpSession(
            sessionState,
            incomingChatId,
            messageId,
            callbackId,
            botToken
          );
        }
        return NextResponse.json({ ok: true });
      }

      if (action === 'otp_approve') {
        const otpSnap = await db.ref('settings/adminOtp').once('value');
        const otpData = otpSnap.val() as AdminOtpSession | null;
        const sessionState = getPendingOtpSessionState(otpData, requestId);

        if (sessionState === 'active') {
          const salt = process.env.PASSWORD_SALT;
          if (!salt) {
            await answerCallbackQuery(callbackId, botToken, { text: 'Error konfigurasi server', showAlert: true });
            return NextResponse.json({ ok: true });
          }

          // Generate OTP
          const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
          const codeHash = hashPasswordScrypt(otpCode, salt);

          // Update status ke approved beserta Hash OTP-nya
          await db.ref('settings/adminOtp').set({
            status: 'approved',
            requestId,
            codeHash: codeHash,
            expiresAt: Date.now() + 5 * 60 * 1000,
          });

          await editMessageText(incomingChatId, messageId, `✅ **Persetujuan Diterima**\n\nGunakan kode OTP berikut:\n\`${otpCode}\`\n\n(Berlaku 5 menit)`, botToken);
          await answerCallbackQuery(callbackId, botToken, { text: 'Persetujuan Diterima!' });
          await logActivity('Admin password OTP approved from Telegram', {
            category: 'admin',
            requestId,
            telegramChatId: incomingChatId,
          });
        } else {
          await respondToInactiveOtpSession(
            sessionState,
            incomingChatId,
            messageId,
            callbackId,
            botToken
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
