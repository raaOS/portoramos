'use client';

import React, { useRef, useEffect } from 'react';
import { m } from 'framer-motion';
import FullPageChatHeader from './components/FullPageChatHeader';
import FullPageChatMessages from './components/FullPageChatMessages';
import FullPageChatFooter from './components/FullPageChatFooter';
import { useChatSync } from './hooks/useChatSync';
import SystemNavFrame from '@/components/layout/SystemNavFrame';

interface FullPageChatContactInfo {
    email?: string;
    socialMedia?: {
        linkedin?: string;
        instagram?: string;
        twitter?: string;
        behance?: string;
        whatsapp?: string;
    };
    headline?: string;
    subtext?: string;
}

interface FullPageChatProps {
    contactInfo?: FullPageChatContactInfo;
}

export default function FullPageChat({ contactInfo }: FullPageChatProps) {
    const bottomRef = useRef<HTMLDivElement>(null);
    const { 
        messages, 
        sendMessage, 
        isSending, 
        isAdminTyping 
    } = useChatSync(contactInfo?.subtext || "👋 Halo! Ada project menarik yang bisa saya bantu? Ketik pesanmu di bawah ini, langsung masuk ke HP saya loh!");

    // Auto-scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isAdminTyping]);

    return (
        <SystemNavFrame hideFooter={true}>
            <div className="relative flex-1 bg-[#0a0a0a] overflow-hidden flex flex-col items-center justify-center pt-28 pb-32 px-4 h-full min-h-[100dvh]">
                <m.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full h-full md:h-[80vh] bg-[#e5ddd5] dark:bg-[#0b141a] md:rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden relative z-10"
                    style={{ maxWidth: '480px' }}
                >
                    <FullPageChatHeader />
                    <FullPageChatMessages 
                        messages={messages} 
                        isTyping={isAdminTyping} 
                        bottomRef={bottomRef} 
                    />
                    <FullPageChatFooter 
                        onSend={sendMessage} 
                        isSending={isSending} 
                    />
                </m.div>

                {/* Background Decor */}
                <div className="absolute inset-0 z-0 pointer-events-none opacity-40 dark:opacity-20 flex justify-center items-center">
                    <div className="w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-[#00a884] rounded-full blur-[120px] mix-blend-screen opacity-50" />
                </div>
            </div>
        </SystemNavFrame>
    );
}
