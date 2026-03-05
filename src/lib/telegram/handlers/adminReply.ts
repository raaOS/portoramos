/**
 * Admin reply handler
 * Handles admin manual replies to visitors
 */

import type { MessageToSend, ChatStoreInterface } from '../types';

export async function handleAdminReply(
    text: string,
    currentVisitorId: string | null,
    chatStore: ChatStoreInterface
): Promise<MessageToSend[]> {
    if (!currentVisitorId) {
        return [{ 
            text: '❌ _Tidak dapat menemukan sesi visitor. Pastikan Anda reply di topik yang benar atau tunggu visitor mengirim pesan pertama._' 
        }];
    }

    console.log('[Webhook Debug] Adding admin reply for visitor:', currentVisitorId);
    const routed = await chatStore.addAdminReply(currentVisitorId, text);
    console.log('[Webhook Debug] Admin reply result:', routed);
    
    if (routed) {
        return [{ 
            text: '✅ _Pesan terkirim ke web._\n👤 Mode AI dimatikan.' 
        }];
    } else {
        return [{ 
            text: '❌ _Gagal menyimpan pesan ke database._' 
        }];
    }
}
