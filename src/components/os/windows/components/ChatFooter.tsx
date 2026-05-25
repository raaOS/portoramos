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
    <div className="z-10 flex shrink-0 items-center gap-3 border-t border-[#d1d7db] bg-[#f0f2f5] px-3 py-2.5 dark:border-white/5 dark:bg-[#202c33]">
      <div className="flex scale-90 items-center gap-3 md:scale-100">
        <EmojiPicker
          onEmojiSelect={(emoji) => {
            setInput(input + emoji);
            onTyping();
          }}
        />
        <Plus
          size={24}
          className="cursor-pointer text-[#54656f] transition-colors hover:text-[#111b21]"
        />
      </div>

      <form onSubmit={onSend} className="flex h-full flex-1 items-center gap-3">
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
          className="flex-1 rounded-[10px] border-none bg-white px-4 py-2 text-[14.5px] text-[#111b21] shadow-sm outline-none placeholder:text-[#8696a0] focus:ring-1 focus:ring-green-500/20 dark:bg-[#2a3942] dark:text-[#d1d7db]"
        />

        {input.trim() ? (
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full p-2 text-[#00a884] transition-all active:scale-95"
          >
            <Send size={24} />
          </button>
        ) : (
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full p-2 text-[#54656f] transition-all"
          >
            <Mic size={24} />
          </button>
        )}
      </form>
    </div>
  );
};
