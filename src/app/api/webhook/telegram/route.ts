import { NextResponse } from 'next/server';
import { getTelegramConfigSafe } from '@/lib/telegram';
import fs from 'fs/promises';
import path from 'path';

/**
 * SECURITY HARDENED Telegram Webhook
 * 
 * Features:
 * - Rate limiting per chat (anti-spam)
 * - Sanitized error messages (no sensitive data leaked)
 * - Input validation
 * - Proper error handling
 */

// Simple in-memory rate limiter (anti-spam)
// Production: consider using Redis for distributed rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 20; // Max 20 messages per minute per chat

function checkRateLimit(chatId: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const record = rateLimitMap.get(chatId);
    
    if (!record || now > record.resetTime) {
        // Reset window
        rateLimitMap.set(chatId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
    }
    
    if (record.count >= RATE_LIMIT_MAX) {
        return { allowed: false, remaining: 0 };
    }
    
    record.count++;
    return { allowed: true, remaining: RATE_LIMIT_MAX - record.count };
}

// Sanitize error for user display (never expose internal details)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function sanitizeError(error: unknown): string {
    if (error instanceof Error) {
        // Only return safe, generic messages
        if (error.message.includes('ENOENT')) return 'File not found';
        if (error.message.includes('EACCES')) return 'Permission denied';
        if (error.message.includes('JSON')) return 'Invalid data format';
        return 'Internal error occurred';
    }
    return 'Unknown error';
}

