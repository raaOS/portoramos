import React, { useState, useRef, useEffect } from 'react';
import { Send, User, MoreVertical, Phone, Video } from 'lucide-react';

export default function ChatWindow() {
    const [messages, setMessages] = useState<{ id: number, text: string, isMe: boolean, time: string }[]>([
        { id: 1, text: "Halo! 👋", isMe: false, time: "10:00" },
        { id: 2, text: "Ada yang bisa saya bantu dengan project design Anda?", isMe: false, time: "10:00" },
    ]);
    const [input, setInput] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const newMsg = { id: Date.now(), text: input, isMe: true, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        setMessages(prev => [...prev, newMsg]);
        setInput('');

        // Fake auto-reply
        setTimeout(() => {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: "Terima kasih pesannya! Saya akan balas secepatnya via WhatsApp asli. 🚀",
                isMe: false,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        }, 1000);
    };

    return (
        <div className="flex flex-col h-full bg-[#E5DDD5]">
            {/* Header WhatsApp Style */}
            <div className="bg-[#075E54] text-white p-3 flex items-center justify-between shrink-0 shadow-md">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center">
                        <User className="text-gray-500" size={24} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">Ramos</h3>
                        <p className="text-xs text-white/80">Online</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-white/80">
                    <Video size={20} />
                    <Phone size={20} />
                    <MoreVertical size={20} />
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundRepeat: 'repeat', backgroundSize: '400px' }}>
                {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg px-3 py-2 shadow-sm text-sm relative ${msg.isMe ? 'bg-[#DCF8C6] rounded-tr-none' : 'bg-white rounded-tl-none'}`}>
                            <p className="text-gray-800 mb-1">{msg.text}</p>
                            <span className="text-[10px] text-gray-500 block text-right">{msg.time}</span>
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="bg-[#F0F0F0] p-3 flex items-center gap-2 shrink-0">
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Ketik pesan..."
                    className="flex-1 bg-white rounded-full px-4 py-2 text-sm outline-none border-none focus:ring-0"
                />
                <button
                    type="submit"
                    className="p-2 bg-[#075E54] rounded-full text-white hover:bg-[#128C7E] transition-colors flex items-center justify-center shadow-sm"
                >
                    <Send size={18} className="translate-x-0.5 translate-y-0.5" />
                </button>
            </form>
        </div>
    );
}
