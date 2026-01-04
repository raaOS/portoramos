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

        // Basic logging
        // console.log('[Telegram Webhook] Received:', JSON.stringify(body, null, 2));

        if (body.message && body.message.text) {
            const incomingChatId = body.message.chat.id.toString();
            const text = body.message.text.trim();
            const isAdmin = incomingChatId === adminChatId;

            let replyPayload: any = {
                chat_id: incomingChatId,
                parse_mode: 'Markdown'
            };

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
                            replyPayload.text = "📭 *Belum ada pesan masuk.*";
                        } else {
                            const formattedLeads = lastLeads.map((l: any, i: number) => {
                                // Format Phone & WA Link
                                let phone = l.contact || '-';
                                let waLink = '';
                                if (phone !== '-') {
                                    // Strip non-digits
                                    let cleanPhone = phone.replace(/\D/g, '');
                                    // Convert 08... to 628...
                                    if (cleanPhone.startsWith('0')) {
                                        cleanPhone = '62' + cleanPhone.slice(1);
                                    }
                                    waLink = `[Chat WA](https://wa.me/${cleanPhone})`;
                                }

                                return `*${i + 1}. ${l.name}*\n` +
                                    `📱 ${phone} ${waLink ? '| ' + waLink : ''}\n` +
                                    `📧 ${l.email}\n` +
                                    `💬 _${l.message.trim().substring(0, 100)}${l.message.length > 100 ? '...' : ''}_`;
                            }).join('\n\n-------------------\n\n');

                            replyPayload.text = `📬 *5 Pesan Terakhir:*\n\n${formattedLeads}`;
                        }
                    } catch (error: any) {
                        console.error('Leads Read Error:', error);
                        replyPayload.text = `❌ Gagal baca database.\nError: ${error.message}\nPath: ${leadsPath}`;
                    }
                }
                else if (command === '/status') {
                    const uptime = process.uptime();
                    const hours = Math.floor(uptime / 3600);
                    const minutes = Math.floor((uptime % 3600) / 60);

                    replyPayload.text = `✅ *Server Online*\n` +
                        `🕒 *Time:* ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}\n` +
                        `⏱ *Uptime:* ${hours}j ${minutes}m`;
                }
                else if (command === '/help') {
                    replyPayload.text = `🛠 *Admin Commands*\n\n` +
                        `/leads - Cek 5 pesan terakhir\n` +
                        `/help - Tampilkan menu ini\n` +
                        `/status - Cek status server`;
                }
                else {
                    replyPayload.text = `❓ Command tidak dikenal. Coba /help`;
                }
            }

            // --- GUEST LOGIC (Default) ---
            else {
                // If it's a guest (or admin typing regular text), give the professional menu
                replyPayload.text = `👋 *Halo! Terima kasih sudah menghubungi.*\n\n` +
                    `Saya adalah asisten virtual dari **Ramos**.\n` +
                    `Saat ini saya hanya bertugas mengirim notifikasi. Silakan pilih menu di bawah:`;

                replyPayload.reply_markup = {
                    inline_keyboard: [
                        [
                            { text: "📂 Lihat Portfolio", url: "https://portofolio-ramos.vercel.app" },
                            { text: "📩 Kontak Saya", url: "https://portofolio-ramos.vercel.app/contact" }
                        ]
                    ]
                };
            }

            // Send Response
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(replyPayload)
            });
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('[Telegram Webhook] Error:', error);
        return NextResponse.json({ ok: false }, { status: 500 });
    }
}
