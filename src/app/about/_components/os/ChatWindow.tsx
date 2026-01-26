import React, { useState, useRef, useEffect } from 'react';
import { Send, User, MoreVertical, Phone, Video, Check, Clock } from 'lucide-react';

interface ChatSettings {
    autoReplyText: string;
    contactEmail: string;
    contactPhone: string;
    avatarUrl?: string;
}

interface ChatWindowProps {
    settings?: ChatSettings;
}

export default function ChatWindow({ settings }: ChatWindowProps) {
    const [messages, setMessages] = useState<{ id: number, text: string, isMe: boolean, time: string, status?: 'sent' | 'read' }[]>([
        { id: 1, text: "Halo! 👋", isMe: false, time: "10:00", status: 'read' },
        { id: 2, text: settings?.autoReplyText || "Ada yang bisa saya bantu dengan project design Anda?", isMe: false, time: "10:00", status: 'read' },
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const replyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (replyTimeoutRef.current) clearTimeout(replyTimeoutRef.current);
        };
    }, []);

    const quickReplies = ["Lihat Portfolio", "Kontak", "Harga / Rate", "Tech Stack"];

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleSend = (text: string) => {
        if (!text.trim()) return;

        const newMsg = {
            id: Date.now(),
            text: text,
            isMe: true,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'sent' as const
        };
        setMessages(prev => [...prev, newMsg]);
        setInput('');

        // Trigger Bot Reply
        setIsTyping(true);
        processBotReply(text);
    };

    const processBotReply = (userText: string) => {
        const lowerText = userText.toLowerCase();
        let replyText = "";
        let delay = 1500 + Math.random() * 1000; // Natural delay

        if (lowerText.includes("portfolio") || lowerText.includes("karya") || lowerText.includes("project")) {
            replyText = "Untuk melihat karya terbaik saya, silakan buka aplikasi 'Launchpad' di Dock atau klik folder 'Projects'. 🚀";
        } else if (lowerText.includes("harga") || lowerText.includes("rate") || lowerText.includes("bajet")) {
            replyText = "Rate saya bervariasi tergantung kompleksitas project. Yuk diskusi lebih lanjut via email! 💼";
        } else if (lowerText.includes("kontak") || lowerText.includes("email") || lowerText.includes("wa")) {
            replyText = `Anda bisa menghubungi saya via email di ${settings?.contactEmail || 'hello@ramos.com'} atau klik aplikasi 'Mail' di Dock.`;
        } else if (lowerText.includes("tech") || lowerText.includes("stack")) {
            replyText = "Saya biasa menggunakan React, Next.js, TypeScript, Tailwind, dan Framer Motion. 💻";
        } else {
            replyText = "Terima kasih pesannya! Saya sedang offline di OS ini, tapi saya akan balas via WhatsApp asli secepatnya. 👍";
        }

        replyTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: replyText,
                isMe: false,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
            replyTimeoutRef.current = null;
        }, delay);
    };

    return (
        <div className="flex flex-col h-full bg-[#E5DDD5]">
            {/* Header WhatsApp Style */}
            <div className="bg-[#075E54] text-white p-3 flex items-center justify-between shrink-0 shadow-md">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center relative">
                        {/* Avatar Image Placeholder */}
                        {settings?.avatarUrl ? (
                            <img src={settings.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <>
                                <div className="absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-600 animate-pulse" />
                                <User className="text-white relative z-10" size={24} />
                            </>
                        )}
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">Ramos</h3>
                        <p className="text-xs text-white/80">{isTyping ? 'Typing...' : 'Online'}</p>
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
                {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg px-3 py-2 shadow-sm text-sm relative ${msg.isMe ? 'bg-[#DCF8C6] rounded-tr-none' : 'bg-white rounded-tl-none'}`}>
                            <p className="text-gray-800 mb-1 leading-relaxed">{msg.text}</p>
                            <div className="flex items-center justify-end gap-1 mt-1">
                                <span className="text-[10px] text-gray-500">{msg.time}</span>
                                {msg.isMe && (
                                    <span className="text-blue-500">
                                        <Check size={12} strokeWidth={3} />
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white rounded-lg rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Quick Replies */}
            {messages.length < 5 && !isTyping && (
                <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar bg-[#E5DDD5]/50 backdrop-blur-sm">
                    {quickReplies.map(reply => (
                        <button
                            key={reply}
                            onClick={() => handleSend(reply)}
                            className="bg-white/90 border border-white/50 px-3 py-1 rounded-full text-xs text-[#075E54] font-medium shadow-sm hover:bg-[#E5DDD5] transition-colors whitespace-nowrap"
                        >
                            {reply}
                        </button>
                    ))}
                </div>
            )}

            {/* Input Area */}
            <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="bg-[#F0F0F0] p-3 flex items-center gap-2 shrink-0">
                <input
                    ref={inputRef}
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
