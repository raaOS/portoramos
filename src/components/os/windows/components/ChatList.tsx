import React from 'react';
import { Search, MoreVertical, CheckCircle2 } from 'lucide-react';
import type { ContactProfile } from '../../data/mockChats';
import { useDictionary } from '@/contexts/LanguageContext';

interface ChatListProps {
  contacts: ContactProfile[];
  onSelect: (contact: ContactProfile) => void;
  getLastMessage: (contact: ContactProfile) => string;
}

export const ChatList: React.FC<ChatListProps> = ({ contacts, onSelect, getLastMessage }) => {
  const t = useDictionary();

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-white text-[#111b21]">
      {/* List Header */}
      <div className="z-10 flex h-[60px] shrink-0 items-center justify-between border-b border-[#d1d7db] bg-[#f0f2f5] px-4 py-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-50 px-3 py-1.5 text-[13px] font-semibold text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          {t.chat.verifiedTestimonials}
        </span>
        <div className="flex items-center gap-4 text-[#54656f]">
          <Search size={20} className="cursor-pointer" />
          <MoreVertical size={20} className="cursor-pointer" />
        </div>
      </div>

      {/* Scrollable contacts */}
      <div className="flex-1 overflow-y-auto">
        {contacts.map((contact) => (
          <div
            key={contact.id}
            onClick={() => onSelect(contact)}
            className="flex cursor-pointer items-center gap-3 border-b border-[#f0f2f5] px-4 py-3 transition-colors hover:bg-[#f5f6f6]"
          >
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-black/5 bg-gray-100">
              <img
                src={contact.avatar}
                alt={contact.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="mb-0.5 flex items-center justify-between">
                <span className="text-[14px] font-semibold text-[#111b21]">{contact.name}</span>
                <span className="text-[11px] text-[#667781]">{t.chat.yesterday}</span>
              </div>
              <p className="line-clamp-1 text-[12.5px] text-[#667781]">{getLastMessage(contact)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Safety Footer / Pattern */}
      <div className="border-t border-[#d1d7db] bg-[#f0f2f5] p-4 text-center">
        <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">
          {t.chat.encrypted}
        </p>
      </div>
    </div>
  );
};
