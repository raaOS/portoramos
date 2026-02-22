'use client';

import React, { useEffect, useRef } from 'react';
import { MessageSquare, Link as LinkIcon, Image as ImageIcon, User, CheckCheck, Trash2, Plus } from 'lucide-react';
import { ChatHistoryMessage } from '@/types/testimonial';
import { Project } from '@/types/projects';

interface ChatEditorProps {
    messages: ChatHistoryMessage[];
    onChange: (messages: ChatHistoryMessage[]) => void;
    projects: Project[];
    projectId?: string;
}

const AutoResizeTextarea = ({ value, onChange, className, placeholder }: { value: string, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void, className?: string, placeholder?: string }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [value]);

    return (
        <textarea
            ref={textareaRef}
            value={value}
            onChange={onChange}
            className={className}
            placeholder={placeholder}
            rows={1}
        />
    );
};

export default function ChatEditor({ messages, onChange, projects, projectId }: ChatEditorProps) {
    const addMessage = () => {
        const newMsg: ChatHistoryMessage = {
            id: Date.now(),
            text: '',
            isMe: false,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'text'
        };
        onChange([...messages, newMsg]);
    };

    const updateMessage = (index: number, updates: Partial<ChatHistoryMessage>) => {
        const newMessages = [...messages];
        newMessages[index] = { ...newMessages[index], ...updates };
        onChange(newMessages);
    };

    const removeMessage = (id: number) => {
        onChange(messages.filter(m => m.id !== id));
    };

    return (
        <div className="pt-4">
            <div className="flex justify-between items-center mb-4">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Alur Percakapan</label>
                <button
                    type="button"
                    onClick={addMessage}
                    className="text-xs bg-violet-50 text-violet-600 px-3 py-1.5 rounded-lg hover:bg-violet-100 flex items-center gap-1 font-bold"
                >
                    <Plus size={14} /> Tambah Balasan
                </button>
            </div>

            <div className="bg-[#efeae2] rounded-xl border border-green-100 overflow-hidden relative h-[500px] flex flex-col shadow-inner">
                <div
                    className="absolute inset-0 opacity-100 pointer-events-none z-0"
                    style={{
                        backgroundImage: 'url("/assets/whatsapp-bg.png")',
                        backgroundRepeat: 'repeat',
                        backgroundSize: '400px'
                    }}
                ></div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 z-10 custom-scrollbar">
                    {messages.map((msg, index) => (
                        <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'} group items-end gap-2 mb-3`}>
                            {msg.isMe && (
                                <button
                                    onClick={() => updateMessage(index, { isMe: false })}
                                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-green-600 transition-all"
                                >
                                    <User size={16} />
                                </button>
                            )}

                            <div className={`relative max-w-[70%] rounded-lg px-2 pt-1.5 pb-1 shadow-sm text-[14.2px] 
                ${msg.isMe ? 'bg-[#d9fdd3] rounded-tr-none' : 'bg-white rounded-tl-none'}
              `}>
                                <div className="flex gap-2 mb-2 border-b border-black/5 pb-1.5">
                                    <button
                                        onClick={() => updateMessage(index, { type: 'text' })}
                                        className={`p-1 rounded ${msg.type === 'text' || !msg.type ? 'bg-black/10' : 'hover:bg-black/5'}`}
                                    >
                                        <MessageSquare size={14} />
                                    </button>
                                    <button
                                        onClick={() => updateMessage(index, { type: 'project', projectId: projectId })}
                                        className={`p-1 rounded ${msg.type === 'project' ? 'bg-black/10' : 'hover:bg-black/5'}`}
                                    >
                                        <LinkIcon size={14} />
                                    </button>
                                    <button
                                        onClick={() => updateMessage(index, { type: 'image' })}
                                        className={`p-1 rounded ${msg.type === 'image' ? 'bg-black/10' : 'hover:bg-black/5'}`}
                                    >
                                        <ImageIcon size={14} />
                                    </button>
                                </div>

                                {msg.type === 'project' && (
                                    <select
                                        value={msg.projectId || ''}
                                        onChange={(e) => updateMessage(index, { projectId: e.target.value })}
                                        className="w-full bg-white/50 border-none text-xs rounded p-1 outline-none mb-2"
                                    >
                                        <option value="">-- Pilih Project --</option>
                                        {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                    </select>
                                )}

                                {msg.type === 'image' && (
                                    <input
                                        type="text"
                                        value={msg.imageSrc || ''}
                                        onChange={(e) => updateMessage(index, { imageSrc: e.target.value })}
                                        placeholder="URL Gambar..."
                                        className="w-full bg-white/50 border-none text-xs rounded p-1 outline-none mb-2"
                                    />
                                )}

                                <AutoResizeTextarea
                                    value={msg.text}
                                    onChange={(e) => updateMessage(index, { text: e.target.value })}
                                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-[#111b21] resize-none overflow-hidden leading-[19px] min-w-[200px]"
                                />

                                <div className="flex justify-end items-center gap-1 mt-1 select-none h-4">
                                    <input
                                        value={msg.time}
                                        onChange={(e) => updateMessage(index, { time: e.target.value })}
                                        className="bg-transparent text-[11px] text-[#667781] w-[35px] text-right border-none focus:ring-0 p-0"
                                    />
                                    {msg.isMe && <span className="text-[#53bdeb] ml-0.5"><CheckCheck size={15} strokeWidth={1.5} /></span>}
                                    <button onClick={() => removeMessage(msg.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 ml-2">
                                        <Trash2 size={13} />
                                    </button>
                                </div>

                                <div className={`absolute top-0 w-0 h-0 border-[6px] border-transparent 
                  ${msg.isMe ? 'right-[-6px] border-t-[#d9fdd3] border-l-[#d9fdd3]' : 'left-[-6px] border-t-white border-r-white'}
                `} />
                            </div>

                            {!msg.isMe && (
                                <button
                                    onClick={() => updateMessage(index, { isMe: true })}
                                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-green-600 transition-all font-bold"
                                >
                                    <User size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
