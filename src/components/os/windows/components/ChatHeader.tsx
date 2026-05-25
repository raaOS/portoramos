import React from 'react';
import { ArrowLeft, Video, Phone, MoreVertical } from 'lucide-react';
import type { ContactProfile } from '../../data/mockChats';

interface ChatHeaderProps {
  contact: ContactProfile;
  onBack: () => void;
  isTyping: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ contact, onBack, isTyping }) => {
  return (
    <div className="z-10 flex h-[60px] shrink-0 items-center justify-between border-b border-[#d1d7db] bg-[#f0f2f5] px-3 py-2 shadow-sm">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-gray-200 active:bg-gray-300"
        >
          <ArrowLeft size={20} className="text-[#54656f]" />
        </button>
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/50 bg-gray-200">
          <img
            src={contact.avatar}
            alt={contact.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="ml-1 flex flex-col">
          <span className="line-clamp-1 text-sm font-semibold leading-tight text-[#111b21]">
            {contact.name}
          </span>
          <span className="text-[11px] font-medium leading-tight text-[#00a884]">
            {isTyping ? 'sedang mengetik...' : 'online'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4 text-[#54656f]">
        <Video size={20} className="cursor-not-allowed opacity-50" />
        <Phone size={18} className="cursor-not-allowed opacity-50" />
        <MoreVertical size={20} className="cursor-pointer" />
      </div>
    </div>
  );
};
