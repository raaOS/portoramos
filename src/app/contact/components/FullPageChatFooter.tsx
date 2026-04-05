import React, { useState, useRef } from 'react';
import { Plus, Send, Mic } from 'lucide-react';
import EmojiPicker from '@/components/chat/EmojiPicker';

interface FullPageChatFooterProps {
    onSend: (text: string) => void;
    isSending: boolean;
}

export default function FullPageChatFooter({ onSend, isSending }: FullPageChatFooterProps) {
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSend = () => {
        if (inputValue.trim() && !isSending) {
            onSend(inputValue.trim());
            setInputValue('');
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleEmojiSelect = (emoji: string) => {
        setInputValue(prev => prev + emoji);
        inputRef.current?.focus();
    };

    return (
        <div className="z-10 flex shrink-0 items-center gap-3 border-t border-[#d1d7db] bg-[#f0f2f5] px-3 py-2.5 pb-safe dark:border-white/5 dark:bg-[#202c33]">
            <div className="flex items-center gap-3 text-[#54656f] dark:text-[#8696a0]">
                <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                <Plus className="h-6 w-6 cursor-pointer hover:text-[#111b21] transition-colors dark:hover:text-white" />
            </div>

            <div className="flex-1 rounded-[10px] bg-white px-4 py-2 shadow-sm dark:bg-[#2a3942]">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Ketik pesan..."
                    className="w-full border-none bg-transparent text-[14.5px] text-[#111b21] outline-none placeholder:text-[#8696a0] focus:outline-none dark:text-[#e9edef]"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isSending}
                />
            </div>

            <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isSending}
                className={`rounded-full p-2 transition-all ${
                    inputValue.trim() && !isSending
                        ? 'text-[#00a884]'
                        : 'text-[#54656f] dark:text-[#8696a0]'
                }`}
            >
                {inputValue.trim() ? (
                    <Send className="h-6 w-6" />
                ) : (
                    <Mic className="h-6 w-6" />
                )}
            </button>
        </div>
    );
}
