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

        if (body.message && body.message.text) {
            const incomingChatId = body.message.chat.id.toString();
            const text = body.message.text.trim();
            const isAdmin = incomingChatId === adminChatId;

            // Store messages to be sent (allows sending multiple bubbles)
            const messagesToSend: { text: string; reply_markup?: any }[] = [];

            // --- ADMIN LOGIC ---
            if (isAdmin && text.startsWith('/')) {
                const command = text.split(' ')[0];

                if (command === '/leads') {
                    // Read leads.json
                    let leadsPath = '';
                    try {
                        leadsPath = path.join(process.cwd(), 'src/data/leads.json');
                        const fileContent = await fs.readFile(leadsPath, 'utf-8');
                        let leads = JSON.parse(fileContent);

                        // Fix: leads.json structure is { leads: [...] }, not just [...]
                        if (!Array.isArray(leads) && leads.leads) {
                            leads = leads.leads;
                        }

                        // Get last 5 leads
                        const lastLeads = Array.isArray(leads) ? leads.slice(-5).reverse() : [];

                        if (lastLeads.length === 0) {
                            messagesToSend.push({ text: "📭 *Belum ada pesan masuk.*" });
                        } else {
                            messagesToSend.push({ text: "📬 *5 Pesan Terakhir:*" });

                            lastLeads.forEach((l: any, i: number) => {
                                // Format Phone & WA Link
                                let phone = l.contact || '-';
                                let waUrl = null;

                                if (phone !== '-') {
                                    let cleanPhone = phone.replace(/\D/g, '');
                                    if (cleanPhone.startsWith('0')) {
                                        cleanPhone = '62' + cleanPhone.slice(1);
                                    }
                                    waUrl = `https://wa.me/${cleanPhone}`;
                                }

                                // Cleaner message format for the card
                                const msgText = `*${i + 1}. ${l.name}*\n` +
                                    `📧 ${l.email}\n` +
                                    `📱 ${phone}\n` +
                                    `💬 _"${l.message.trim().substring(0, 100)}${l.message.length > 100 ? '...' : ''}"_`;

                                const msgPayload: any = { text: msgText };

                                // Add Inline Button if WA is valid
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
                else if (command === '/status') {
                    const uptime = process.uptime();
                    const hours = Math.floor(uptime / 3600);
                    const minutes = Math.floor((uptime % 3600) / 60);

                    messagesToSend.push({
                        text: `✅ *Server Online*\n` +
                            `🕒 *Time:* ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}\n` +
                            `⏱ *Uptime:* ${hours}j ${minutes}m`
                    });
                }
                else if (command === '/prop') {
                    const jobContent = text.replace('/prop', '').trim();
                    if (!jobContent) {
                        await sendImmediate(incomingChatId, "❌ *Harap sertakan deskripsi atau link lowongan.*\nContoh: `/prop butuh editor video tiktok`", botToken);
                    } else {
                        await sendImmediate(incomingChatId, "🤖 *Sedang meracik proposal maut... (Sabar ya Bos, mikir dulu)*", botToken);

                        try {
                            const { aiProposalService } = await import('@/lib/services/aiProposalService');
                            const proposal = await aiProposalService.generateProposalForJob(jobContent);
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
                            const { pdfBuffer, hrMessage, analysis } = await atsService.tailorResume(jobContent);

                            // Send Analysis first
                            await sendImmediate(incomingChatId, "🔍 *AI Strategy Analysis:*\n\n" + analysis, botToken);

                            // Send the PDF
                            const { sendTelegramDocument } = await import('@/lib/telegram');
                            await sendTelegramDocument(`Resume_Ramos_ATS.pdf`, pdfBuffer, "📄 *Resume ATS-Friendly* sudah siap!");

                            // Send the HR message
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
                            `/status - Cek status server`
                    });
                }
                else {
                    messagesToSend.push({ text: `❓ Command tidak dikenal. Coba /help` });
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
                await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: incomingChatId,
                        text: msg.text,
                        parse_mode: 'Markdown',
                        reply_markup: msg.reply_markup
                    })
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
