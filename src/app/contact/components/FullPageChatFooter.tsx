import React, { useState, useRef, useEffect } from 'react';
import { Plus, Smile, Send, Mic } from 'lucide-react';

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

    return (
        <div className="bg-[#f0f2f5] dark:bg-[#202c33] px-4 py-3 flex items-center gap-3 shrink-0 relative z-20 pb-safe">
            <div className="flex items-center gap-3 text-[#667781] dark:text-[#8696a0]">
                <Plus className="w-6 h-6 cursor-not-allowed opacity-60" />
                <Smile className="w-6 h-6 cursor-not-allowed opacity-60" />
            </div>

            <div className="flex-1 bg-white dark:bg-[#2a3942] rounded-xl px-4 py-2 border dark:border-white/5">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Type a message"
                    className="w-full bg-transparent border-none focus:outline-none text-[#111b21] dark:text-[#e9edef] text-sm"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isSending}
                />
            </div>

            <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isSending}
                className={`p-2.5 rounded-full flex items-center justify-center transition-all ${
                    inputValue.trim() && !isSending
                        ? 'bg-[#00a884] shadow-md hover:scale-110'
                        : 'bg-transparent text-[#667781] dark:text-[#8696a0]'
                }`}
            >
                {inputValue.trim() ? (
                    <Send className="w-5 h-5 text-white" />
                ) : (
                    <Mic className="w-6 h-6" />
                )}
            </button>
        </div>
    );
}
