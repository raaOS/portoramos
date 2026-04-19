import React from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Check, CheckCheck } from 'lucide-react';
import type { ChatMessage } from '../../data/mockChats';
import type { Project } from '@/types/projects';

interface ChatMessagesProps {
    messages: ChatMessage[];
    isTyping: boolean;
    getProjectById: (id: string) => Project | undefined;
    onOpenProject: (project: Project) => void;
    onPreviewMedia: (src: string, title: string, type: 'image' | 'video') => void;
}

const ChatMediaPreview: React.FC<{ src: string; alt?: string; className?: string }> = ({ src, alt, className }) => {
    const isVideo = src.toLowerCase().endsWith('.mp4') || src.toLowerCase().endsWith('.webm');

    if (isVideo) {
        return (
            <video
                src={src}
                className={className}
                autoPlay
                muted
                loop
                playsInline
                disablePictureInPicture
            />
        );
    }

    return <img src={src} alt={alt} className={className} loading="lazy" />;
};

export const ChatMessages: React.FC<ChatMessagesProps> = ({ 
    messages, 
    isTyping, 
    getProjectById,
    onOpenProject,
    onPreviewMedia
}) => {
    return (
        <div className="flex-1 w-full overflow-y-auto px-4 py-4 flex flex-col gap-2 relative bg-[#e5ddd5] dark:bg-[#0b141a]">
            {/* Pattern Background */}
            <div
                className="absolute inset-0 opacity-40 pointer-events-none"
                style={{
                    backgroundImage: `url('/assets/whatsapp-bg.webp')`,
                    backgroundSize: '400px',
                    backgroundRepeat: 'repeat'
                }}
            />

            {/* Date Indicator */}
            <div className="w-full flex justify-center mb-2 z-10">
                <span className="bg-[#d9ddcf] dark:bg-[#1f2c34] text-[#54656f] dark:text-gray-300 text-[11px] px-2.5 py-1 rounded-md uppercase font-bold tracking-wider shadow-sm">
                    Today
                </span>
            </div>

            <div className="flex flex-col gap-2 z-10 w-full">
                <AnimatePresence initial={false}>
                    {Array.isArray(messages) && messages.map((msg) => {
                        const project = (msg.projectId && typeof getProjectById === 'function') 
                            ? getProjectById(msg.projectId) 
                            : null;
                        
                        // Fallback source for media if project is missing or as a primary source
                        const mediaSrc = project?.cover || msg.imageSrc;
                        return (
                            <m.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className={`flex flex-col max-w-[85%] ${msg.isMe ? 'self-end items-end' : 'self-start items-start'} relative group`}
                            >
                                <div
                                    className={`px-3 py-1.5 rounded-2xl shadow-sm text-[13.5px] leading-relaxed relative ${msg.isMe
                                        ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-tr-none'
                                        : 'bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] rounded-tl-none'
                                        }`}
                                    style={{ wordBreak: 'break-word' }}
                                >
                                    {/* Tail SVG */}
                                    <svg viewBox="0 0 8 13" width="8" height="13" className={`absolute top-0 ${msg.isMe ? '-right-[8px] text-[#d9fdd3] dark:text-[#005c4b]' : '-left-[8px] text-white dark:text-[#202c33] transform scale-x-[-1]'} fill-current overflow-visible z-20`}>
                                        <path d="M5.188 0H0v12.191L8 1.733V0h-2.812z"></path>
                                    </svg>

                                    {/* Message Content */}
                                    {(msg.type === 'project' || (msg.type === 'image' && msg.projectId)) && (
                                        <m.div
                                            whileHover={{ scale: 1.02 }}
                                            onClick={() => project && onOpenProject(project)}
                                            className="mb-2 bg-black/5 dark:bg-white/5 rounded-xl p-1.5 overflow-hidden border border-black/5 cursor-pointer block no-underline group/card"
                                        >
                                            <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
                                                {mediaSrc ? (
                                                    <ChatMediaPreview
                                                        src={mediaSrc}
                                                        alt={project?.title || 'Project Preview'}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-800">
                                                        <span className="text-[10px] text-gray-400 uppercase font-bold">No Preview</span>
                                                    </div>
                                                )}
                                            </div>
                                            {(project || msg.text) && (
                                                <div className="p-2">
                                                    <h4 className="text-[12px] font-bold text-[#111b21] dark:text-white leading-tight uppercase line-clamp-1">
                                                        {project?.title || 'Project Preview'}
                                                    </h4>
                                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                                        {project?.description || 'Click to view project details'}
                                                    </p>
                                                </div>
                                            )}
                                        </m.div>
                                    )}

                                    {msg.type === 'image' && !msg.projectId && msg.imageSrc && (
                                        <div 
                                            className="mb-2 rounded-xl overflow-hidden bg-gray-100 border border-black/5 aspect-[4/3] w-full max-w-[240px] cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={() => {
                                                if (msg.imageSrc) {
                                                    const isVideo = msg.imageSrc.toLowerCase().endsWith('.mp4') || msg.imageSrc.toLowerCase().endsWith('.webm');
                                                    onPreviewMedia(msg.imageSrc, 'Image Preview', isVideo ? 'video' : 'image');
                                                }
                                            }}
                                        >
                                            <ChatMediaPreview 
                                                src={msg.imageSrc} 
                                                alt="Sent image" 
                                                className="w-full h-full object-cover" 
                                            />
                                        </div>
                                    )}

                                    <div className="whitespace-pre-wrap">{msg.text}</div>

                                    {/* Time & Read Status */}
                                    <div className={`flex items-center justify-end gap-1 mt-1 -mb-1 ${msg.isMe ? 'text-[#667781] dark:text-white/60' : 'text-[#667781] dark:text-white/50'}`}>
                                        <span className="text-[9px] uppercase font-bold tracking-tighter">{msg.time}</span>
                                        {msg.isMe && (
                                            msg.status === 'read' ? <CheckCheck className="w-3.5 h-3.5 text-blue-500" /> : <Check className="w-3 hot-3 text-gray-400" />
                                        )}
                                    </div>
                                </div>
                            </m.div>
                        );
                    })}

                    {/* Remote Typing Indicator */}
                    {isTyping && (
                        <m.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="flex flex-col max-w-[85%] self-start items-start relative"
                        >
                            <div className="px-3 py-1.5 rounded-2xl shadow-sm bg-white dark:bg-[#202c33] text-[#667781] dark:text-[#8696a0] rounded-tl-none relative min-w-[60px]">
                                <svg viewBox="0 0 8 13" width="8" height="13" className="absolute top-0 -left-[8px] text-white dark:text-[#202c33] fill-current transform scale-x-[-1] overflow-visible z-20">
                                    <path d="M5.188 0H0v12.191L8 1.733V0h-2.812z"></path>
                                </svg>
                                <div className="flex gap-1.5 items-center justify-center py-1">
                                    <m.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-1.5 h-1.5 rounded-full bg-[#8696a0]" />
                                    <m.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-[#8696a0]" />
                                    <m.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-[#8696a0]" />
                                </div>
                            </div>
                        </m.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
