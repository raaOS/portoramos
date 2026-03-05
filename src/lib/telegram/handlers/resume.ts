/**
 * /resume command handler
 * Generates ATS-friendly resume
 */

import type { MessageToSend } from '../types';
import { sendImmediate } from '../sender';

export async function handleResumeCommand(
    text: string,
    chatId: string,
    botToken: string,
    threadId?: number
): Promise<MessageToSend[]> {
    const jobContent = text.replace(/\/(resume|cv)/, '').trim();
    
    if (!jobContent) {
        return [{
            text: '❌ *Harap sertakan deskripsi atau link lowongan.*\nContoh: `/resume loker editor startup`'
        }];
    }

    await sendImmediate(
        chatId, 
        '📑 *Menganalisa loker & meracik ATS Resume...*', 
        botToken,
        threadId
    );

    try {
        const { atsService } = await import('@/lib/services/atsService');
        const { pdfBuffer, hrMessage, analysis } = await atsService.tailorResume(jobContent);

        const messages: MessageToSend[] = [];
        
        messages.push({
            text: '🔍 *AI Strategy Analysis:*\n\n' + analysis
        });

        const { sendTelegramDocument } = await import('@/lib/telegram');
        const docResult = await sendTelegramDocument(
            'Resume_Ramos_ATS.pdf', 
            pdfBuffer, 
            '📄 *Resume ATS-Friendly* sudah siap!'
        );

        if (!docResult.success) {
            messages.push({
                text: '❌ *Gagal mengirim PDF*'
            });
        }

        messages.push({
            text: '💬 *Pesan Intro buat HRD (Tinggal Copy):*\n\n' + hrMessage
        });

        return messages;
    } catch (err) {
        console.error('[ATS] Error:', err);
        return [{
            text: '❌ *Gagal generate resume*\n\nSilakan coba lagi nanti.'
        }];
    }
}
