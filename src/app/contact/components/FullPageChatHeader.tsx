import React from 'react';
import { Video, Phone, MoreVertical } from 'lucide-react';

export default function FullPageChatHeader() {
    return (
        <div className="bg-[#00a884] dark:bg-[#202c33] px-4 py-4 flex items-center justify-between shrink-0 shadow-md z-20">
            <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0 border border-white/20">
                    <img 
                        src={`https://ui-avatars.com/api/?background=ffffff&color=000000&name=R&size=128&bold=true&length=1`} 
                        alt="Ramos" 
                        className="w-full h-full object-cover" 
                    />
                </div>

                <div className="flex flex-col">
                    <span className="font-semibold text-white text-base leading-tight">Ramos</span>
                    <span className="text-white/80 text-xs font-medium">Online</span>
                </div>
            </div>

            <div className="flex items-center gap-4 text-white">
                <Video className="w-5 h-5 opacity-80 cursor-not-allowed" />
                <Phone className="w-5 h-5 opacity-80 cursor-not-allowed" />
                <MoreVertical className="w-5 h-5 opacity-80 cursor-not-allowed" />
            </div>
        </div>
    );
}
