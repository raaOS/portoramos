import React, { useState } from 'react';
import { Plus, Trash2, Save, Bell, Eye, EyeOff, Pencil, X } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { AboutIslandNotification } from '@/types/about';
import { useAdminAuth } from '@/hooks/useAdminAuth';

// Subcomponents
import { NotificationFormRow } from './notification-manager/NotificationFormRow';
import { ConversationManagerRow } from './notification-manager/ConversationManagerRow';

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
                                        <NotificationFormRow
                                            notif={notif}
                                            handleUpdate={handleUpdate}
                                            handleAiGenerateNotif={handleAiGenerateNotif}
                                            generatingNotifId={generatingNotifId}
                                        />
                                        <ConversationManagerRow
                                            notif={notif}
                                            handleUpdate={handleUpdate}
                                            handleAiGenerate={handleAiGenerate}
                                            generatingAiId={generatingAiId}
                                        />
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
