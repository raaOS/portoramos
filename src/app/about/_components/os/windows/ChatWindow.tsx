'use client';

import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { soundManager } from '@/app/about/_components/os/utils/SoundManager';
import { useChatProjects } from './hooks/useChatProjects';
import { useChatSequencer } from './hooks/useChatSequencer';
import { ChatHeader } from './components/ChatHeader';
import { ChatMessages } from './components/ChatMessages';
import { ChatFooter } from './components/ChatFooter';
import { ChatList } from './components/ChatList';
import type { ContactProfile, ChatMessage } from '../data/mockChats';
import type { TestimonialData } from '@/types/testimonial';
import { convertTestimonialToContact } from '../utils/chatUtils';

interface ChatWindowProps {
    activeChatId?: string | null;
    customContacts?: Record<string, ContactProfile>;
}

export default function ChatWindow({ activeChatId = null, customContacts }: ChatWindowProps) {
    const [activeContact, setActiveContact] = useState<ContactProfile | null>(null);
    const [showList, setShowList] = useState(true);
    const [input, setInput] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);
    
    // Contacts state
    const [fetchedContacts, setFetchedContacts] = useState<ContactProfile[]>(
        customContacts ? Object.values(customContacts) : []
    );
    const contacts = useMemo(
        () => customContacts ? Object.values(customContacts) : fetchedContacts,
        [customContacts, fetchedContacts]
    );

    // Custom Hooks
    const { getProjectById } = useChatProjects();
    const { 
        visibleMessages, 
        isRemoteTyping, 
        addMessage, 
        setVisibleMessages 
    } = useChatSequencer(activeContact, showList);

    // Auto-scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [visibleMessages, isRemoteTyping]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !activeContact) return;

        const newMessage: ChatMessage = {
            id: Date.now(),
            text: input,
            isMe: true,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'sent' as const,
            type: 'text'
        };

        addMessage(newMessage);
        setInput('');
        soundManager.play('click');
    };

    const handleTyping = () => {
        soundManager.play('typing');
    };

    const selectContact = useCallback((contact: ContactProfile) => {
        setActiveContact(contact);
        setShowList(false);
        setVisibleMessages([]);
    }, [setVisibleMessages]);

    const goBackToList = useCallback(() => {
        setShowList(true);
        setActiveContact(null);
        setVisibleMessages([]);
    }, [setVisibleMessages]);

    const findContactByChatId = useCallback((chatId: string) => {
        return contacts.find((contact) => contact.id === chatId || contact.name === chatId) || null;
    }, [contacts]);

    const getLastMessage = (contact: ContactProfile) => {
        const messages = contact.messages || contact.conversation || [];
        if (messages.length === 0) return "Tidak ada pesan";
        const lastMsg = messages[messages.length - 1];
        return lastMsg.text.length > 30 ? lastMsg.text.substring(0, 30) + "..." : lastMsg.text;
    };

    useEffect(() => {
        if (!activeChatId) {
            return;
        }

        const targetContact = findContactByChatId(activeChatId);
        if (targetContact) {
            selectContact(targetContact);
        }
    }, [activeChatId, findContactByChatId, selectContact]);

    useEffect(() => {
        if (customContacts) return;

        let isMounted = true;

        const fetchTestimonials = async () => {
            try {
                const res = await fetch('/api/testimonial');
                if (!res.ok) {
                    throw new Error(`Failed to load testimonials: ${res.status}`);
                }

                const data: TestimonialData = await res.json();
                if (isMounted) {
                    const nextContacts = (data.testimonials || [])
                        .filter((testimonial) => testimonial.isActive !== false)
                        .map(convertTestimonialToContact);
                    setFetchedContacts(nextContacts);
                }
            } catch (err) {
                console.error("Failed to load contacts:", err);
            }
        };
        fetchTestimonials();
        return () => {
            isMounted = false;
        };
    }, [customContacts]);

    if (showList) {
        return <ChatList contacts={contacts} onSelect={selectContact} getLastMessage={getLastMessage} />;
    }

    if (!activeContact) return null;

    return (
        <div className="flex flex-col h-full w-full bg-[#e5ddd5] dark:bg-[#0b141a] relative overflow-hidden text-[#111b21]">
            <ChatHeader 
                contact={activeContact} 
                onBack={goBackToList} 
                isTyping={isRemoteTyping} 
            />

            <ChatMessages 
                messages={visibleMessages} 
                isTyping={isRemoteTyping} 
                getProjectById={getProjectById} 
            />

            <div ref={bottomRef} />

            <ChatFooter 
                input={input} 
                setInput={setInput} 
                onSend={handleSend} 
                onTyping={handleTyping} 
            />
        </div>
    );
}
