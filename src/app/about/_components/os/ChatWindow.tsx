import React, { useState, useRef, useEffect } from 'react';
import { Send, User, MoreVertical, Phone, Video, CheckCheck, ArrowLeft } from 'lucide-react';
import { mockChats, ContactProfile } from './data/mockChats';

interface ChatWindowProps {
    settings?: any;
    activeChatId?: string | null;
}

export default function ChatWindow({ settings, activeChatId }: ChatWindowProps) {
    const [activeContact, setActiveContact] = useState<ContactProfile | null>(null);
    const [input, setInput] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    // Load chat based on ID
    useEffect(() => {
        if (activeChatId && mockChats[activeChatId]) {
            setActiveContact(mockChats[activeChatId]);
        } else {
            // Default to first chat or Recruiter if none selected
            setActiveContact(mockChats["Rini (HRD)"]);
        }
    }, [activeChatId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeContact]);

    const handleSend = (text: string) => {
        if (!text.trim() || !activeContact) return;

        // Visual only - doesn't actually persist
        setActiveContact(prev => {
            if (!prev) return null;
            return {
                ...prev,
                conversation: [
                    ...prev.conversation,
                    {
                        id: Date.now(),
                        text: text,
                        isMe: true,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        status: 'sent'
                    }
                ]
            };
        });
        setInput('');
    };

    if (!activeContact) return <div className="h-full bg-[#E5DDD5]"></div>;

    return (
        <div className="flex flex-col h-full bg-[#E5DDD5]">
            {/* Header WhatsApp Style */}
            <div className="bg-[#075E54] text-white p-3 flex items-center justify-between shrink-0 shadow-md">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center relative shrink-0">
                        <img src={activeContact.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm truncate max-w-[150px]">{activeContact.name}</h3>
                        <p className="text-xs text-white/80 truncate">{activeContact.status}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-white/80">
                    <Video size={20} className="cursor-not-allowed opacity-70" />
                    <Phone size={20} className="cursor-not-allowed opacity-70" />
                    <MoreVertical size={20} />
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar relative" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundRepeat: 'repeat', backgroundSize: '400px' }}>
                {activeContact.conversation.map(msg => (
                    <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-lg px-3 py-2 shadow-sm text-sm relative ${msg.isMe ? 'bg-[#DCF8C6] rounded-tr-none' : 'bg-white rounded-tl-none'}`}>
                            <p className="text-gray-800 mb-1 leading-relaxed">{msg.text}</p>
                            <div className="flex items-center justify-end gap-1 mt-1">
                                <span className="text-[10px] text-gray-500">{msg.time}</span>
                                {msg.isMe && (
                                    <span className={`text-[10px] ${msg.status === 'read' ? 'text-blue-500' : 'text-gray-400'}`}>
                                        <CheckCheck size={16} strokeWidth={2} />
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="bg-[#F0F0F0] p-3 flex items-center gap-2 shrink-0">
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Ketik pesan..."
                    className="flex-1 bg-white rounded-full px-4 py-2 text-sm outline-none border-none focus:ring-0 shadow-inner"
                />
                <button
                    type="submit"
                    className="p-2 bg-[#075E54] rounded-full text-white hover:bg-[#128C7E] transition-all transform hover:scale-105 shadow-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!input.trim()}
                >
                    <Send size={18} className="translate-x-0.5 translate-y-0.5" />
                </button>
            </form>
        </div>
    );
}
