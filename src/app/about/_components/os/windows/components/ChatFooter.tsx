import React from 'react';
import { Plus, Mic, Send } from 'lucide-react';
import EmojiPicker from '@/components/chat/EmojiPicker';

interface ChatFooterProps {
    input: string;
    setInput: (val: string) => void;
    onSend: (e: React.FormEvent) => void;
    onTyping: () => void;
}

export const ChatFooter: React.FC<ChatFooterProps> = ({ input, setInput, onSend, onTyping }) => {
    return (
        <div className="bg-[#f0f2f5] dark:bg-[#202c33] px-3 py-2.5 flex items-center gap-3 shrink-0 z-10 border-t border-[#d1d7db] dark:border-white/5">
            <div className="flex items-center gap-3 scale-90 md:scale-100">
                <EmojiPicker
                    onEmojiSelect={(emoji) => {
                        setInput(input + emoji);
                        onTyping();
                    }}
                />
                <Plus size={24} className="text-[#54656f] cursor-pointer hover:text-[#111b21] transition-colors" />
            </div>

            <form onSubmit={onSend} className="flex-1 flex items-center gap-3 h-full">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => {
                        setInput(e.target.value);
                        if (e.target.value.length > input.length) {
                            onTyping();
                        }
                    }}
                    placeholder="Ketik pesan..."
                    className="flex-1 bg-white dark:bg-[#2a3942] rounded-[10px] px-4 py-2 text-[14.5px] outline-none border-none text-[#111b21] dark:text-[#d1d7db] placeholder:text-[#8696a0] shadow-sm focus:ring-1 focus:ring-green-500/20"
                />
                
                {input.trim() ? (
                    <button
                        type="submit"
                        className="p-2 text-[#00a884] rounded-full transition-all active:scale-95"
                    >
                        <Send size={24} />
                    </button>
                ) : (
                    <button type="button" className="p-2 text-[#54656f] rounded-full transition-all">
                        <Mic size={24} />
                    </button>
                )}
            </form>
        </div>
    );
};
