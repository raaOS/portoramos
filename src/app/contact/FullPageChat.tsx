'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, MoreVertical, Phone, Video, Search, CheckCheck } from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';
import { soundManager } from '@/app/about/_components/os/utils/SoundManager';
// The ID used for this browser session to track polling
import { v4 as uuidv4 } from 'uuid';
import useSWR from 'swr';
import SystemNavFrame from '@/components/layout/SystemNavFrame';

// Helper for fetching
const fetcher = (url: string) => fetch(url).then(res => res.json());

interface ChatMessage {
    id: string;
    text: string;
    sender: 'visitor' | 'admin';
    timestamp: number;
}

export default function FullPageChat({ contactInfo }: { contactInfo: any }) {
    console.log('[FullPageChat] Rendered, contactInfo:', !!contactInfo);
    // Session state
    const [visitorId, setVisitorId] = useState<string>('');
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isSending, setIsSending] = useState(false);

    const bottomRef = useRef<HTMLDivElement>(null);

    // Initialize visitor ID on mount
    useEffect(() => {
        document.body.setAttribute('data-page', 'contact');
        const storedId = localStorage.getItem('ramos_visitor_id');
        if (storedId) {
            setVisitorId(storedId);
        } else {
            const newId = uuidv4();
            localStorage.setItem('ramos_visitor_id', newId);
            setVisitorId(newId);
        }
        return () => document.body.removeAttribute('data-page');
    }, []);

    // Initial greeting if no messages
    useEffect(() => {
        if (visitorId && messages.length === 0) {
            setMessages([{
                id: 'greeting',
                text: contactInfo?.subtext || "👋 Halo! Ada project menarik yang bisa saya bantu? Ketik pesanmu di bawah ini, langsung masuk ke HP saya loh!",
                sender: 'admin',
                timestamp: Date.now()
            }]);
        }
    }, [visitorId, contactInfo?.subtext, messages.length]);

    // Polling using SWR (Runs every 2.5s)
    const { data: syncData } = useSWR(
        visitorId ? `/api/chat/sync?visitorId=${visitorId}` : null,
        fetcher,
        { refreshInterval: 2500, revalidateOnFocus: true }
    );

    // Update messages when polling returns new data
    useEffect(() => {
        if (syncData?.success && syncData?.messages?.length > 0) {
            setMessages(prev => {
                const newMessages = [...prev];
                let hasNewAdminMessage = false;

                syncData.messages.forEach((serverMsg: ChatMessage) => {
                    // Try to find a temporary optimistic message that matches this server message
                    const existingTempIndex = newMessages.findIndex(
                        m => m.id.startsWith('temp-') && m.text === serverMsg.text && m.sender === serverMsg.sender
                    );

                    // Check if we already have the confirmed server message
                    const hasConfirmed = newMessages.find(m => m.id === serverMsg.id);

                    if (!hasConfirmed) {
                        if (existingTempIndex >= 0) {
                            // Replace temp message with server message to prevent visual duplicates during network race
                            newMessages[existingTempIndex] = serverMsg;
                        } else {
                            newMessages.push(serverMsg);
                            if (serverMsg.sender === 'admin') hasNewAdminMessage = true;
                        }
                    }
                });

                if (hasNewAdminMessage) {
                    soundManager.play('notification', 0.6);
                }

                // Absolute deduplication by ID just in case state got tangled
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

    // Auto-scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isSending]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isSending || !visitorId) return;

        const messageText = input.trim();
        setInput('');
        setIsSending(true);

        // Optimistically add to UI
        const tempId = `temp-${Date.now()}`;
        setMessages(prev => [...prev, {
            id: tempId,
            text: messageText,
            sender: 'visitor',
            timestamp: Date.now()
        }]);

        soundManager.play('click', 0.3);

        try {
            const res = await fetch('/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    visitorId,
                    message: messageText,
                    pageUrl: window.location.href
                })
            });
            const data = await res.json();

            if (data.success && data.message) {
                // Replace temp message with server confirmed one
                setMessages(prev => {
                    const mapped = prev.map(m => m.id === tempId ? data.message : m);
                    // Absolute deduplication by ID
                    const uniqueMsgs: ChatMessage[] = [];
                    const seenIds = new Set();
                    mapped.forEach(m => {
                        if (!seenIds.has(m.id)) {
                            seenIds.add(m.id);
                            uniqueMsgs.push(m);
                        }
                    });
                    return uniqueMsgs;
                });
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            // Could add a visual error state here
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <SystemNavFrame hideFooter={true}>
            <div className="relative flex-1 bg-[#0a0a0a] overflow-hidden flex flex-col items-center justify-center pt-28 pb-32 px-4 h-full min-h-[100dvh]">
                {/* Device Frame Constraint for Desktop */}
                <div
                    className="w-full h-full md:h-[80vh] bg-[#e5ddd5] dark:bg-[#0b141a] md:rounded-[2.5rem] md:border-[12px] border-gray-800 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden relative z-10"
                    style={{ maxWidth: '480px' }}
                >

                    {/* Chat Header */}
                    <div className="bg-[#00a884] dark:bg-[#202c33] px-4 py-4 flex items-center justify-between shrink-0 shadow-md z-20">
                        <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0 border border-white/20">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={`https://ui-avatars.com/api/?background=ffffff&color=000000&name=R&size=128&bold=true&length=1`} alt="Ramos" className="w-full h-full object-cover" />
                            </div>

                            <div className="flex flex-col">
                                <span className="font-semibold text-white text-base leading-tight">Ramos</span>
                                <span className="text-white/80 text-xs font-medium">Online</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-white">
                            <Video className="w-5 h-5 opacity-80 cursor-not-allowed" />
                            <Phone className="w-5 h-5 opacity-80 cursor-not-allowed" />
                            <MoreVertical className="w-5 h-5 opacity-80 cursor-not-allowed" />
                        </div>
                    </div>

                    {/* Chat Messages Area */}
                    <div className="flex-1 w-full overflow-y-auto px-4 py-6 flex flex-col gap-3 relative"
                        style={{ backgroundImage: `url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')`, backgroundSize: 'cover', backgroundAttachment: 'fixed' }}>

                        <div className="w-full flex justify-center mb-4">
                            <span className="bg-[#d9ddcf] dark:bg-[#1f2c34] text-[#4a4a4a] dark:text-gray-300 text-xs px-3 py-1 rounded-md shadow-sm">
                                Today
                            </span>
                        </div>

                        <AnimatePresence initial={false}>
                            {messages.map((msg, idx) => {
                                const isMe = msg.sender === 'visitor';
                                return (
                                    <m.div
                                        key={msg.id || idx}
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        className={`flex flex-col max-w-[85%] ${isMe ? 'self-end items-end' : 'self-start items-start'} relative group`}
                                    >
                                        <div
                                            className={`px-3 py-2 rounded-2xl shadow-sm text-[15px] leading-relaxed relative ${isMe
                                                ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-tr-none'
                                                : 'bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] rounded-tl-none'
                                                }`}
                                            style={{ wordBreak: 'break-word' }}
                                        >
                                            {/* Chat Tail SVG (Simplified) */}
                                            <svg viewBox="0 0 8 13" width="8" height="13" className={`absolute top-0 ${isMe ? '-right-[8px] text-[#d9fdd3] dark:text-[#005c4b]' : '-left-[8px] text-white dark:text-[#202c33] transform scale-x-[-1]'} fill-current`}>
                                                <path d="M5.188 1H0v11.191L8 1.733V1h-2.812z"></path>
                                            </svg>

                                            <div className="whitespace-pre-wrap">{msg.text}</div>

                                            <div className={`flex items-center justify-end gap-1 mt-1 -mb-1 ${isMe ? 'text-[#667781] dark:text-white/60' : 'text-[#667781] dark:text-white/50'}`}>
                                                <span className="text-[10px] uppercase">
                                                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {isMe && <CheckCheck className="w-3.5 h-3.5 text-blue-500" />}
                                            </div>
                                        </div>
                                    </m.div>
                                );
                            })}
                        </AnimatePresence>

                        <div ref={bottomRef} className="h-2 w-full" />
                    </div>

                    <div className="bg-[#f0f2f5] dark:bg-[#202c33] px-3 py-3 md:px-4 md:py-4 flex items-end gap-2 shrink-0 z-20 no-ring">
                        <div
                            className="flex-1 bg-white dark:bg-[#2a3942] rounded-2xl md:rounded-3xl min-h-[44px] flex items-center px-4 overflow-hidden border border-transparent dark:border-white/5 shadow-sm no-ring focus-within:ring-0 focus-within:ring-offset-0"
                            style={{ boxShadow: 'none', outline: 'none' }}
                        >
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Tulis pesan..."
                                className="flex-1 max-h-[120px] py-3 bg-transparent border-none outline-none resize-none text-[15px] text-[#111b21] dark:text-[#d1d7db] placeholder:text-[#8696a0] scrollbar-hide no-ring"
                                rows={1}
                                style={{ minHeight: '44px', boxShadow: 'none', outline: 'none' }}
                            />
                        </div>

                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isSending}
                            className={`w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0 transition-all ${input.trim() && !isSending
                                ? 'bg-[#00a884] shadow-md hover:bg-[#008f6f] text-white'
                                : 'bg-[#e9edef] dark:bg-[#2a3942] text-[#8696a0] dark:text-[#8696a0] pointer-events-none'
                                }`}
                        >
                            <Send className="w-5 h-5 -translate-x-[2px] translate-y-[1px]" />
                        </button>
                    </div>
                </div>

                {/* Background Decor (blurred) */}
                <div className="absolute inset-0 z-0 pointer-events-none opacity-40 dark:opacity-20 flex justify-center items-center">
                    <div className="w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-[#00a884] rounded-full blur-[120px] mix-blend-screen opacity-50" />
                </div>
            </div>
        </SystemNavFrame>
    );
}
