import React, { useState, useRef, useEffect } from 'react';
import { Send, MoreVertical, Search, CheckCheck, Paperclip, Smile, Mic, ArrowLeft, BadgeCheck } from 'lucide-react';
import Image from 'next/image';
import { mockChats, ContactProfile } from './data/mockChats';
import { getAvatarUrl } from '@/lib/avatar';

// Letter Avatar Helper (Clean & Consistent)
const USER_AVATAR = `https://ui-avatars.com/api/?background=00a884&color=ffffff&name=R&size=128&bold=true&length=1`; // User (Ramos) - Green background
const CLIENT_AVATAR = `https://ui-avatars.com/api/?background=d9fdd3&color=128c7e&name=C&size=128&bold=true&length=1`; // Default Client Fallback

interface ChatWindowProps {
    settings?: any;
    activeChatId?: string | null;
    customContacts?: Record<string, ContactProfile>;
}

export default function ChatWindow({ settings, activeChatId, customContacts }: ChatWindowProps) {
    const [chats, setChats] = useState<Record<string, ContactProfile>>({});
    const [input, setInput] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);
    const [activeContact, setActiveContact] = useState<ContactProfile | null>(null);

    // Initialize chats and select active contact
    useEffect(() => {
        const initialChats = customContacts || mockChats;
        setChats(initialChats);

        // Select active contact
        const contactId = activeChatId || Object.keys(initialChats)[0];
        if (contactId && initialChats[contactId]) {
            setActiveContact(initialChats[contactId]);
        } else if (Object.keys(initialChats).length > 0) {
            setActiveContact(Object.values(initialChats)[0]);
        }
    }, [activeChatId, customContacts]);

    // Scroll to bottom on new message
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeContact]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !activeContact) return;

        setActiveContact(prev => {
            if (!prev) return null;
            return {
                ...prev,
                conversation: [
                    ...prev.conversation,
                    {
                        id: Date.now(),
                        text: input,
                        isMe: true,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        status: 'sent' as const
                    }
                ]
            };
        });
        setInput('');
    };

    if (!activeContact) return <div className="h-full bg-[#efeae2]"></div>;

    return (
        <div key="chat-window-inner" className="flex flex-col h-full w-full bg-[#efeae2] relative overflow-hidden text-[#111b21]">
            {/* Chat Background Pattern */}
            <div
                key="chat-bg-pattern-os-v2"
                className="absolute inset-0 opacity-100 pointer-events-none z-0"
                style={{
                    backgroundImage: 'url("/assets/whatsapp-bg.png")',
                    backgroundRepeat: 'repeat',
                    backgroundSize: '400px'
                }}
            ></div>

            {/* Header */}
            <div className="bg-[#f0f2f5] py-2 px-4 flex items-center justify-between shrink-0 h-[60px] border-b border-[#d1d7db] z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden cursor-pointer relative shrink-0">
                        <Image
                            src={activeContact.avatar && activeContact.avatar.startsWith('http') ? activeContact.avatar : getAvatarUrl(activeContact.name)}
                            alt={activeContact.name}
                            width={40}
                            height={40}
                            unoptimized
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="flex flex-col justify-center min-w-0">
                        <h3 className="text-[16px] text-[#111b21] font-semibold leading-none truncate">{activeContact.name}</h3>
                        <span className="text-[11px] text-[#00a884] font-medium flex items-center gap-1 mt-0.5">
                            <BadgeCheck size={14} fill="#00a884" className="text-white" /> Verified Client Testimonial
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-5 text-[#54656f]">
                    <Search size={20} className="cursor-pointer" />
                    <MoreVertical size={20} className="cursor-pointer" />
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-y-5 z-10 custom-scrollbar relative">
                {activeContact.conversation.map(msg => (
                    <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`relative max-w-[85%] rounded-lg px-2 pt-1.5 pb-1 shadow-sm text-[14.2px] 
                            ${msg.isMe ? 'bg-[#d9fdd3] rounded-tr-none' : 'bg-white rounded-tl-none'}`}
                        >
                            <div className="flex flex-col">
                                <p className="text-[#111b21] leading-[19px] break-words whitespace-pre-wrap pr-1">
                                    {msg.text}
                                </p>
                                <div className="flex justify-end items-center gap-1 select-none mt-1 h-3">
                                    <span className="text-[11px] text-[#667781] leading-none">{msg.time}</span>
                                    {msg.isMe && (
                                        <span className="text-[#53bdeb]">
                                            <CheckCheck size={16} strokeWidth={1.5} />
                                        </span>
                                    )}
                                </div>
                            </div>
                            {/* Triangle tip */}
                            <div className={`absolute top-0 w-0 h-0 border-[6px] border-transparent 
                                ${msg.isMe
                                    ? 'right-[-6px] border-t-[#d9fdd3] border-l-[#d9fdd3]'
                                    : 'left-[-6px] border-t-white border-r-white'
                                }`}
                            />
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Footer / Input Area */}
            <div className="bg-[#f0f2f5] px-4 py-2 flex items-center gap-2 shrink-0 z-10 min-h-[62px]">
                <div className="flex gap-4 text-[#54656f]">
                    <Smile size={26} className="cursor-pointer hover:text-[#41525d]" />
                    <Paperclip size={24} className="cursor-pointer hover:text-[#41525d]" />
                </div>
                <form onSubmit={handleSend} className="flex-1 mx-2">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Ketik pesan"
                        className="w-full bg-white rounded-lg px-4 py-[9px] text-[15px] text-[#111b21] placeholder:text-[#667781] focus:outline-none border border-transparent focus:border-white"
                    />
                </form>
                <div className="flex gap-3 text-[#54656f]">
                    {input.trim() ? (
                        <button onClick={handleSend} className="text-[#54656f] hover:text-[#41525d]">
                            <Send size={24} />
                        </button>
                    ) : (
                        <Mic size={24} className="cursor-pointer hover:text-[#41525d]" />
                    )}
                </div>
            </div>
        </div>
    );
}
