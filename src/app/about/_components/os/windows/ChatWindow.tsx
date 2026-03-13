import React, { useState, useRef, useEffect } from 'react';
import { Send, MoreVertical, Search, CheckCheck, Paperclip, Smile, Mic, BadgeCheck, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { mockChats as initialChats, ContactProfile, ChatMessage } from '../data/mockChats';
import { soundManager } from "../utils/SoundManager";
import { getAvatarUrl } from '@/lib/avatar';
import { Project } from '@/types/projects';
import { isVideoLink } from '@/lib/media';

interface ChatWindowProps {
    activeChatId?: string | null;
    customContacts?: Record<string, ContactProfile>;
}

export default function ChatWindow({ activeChatId, customContacts }: ChatWindowProps) {
    const [input, setInput] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);
    const [activeContact, setActiveContact] = useState<ContactProfile | null>(null);
    const [visibleMessages, setVisibleMessages] = useState<ChatMessage[]>([]);
    const [isRemoteTyping, setIsRemoteTyping] = useState(false);
    const [projects, setProjects] = useState<Record<string, Project>>({});
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [showList, setShowList] = useState(!activeChatId);
    const sequencerRef = useRef<NodeJS.Timeout | null>(null);

    const contactsToUse = customContacts && Object.keys(customContacts).length > 0
        ? customContacts
        : initialChats;

    // Load projects for thumbnails
    useEffect(() => {
        const loadProjects = async () => {
            try {
                const response = await fetch('/api/projects', { cache: 'no-store' });
                const data = await response.json();
                const projectMap: Record<string, Project> = {};
                (data?.data?.projects || []).forEach((p: Project) => {
                    projectMap[p.id] = p;
                    if (p.slug) projectMap[p.slug] = p;
                });
                setProjects(projectMap);
            } catch {
                console.error('Error loading projects for chat');
            }
        };
        loadProjects();
    }, []);

    // When activeChatId changes, switch to that chat
    useEffect(() => {
        if (activeChatId && contactsToUse[activeChatId]) {
            setActiveContact(contactsToUse[activeChatId]);
            setShowList(false);
        } else if (!activeChatId) {
            setShowList(true);
            setActiveContact(null);
        }
    }, [activeChatId, contactsToUse]);

    // Sequencer Logic: Autoplay conversation
    useEffect(() => {
        if (showList || !activeContact) return;

        // Reset visibility
        setVisibleMessages([]);
        setIsRemoteTyping(false);
        if (sequencerRef.current) clearTimeout(sequencerRef.current);

        let currentIndex = 0;
        const fullConversation = activeContact.messages || activeContact.conversation || [];

        const nextStep = () => {
            if (currentIndex >= fullConversation.length) return;

            const msg = fullConversation[currentIndex];

            if (!msg.isMe) {
                setIsRemoteTyping(true);
                sequencerRef.current = setTimeout(() => {
                    setIsRemoteTyping(false);
                    setVisibleMessages(prev => [...prev, msg]);
                    soundManager.play('notification');
                    currentIndex++;
                    sequencerRef.current = setTimeout(nextStep, 1500);
                }, 2000);
            } else {
                setVisibleMessages(prev => [...prev, msg]);
                currentIndex++;
                const delay = msg.type === 'image' ? 2500 : 1000;
                sequencerRef.current = setTimeout(nextStep, delay);
            }
        };

        sequencerRef.current = setTimeout(nextStep, 800);

        return () => {
            if (sequencerRef.current) clearTimeout(sequencerRef.current);
        };
    }, [activeContact, showList]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [visibleMessages, isRemoteTyping]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !activeContact) return;

        const newMessage: ChatMessage = {
            id: Date.now(),
            text: input,
            isMe: true,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'sent' as const,
            type: 'text'
        };

        setVisibleMessages(prev => [...prev, newMessage]);
        setInput('');
        soundManager.play('click');
    };

    const selectContact = (contact: ContactProfile) => {
        setActiveContact(contact);
        setShowList(false);
        setVisibleMessages([]);
    };

    const goBackToList = () => {
        setShowList(true);
        setActiveContact(null);
        setVisibleMessages([]);
        if (sequencerRef.current) clearTimeout(sequencerRef.current);
    };

    // Get last message preview
    const getLastMessage = (contact: ContactProfile) => {
        const messages = contact.messages || contact.conversation || [];
        if (messages.length === 0) return "Tidak ada pesan";
        const lastMsg = messages[messages.length - 1];
        return lastMsg.text.length > 30 ? lastMsg.text.substring(0, 30) + "..." : lastMsg.text;
    };

    // Chat List View
    if (showList) {
        return (
            <div className="flex flex-col h-full w-full bg-white relative overflow-hidden text-[#111b21]">
                {/* List Header */}
                <div className="bg-[#f0f2f5] py-3 px-4 flex items-center justify-between shrink-0 h-[60px] border-b border-[#d1d7db] z-10">
                    {/* Pill Badge Style */}
                    <span className="inline-flex items-center gap-1.5 text-[13px] text-green-600 font-semibold bg-green-50 border border-green-500/30 px-3 py-1.5 rounded-full">
                        <CheckCircle2 className="w-4 h-4" />
                        Verified Testimonials
                    </span>
                    <div className="flex items-center gap-4 text-[#54656f]">
                        <Search size={20} className="cursor-pointer" />
                        <MoreVertical size={20} className="cursor-pointer" />
                    </div>
                </div>

                {/* Contact List */}
                <div className="flex-1 overflow-y-auto bg-white">
                    {Object.values(contactsToUse).map((contact, index) => (
                        <m.div
                            key={contact.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-[#f0f2f5] cursor-pointer border-b border-[#e9edef] transition-colors"
                            onClick={() => selectContact(contact)}
                        >
                            {/* Avatar */}
                            <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-gray-200">
                                {contact.avatar && contact.avatar.startsWith('http') ? (
                                    <Image
                                        src={contact.avatar}
                                        alt={contact.name}
                                        width={48}
                                        height={48}
                                        unoptimized
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-lg font-bold text-white">
                                        {contact.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>

                            {/* Contact Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-[16px] text-[#111b21] truncate">
                                        {contact.name}
                                    </span>
                                    <span className="text-[11px] text-[#667781]">Baru saja</span>
                                </div>
                                <div className="flex items-center gap-1 mt-0.5">
                                    <span className="text-[13px] text-[#667781] truncate flex-1">
                                        {getLastMessage(contact)}
                                    </span>
                                </div>
                            </div>
                        </m.div>
                    ))}
                </div>
            </div>
        );
    }

    // Individual Chat View
    if (!activeContact) return <div className="h-full bg-[#efeae2]"></div>;

    return (
        <div key="chat-window-inner" className="flex flex-col h-full w-full bg-[#efeae2] relative overflow-hidden text-[#111b21]">
            {/* Chat Background Pattern */}
            <div
                key="chat-bg-pattern-os-v2"
                className="absolute inset-0 opacity-100 pointer-events-none z-0"
                style={{
                    backgroundImage: 'url("/assets/whatsapp-bg.webp")',
                    backgroundRepeat: 'repeat',
                    backgroundSize: '400px'
                }}
            ></div>

            {/* Header */}
            <div className="bg-[#f0f2f5] py-2 px-3 flex items-center justify-between shrink-0 h-[60px] border-b border-[#d1d7db] z-10">
                <div className="flex items-center gap-2">
                    {/* Back Button (only show when came from list) */}
                    {!activeChatId && (
                        <button
                            onClick={goBackToList}
                            className="p-1 -ml-1 text-[#54656f] hover:text-[#41525d] transition-colors"
                        >
                            <ArrowLeft size={22} />
                        </button>
                    )}

                    <div className="w-10 h-10 rounded-full overflow-hidden cursor-pointer relative shrink-0">
                        <Image
                            src={activeContact.avatar && activeContact.avatar.startsWith('http') ? activeContact.avatar : getAvatarUrl(activeContact.name)}
                            alt={activeContact.name}
                            width={40}
                            height={40}
                            unoptimized
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="flex flex-col justify-center min-w-0">
                        <h3 className="text-[16px] text-[#111b21] font-semibold leading-none truncate">{activeContact.name}</h3>
                        {isRemoteTyping ? (
                            <span className="text-[11px] text-[#00a884] font-medium mt-0.5 animate-pulse">sedang mengetik...</span>
                        ) : (
                            <span className="text-[11px] text-[#00a884] font-medium flex items-center gap-1 mt-0.5">
                                <BadgeCheck size={14} fill="#00a884" className="text-white" /> Verified Testimonial
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-5 text-[#54656f]">
                    <Search size={20} className="cursor-pointer" />
                    <MoreVertical size={20} className="cursor-pointer" />
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-y-5 z-10 custom-scrollbar relative">
                <AnimatePresence>
                    {visibleMessages.map((msg) => (
                        <m.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            key={msg.id}
                            className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`relative max-w-[85%] rounded-lg px-2 pt-1.5 pb-1 text-[14.2px] 
                                ${msg.isMe ? 'bg-[#d9fdd3] rounded-tr-none' : 'bg-white rounded-tl-none'}`}
                            >
                                <div className="flex flex-col">
                                    {/* Project Thumbnail Bubble */}
                                    {msg.type === 'project' && msg.projectId && (
                                        projects[msg.projectId] ? (
                                            <div
                                                className="mb-2 rounded-md overflow-hidden bg-black/5 border border-black/5 group cursor-pointer relative hover:opacity-90 transition-opacity"
                                                onClick={() => setPreviewImage(projects[msg.projectId!].cover)}
                                            >
                                                {isVideoLink(projects[msg.projectId].cover) ? (
                                                    <video
                                                        src={projects[msg.projectId].cover + '#t=0.1'}
                                                        autoPlay
                                                        muted
                                                        loop
                                                        playsInline
                                                        className="w-full h-auto object-cover max-h-[180px]"
                                                    />
                                                ) : (
                                                    <Image
                                                        src={projects[msg.projectId].cover}
                                                        alt={projects[msg.projectId].title}
                                                        width={300}
                                                        height={200}
                                                        className="w-full h-auto object-cover max-h-[180px]"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iMzAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzAwYTg4NCIvPjx0ZXh0IHg9IjUwJSI yeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNDAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+74uYPC90ZXh0Pjwvc3ZnPg==';
                                                        }}
                                                    />
                                                )}
                                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                                                    <p className="text-white text-[11px] font-bold truncate">{projects[msg.projectId].title}</p>
                                                    <p className="text-white/70 text-[9px]">Klik untuk preview</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mb-2 rounded-md overflow-hidden bg-[#00a884]/10 border border-[#00a884]/20 p-3">
                                                <p className="text-[#00a884] text-xs font-medium">📁 Project: {msg.projectId}</p>
                                                <p className="text-[#667781] text-[10px] mt-1">Loading project...</p>
                                            </div>
                                        )
                                    )}

                                    {/* Image Bubble */}
                                    {msg.type === 'image' && msg.imageSrc && (
                                        <div
                                            className="mb-2 rounded-md overflow-hidden bg-black/5 border border-black/5 cursor-pointer hover:opacity-90 transition-opacity min-h-[100px] flex items-center justify-center bg-gray-100"
                                            onClick={() => setPreviewImage(msg.imageSrc || null)}
                                        >
                                            {isVideoLink(msg.imageSrc) ? (
                                                <video
                                                    src={msg.imageSrc + '#t=0.1'}
                                                    autoPlay={true}
                                                    muted
                                                    loop
                                                    playsInline
                                                    className="w-full h-auto object-cover max-h-[250px]"
                                                />
                                            ) : (
                                                <img
                                                    src={msg.imageSrc}
                                                    alt="Shared media"
                                                    className="w-full h-auto object-cover max-h-[250px]"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMDBhODg0Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5EZXNhaW4gS2VtYXNhbjwvdGV4dD48L3N2Zz4=';
                                                    }}
                                                />
                                            )}
                                        </div>
                                    )}

                                    <p className="text-[#111b21] leading-[19px] break-words whitespace-pre-wrap pr-1">
                                        {msg.text}
                                    </p>
                                    <div className="flex justify-end items-center gap-1 select-none mt-1 h-3">
                                        <span className="text-[11px] text-[#667781] leading-none">{msg.time}</span>
                                        {msg.isMe && (
                                            <m.span
                                                initial={{ color: "#667781" }}
                                                animate={{ color: "#53bdeb" }}
                                                transition={{ delay: 1 }}
                                                className="text-[#53bdeb]"
                                            >
                                                <CheckCheck size={16} strokeWidth={1.5} />
                                            </m.span>
                                        )}
                                    </div>
                                </div>
                                {/* Triangle tip */}
                                <div className={`absolute top-0 w-0 h-0 border-[6px] border-transparent 
                                    ${msg.isMe
                                        ? 'right-[-6px] border-t-[#d9fdd3] border-l-[#d9fdd3]'
                                        : 'left-[-6px] border-t-white border-r-white'
                                    }`}
                                />
                            </div>
                        </m.div>
                    ))}
                    {isRemoteTyping && (
                        <m.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex justify-start"
                        >
                            <div className="bg-white rounded-lg rounded-tl-none px-3 py-2 flex gap-1 items-center">
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                            </div>
                        </m.div>
                    )}
                </AnimatePresence>
                <div ref={bottomRef} />
            </div>

            {/* Footer / Input Area */}
            <div className="bg-[#f0f2f5] px-4 py-2 flex items-center gap-2 shrink-0 z-10 min-h-[62px]">
                <div className="flex gap-4 text-[#54656f]">
                    <Smile size={26} className="cursor-pointer hover:text-[#41525d]" />
                    <Paperclip size={24} className="cursor-pointer hover:text-[#41525d]" />
                </div>
                <form onSubmit={handleSend} className="flex-1 mx-2">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Ketik pesan"
                        className="w-full bg-white rounded-lg px-4 py-[9px] text-[15px] text-[#111b21] placeholder:text-[#667781] focus:outline-none border border-transparent focus:border-white"
                    />
                </form>
                <div className="flex gap-3 text-[#54656f]">
                    {input.trim() ? (
                        <button onClick={handleSend} className="text-[#54656f] hover:text-[#41525d]">
                            <Send size={24} />
                        </button>
                    ) : (
                        <Mic size={24} className="cursor-pointer hover:text-[#41525d]" />
                    )}
                </div>
            </div>

            {/* Image Preview Modal */}
            <AnimatePresence>
                {previewImage && (
                    <m.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4"
                        onClick={() => setPreviewImage(null)}
                    >
                        <div className="relative max-w-full max-h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
                            {isVideoLink(previewImage) ? (
                                <video
                                    src={previewImage + '#t=0.1'}
                                    controls
                                    autoPlay
                                    className="max-w-full max-h-full object-contain rounded-lg"
                                />
                            ) : (
                                <img
                                    src={previewImage}
                                    alt="Preview"
                                    className="max-w-full max-h-full object-contain rounded-lg"
                                />
                            )}
                            <button
                                className="absolute top-2 right-2 text-white/80 hover:text-white p-1 bg-black/50 rounded-md w-8 h-8 flex items-center justify-center text-lg z-10"
                                onClick={() => setPreviewImage(null)}
                            >
                                ✕
                            </button>
                        </div>
                    </m.div>
                )}
            </AnimatePresence>
        </div>
    );
}
