import { NextResponse } from 'next/server';
import { getTelegramConfigSafe, isValidTelegramWebhookSecret } from '@/lib/telegram';
import { checkRateLimit } from '@/lib/telegram/rateLimiter';
import { validateWebhookData } from '@/lib/telegram/validators';
import { checkIsAdmin, logWebhookDebug } from '@/lib/telegram/helpers';
import { sendImmediate, sendMessage } from '@/lib/telegram/sender';
import { chatStore } from '@/lib/chatStore';
import { cleanEnvVar } from '@/lib/utils/env';
import type { MessageToSend } from '@/lib/telegram/types';
import {
  handleLeadsCommand,
  handleProposalCommand,
  handleResumeCommand,
  handleJobsCommand,
  handleApplyCommand,
  handleGlintsCommand,
  handleAiCommand,
  handleAdminReply,
  handleGuestMessage,
  handleHelpCommand,
} from '@/lib/telegram/handlers';
import { APPLY_PROMPT_MARKER } from '@/lib/telegram/handlers/apply';

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

    const webhookBody = body as { message?: Record<string, unknown> };

    if (webhookBody.message && typeof webhookBody.message.text === 'string') {
      const msg = webhookBody.message as Record<string, unknown>;
      const incomingChatId = String((msg.chat as Record<string, unknown>)?.id ?? '');
      const text = String(msg.text ?? '').trim();
      const threadId =
        typeof msg.message_thread_id === 'number' ? msg.message_thread_id : undefined;

      // ForceReply conversational flow: kalau pesan ini reply ke prompt
      // /apply (teks pesan target diawali APPLY_PROMPT_MARKER), treat
      // input user sebagai argumen `/apply` dan dispatch lewat command path
      // normal. Strict mode: hanya pesan yang BENAR-BENAR reply ke prompt
      // tersebut yang ke-route, bukan pesan random.
      const replyTo = msg.reply_to_message as Record<string, unknown> | undefined;
      const repliedFromBot =
        (replyTo?.from as Record<string, unknown> | undefined)?.is_bot === true;
      const repliedText = typeof replyTo?.text === 'string' ? replyTo.text : '';
      const isReplyToApplyPrompt =
        !!replyTo && repliedFromBot && repliedText.startsWith(APPLY_PROMPT_MARKER);

      const effectiveText = isReplyToApplyPrompt ? `/apply ${text}` : text;

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

      // Skip visitor resolution kalau reply ini menuju prompt /apply,
      // supaya tidak salah dikira admin reply ke visitor.
      if (!isReplyToApplyPrompt) {
        if (threadId) {
          currentVisitorId = await chatStore.getVisitorByThreadId(threadId);
        } else if ((msg.reply_to_message as Record<string, unknown>)?.message_id) {
          const replyMsgId = Number((msg.reply_to_message as Record<string, unknown>).message_id);
          currentVisitorId = await chatStore.getVisitorByMessageId(replyMsgId);
        }
      }

      // Process messages to send
      const messagesToSend = await processMessage({
        text: effectiveText,
        isAdmin,
        currentVisitorId,
        chatId: incomingChatId,
        botToken,
        threadId,
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
  chatId: string;
  botToken: string;
  threadId?: number;
}

async function processMessage({
  text,
  isAdmin,
  currentVisitorId,
  chatId,
  botToken,
  threadId,
}: ProcessMessageParams): Promise<MessageToSend[]> {
  const jobBotThreadIdRaw = cleanEnvVar('JOB_BOT_THREAD_ID');
  const jobBotThreadId = jobBotThreadIdRaw ? Number.parseInt(jobBotThreadIdRaw, 10) : NaN;
  const isJobBotThread = Number.isFinite(jobBotThreadId) && threadId === jobBotThreadId;

  if (isJobBotThread || text.startsWith('/job_')) {
    return [];
  }

  // --- ADMIN COMMANDS ---
  if (isAdmin) {
    if (text.startsWith('/')) {
      const command = text.split(' ')[0];

      switch (command) {
        case '/leads':
          return await handleLeadsCommand();

        case '/prop':
          return await handleProposalCommand(text, chatId, botToken, threadId);

        case '/resume':
        case '/cv':
          return await handleResumeCommand(text, chatId, botToken, threadId);

        case '/jobs':
          return await handleJobsCommand(text, chatId, botToken, threadId);

        case '/glints':
          return await handleGlintsCommand(chatId, botToken, threadId);

        case '/apply':
          return await handleApplyCommand(text, chatId, botToken, threadId);

        case '/help':
          return handleHelpCommand();

        case '/ai':
          return await handleAiCommand(
            currentVisitorId,
            chatStore as unknown as import('@/lib/telegram/types').ChatStoreInterface
          );

        default:
          return [{ text: '❓ Command tidak dikenal. Coba /help' }];
      }
    } else if (currentVisitorId) {
      // Admin manual reply
      return await handleAdminReply(
        text,
        currentVisitorId,
        chatStore as unknown as import('@/lib/telegram/types').ChatStoreInterface
      );
    } else if (!currentVisitorId && isAdmin) {
      return [
        {
          text: '❌ _Tidak dapat menemukan sesi visitor. Pastikan Anda reply di topik yang benar atau tunggu visitor mengirim pesan pertama._',
        },
      ];
    }
  }

  // --- GUEST LOGIC ---
  console.log('[Webhook Debug] Guest message received (not admin)');
  return handleGuestMessage();
}
