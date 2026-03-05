/**
 * /ai command handler
 * Activates AI auto-responder mode
 */

import type { MessageToSend, ChatStoreInterface, SimpleMessage } from '../types';

export async function handleAiCommand(
    currentVisitorId: string | null,
    chatStore: ChatStoreInterface
): Promise<MessageToSend[]> {
    const messages: MessageToSend[] = [];
    
    if (!currentVisitorId) {
        messages.push({ 
            text: '❌ _Gunakan perintah ini di dalam Topik pengunjung (Forum), atau Reply pesan pengunjung._' 
        });
        return messages;
    }

    const success = await chatStore.setAiMode(currentVisitorId, true);
    
    if (success) {
        messages.push({ 
            text: '🤖 *Mode AI Aktif!*\nSistem akan membalas pesan secara otomatis.' 
        });

        // Smart catch-up
        const allMessages = await chatStore.getAllMessages(currentVisitorId);
        const lastMessage = allMessages[allMessages.length - 1];

        if (lastMessage && lastMessage.sender === 'visitor') {
            messages.push({ 
                text: '🔍 _Membalas pesan terakhir pengunjung..._' 
            });

            try {
                const { aiChatService } = await import('@/lib/services/aiChatService');
                // Convert to ChatMessage format expected by aiChatService
                const chatMessages = allMessages.map(m => ({
                    sender: m.sender as 'visitor' | 'admin' | 'ai',
                    text: m.content
                }));
                const aiResponse = await aiChatService.generateResponse(chatMessages as import('@/lib/chatStore').ChatMessage[]);
                await chatStore.addAiReply(currentVisitorId, aiResponse);
                messages.push({ text: `🤖 *AI:* "${aiResponse}"` });
            } catch (err) {
                console.error('[Smart Catch-up] Error:', err);
            }
        }
    } else {
        messages.push({ 
            text: '❌ _Sesi klien tidak ditemukan atau sudah kadaluarsa._' 
        });
    }
    
    return messages;
}
