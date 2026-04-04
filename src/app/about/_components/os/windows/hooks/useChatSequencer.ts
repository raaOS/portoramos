import { useState, useEffect, useRef } from 'react';
import { soundManager } from '@/app/about/_components/os/utils/SoundManager';
import type { ContactProfile, ChatMessage } from '../../data/mockChats';

export function useChatSequencer(activeContact: ContactProfile | null, showList: boolean) {
    const [visibleMessages, setVisibleMessages] = useState<ChatMessage[]>([]);
    const [isRemoteTyping, setIsRemoteTyping] = useState(false);
    const sequencerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (showList || !activeContact) {
            setVisibleMessages([]);
            setIsRemoteTyping(false);
            if (sequencerRef.current) clearTimeout(sequencerRef.current);
            return;
        }

        // Reset visibility
        setVisibleMessages([]);
        setIsRemoteTyping(false);
        if (sequencerRef.current) clearTimeout(sequencerRef.current);

        let currentIndex = 0;
        const fullConversation = activeContact.messages || activeContact.conversation || [];

        const nextStep = () => {
            if (currentIndex >= fullConversation.length) return;

            const msg = fullConversation[currentIndex];

            if (!msg.isMe) {
                setIsRemoteTyping(true);
                sequencerRef.current = setTimeout(() => {
                    setIsRemoteTyping(false);
                    setVisibleMessages(prev => {
                        // Avoid duplicates if component re-renders
                        if (prev.find(m => m.id === msg.id)) return prev;
                        return [...prev, msg];
                    });
                    soundManager.play('notification');
                    currentIndex++;
                    sequencerRef.current = setTimeout(nextStep, 1500);
                }, 2000);
            } else {
                setVisibleMessages(prev => {
                    if (prev.find(m => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
                currentIndex++;
                const delay = msg.type === 'image' ? 2500 : 1000;
                sequencerRef.current = setTimeout(nextStep, delay);
            }
        };

        sequencerRef.current = setTimeout(nextStep, 800);

        return () => {
            if (sequencerRef.current) clearTimeout(sequencerRef.current);
        };
    }, [activeContact, showList]);

    const addMessage = (msg: ChatMessage) => {
        setVisibleMessages(prev => [...prev, msg]);
    };

    return { visibleMessages, isRemoteTyping, addMessage, setVisibleMessages };
}
