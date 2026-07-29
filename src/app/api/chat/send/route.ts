import { NextResponse } from 'next/server';
import { validateConfig } from '@/lib/telegram';
import { chatStore } from '@/lib/chatStore';
import { aiChatService } from '@/lib/services/aiChatService';
import { checkDataRateLimit } from '@/lib/dataRateLimit';
import { getClientIdentifier } from '@/lib/security/request';

export const dynamic = 'force-dynamic';

// Rate limit: max 10 pesan per 60 detik per visitorId
const CHAT_MAX_MESSAGES = 10;
const CHAT_WINDOW_MS = 60 * 1000; // 1 menit
const CHAT_BLOCK_MS = 5 * 60 * 1000; // 5 menit block

/**
 * Escape characters that Telegram Markdown (v1) treats as special.
 * Prevents user-supplied `message` / `pageUrl` from breaking formatting
 * or injecting unintended Markdown directives.
 */
function escapeTelegramMarkdown(text: string): string {
  return text.replace(/([_*\[\]`])/g, '\\$1');
}

/**
 * Escape HTML special characters to prevent injection in Telegram HTML parse mode.
 */
function escapeTelegramHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

interface TelegramPayload {
  chat_id: string;
  text: string;
  parse_mode: string;
  message_thread_id?: number;
}

interface ChatRequestBody {
  message: string;
  visitorId: string;
  pageUrl?: string;
}

export async function POST(request: Request) {
  try {
    const validation = validateConfig();
    const hasTelegram = validation.valid && !!validation.config.botToken && !!validation.config.chatId;
    const botToken = hasTelegram ? validation.config.botToken : '';
    const adminChatId = hasTelegram ? validation.config.chatId : '';
    const envGroupId = hasTelegram ? validation.config.groupId : undefined;

    if (!hasTelegram) {
      console.warn(
        `[Chat Send] Telegram not configured (${validation.valid ? 'missing credentials' : validation.error}). Operating in local/standalone AI mode.`
      );
    }

    const body = (await request.json()) as ChatRequestBody;
    const { message, visitorId, pageUrl } = body;

    if (!message || !visitorId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Rate limiting keyed on client IP+UA (not user-controlled visitorId)
    // to prevent a single attacker from bypassing limits by rotating IDs.
    const clientId = getClientIdentifier(request);
    const rateCheck = await checkDataRateLimit(
      `chat_${clientId}`,
      CHAT_MAX_MESSAGES,
      CHAT_WINDOW_MS,
      CHAT_BLOCK_MS
    );
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Too many messages. Please wait before sending again.',
          retryAfter: rateCheck.retryAfter,
        },
        { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfter) } }
      );
    }

    // 1. Add message to CLOUDFLARE_D1 store
    const chatMsg = await chatStore.addVisitorMessage(visitorId, message);

    // 1b. Check Session and Topic Status
    let session = await chatStore.getSession(visitorId);
    if (!session) {
      session = await chatStore.createOrUpdateSession(visitorId);
    }

    const isAiMode = session.aiMode !== false; // Defaults to true

    // 2. Format message for Admin
    const urgentKeywords = [
      'asap',
      'urgent',
      'cepat',
      'cepetan',
      'darurat',
      'besok',
      'penting',
      'buru-buru',
    ];
    const isUrgent = urgentKeywords.some((keyword) => message.toLowerCase().includes(keyword));

    let text = ``;
    if (isUrgent) {
      text += `🚨 *[KLIEN URGENT!]* 🚨\n_Pesan mengandung kata darurat/mendesak!_\n\n`;
    }

    text += `🌐 *New Web Chat Message*\n_ID: ${visitorId.substring(0, 6)}_\n\n💬 "${escapeTelegramMarkdown(message)}"`;

    if (pageUrl) {
      text += `\n\n📄 Page: ${escapeTelegramMarkdown(pageUrl)}`;
    }
    if (isAiMode) {
      text += `\n\n🤖 _AI is calculating a response..._\n_(Reply to take over manually)_`;
    } else {
      text += `\n\n_Reply to this message to chat back!_`;
    }

    // 3. Telegram Routing (Topics vs DM)
    // 3. Telegram Routing (Topics vs DM)
    if (hasTelegram && botToken) {
      const groupId = envGroupId || process.env.TELEGRAM_GROUP_ID;
      let targetChatId = groupId || adminChatId;
      let threadId: number | undefined = session.telegramThreadId
        ? Number(session.telegramThreadId)
        : undefined;

      if (groupId) {
        if (!threadId) {
          try {
            const topicRes = await fetch(`https://api.telegram.org/bot${botToken}/createForumTopic`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: groupId,
                name: `💬 Guest ${visitorId.substring(0, 4)}`,
              }),
            });
            const topicData = await topicRes.json();

            if (topicData.ok && topicData.result?.message_thread_id) {
              threadId = Number(topicData.result.message_thread_id);
              await chatStore.updateSessionThreadId(visitorId, threadId);
            } else {
              console.error('[Chat Send] Failed to create Telegram Topic:', topicData);
              targetChatId = adminChatId;
            }
          } catch (topicErr) {
            console.error('[Chat Send] Network Error creating Telegram Topic:', topicErr);
            targetChatId = adminChatId;
          }
        }
      }

      // Send to Telegram
      const tgPayload: TelegramPayload = {
        chat_id: targetChatId,
        text: text,
        parse_mode: 'Markdown',
      };
      if (threadId) {
        tgPayload.message_thread_id = threadId;
      }

      const tgResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tgPayload),
      });

      const tgData = await tgResponse.json();

      if (tgData.ok && tgData.result?.message_id) {
        await chatStore.mapTelegramMessage(visitorId, tgData.result.message_id);
      } else {
        console.error('[Chat Send] Failed to send message to Telegram:', tgData);
      }
    }

    // 4. Trigger AI if in AI mode
    if (isAiMode) {
      try {
        // Trigger typing indicator on the web
        await chatStore.setTypingStatus(visitorId, 10000);

        let aiResponseText = '';
        let hasApiError = false;
        let apiErrorMessage = '';

        if (isUrgent) {
          // Bypass AI Generation completely when urgent
          aiResponseText =
            '🚨 *PRIORITAS TINGGI*: Saya mendeteksi pesan Anda sangat penting. Pesan ini sudah dibunyikan sebagai Alarm Darurat langsung di HP pribadi Ramos. Mohon tunggu sebentar ya, beliau akan segera membalas ini secara manual!';
        } else {
          // Generate normal reply
          const sessionWithMessages = await chatStore.getAllMessages(visitorId);
          const aiResponse = await aiChatService.generateResponse(sessionWithMessages);
          aiResponseText = aiResponse.text;
          hasApiError = !!aiResponse.error;
          apiErrorMessage = aiResponse.error || '';
        }

        // Add to CLOUDFLARE_D1 store
        const aiReplyMsg = await chatStore.addAiReply(visitorId, aiResponseText);

        // Notify admin of AI reply inside the same topic (if Telegram enabled)
        if (aiReplyMsg && hasTelegram && botToken) {
          const groupId = envGroupId || process.env.TELEGRAM_GROUP_ID;
          const targetChatId = groupId || adminChatId;
          const threadId: number | undefined = session.telegramThreadId
            ? Number(session.telegramThreadId)
            : undefined;

          let adminAlertText = `🤖 *AI Auto-Reply:*\n"${escapeTelegramMarkdown(aiResponseText)}"`;

          if (isUrgent) {
            adminAlertText = `⚠️ <b>[URGENT BYPASS]</b> ⚠️\n\nSistem AI di-Bypass karena pesan mendesak. Sistem mengirim balasan pegangan darurat:\n"<i>${escapeTelegramHtml(aiResponseText)}</i>"\n\n<b>SEGERA BALAS SECARA MANUAL!</b>`;
          } else if (hasApiError) {
            adminAlertText = `⚠️ <b>[ALERT] API AI ERROR / LIMIT EXCEEDED!</b> ⚠️\n\n<i>Error detail: ${escapeTelegramHtml(apiErrorMessage)}</i>\n\nSistem mengirim pesan auto-reply darurat ke pengunjung:\n"<i>${escapeTelegramHtml(aiResponseText)}</i>"\n\n<b>SEGERA BALAS SECARA MANUAL!</b>`;
          }

          const aiPayload: TelegramPayload = {
            chat_id: targetChatId,
            text: adminAlertText,
            parse_mode: hasApiError || isUrgent ? 'HTML' : 'Markdown',
          };
          if (threadId) {
            aiPayload.message_thread_id = threadId;
          }
          const aiTgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(aiPayload),
          });
          const aiTgData = await aiTgRes.json();
          if (aiTgData.ok && aiTgData.result?.message_id) {
            await chatStore.mapTelegramMessage(visitorId, aiTgData.result.message_id);
          } else {
            console.error('[Chat Send] Failed to send AI reply to Telegram:', aiTgData);
          }
        }
      } catch (aiErr) {
        console.error('[Web Chat AI Error]:', aiErr);
      }
    }

    return NextResponse.json({ success: true, message: chatMsg });
  } catch (error: unknown) {
    console.error('[Web Chat Send Error]:', error);
    // Log full error server-side only - do not expose to client
    return NextResponse.json(
      {
        error: 'Failed to send message',
      },
      { status: 500 }
    );
  }
}
