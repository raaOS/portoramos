import { NextResponse } from 'next/server';
import { validateConfig } from '@/lib/telegram';
import { chatStore } from '@/lib/chatStore';
import { aiChatService } from '@/lib/services/aiChatService';
import { checkFirebaseRateLimit } from '@/lib/firebaseRateLimit';

export const dynamic = 'force-dynamic';

// Rate limit: max 10 pesan per 60 detik per visitorId
const CHAT_MAX_MESSAGES = 10;
const CHAT_WINDOW_MS = 60 * 1000;      // 1 menit
const CHAT_BLOCK_MS = 5 * 60 * 1000;   // 5 menit block

export async function POST(request: Request) {
    try {
        // Use validateConfig to get actual bot token (not masked)
        const validation = validateConfig();
        if (!validation.valid) {
            return NextResponse.json({ error: 'Telegram not configured: ' + validation.error }, { status: 500 });
        }
        const { botToken, chatId: adminChatId, groupId: envGroupId } = validation.config;
        
        if (!botToken || !adminChatId) {
            return NextResponse.json({ error: 'Telegram not configured' }, { status: 500 });
        }

        const body = await request.json();
        const { message, visitorId, pageUrl } = body as { message: string; visitorId: string; pageUrl?: string };

        if (!message || !visitorId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Rate limiting per visitorId untuk mencegah spam ke Telegram
        const rateCheck = await checkFirebaseRateLimit(
            `chat_${visitorId}`,
            CHAT_MAX_MESSAGES,
            CHAT_WINDOW_MS,
            CHAT_BLOCK_MS
        );
        if (!rateCheck.allowed) {
            return NextResponse.json(
                { error: 'Too many messages. Please wait before sending again.', retryAfter: rateCheck.retryAfter },
                { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfter) } }
            );
        }

        // 1. Add message to Firebase store
        const chatMsg = await chatStore.addVisitorMessage(visitorId, message);

        // 1b. Check Session and Topic Status
        let session = await chatStore.getSession(visitorId);
        if (!session) {
            session = await chatStore.createOrUpdateSession(visitorId);
        }

        const isAiMode = session.aiMode !== false; // Defaults to true

        // 2. Format message for Admin
        let text = `🌐 *New Web Chat Message*\n_ID: ${visitorId.substring(0, 6)}_\n\n💬 "${message}"`;
        if (isAiMode) {
            text += `\n\n🤖 _AI is calculating a response..._\n_(Reply to take over manually)_`;
        } else {
            text += `\n\n_Reply to this message to chat back!_`;
        }

        // 3. Telegram Routing (Topics vs DM)
        const groupId = envGroupId || process.env.TELEGRAM_GROUP_ID;
        let targetChatId = groupId || adminChatId;
        // Ensure threadId is treated as number from Firebase
        let threadId: number | undefined = session.telegramThreadId ? Number(session.telegramThreadId) : undefined;



        if (groupId) {
            // Need to ensure visitor has a Topic created in the forum
            if (!threadId) {
                try {
                    const topicRes = await fetch(`https://api.telegram.org/bot${botToken}/createForumTopic`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            chat_id: groupId,
                            name: `💬 Guest ${visitorId.substring(0, 4)}`
                        })
                    });
                    const topicData = await topicRes.json();
                    
                    if (topicData.ok && topicData.result?.message_thread_id) {
                        threadId = Number(topicData.result.message_thread_id);
                        await chatStore.updateSessionThreadId(visitorId, threadId);
                    } else {
                        console.error('[Chat Send] Failed to create Telegram Topic:', topicData);
                        // Fallback to sending to admin DM instead of group topic
                        targetChatId = adminChatId;
                    }
                } catch (topicErr) {
                    console.error('[Chat Send] Network Error creating Telegram Topic:', topicErr);
                    targetChatId = adminChatId;
                }
            }
        }

        // Send to Telegram
        const tgPayload: any = {
            chat_id: targetChatId,
            text: text,
            parse_mode: 'Markdown'
        };
        if (threadId) {
            tgPayload.message_thread_id = threadId;
        }

        const tgResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tgPayload)
        });

        const tgData = await tgResponse.json();

        // 3b. Map the Telegram message ID to the visitor ID for future manual replies
        if (tgData.ok && tgData.result?.message_id) {
            await chatStore.mapTelegramMessage(visitorId, tgData.result.message_id);
        } else {
            console.error('[Chat Send] Failed to send message to Telegram:', tgData);
        }

        // 4. Trigger AI if in AI mode
        if (isAiMode) {
            // Await AI response in the background for UX speed, or await it if UX needs instant reflection
            // It's usually better to let NextJS finish the request and do background task, but Vercel might kill it.
            // For safety, we block here, or Nextjs edge allows background if we set config.
            try {
                // Generate reply
                const sessionWithMessages = await chatStore.getAllMessages(visitorId);
                const aiResponseText = await aiChatService.generateResponse(sessionWithMessages);

                // Add to Firebase store
                const aiReplyMsg = await chatStore.addAiReply(visitorId, aiResponseText);

                // Notify admin of AI reply inside the same topic
                if (aiReplyMsg) {
                    const aiPayload: any = {
                        chat_id: targetChatId,
                        text: `🤖 *AI Auto-Reply:*\n"${aiResponseText}"`,
                        parse_mode: 'Markdown'
                    };
                    if (threadId) {
                        aiPayload.message_thread_id = threadId;
                    }
                    const aiTgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(aiPayload)
                    });
                    const aiTgData = await aiTgRes.json();
                    if (aiTgData.ok && aiTgData.result?.message_id) {
                        await chatStore.mapTelegramMessage(visitorId, aiTgData.result.message_id);
                    } else {
                        console.error('[Chat Send] Failed to send AI reply to Telegram:', aiTgData);
                    }
                }
            } catch (aiErr) {
                console.error("[Web Chat AI Error]:", aiErr);
            }
        }

        return NextResponse.json({ success: true, message: chatMsg });

    } catch (error: any) {
        console.error('[Web Chat Send Error]:', error);
        return NextResponse.json({
            error: 'Failed to send message',
            details: error.message || String(error)
        }, { status: 500 });
    }
}
