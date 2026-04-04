import React from 'react';
import { Info, Sparkles, Loader2 } from 'lucide-react';
import { AboutIslandNotification } from '@/types/about';

interface NotificationFormRowProps {
    notif: AboutIslandNotification;
    handleUpdate: (id: string, updates: Partial<AboutIslandNotification>) => void;
    handleAiGenerateNotif: (notif: AboutIslandNotification) => Promise<void>;
    generatingNotifId: string | null;
}

export function NotificationFormRow({ notif, handleUpdate, handleAiGenerateNotif, generatingNotifId }: NotificationFormRowProps) {
    return (
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
    );
}