// Validate incoming webhook data
interface WebhookBody {
    message?: {
        text?: string;
        chat?: unknown;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

function validateWebhookData(body: unknown): { valid: boolean; error?: string } {
    if (!body || typeof body !== 'object') {
        return { valid: false, error: 'Invalid payload' };
    }
    
    const webhookBody = body as WebhookBody;
    
    if (webhookBody.message && typeof webhookBody.message !== 'object') {
        return { valid: false, error: 'Invalid message format' };
    }
    
    if (webhookBody.message?.text && typeof webhookBody.message.text !== 'string') {
        return { valid: false, error: 'Invalid text format' };
    }
    
    return { valid: true };
}

export async function POST(request: Request) {
    try {
        // Check bot configuration
        const configCheck = await getTelegramConfigSafe();
        if (!configCheck.configured) {
            console.error('[Telegram Webhook] Bot not configured:', configCheck.error);
            return NextResponse.json(
                { error: 'Service unavailable' }, 
                { status: 503 }
            );
        }

        // Get bot token (internal use only)
        const fullConfig = await import('@/lib/telegram').then(m => {
            // Access internal config through validation
            const validation = m.validateConfig();
            return validation.valid ? validation.config : null;
        });
        
        if (!fullConfig) {
            return NextResponse.json(
                { error: 'Configuration error' }, 
                { status: 500 }
            );
        }
        
        const { botToken, chatId: adminChatId, groupId } = fullConfig;

        // Parse and validate body
        let body;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { error: 'Invalid JSON' }, 
                { status: 400 }
            );
        }

        const validation = validateWebhookData(body);
        if (!validation.valid) {
            return NextResponse.json(
                { error: validation.error }, 
                { status: 400 }
            );
        }

        if (body.message && body.message.text) {
            const incomingChatId = body.message.chat.id.toString();
            const text = body.message.text.trim();
            const threadId = body.message.message_thread_id;

            // Rate limiting check
            const rateLimit = checkRateLimit(incomingChatId);
            if (!rateLimit.allowed) {
                console.warn(`[Telegram Webhook] Rate limit exceeded for chat ${incomingChatId}`);
                await sendImmediate(
                    incomingChatId, 
                    '⏳ *Rate Limit*\n\nTerlalu banyak pesan. Mohon tunggu 1 menit.', 
                    botToken,
                    threadId
                );
                return NextResponse.json({ ok: true }); // Return 200 to prevent retries
            }

            // Check if admin - normalize for comparison
            const normalizedIncoming = incomingChatId.replace(/^-100/, '');  // Remove -100 prefix if present
            const normalizedAdmin = adminChatId.replace(/^-100/, '');
            const normalizedGroup = groupId ? groupId.replace(/^-100/, '') : null;
            
            const isAdmin = incomingChatId === adminChatId || 
                           incomingChatId === normalizedAdmin ||
                           normalizedIncoming === adminChatId ||
                           normalizedIncoming === normalizedAdmin ||
                           (groupId && (
                               incomingChatId === groupId || 
                               incomingChatId === normalizedGroup ||
                               normalizedIncoming === groupId ||
                               normalizedIncoming === normalizedGroup
                           ));
            
            console.log('[Webhook Debug]', {
                incomingChatId,
                adminChatId,
                groupId,
                normalizedIncoming,
                normalizedAdmin,
                normalizedGroup,
                isAdmin,
                threadId,
                hasReplyTo: !!body.message.reply_to_message,
                text: text.substring(0, 30)
            });

            // Import chat store
            const { chatStore } = await import('@/lib/chatStore');

            // Find visitor context
            let currentVisitorId: string | null = null;
            
            if (threadId) {
                console.log('[Webhook Debug] Looking up threadId:', Number(threadId));
                currentVisitorId = await chatStore.getVisitorByThreadId(Number(threadId));
                console.log('[Webhook Debug] Visitor found by thread:', currentVisitorId);
            } else if (body.message.reply_to_message?.message_id) {
                const replyMsgId = Number(body.message.reply_to_message.message_id);
                console.log('[Webhook Debug] Looking up replyTo messageId:', replyMsgId);
                currentVisitorId = await chatStore.getVisitorByMessageId(replyMsgId);
                console.log('[Webhook Debug] Visitor found by message:', currentVisitorId);
            } else {
                console.log('[Webhook Debug] No threadId or reply_to_message');
            }

            interface ReplyMarkup {
                inline_keyboard: { text: string; url?: string }[][];
            }
            
            const messagesToSend: { text: string; reply_markup?: ReplyMarkup; message_thread_id?: number }[] = [];

            // --- ADMIN COMMANDS ---
            if (isAdmin) {
                if (text.startsWith('/')) {
                    const command = text.split(' ')[0];

                    if (command === '/leads') {
                        try {
                            const leadsPath = path.join(process.cwd(), 'src/data/leads.json');
                            const fileContent = await fs.readFile(leadsPath, 'utf-8');
                            let leads = JSON.parse(fileContent);

                            if (!Array.isArray(leads) && leads.leads) {
                                leads = leads.leads;
                            }

                            const lastLeads = Array.isArray(leads) ? leads.slice(-5).reverse() : [];

                            if (lastLeads.length === 0) {
                                messagesToSend.push({ text: '📭 *Belum ada pesan masuk.*' });
                            } else {
                                messagesToSend.push({ text: '📬 *5 Pesan Terakhir:*' });

                                for (let i = 0; i < lastLeads.length; i++) {
                                    const l = lastLeads[i];
                                    let phone = l.contact || '-';
                                    let waUrl = null;

                                    if (phone !== '-') {
                                        let cleanPhone = phone.replace(/\D/g, '');
                                        if (cleanPhone.startsWith('0')) {
                                            cleanPhone = '62' + cleanPhone.slice(1);
                                        }
                                        waUrl = `https://wa.me/${cleanPhone}`;
                                    }

                                    const msgText = `*${i + 1}. ${l.name}*\n` +
                                        `📧 ${l.email}\n` +
                                        `📱 ${phone}\n` +
                                        `💬 _"${l.message.trim().substring(0, 100)}${l.message.length > 100 ? '...' : ''}"_`;

                                    const msgPayload: { text: string; reply_markup?: ReplyMarkup } = { text: msgText };

                                    if (waUrl) {
                                        msgPayload.reply_markup = {
                                            inline_keyboard: [[{ text: '💬 Chat WhatsApp', url: waUrl }]]
                                        };
                                    }

                                    messagesToSend.push(msgPayload);
                                }
                            }
                        } catch (error) {
                            console.error('[Telegram] Leads error:', error);
                            messagesToSend.push({ 
                                text: '❌ *Gagal membaca data*\n\nSilakan coba lagi nanti.' 
                            });
                        }
                    }
                    else if (command === '/prop') {
                        const jobContent = text.replace('/prop', '').trim();
                        if (!jobContent) {
                            await sendImmediate(
                                incomingChatId, 
                                '❌ *Harap sertakan deskripsi atau link lowongan.*\nContoh: `/prop butuh editor video tiktok`', 
                                botToken,
                                threadId
                            );
                        } else {
                            await sendImmediate(
                                incomingChatId, 
                                '🤖 *Sedang meracik proposal...*', 
                                botToken,
                                threadId
                            );

                            try {
                                const { aiProposalService } = await import('@/lib/services/aiProposalService');
                                const proposal = await aiProposalService.generateProposalForJob(jobContent);
                                await sendImmediate(incomingChatId, proposal, botToken, threadId);
                            } catch (err) {
                                console.error('[AI Proposal] Error:', err);
                                await sendImmediate(
                                    incomingChatId, 
                                    '❌ *Gagal generate proposal*\n\nSilakan coba lagi nanti.', 
                                    botToken,
                                    threadId
                                );
                            }
                        }
                        return NextResponse.json({ ok: true });
                    }
                    else if (command === '/resume' || command === '/cv') {
                        const jobContent = text.replace(command, '').trim();
                        if (!jobContent) {
                            await sendImmediate(
                                incomingChatId, 
                                '❌ *Harap sertakan deskripsi atau link lowongan.*\nContoh: `/resume loker editor startup`', 
                                botToken,
                                threadId
                            );
                        } else {
                            await sendImmediate(
                                incomingChatId, 
                                '📑 *Menganalisa loker & meracik ATS Resume...*', 
                                botToken,
                                threadId
                            );

                            try {
                                const { atsService } = await import('@/lib/services/atsService');
                                const { pdfBuffer, hrMessage, analysis } = await atsService.tailorResume(jobContent);

                                await sendImmediate(
                                    incomingChatId, 
                                    '🔍 *AI Strategy Analysis:*\n\n' + analysis, 
                                    botToken,
                                    threadId
                                );

                                const { sendTelegramDocument } = await import('@/lib/telegram');
                                const docResult = await sendTelegramDocument(
                                    'Resume_Ramos_ATS.pdf', 
                                    pdfBuffer, 
                                    '📄 *Resume ATS-Friendly* sudah siap!'
                                );

                                if (!docResult.success) {
                                    await sendImmediate(
                                        incomingChatId, 
                                        '❌ *Gagal mengirim PDF*', 
                                        botToken,
                                        threadId
                                    );
                                }

                                await sendImmediate(
                                    incomingChatId, 
                                    '💬 *Pesan Intro buat HRD (Tinggal Copy):*\n\n' + hrMessage, 
                                    botToken,
                                    threadId
                                );
                            } catch (err) {
                                console.error('[ATS] Error:', err);
                                await sendImmediate(
                                    incomingChatId, 
                                    '❌ *Gagal generate resume*\n\nSilakan coba lagi nanti.', 
                                    botToken,
                                    threadId
                                );
                            }
                        }
                        return NextResponse.json({ ok: true });
                    }
                    else if (command === '/help') {
                        messagesToSend.push({
                            text: '🛠 *Admin Commands*\n\n' +
                                '`/resume [detail]` - AI bikin Resume ATS (PDF) + Pesan HRD\n' +
                                '`/prop [detail]` - AI bikin Proposal Lamaran\n' +
                                '`/leads` - Cek 5 pesan terakhir\n' +
                                '`/help` - Tampilkan menu ini\n' +
                                '`/ai` - Aktifkan ulang AI Auto-Responder'
                        });
                    }
                    else if (command === '/ai') {
                        if (currentVisitorId) {
                            const success = await chatStore.setAiMode(currentVisitorId, true);
                            if (success) {
                                messagesToSend.push({ 
                                    text: '🤖 *Mode AI Aktif!*\nSistem akan membalas pesan secara otomatis.' 
                                });

                                // Smart catch-up
                                const allMessages = await chatStore.getAllMessages(currentVisitorId);
                                const lastMessage = allMessages[allMessages.length - 1];

                                if (lastMessage && lastMessage.sender === 'visitor') {
                                    messagesToSend.push({ 
                                        text: '🔍 _Membalas pesan terakhir pengunjung..._' 
                                    });

                                    try {
                                        const { aiChatService } = await import('@/lib/services/aiChatService');
                                        const aiResponse = await aiChatService.generateResponse(allMessages);
                                        await chatStore.addAiReply(currentVisitorId, aiResponse);
                                        messagesToSend.push({ text: `🤖 *AI:* "${aiResponse}"` });
                                    } catch (err) {
                                        console.error('[Smart Catch-up] Error:', err);
                                    }
                                }
                            } else {
                                messagesToSend.push({ 
                                    text: '❌ _Sesi klien tidak ditemukan atau sudah kadaluarsa._' 
                                });
                            }
                        } else {
                            messagesToSend.push({ 
                                text: '❌ _Gunakan perintah ini di dalam Topik pengunjung (Forum), atau Reply pesan pengunjung._' 
                            });
                        }
                    }
                    else {
                        messagesToSend.push({ text: '❓ Command tidak dikenal. Coba /help' });
                    }
                } else if (currentVisitorId && !text.startsWith('/')) {
                    // Admin manual reply
                    console.log('[Webhook Debug] Adding admin reply for visitor:', currentVisitorId);
                    const routed = await chatStore.addAdminReply(currentVisitorId, text);
                    console.log('[Webhook Debug] Admin reply result:', routed);
                    if (routed) {
                        messagesToSend.push({ 
                            text: '✅ _Pesan terkirim ke web._\n👤 Mode AI dimatikan.' 
                        });
                    } else {
                        messagesToSend.push({ 
                            text: '❌ _Gagal menyimpan pesan ke database._' 
                        });
                    }
                } else if (!currentVisitorId && !text.startsWith('/') && isAdmin) {
                    // Admin tried to reply but visitor not found
                    console.log('[Webhook Debug] Visitor not found for admin reply');
                    messagesToSend.push({ 
                        text: '❌ _Tidak dapat menemukan sesi visitor. Pastikan Anda reply di topik yang benar atau tunggu visitor mengirim pesan pertama._' 
                    });
                }
            }
            // --- GUEST LOGIC ---
            else {
                console.log('[Webhook Debug] Guest message received (not admin)');
                messagesToSend.push({
                    text: '👋 *Halo! Terima kasih sudah menghubungi.*\n\n' +
                        'Saya adalah asisten virtual dari **Ramos**.\n' +
                        'Silakan pilih menu di bawah:',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '📂 Lihat Portfolio', url: process.env.NEXT_PUBLIC_SITE_URL || 'https://portofolio-ramos.vercel.app' },
                                { text: '📩 Kontak Saya', url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://portofolio-ramos.vercel.app'}/contact` }
                            ]
                        ]
                    }
                });
            }

            // Send all messages
            for (const msg of messagesToSend) {
                const payload: { 
                    chat_id: string; 
                    text: string; 
                    parse_mode: string; 
                    reply_markup?: ReplyMarkup;
                    message_thread_id?: number;
                } = {
                    chat_id: incomingChatId,
                    text: msg.text,
                    parse_mode: 'Markdown',
                    reply_markup: msg.reply_markup
                };
                if (threadId) {
                    payload.message_thread_id = threadId;
                }

                await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('[Telegram Webhook] Critical error:', error);
        // Return generic error, never expose internal details
        return NextResponse.json(
            { error: 'Internal server error' }, 
            { status: 500 }
        );
    }
}

// Helper to send immediate message
async function sendImmediate(
    chatId: string, 
    text: string, 
    botToken: string,
    threadId?: number
) {
    try {
        const payload: { 
            chat_id: string; 
            text: string; 
            parse_mode: string;
            message_thread_id?: number;
        } = {
            chat_id: chatId,
            text: text,
            parse_mode: 'Markdown'
        };
        if (threadId) {
            payload.message_thread_id = threadId;
        }

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (e) {
        console.error('[sendImmediate] Error:', e);
    }
}
