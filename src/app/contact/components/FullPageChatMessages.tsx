import React from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { CheckCheck } from 'lucide-react';
import { parseEmojiText } from '@/components/chat/AnimatedEmoji';
import TypingIndicator from './TypingIndicator';

interface ChatMessage {
    id: string;
    text: string;
    sender: 'visitor' | 'admin';
    timestamp: number;
}

interface FullPageChatMessagesProps {
    messages: ChatMessage[];
    isTyping: boolean;
    bottomRef: React.RefObject<HTMLDivElement>;
}

export default function FullPageChatMessages({ 
    messages, 
    isTyping, 
    bottomRef 
}: FullPageChatMessagesProps) {
    return (
        <div className="flex-1 w-full overflow-y-auto px-4 py-6 flex flex-col gap-3 relative bg-[#e5ddd5] dark:bg-[#0b141a]">
            {/* WhatsApp Pattern Background */}
            <div
                className="absolute inset-0 opacity-40 pointer-events-none"
                style={{
                    backgroundImage: `url('/assets/whatsapp-bg.webp')`,
                    backgroundSize: '400px',
                    backgroundRepeat: 'repeat'
                }}
            />

            {/* Messages Container - above background */}
            <div className="relative z-10 flex flex-col gap-3 w-full">
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
                                    <svg viewBox="0 0 8 13" width="8" height="13" className={`absolute top-0 ${isMe ? '-right-[8px] text-[#d9fdd3] dark:text-[#005c4b]' : '-left-[8px] text-white dark:text-[#202c33] transform scale-x-[-1]'} fill-current overflow-visible z-20`}>
                                        <path d="M5.188 0H0v12.191L8 1.733V0h-2.812z"></path>
                                    </svg>

                                    <div className="whitespace-pre-wrap">
                                        {parseEmojiText(msg.text)}
                                    </div>

                                    <div className={`flex items-center justify-end gap-1 mt-1 -mb-1 ${isMe ? 'text-[#667781] dark:text-white/60' : 'text-[#667781] dark:text-white/50'}`}>
                                        <span className="text-[10px] uppercase">
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {isMe && <CheckCheck className="w-3.5 h-3.5 text-blue-500" />}
                                    </div>
                                </div>
                            </m.div>
                        );
                    })}

                    {/* Typing Indicator */}
                    {isTyping && <TypingIndicator />}
                </AnimatePresence>
            </div>

            <div ref={bottomRef} className="h-2 w-full relative z-10" />
        </div>
    );
}
