import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import useSWR from 'swr';
import { soundManager } from '@/app/about/_components/os/utils/SoundManager';

interface ChatMessage {
    id: string;
    text: string;
    sender: 'visitor' | 'admin';
    timestamp: number;
}

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(await res.text() || 'Network error');
    return res.json();
};

export function useChatSync(initialGreeting?: string) {
    const [visitorId, setVisitorId] = useState<string>('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isSending, setIsSending] = useState(false);
    const [isAdminTyping, setIsAdminTyping] = useState(false);

    // Initial Visitor ID
    useEffect(() => {
        try {
            const storedId = localStorage.getItem('ramos_visitor_id');
            if (storedId) {
                setVisitorId(storedId);
            } else {
                const newId = uuidv4();
                localStorage.setItem('ramos_visitor_id', newId);
                setVisitorId(newId);
            }
        } catch (e) {
            setVisitorId(uuidv4());
        }
    }, []);

    // Greeting
    useEffect(() => {
        if (visitorId && messages.length === 0 && initialGreeting) {
            setMessages([{
                id: 'greeting',
                text: initialGreeting,
                sender: 'admin',
                timestamp: Date.now(),
            }]);
        }
    }, [visitorId, initialGreeting, messages.length]);

    // Polling
    const { data: syncData } = useSWR(
        visitorId ? `/api/chat/sync?visitorId=${visitorId}` : null,
        fetcher,
        { refreshInterval: 3000, revalidateOnFocus: false }
    );

    // Sync Messages from Server
    useEffect(() => {
        if (syncData?.success && syncData?.messages?.length > 0) {
            setMessages(prev => {
                const newMessages = [...prev];
                let hasNewAdminMessage = false;

                syncData.messages.forEach((serverMsg: ChatMessage) => {
                    const existingTempIndex = newMessages.findIndex(
                        m => m.id.startsWith('temp-') && m.text === serverMsg.text && m.sender === serverMsg.sender
                    );
                    const hasConfirmed = newMessages.find(m => m.id === serverMsg.id);

                    if (!hasConfirmed) {
                        if (existingTempIndex >= 0) {
                            newMessages[existingTempIndex] = serverMsg;
                        } else {
                            newMessages.push(serverMsg);
                            if (serverMsg.sender === 'admin') hasNewAdminMessage = true;
                        }
                    }
                });

                if (hasNewAdminMessage) {
                    soundManager.play('notification');
                    setIsAdminTyping(false);
                }

                // Deduplicate and Sort
                const uniqueMsgs: ChatMessage[] = [];
                const seenIds = new Set();
                newMessages.sort((a, b) => a.timestamp - b.timestamp).forEach(m => {
                    if (!seenIds.has(m.id)) {
                        seenIds.add(m.id);
                        uniqueMsgs.push(m);
                    }
                });
                return uniqueMsgs;
            });
        }
    }, [syncData]);

    const sendMessage = async (text: string) => {
        if (!text.trim() || isSending || !visitorId) return;

        setIsSending(true);
        const tempId = `temp-${Date.now()}`;
        const newMessage: ChatMessage = {
            id: tempId,
            text: text.trim(),
            sender: 'visitor',
            timestamp: Date.now(),
        };

        setMessages(prev => [...prev, newMessage]);
        soundManager.play('sent');

        try {
            const res = await fetch('/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    visitorId,
                    message: text.trim(),
                    pageUrl: window.location.href
                })
            });
            const data = await res.json();

            if (data.success && data.message) {
                setMessages(prev => prev.map(m => m.id === tempId ? data.message : m));
            }
        } catch (error) {
            console.error('Send failed', error);
        } finally {
            setIsSending(false);
        }
    };

    return { 
        visitorId, 
        messages, 
        setMessages,
        sendMessage, 
        isSending, 
        isAdminTyping, 
        setIsAdminTyping 
    };
}
