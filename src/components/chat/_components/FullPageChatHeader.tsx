import React from 'react';
import { Video, Phone, MoreVertical, Trash2 } from 'lucide-react';
import { useDictionary } from '@/contexts/LanguageContext';

interface FullPageChatHeaderProps {
  onClearClick?: () => void;
}

export default function FullPageChatHeader({ onClearClick }: FullPageChatHeaderProps) {
  const t = useDictionary();

  return (
    <div className="z-10 flex h-[60px] shrink-0 items-center justify-between border-b border-[#d1d7db] bg-[#f0f2f5] px-3 py-2 shadow-sm dark:border-[#222d34] dark:bg-[#202c33]">
      <div className="flex items-center gap-2">
        {/* Avatar */}
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/50 bg-gray-200">
          <img
            src={`https://ui-avatars.com/api/?background=ffffff&color=000000&name=R&size=128&bold=true&length=1`}
            alt="Ramos"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="ml-1 flex flex-col">
          <span className="line-clamp-1 text-sm font-semibold leading-tight text-[#111b21] dark:text-[#e9edef]">
            Ramos
          </span>
          <span className="text-[11px] font-medium leading-tight text-[#00a884]">
            {t.chat.online}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 text-[#54656f] dark:text-[#aebac1]">
        <div className="flex h-7 w-7 items-center justify-center" title="Video Call">
          <Video size={19} className="cursor-not-allowed opacity-50" />
        </div>
        <button
          type="button"
          onClick={onClearClick}
          title="Hapus Percakapan"
          className="flex h-7 w-7 cursor-pointer items-center justify-center text-[#54656f] transition-colors hover:text-red-500 active:text-red-600 dark:text-[#aebac1] dark:hover:text-red-400 dark:active:text-red-500"
        >
          <Trash2 size={19} />
        </button>
        <div className="flex h-7 w-7 items-center justify-center" title="Voice Call">
          <Phone size={19} className="cursor-not-allowed opacity-50" />
        </div>
        <div className="flex h-7 w-7 items-center justify-center">
          <MoreVertical size={19} className="cursor-pointer" />
        </div>
      </div>
    </div>
  );
}
