/**
 * /prop command handler
 * Generates AI proposal for job applications
 */

import type { MessageToSend } from '../types';
import { sendImmediate } from '../sender';

export async function handleProposalCommand(
    text: string,
    chatId: string,
    botToken: string,
    threadId?: number
): Promise<MessageToSend[]> {
    const jobContent = text.replace('/prop', '').trim();
    
    if (!jobContent) {
        return [{
            text: '❌ *Harap sertakan deskripsi atau link lowongan.*\nContoh: `/prop butuh editor video tiktok`'
        }];
    }

    // Send immediate loading message
    await sendImmediate(
        chatId, 
        '🤖 *Sedang meracik proposal...*', 
        botToken,
        threadId
    );

    try {
        const { aiProposalService } = await import('@/lib/services/aiProposalService');
        const proposal = await aiProposalService.generateProposalForJob(jobContent);
        return [{ text: proposal }];
    } catch (err) {
        console.error('[AI Proposal] Error:', err);
        return [{
            text: '❌ *Gagal generate proposal*\n\nSilakan coba lagi nanti.'
        }];
    }
}
