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
        <div className="bg-[#f0f2f5] py-2 px-3 flex items-center justify-between shrink-0 h-[60px] border-b border-[#d1d7db] z-10 shadow-sm">
            <div className="flex items-center gap-2">
                <button
                    onClick={onBack}
                    className="flex items-center justify-center w-8 h-8 hover:bg-gray-200 rounded-full transition-colors active:bg-gray-300"
                >
                    <ArrowLeft size={20} className="text-[#54656f]" />
                </button>
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0 border border-white/50">
                    <img
                        src={contact.avatar}
                        alt={contact.name}
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="flex flex-col ml-1">
                    <span className="font-semibold text-sm text-[#111b21] leading-tight line-clamp-1">{contact.name}</span>
                    <span className="text-[11px] text-[#00a884] font-medium leading-tight">
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
