'use client';

import React, { useState, useRef, useEffect } from 'react';
import { soundManager } from '@/app/about/_components/os/utils/SoundManager';
import { useChatProjects } from './hooks/useChatProjects';
import { useChatSequencer } from './hooks/useChatSequencer';
import { ChatHeader } from './components/ChatHeader';
import { ChatMessages } from './components/ChatMessages';
import { ChatFooter } from './components/ChatFooter';
import { ChatList } from './components/ChatList';
import type { ContactProfile, ChatMessage } from '../data/mockChats';

export default function ChatWindow({ customContacts }: { customContacts?: Record<string, ContactProfile> }) {
    const [activeContact, setActiveContact] = useState<ContactProfile | null>(null);
    const [showList, setShowList] = useState(true);
    const [input, setInput] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);
    
    // Contacts state
    const [contacts, setContacts] = useState<ContactProfile[]>(
        customContacts ? Object.values(customContacts) : []
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

    const selectContact = (contact: ContactProfile) => {
        setActiveContact(contact);
        setShowList(false);
        setVisibleMessages([]);
    };

    const goBackToList = () => {
        setShowList(true);
        setActiveContact(null);
        setVisibleMessages([]);
    };

    const getLastMessage = (contact: ContactProfile) => {
        const messages = contact.messages || contact.conversation || [];
        if (messages.length === 0) return "Tidak ada pesan";
        const lastMsg = messages[messages.length - 1];
        return lastMsg.text.length > 30 ? lastMsg.text.substring(0, 30) + "..." : lastMsg.text;
    };

    useEffect(() => {
        if (customContacts) return; // Skip if provided via props

        const fetchTestimonials = async () => {
            try {
                const res = await fetch('/api/testimonials');
                const data = await res.json();
                if (data.success) {
                    setContacts(data.testimonials);
                }
            } catch (err) {
                console.error("Failed to load contacts:", err);
            }
        };
        fetchTestimonials();
    }, []);

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
