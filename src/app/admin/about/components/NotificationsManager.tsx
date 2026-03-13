import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Save, Bell, Eye, EyeOff, MessageSquare, Clock, Check, Pencil, X, Info, Sparkles, Wand2, Loader2 } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { AboutIslandNotification, ChatMessage } from '@/types/about';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface NotificationsManagerProps {
    notifications: AboutIslandNotification[];
    onUpdate: (notifications: AboutIslandNotification[]) => void;
}

export default function NotificationsManager({ notifications, onUpdate }: NotificationsManagerProps) {
    const [localNotifications, setLocalNotifications] = useState<AboutIslandNotification[]>(notifications || []);
    const [selectedNotifId, setSelectedNotifId] = useState<string | null>(null);
    const { showSuccess, showError } = useToast();
    const { csrfToken } = useAdminAuth();
    const [saving, setSaving] = useState(false);
    const [generatingAiId, setGeneratingAiId] = useState<string | null>(null);
    const [generatingNotifId, setGeneratingNotifId] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleAdd = () => {
        const newNotif: AboutIslandNotification = {
            id: crypto.randomUUID(),
            name: 'Nama Pengirim',
            message: 'Isi pesan notifikasi...',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop',
            isActive: true,
            conversation: [],
            status: 'Online'
        };
        setLocalNotifications([...localNotifications, newNotif]);
        setSelectedNotifId(newNotif.id); // Langsung buka mode edit untuk notifikasi baru
    };

    const handleUpdate = (id: string, updates: Partial<AboutIslandNotification>) => {
        setLocalNotifications(localNotifications.map((n: AboutIslandNotification) => n.id === id ? { ...n, ...updates } : n));
    };

    const handleDelete = (id: string) => {
        if (confirm('Apakah Anda yakin ingin menghapus notifikasi ini?')) {
            setLocalNotifications(localNotifications.filter((n: AboutIslandNotification) => n.id !== id));
            if (selectedNotifId === id) setSelectedNotifId(null);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await onUpdate(localNotifications);
            showSuccess('Daftar notifikasi berhasil diperbarui.');
        } catch {
            showError('Gagal memperbarui notifikasi.');
        } finally {
            setSaving(false);
        }
    };

    const handleAiGenerateNotif = async (notif: AboutIslandNotification) => {
        try {
            setGeneratingNotifId(notif.id);
            const res = await fetch('/api/ai/generate-notif-message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken
                },
                credentials: 'include',
                body: JSON.stringify({ senderName: notif.name })
            });

            if (!res.ok) throw new Error('AI Generation failed');

            const data = await res.json();
            handleUpdate(notif.id, { message: data.message });
            showSuccess('Pesan notifikasi berhasil di-generate!');
        } catch {
            showError('Gagal generate pesan.');
        } finally {
            setGeneratingNotifId(null);
        }
    };

    const handleAiGenerate = async (notif: AboutIslandNotification) => {
        try {
            setGeneratingAiId(notif.id);
            const res = await fetch('/api/ai/generate-conversation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken
                },
                credentials: 'include',
                body: JSON.stringify({
                    senderName: notif.name,
                    notifMessage: notif.message
                })
            });

            if (!res.ok) throw new Error('AI Generation failed');

            const generatedMessages = await res.json();

            // Suffix IDs to avoid collision and ensure uniqueness
            const timestamp = Date.now();
            interface GeneratedMessage {
                text: string;
                isMe: boolean;
                time: string;
                status: 'sent' | 'delivered' | 'read';
            }

            const sanitizedMessages = generatedMessages.map((msg: GeneratedMessage, i: number) => ({
                ...msg,
                id: timestamp + i
            }));

            handleUpdate(notif.id, {
                conversation: [...(notif.conversation || []), ...sanitizedMessages]
            });

            showSuccess('AI berhasil membuatkan kelanjutan chat!');
        } catch {
            showError('Gagal generate chat via AI.');
        } finally {
            setGeneratingAiId(null);
        }
    };

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
    }, [localNotifications, selectedNotifId]);

    return (
        <div className="space-y-6">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-start sm:items-center justify-between gap-4">
                <div>
                    <h3 className="font-bold text-indigo-800 flex items-center gap-2">
                        <Bell className="w-5 h-5" /> Kelola Notifikasi Dynamic Island
                    </h3>
                    <p className="text-sm text-indigo-600 mt-1 italic">
                        Klik ikon Edit untuk menyesuaikan data pengirim dan alur chatting WhatsApp.
                    </p>
                </div>
                <div className="flex gap-2 shrink-0">
                    <button
                        onClick={handleAdd}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-700 border border-indigo-200 rounded-lg hover:bg-slate-50 transition-colors text-sm font-bold"
                    >
                        <Plus size={16} /> Tambah
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-bold shadow-lg shadow-indigo-200 disabled:opacity-50"
                    >
                        <Save size={16} /> {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </div>
            </div>

            {/* List View Container */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-20">
                {/* Table Header - Desktop Only */}
                <div className="hidden md:grid grid-cols-[80px_1fr_120px] items-center px-8 py-4 bg-gray-50 border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <div>Avatar</div>
                    <div className="text-center">Status Notifikasi</div>
                    <div className="text-right">Actions</div>
                </div>

                <div className="divide-y divide-gray-100">
                    {localNotifications.map((notif: AboutIslandNotification) => (
                        <div key={notif.id} className={`group px-2 md:px-3 py-6 hover:bg-indigo-50/20 transition-colors ${!notif.isActive ? 'bg-gray-50/50' : ''}`}>
                            <div className="flex flex-col md:grid md:grid-cols-[80px_1fr_120px] items-center gap-4">

                                {/* Avatar */}
                                <div className="w-[60px] relative shrink-0">
                                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm ring-2 ring-indigo-50 bg-gray-100">
                                        <img src={notif.avatar} alt={notif.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-white rounded-full ${notif.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                </div>

                                {/* Status Toggle */}
                                <div className="flex justify-center">
                                    <button
                                        onClick={() => handleUpdate(notif.id, { isActive: !notif.isActive })}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${notif.isActive
                                            ? 'text-green-600'
                                            : 'text-gray-400'
                                            }`}
                                    >
                                        {notif.isActive ? <><Eye size={12} strokeWidth={3} /> Aktif</> : <><EyeOff size={12} strokeWidth={3} /> Draft</>}
                                    </button>
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end items-center gap-2 w-full md:w-auto">
                                    <button
                                        onClick={() => setSelectedNotifId(selectedNotifId === notif.id ? null : notif.id)}
                                        className={`p-2 rounded-lg transition-all ${selectedNotifId === notif.id
                                            ? 'bg-amber-100 text-amber-600'
                                            : 'text-indigo-600 hover:bg-indigo-50 active:bg-indigo-100'
                                            }`}
                                        title={selectedNotifId === notif.id ? "Tutup" : "Edit"}
                                    >
                                        {selectedNotifId === notif.id ? <X size={20} /> : <Pencil size={20} />}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(notif.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Hapus"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            {selectedNotifId === notif.id && (
                                <div className="mt-6 border-t border-gray-100 pt-8 pb-4 animate-in fade-in slide-in-from-top-4 duration-500 ease-out">
                                    <div className="space-y-10">

                                        {/* Row 1: Notification Info (Horizontal on Desktop) */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2.5 mb-2">
                                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shadow-sm">
                                                    <Info size={18} />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-gray-800 text-sm uppercase tracking-tight">Detail Notifikasi</h4>
                                                    <p className="text-[10px] text-gray-400 font-medium">Pengaturan utama yang tampil pada Dynamic Island.</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-indigo-50/20 p-6 rounded-3xl border border-indigo-50 shadow-inner">
                                                <div>
                                                    <label className="text-[9px] font-black text-indigo-300 uppercase tracking-[0.2em] block mb-2 ml-1">Nama Pengirim</label>
                                                    <input
                                                        type="text"
                                                        value={notif.name}
                                                        onChange={(e) => handleUpdate(notif.id, { name: e.target.value })}
                                                        className="w-full text-sm font-bold bg-white border border-indigo-100 rounded-xl px-4 py-3 shadow-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all"
                                                        placeholder="Misal: Rini (HRD)"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] font-black text-indigo-300 uppercase tracking-[0.2em] block mb-2 ml-1">Avatar Profile URL</label>
                                                    <input
                                                        type="text"
                                                        value={notif.avatar}
                                                        onChange={(e) => handleUpdate(notif.id, { avatar: e.target.value })}
                                                        className="w-full text-[10px] font-mono bg-white border border-indigo-100 rounded-xl px-4 py-3 shadow-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all"
                                                        placeholder="https://..."
                                                    />
                                                </div>
                                                <div>
                                                    <div className="flex items-center justify-between mb-2 ml-1">
                                                        <label className="text-[9px] font-black text-indigo-300 uppercase tracking-[0.2em] block">Pesan Notifikasi</label>
                                                        <button
                                                            onClick={() => handleAiGenerateNotif(notif)}
                                                            disabled={generatingNotifId === notif.id}
                                                            className="text-indigo-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
                                                            title="Generate via AI"
                                                        >
                                                            {generatingNotifId === notif.id ? (
                                                                <Loader2 size={12} className="animate-spin" />
                                                            ) : (
                                                                <Sparkles size={12} />
                                                            )}
                                                        </button>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={notif.message}
                                                        onChange={(e) => handleUpdate(notif.id, { message: e.target.value })}
                                                        className="w-full text-sm font-bold bg-white border border-indigo-100 rounded-xl px-4 py-3 shadow-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all"
                                                        placeholder="Isi pesan di Island..."
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Row 2: Conversation History (Full Width) */}
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
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {localNotifications.length === 0 && (
                    <div className="py-20 text-center bg-gray-50">
                        <Bell className="w-16 h-16 text-gray-200 mx-auto mb-4 opacity-50" />
                        <h3 className="text-gray-400 font-black uppercase tracking-widest text-sm">Belum ada notifikasi</h3>
                        <p className="text-gray-300 text-xs mt-2">Buat notifikasi pertama Anda untuk menghidupkan Dynamic Island.</p>
                        <button
                            onClick={handleAdd}
                            className="mt-6 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                        >
                            Tambah Sekarang
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
