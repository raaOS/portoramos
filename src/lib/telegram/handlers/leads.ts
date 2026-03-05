/**
 * /leads command handler
 * Returns last 5 leads from leads.json
 */

import fs from 'fs/promises';
import path from 'path';
import type { MessageToSend, ReplyMarkup } from '../types';

interface Lead {
    name: string;
    email: string;
    contact: string;
    message: string;
}

export async function handleLeadsCommand(): Promise<MessageToSend[]> {
    const messages: MessageToSend[] = [];
    
    try {
        const leadsPath = path.join(process.cwd(), 'src/data/leads.json');
        const fileContent = await fs.readFile(leadsPath, 'utf-8');
        let leadsData: Lead[] | { leads: Lead[] } = JSON.parse(fileContent);

        if (!Array.isArray(leadsData) && 'leads' in leadsData) {
            leadsData = leadsData.leads;
        }

        const leads = Array.isArray(leadsData) ? leadsData : [];
        const lastLeads = leads.slice(-5).reverse();

        if (lastLeads.length === 0) {
            messages.push({ text: '📭 *Belum ada pesan masuk.*' });
        } else {
            messages.push({ text: '📬 *5 Pesan Terakhir:*' });

            for (let i = 0; i < lastLeads.length; i++) {
                const lead = lastLeads[i];
                let phone = lead.contact || '-';
                let waUrl: string | null = null;

                if (phone !== '-') {
                    let cleanPhone = phone.replace(/\D/g, '');
                    if (cleanPhone.startsWith('0')) {
                        cleanPhone = '62' + cleanPhone.slice(1);
                    }
                    waUrl = `https://wa.me/${cleanPhone}`;
                }

                const msgText = `*${i + 1}. ${lead.name}*\n` +
                    `📧 ${lead.email}\n` +
                    `📱 ${phone}\n` +
                    `💬 _"${lead.message.trim().substring(0, 100)}${lead.message.length > 100 ? '...' : ''}"_`;

                const msgPayload: MessageToSend = { text: msgText };

                if (waUrl) {
                    const markup: ReplyMarkup = {
                        inline_keyboard: [[{ text: '💬 Chat WhatsApp', url: waUrl }]]
                    };
                    msgPayload.reply_markup = markup;
                }

                messages.push(msgPayload);
            }
        }
    } catch (error) {
        console.error('[Telegram] Leads error:', error);
        messages.push({ 
            text: '❌ *Gagal membaca data*\n\nSilakan coba lagi nanti.' 
        });
    }
    
    return messages;
}
