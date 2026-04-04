import React from 'react';
import { Search, MoreVertical, CheckCircle2 } from 'lucide-react';
import type { ContactProfile } from '../../data/mockChats';

interface ChatListProps {
    contacts: ContactProfile[];
    onSelect: (contact: ContactProfile) => void;
    getLastMessage: (contact: ContactProfile) => string;
}

export const ChatList: React.FC<ChatListProps> = ({ contacts, onSelect, getLastMessage }) => {
    return (
        <div className="flex flex-col h-full w-full bg-white relative overflow-hidden text-[#111b21]">
            {/* List Header */}
            <div className="bg-[#f0f2f5] py-3 px-4 flex items-center justify-between shrink-0 h-[60px] border-b border-[#d1d7db] z-10">
                <span className="inline-flex items-center gap-1.5 text-[13px] text-green-600 font-semibold bg-green-50 border border-green-500/30 px-3 py-1.5 rounded-full">
                    <CheckCircle2 className="w-4 h-4" />
                    Verified Testimonials
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
                        className="flex items-center gap-3 px-4 py-3 hover:bg-[#f5f6f6] cursor-pointer border-b border-[#f0f2f5] transition-colors"
                    >
                        <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-gray-100 border border-black/5">
                            <img src={contact.avatar} alt={contact.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <div className="flex justify-between items-center mb-0.5">
                                <span className="font-semibold text-[14px] text-[#111b21]">{contact.name}</span>
                                <span className="text-[11px] text-[#667781]">Yesterday</span>
                            </div>
                            <p className="text-[12.5px] text-[#667781] line-clamp-1">
                                {getLastMessage(contact)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Safety Footer / Pattern */}
            <div className="p-4 bg-[#f0f2f5] text-center border-t border-[#d1d7db]">
               <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">End-to-End Encrypted</p>
            </div>
        </div>
    );
};
