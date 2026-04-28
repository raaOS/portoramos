'use client';

import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { soundManager } from '@/app/about/_components/os/utils/SoundManager';
import { useChatProjects } from './hooks/useChatProjects';
import { useChatSequencer } from './hooks/useChatSequencer';
import { ChatHeader } from './components/ChatHeader';
import { ChatMessages } from './components/ChatMessages';
import { ChatFooter } from './components/ChatFooter';
import { ChatList } from './components/ChatList';
import QuickLookModal from '@/components/ui/QuickLookModal';
import { useDesktopWindowContext } from '../context/DesktopWindowContext';
import type { ContactProfile, ChatMessage } from '../data/mockChats';
import type { Project } from '@/types/projects';

interface ChatWindowProps {
    activeChatId?: string | null;
    customContacts?: Record<string, ContactProfile>;
    initialProjects?: Project[];
}

export default function ChatWindow({ activeChatId = null, customContacts, initialProjects }: ChatWindowProps) {
    const [activeContact, setActiveContact] = useState<ContactProfile | null>(null);
    const [showList, setShowList] = useState(true);
    const [input, setInput] = useState('');
    const [previewMedia, setPreviewMedia] = useState<{
        src: string;
        title: string;
        type: 'image' | 'video';
        project?: Project;
    } | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const { openWindow: _openWindow } = useDesktopWindowContext();

    // Contacts state
    const contacts = useMemo(
        () => customContacts ? Object.values(customContacts) : [],
        [customContacts]
    );

    // Custom Hooks
    const { getProjectById } = useChatProjects(initialProjects);
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

    const handleSend = useCallback((e: React.FormEvent) => {
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
    }, [input, activeContact, addMessage]);

    const handleTyping = useCallback(() => {
        soundManager.play('typing');
    }, []);

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
        return contacts?.find?.((contact) => contact.id === chatId || contact.name === chatId) || null;
    }, [contacts]);

    const getLastMessage = useCallback((contact: ContactProfile) => {
        const messages = contact.messages || contact.conversation || [];
        if (messages.length === 0) return "Tidak ada pesan";
        const lastMsg = messages[messages.length - 1];
        return lastMsg.text.length > 30 ? lastMsg.text.substring(0, 30) + "..." : lastMsg.text;
    }, []);

    // Sync activeChatId changes via effect
    useEffect(() => {
        if (!activeChatId) return;
        const target = findContactByChatId(activeChatId);
        if (target) {
            React.startTransition(() => {
                setActiveContact(target);
                setShowList(false);
                setVisibleMessages([]);
            });
        }
    }, [activeChatId, findContactByChatId, setVisibleMessages]);

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
                onOpenProject={(project) => {
                    const isVideo = project.cover?.toLowerCase().endsWith('.mp4') || project.cover?.toLowerCase().endsWith('.webm');
                    setPreviewMedia({
                        src: project.cover || '',
                        title: project.title,
                        type: isVideo ? 'video' : 'image',
                        project
                    });
                }}
                onPreviewMedia={(src, title, type) => setPreviewMedia({ src, title, type })}
            />

            <div ref={bottomRef} />

            <ChatFooter
                input={input}
                setInput={setInput}
                onSend={handleSend}
                onTyping={handleTyping}
            />

            {/* Media Preview Modal */}
            <QuickLookModal
                isOpen={!!previewMedia}
                onClose={() => setPreviewMedia(null)}
                title={previewMedia?.title || 'Preview'}
                type={previewMedia?.type || 'image'}
                url={previewMedia?.src || ''}
            />
        </div>
    );
}
