/**
 * /leads command handler
 * Returns last 5 leads from the data backend.
 */

import { db } from '@/lib/database';
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
    const snapshot = await db.ref('leads').limitToLast(5).once('value');
    const leadsRaw = snapshot.val();

    let leads: Lead[] = [];
    if (leadsRaw) {
      leads = Array.isArray(leadsRaw) ? leadsRaw : Object.values(leadsRaw);
    }

    const lastLeads = leads.slice(-5).reverse();

    if (lastLeads.length === 0) {
      messages.push({ text: '📭 *Belum ada pesan masuk.*' });
    } else {
      messages.push({ text: '📬 *5 Pesan Terakhir:*' });

      for (let i = 0; i < lastLeads.length; i++) {
        const lead = lastLeads[i];
        const phone = lead.contact || '-';
        let waUrl: string | null = null;

        if (phone !== '-') {
          let cleanPhone = phone.replace(/\D/g, '');
          if (cleanPhone.startsWith('0')) {
            cleanPhone = '62' + cleanPhone.slice(1);
          }
          waUrl = `https://wa.me/${cleanPhone}`;
        }

        const msgText =
          `*${i + 1}. ${lead.name}*\n` +
          `📧 ${lead.email}\n` +
          `📱 ${phone}\n` +
          `💬 _"${lead.message.trim().substring(0, 100)}${lead.message.length > 100 ? '...' : ''}"_`;

        const msgPayload: MessageToSend = { text: msgText };

        if (waUrl) {
          const markup: ReplyMarkup = {
            inline_keyboard: [[{ text: '💬 Chat WhatsApp', url: waUrl }]],
          };
          msgPayload.reply_markup = markup;
        }

        messages.push(msgPayload);
      }
    }
  } catch (error) {
    console.error('[Telegram] Leads error:', error);
    messages.push({
      text: '❌ *Gagal membaca data*\n\nSilakan coba lagi nanti.',
    });
  }

  return messages;
}
