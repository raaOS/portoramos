import React, { useRef, useEffect } from 'react';
import { MessageSquare, Plus, Trash2, Clock, Check, Sparkles, Wand2, Loader2 } from 'lucide-react';
import { AboutIslandNotification, ChatMessage } from '@/types/about';

interface ConversationManagerRowProps {
    notif: AboutIslandNotification;
    handleUpdate: (id: string, updates: Partial<AboutIslandNotification>) => void;
    handleAiGenerate: (notif: AboutIslandNotification) => Promise<void>;
    generatingAiId: string | null;
}

export function ConversationManagerRow({ notif, handleUpdate, handleAiGenerate, generatingAiId }: ConversationManagerRowProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-resize chat textareas and auto-scroll to bottom
    useEffect(() => {
        if (!scrollRef.current) return;

        // Auto-resize chat bubbles only
        const textareas = scrollRef.current.querySelectorAll('textarea.chat-textarea');
        textareas.forEach(ta => {
            const el = ta as HTMLTextAreaElement;
            el.style.height = 'auto';
            el.style.height = `${el.scrollHeight}px`;
        });

        // Auto-scroll to bottom when conversation changes
        const scrollContainer = scrollRef.current;
        scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: 'smooth'
        });
    }, [notif.conversation]);

    return (
        <div className="space-y-4 border-t border-gray-50 pt-8">
            {/* Magic AI Helper Section */}
            <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 p-4 border border-violet-100 rounded-3xl mb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-sm font-bold text-violet-900 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-violet-600" />
                            Magic AI Chat Helper
                        </h4>
                        <p className="text-[10px] text-violet-600 mt-0.5 font-medium">
                            Generate alur chat otomatis berdasarkan pengirim & pesan di atas.
                        </p>
                    </div>

                    <button
                        onClick={() => handleAiGenerate(notif)}
                        disabled={generatingAiId === notif.id}
                        className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow-lg shadow-violet-200 transition-all disabled:opacity-50"
                    >
                        {generatingAiId === notif.id ? (
                            <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Thinking...
                            </>
                        ) : (
                            <>
                                <Wand2 className="w-3 h-3" />
                                Generate Chat
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 text-green-600 rounded-lg shadow-sm border border-green-100">
                        <MessageSquare size={20} />
                    </div>
                    <div>
                        <h4 className="font-black text-gray-800 text-sm uppercase tracking-tight">Kustomisasi Chat WA</h4>
                        <p className="text-[10px] text-gray-400 font-medium">Alur percakapan setelah notifikasi diklik.</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-auto">
                    <div className="flex flex-col items-end mr-1">
                        <span className="text-[9px] font-black text-indigo-300 uppercase tracking-[0.2em] leading-none mb-1.5">Status Online</span>
                        <input
                            type="text"
                            value={notif.status || ''}
                            onChange={(e) => handleUpdate(notif.id, { status: e.target.value })}
                            className="text-right text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded border-none focus:ring-0 placeholder:text-gray-300 w-28"
                            placeholder="Online"
                        />
                    </div>
                    <button
                        onClick={() => {
                            const newMsg: ChatMessage = {
                                id: Date.now(),
                                text: 'Pesan baru...',
                                isMe: false,
                                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                status: 'read'
                            };
                            handleUpdate(notif.id, { conversation: [...(notif.conversation || []), newMsg] });
                        }}
                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-md text-xs font-black uppercase tracking-tighter"
                    >
                        <Plus size={16} /> Tambah Balon Chat
                    </button>
                </div>
            </div>

            <div ref={scrollRef} className="space-y-5 p-3 md:p-4 bg-gray-50/50 rounded-[2rem] border border-gray-200/50 shadow-inner custom-scrollbar relative overflow-hidden">
                <div className="max-h-[600px] overflow-y-auto pr-2 space-y-6">
                    {(notif.conversation || []).map((msg: ChatMessage, idx: number) => (
                        <div key={msg.id} className={`flex items-start gap-4 group/msg ${msg.isMe ? 'flex-row-reverse' : 'flex-row'} animate-in zoom-in-95 duration-300`}>
                            {/* Avatar icon in chat for Them */}
                            {!msg.isMe && (
                                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md shrink-0 mt-2">
                                    <img src={notif.avatar} alt={notif.name} className="w-full h-full object-cover" />
                                </div>
                            )}

                            <div className={`pt-3 pb-3 px-4 rounded-2xl flex-1 max-w-[100%] transition-all border ${msg.isMe ? 'bg-[#DCF8C6] text-gray-800 rounded-tr-none border-[#beddb0]' : 'bg-white text-gray-800 rounded-tl-none border-black/10'}`}>
                                <div className="flex flex-col gap-2">
                                    {/* Participant Label at the TOP */}
                                    <div className={`flex items-center gap-1.5 ${msg.isMe ? 'flex-row' : 'flex-row'}`}>
                                        {msg.isMe && <div className="w-2 h-2 rounded-full bg-green-500" />}
                                        <button
                                            onClick={() => {
                                                const newConv = [...(notif.conversation || [])];
                                                newConv[idx] = { ...msg, isMe: !msg.isMe };
                                                handleUpdate(notif.id, { conversation: newConv });
                                            }}
                                            className={`text-[9px] font-black uppercase tracking-widest transition-all border-none outline-none focus:outline-none ${msg.isMe ? 'text-green-700' : 'text-gray-400'} hover:opacity-100 flex items-center gap-1`}
                                        >
                                            {msg.isMe ? 'SAYA (DESIGNER)' : 'DIA (GUEST)'}
                                        </button>
                                    </div>
                                    <textarea
                                        value={msg.text}
                                        onChange={(e) => {
                                            const newConv = [...(notif.conversation || [])];
                                            newConv[idx] = { ...msg, text: e.target.value };
                                            handleUpdate(notif.id, { conversation: newConv });
                                        }}
                                        rows={1}
                                        className="chat-textarea w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-semibold md:text-base resize-none overflow-hidden placeholder:text-gray-400 tracking-tight leading-normal"
                                        placeholder="Tulis pesan..."
                                        onInput={(e) => {
                                            const target = e.target as HTMLTextAreaElement;
                                            target.style.height = 'auto';
                                            target.style.height = `${target.scrollHeight}px`;
                                        }}
                                    />

                                    <div className={`flex items-center gap-3 border-t border-black/5 pt-2 mt-1 ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`flex items-center gap-1 ${msg.isMe ? 'opacity-60' : 'opacity-40'}`}>
                                            <Clock size={11} />
                                            <input
                                                type="text"
                                                value={msg.time}
                                                onChange={(e) => {
                                                    const newConv = [...(notif.conversation || [])];
                                                    newConv[idx] = { ...msg, time: e.target.value };
                                                    handleUpdate(notif.id, { conversation: newConv });
                                                }}
                                                className="w-10 bg-transparent border-none focus:ring-0 p-0 text-[10px] font-bold"
                                            />
                                        </div>
                                        <div className={`flex -space-x-1.5 ${msg.isMe ? 'text-blue-500' : 'opacity-40 text-blue-500'}`}>
                                            <Check size={12} strokeWidth={3} />
                                            <Check size={12} strokeWidth={3} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    if (confirm('Hapus balon chat ini?')) {
                                        const newConv = (notif.conversation || []).filter((m: ChatMessage) => m.id !== msg.id);
                                        handleUpdate(notif.id, { conversation: newConv });
                                    }
                                }}
                                className="p-3 text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-2xl opacity-0 group-hover/msg:opacity-100 transition-all shrink-0 self-center"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    ))}
                </div>

                {(notif.conversation || []).length === 0 && (
                    <div className="py-24 text-center bg-white/50 rounded-[2rem] border-2 border-dashed border-indigo-100/50">
                        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <MessageSquare className="w-10 h-10 text-indigo-200" />
                        </div>
                        <h5 className="text-gray-400 text-base font-black uppercase tracking-[0.2em]">Belum Ada Chat</h5>
                        <p className="text-xs text-gray-300 mt-2 max-w-[250px] mx-auto font-medium">Mulai buat percakapan dengan menekan tombol Tambah Balon Chat di atas.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
