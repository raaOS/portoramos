'use client';

import React, { useEffect, useRef } from 'react';
import { MessageSquare, Link as LinkIcon, Image as ImageIcon, User, CheckCheck, Trash2, Plus, Image, ArrowLeftRight } from 'lucide-react';
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
    const addMessage = (type: 'text' | 'image' | 'project' = 'text') => {
        const newMsg: ChatHistoryMessage = {
            id: Date.now(),
            text: type === 'project' ? 'Ini hasil projectnya' : '',
            isMe: true,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: type,
            projectId: type === 'project' ? (projectId || projects[0]?.id || '') : undefined
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

    const getProjectById = (id: string) => projects.find(p => p.id === id || p.slug === id);

    return (
        <div className="pt-4">
            <div className="flex justify-between items-center mb-4">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Alur Percakapan</label>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => addMessage('text')}
                        className="text-xs bg-violet-50 text-violet-600 px-3 py-1.5 rounded-lg hover:bg-violet-100 flex items-center gap-1 font-bold"
                    >
                        <Plus size={14} /> Teks
                    </button>
                    <button
                        type="button"
                        onClick={() => addMessage('project')}
                        className="text-xs bg-green-50 text-green-600 px-3 py-1.5 rounded-lg hover:bg-green-100 flex items-center gap-1 font-bold"
                        aria-label="Tambah link project"
                    >
                        {/* eslint-disable-next-line jsx-a11y/alt-text */}
                        <Image size={14} aria-hidden="true" /> Link Project
                    </button>
                </div>
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
                    {messages.map((msg, index) => {
                        const linkedProject = msg.type === 'project' && msg.projectId ? getProjectById(msg.projectId) : null;

                        return (
                            <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'} group items-end gap-2 mb-3`}>
                                <div className={`relative max-w-[80%] rounded-lg px-3 pt-2 pb-1 shadow-sm text-[14.2px] 
                                    ${msg.isMe ? 'bg-[#d9fdd3] rounded-tr-none' : 'bg-white rounded-tl-none'}
                                `}>
                                    {/* Type Selector & Actions */}
                                    <div className="flex items-center justify-between gap-4 mb-2 border-b border-black/5 pb-1.5">
                                        <div className="flex gap-1.5">
                                            <button
                                                onClick={() => updateMessage(index, { type: 'text', projectId: undefined, imageSrc: undefined })}
                                                className={`w-7 h-7 flex items-center justify-center rounded transition-all ${msg.type === 'text' || !msg.type ? 'bg-black/10 text-black' : 'text-gray-400 hover:bg-black/5'}`}
                                                title="Teks"
                                            >
                                                <MessageSquare size={14} />
                                            </button>
                                            <button
                                                onClick={() => updateMessage(index, { type: 'project', projectId: projectId || projects[0]?.id || '' })}
                                                className={`w-7 h-7 flex items-center justify-center rounded transition-all ${msg.type === 'project' ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:bg-black/5'}`}
                                                title="Link Project"
                                            >
                                                <LinkIcon size={14} />
                                            </button>
                                            <button
                                                onClick={() => updateMessage(index, { type: 'image', projectId: undefined })}
                                                className={`w-7 h-7 flex items-center justify-center rounded transition-all ${msg.type === 'image' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-black/5'}`}
                                                title="Gambar URL"
                                            >
                                                <ImageIcon size={14} />
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => updateMessage(index, { isMe: !msg.isMe })}
                                                className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-all"
                                                title="Tukar Pengirim"
                                            >
                                                <ArrowLeftRight size={14} />
                                            </button>
                                            <button
                                                onClick={() => removeMessage(msg.id)}
                                                className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                                                title="Hapus Pesan"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Project Selector & Preview */}
                                    {msg.type === 'project' && (
                                        <div className="mb-2">
                                            <select
                                                value={msg.projectId || ''}
                                                onChange={(e) => updateMessage(index, { projectId: e.target.value })}
                                                className="w-full bg-white/70 border border-black/10 text-xs rounded-lg p-2 outline-none mb-2"
                                            >
                                                <option value="">-- Pilih Project --</option>
                                                {projects.map(p => (
                                                    <option key={p.id} value={p.id || p.slug}>
                                                        {p.title} {p.client ? `- ${p.client}` : ''}
                                                    </option>
                                                ))}
                                            </select>

                                            {/* Project Preview */}
                                            {linkedProject && (
                                                <div className="bg-white/80 rounded-lg overflow-hidden border border-black/10 mt-2">
                                                    {linkedProject.cover ? (
                                                        <div className="relative h-24 bg-gray-100">
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img
                                                                src={linkedProject.cover}
                                                                alt={`${linkedProject.title} - ${linkedProject.client || 'Project'}`}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                                }}
                                                            />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                                            <div className="absolute bottom-2 left-2 right-2">
                                                                <p className="text-white text-xs font-bold truncate">{linkedProject.title}</p>
                                                                <p className="text-white/80 text-[10px] truncate">{linkedProject.client}</p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="h-16 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                                                            <span className="text-white text-xs font-bold">{linkedProject.title}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Image URL Input */}
                                    {msg.type === 'image' && (
                                        <div className="mb-2">
                                            <input
                                                type="text"
                                                value={msg.imageSrc || ''}
                                                onChange={(e) => updateMessage(index, { imageSrc: e.target.value })}
                                                placeholder="URL Gambar (https://...)"
                                                className="w-full bg-white/70 border border-black/10 text-xs rounded-lg p-2 outline-none mb-2"
                                            />
                                            {msg.imageSrc && (
                                                <div className="mt-2 rounded-lg overflow-hidden bg-gray-100 max-h-32">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={msg.imageSrc}
                                                        alt="Preview"
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Text Input */}
                                    <AutoResizeTextarea
                                        value={msg.text}
                                        onChange={(e) => updateMessage(index, { text: e.target.value })}
                                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-[#111b21] resize-none overflow-hidden leading-[19px] min-w-[200px]"
                                        placeholder={msg.type === 'project' ? 'Tulis pesan tentang project...' : 'Tulis pesan...'}
                                    />

                                    {/* Footer: Time & Actions */}
                                    <div className="flex justify-end items-center gap-1 select-none mt-1 h-4">
                                        <input
                                            value={msg.time}
                                            onChange={(e) => updateMessage(index, { time: e.target.value })}
                                            className="bg-transparent text-[11px] text-[#667781] w-[40px] text-right border-none focus:ring-0 p-0"
                                        />
                                        {msg.isMe && <span className="text-[#53bdeb] ml-0.5"><CheckCheck size={15} strokeWidth={1.5} /></span>}
                                    </div>

                                    {/* Triangle tip */}
                                    <div className={`absolute top-0 w-0 h-0 border-[6px] border-transparent 
                                        ${msg.isMe ? 'right-[-6px] border-t-[#d9fdd3] border-l-[#d9fdd3]' : 'left-[-6px] border-t-white border-r-white'}
                                    `} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
