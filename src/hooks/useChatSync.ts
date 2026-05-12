import { useState, useEffect, startTransition } from 'react';
import { v4 as uuidv4 } from 'uuid';
import useSWR from 'swr';
import { soundManager } from '@/components/os/utils/SoundManager';

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
    const [isPageVisible, setIsPageVisible] = useState(true);

    // Initial Visitor ID
    useEffect(() => {
        try {
            const storedId = localStorage.getItem('ramos_visitor_id');
            startTransition(() => {
                if (storedId) {
                    setVisitorId(storedId);
                } else {
                    const newId = uuidv4();
                    localStorage.setItem('ramos_visitor_id', newId);
                    setVisitorId(newId);
                }
            });
        } catch {
            startTransition(() => {
                setVisitorId(uuidv4());
            });
        }
    }, []);

    // Track page visibility to optimize polling
    useEffect(() => {
        const handleVisibilityChange = () => {
            setIsPageVisible(document.visibilityState === 'visible');
        };
        window.addEventListener('visibilitychange', handleVisibilityChange);
        return () => window.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    // Greeting
    useEffect(() => {
        if (visitorId && messages.length === 0 && initialGreeting) {
            startTransition(() => {
                setMessages([{
                    id: 'greeting',
                    text: initialGreeting,
                    sender: 'admin',
                    timestamp: Date.now(),
                }]);
            });
        }
    }, [visitorId, initialGreeting, messages.length]);

    const [syncError, setSyncError] = useState(false);
 
    // Polling with Smart Interval
    // 3 seconds when active, 30 seconds when in background
    const { data: _syncData, error: swrError } = useSWR(
        visitorId ? `/api/chat/sync?visitorId=${visitorId}` : null,
        fetcher,
        { 
            refreshInterval: isPageVisible ? 3000 : 30000, 
            revalidateOnFocus: true,
            dedupingInterval: 2000,
            onSuccess: (data) => {
                setSyncError(false);
                if (data?.success) {
                    // Update typing status from server
                    if (data.isAdminTyping !== undefined) {
                        setIsAdminTyping(data.isAdminTyping);
                    }

                    if (data.messages?.length > 0) {
                        setMessages(prev => {
                            const newMessages = [...prev];
                            let hasNewAdminMessage = false;

                            data.messages.forEach((serverMsg: ChatMessage) => {
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
                                // Hanya bunyikan notifikasi kalau tab visible agar user
                                // tidak ter-distract di background tab.
                                if (typeof document === 'undefined' || document.visibilityState === 'visible') {
                                    soundManager.play('notification');
                                }
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
                }
            },
            onError: () => setSyncError(true)
        }
    );

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
        setIsAdminTyping,
        syncError: syncError || !!swrError
    };
}
