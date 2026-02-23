import { NextResponse } from 'next/server';
import { getTelegramConfig } from '@/lib/telegram';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
    try {
        const { botToken, chatId: adminChatId } = await getTelegramConfig();
        if (!botToken) {
            return NextResponse.json({ message: 'Bot not configured' }, { status: 500 });
        }

        const body = await request.json();
        console.log('[Telegram Webhook] Incoming:', JSON.stringify(body));

        if (body.message && body.message.text) {
            const incomingChatId = body.message.chat.id.toString();
            const text = body.message.text.trim();
            const threadId = body.message.message_thread_id;

            // Fix: Clean TELEGRAM_GROUP_ID to prevent quote mismatch in Vercel
            let groupId = process.env.TELEGRAM_GROUP_ID;
            if (groupId) {
                groupId = groupId.trim();
                if ((groupId.startsWith('"') && groupId.endsWith('"')) || (groupId.startsWith("'") && groupId.endsWith("'"))) {
                    groupId = groupId.slice(1, -1);
                }
            }

            const isAdmin = incomingChatId === adminChatId || (groupId && incomingChatId === groupId);
            console.log('[Telegram Webhook] Routing:', {
                incomingChatId,
                adminChatId,
                groupId,
                isAdmin,
                threadId,
                replyTo: body.message.reply_to_message?.message_id
            });

            // Find visitorId context if we are in a Topic or Replying to an old DM
            let currentVisitorId: string | null = null;
            const { chatStore } = await import('@/lib/chatStore');

            if (threadId) {
                currentVisitorId = await chatStore.getVisitorByThreadId(threadId);
            } else if (body.message.reply_to_message?.message_id) {
                currentVisitorId = await chatStore.getVisitorByMessageId(body.message.reply_to_message.message_id);
            }

            console.log('[Telegram Webhook] Context:', { currentVisitorId });

            // Store messages to be sent (allows sending multiple bubbles)
            const messagesToSend: { text: string; reply_markup?: any; message_thread_id?: number }[] = [];

            // --- ADMIN LOGIC ---
            if (isAdmin) {
                if (text.startsWith('/')) {
                    const command = text.split(' ')[0];

                    if (command === '/leads') {
                        // Read leads.json
                        let leadsPath = '';
                        try {
                            leadsPath = path.join(process.cwd(), 'src/data/leads.json');
                            const fileContent = await fs.readFile(leadsPath, 'utf-8');
                            let leads = JSON.parse(fileContent);

                            if (!Array.isArray(leads) && leads.leads) {
                                leads = leads.leads;
                            }

                            const lastLeads = Array.isArray(leads) ? leads.slice(-5).reverse() : [];

                            if (lastLeads.length === 0) {
                                messagesToSend.push({ text: "📭 *Belum ada pesan masuk.*" });
                            } else {
                                messagesToSend.push({ text: "📬 *5 Pesan Terakhir:*" });

                                lastLeads.forEach((l: any, i: number) => {
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

                                    const msgPayload: any = { text: msgText };

                                    if (waUrl) {
                                        msgPayload.reply_markup = {
                                            inline_keyboard: [[{ text: "💬 Chat WhatsApp", url: waUrl }]]
                                        };
                                    }

                                    messagesToSend.push(msgPayload);
                                });
                            }
                        } catch (error: any) {
                            console.error('Leads Read Error:', error);
                            messagesToSend.push({ text: `❌ Gagal baca database.\nError: ${error.message}\nPath: ${leadsPath}` });
                        }
                    }
                    else if (command === '/prop') {
                        const jobContent = text.replace('/prop', '').trim();
                        if (!jobContent) {
                            await sendImmediate(incomingChatId, "❌ *Harap sertakan deskripsi atau link lowongan.*\nContoh: `/prop butuh editor video tiktok`", botToken);
                        } else {
                            await sendImmediate(incomingChatId, "🤖 *Sedang meracik proposal maut... (Sabar ya Bos, mikir dulu)*", botToken);

                            try {
                                const { aiProposalService } = await import('@/lib/services/aiProposalService');
                                await sendImmediate(incomingChatId, "🔍 *Menganalisa job description...*", botToken);
                                const proposal = await aiProposalService.generateProposalForJob(jobContent);
                                await sendImmediate(incomingChatId, "✍️ *Menyusun proposal maut...*", botToken);
                                await sendImmediate(incomingChatId, proposal, botToken);
                            } catch (err: any) {
                                await sendImmediate(incomingChatId, `❌ *Gagal generate:* ${err.message}`, botToken);
                            }
                        }
                        return NextResponse.json({ ok: true });
                    }
                    else if (command === '/resume' || command === '/cv') {
                        const jobContent = text.replace(command, '').trim();
                        if (!jobContent) {
                            await sendImmediate(incomingChatId, "❌ *Harap sertakan deskripsi atau link lowongan.*\nContoh: `/resume loker editor startup` ", botToken);
                        } else {
                            await sendImmediate(incomingChatId, "📑 *Menganalisa loker & meracik ATS Resume... (Sedang digodok Bos)*", botToken);

                            try {
                                const { atsService } = await import('@/lib/services/atsService');
                                await sendImmediate(incomingChatId, "🔍 *Menganalisa loker & strategi AI...*", botToken);
                                const { pdfBuffer, hrMessage, analysis } = await atsService.tailorResume(jobContent);

                                await sendImmediate(incomingChatId, "✍️ *Menyusun konten ATS-Friendly...*", botToken);
                                await sendImmediate(incomingChatId, "🔍 *AI Strategy Analysis:*\n\n" + analysis, botToken);

                                await sendImmediate(incomingChatId, "🖨️ *Rendering PDF Resume...*", botToken);

                                const { sendTelegramDocument } = await import('@/lib/telegram');
                                await sendTelegramDocument(`Resume_Ramos_ATS.pdf`, pdfBuffer, "📄 *Resume ATS-Friendly* sudah siap!");

                                await sendImmediate(incomingChatId, "💬 *Pesan Intro buat HRD (Tinggal Copy):*\n\n" + hrMessage, botToken);
                            } catch (err: any) {
                                await sendImmediate(incomingChatId, `❌ *Gagal:* ${err.message}`, botToken);
                            }
                        }
                        return NextResponse.json({ ok: true });
                    }
                    else if (command === '/help') {
                        messagesToSend.push({
                            text: `🛠 *Admin Commands*\n\n` +
                                `/resume [detail] - AI bikin Resume ATS (PDF) + Pesan HRD!\n` +
                                `/prop [detail] - AI bikin Proposal Lamaran maut!\n` +
                                `/leads - Cek 5 pesan terakhir\n` +
                                `/help - Tampilkan menu ini\n` +
                                `/ai - Aktifkan ulang AI Auto-Responder di obrolan ini`
                        });
                    }
                    else if (command === '/ai') {
                        if (currentVisitorId) {
                            const success = await chatStore.setAiMode(currentVisitorId, true);
                            if (success) {
                                messagesToSend.push({ text: `🤖 *Mode AI Aktif!*\nSistem akan kembali membalas pesan dari pengunjung ini secara otomatis.` });

                                // --- SMART CATCH-UP LOGIC ---
                                // Check if the last message was from visitor and needs a reply
                                const allMessages = await chatStore.getAllMessages(currentVisitorId);
                                const lastMessage = allMessages[allMessages.length - 1];

                                if (lastMessage && lastMessage.sender === 'visitor') {
                                    messagesToSend.push({ text: `🔍 _Menarik nafas... membalas pesan terakhir pengunjung._` });

                                    try {
                                        const { aiChatService } = await import('@/lib/services/aiChatService');
                                        const aiResponse = await aiChatService.generateResponse(allMessages);
                                        const aiReplyMsg = await chatStore.addAiReply(currentVisitorId, aiResponse);

                                        if (aiReplyMsg) {
                                            messagesToSend.push({ text: `🤖 *AI:* "${aiResponse}"` });
                                        }
                                    } catch (err) {
                                        console.error('[Smart Catch-up Error]:', err);
                                    }
                                }
                            } else {
                                messagesToSend.push({ text: `❌ _Sesi klien tidak ditemukan atau sudah kadaluarsa._` });
                            }
                        } else {
                            messagesToSend.push({ text: `❌ _Mohon gunakan perintah ini di dalam Topik pengunjung (Forum), atau Reply pesan pengunjung._` });
                        }
                    }
                    else {
                        messagesToSend.push({ text: `❓ Command tidak dikenal. Coba /help` });
                    }
                } else if (currentVisitorId && !text.startsWith('/')) {
                    // Admin manual reply
                    const routed = await chatStore.addAdminReply(currentVisitorId, text);
                    if (routed) {
                        // Only send confirmation if we are in legacy DM mode, to avoid spamming a Forum Topic.
                        if (!threadId) {
                            messagesToSend.push({ text: `✅ _Pesan terkirim ke web._\n👤 Mode AI dimatikan permanen.` });
                        }
                    } else {
                        if (!threadId) {
                            messagesToSend.push({ text: `❌ _Sesi web user tidak ditemukan atau terputus._` });
                        }
                    }
                }
            }
            // --- GUEST LOGIC (Default) ---
            else {
                messagesToSend.push({
                    text: `👋 *Halo! Terima kasih sudah menghubungi.*\n\n` +
                        `Saya adalah asisten virtual dari **Ramos**.\n` +
                        `Saat ini saya hanya bertugas mengirim notifikasi. Silakan pilih menu di bawah:`,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: "📂 Lihat Portfolio", url: "https://portofolio-ramos.vercel.app" },
                                { text: "📩 Kontak Saya", url: "https://portofolio-ramos.vercel.app/contact" }
                            ]
                        ]
                    }
                });
            }

            // Send All Messages Sequentially
            for (const msg of messagesToSend) {
                const payload: any = {
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
        console.error('[Telegram Webhook] Error:', error);
        return NextResponse.json({ ok: false }, { status: 500 });
    }
}
/**
 * Helper to send message immediately without waiting for the batch
 */
async function sendImmediate(chatId: string, text: string, botToken: string) {
    try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'Markdown'
            })
        });
    } catch (e) {
        console.error('Immediate send failed:', e);
    }
}
