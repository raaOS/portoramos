import React from 'react';
import { Info, Sparkles, Loader2 } from 'lucide-react';
import { AboutIslandNotification } from '@/types/about';

interface NotificationFormRowProps {
  notif: AboutIslandNotification;
  handleUpdate: (id: string, updates: Partial<AboutIslandNotification>) => void;
  handleAiGenerateNotif: (notif: AboutIslandNotification) => Promise<void>;
  generatingNotifId: string | null;
}

export function NotificationFormRow({
  notif,
  handleUpdate,
  handleAiGenerateNotif,
  generatingNotifId,
}: NotificationFormRowProps) {
  return (
    <div className="space-y-4">
      <div className="mb-2 flex items-center gap-2.5">
        <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 shadow-sm">
          <Info size={18} />
        </div>
        <div>
          <h4 className="text-sm font-black uppercase tracking-tight text-gray-800">
            Detail Notifikasi
          </h4>
          <p className="text-[10px] font-medium text-gray-400">
            Pengaturan utama yang tampil pada Dynamic Island.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 rounded-3xl border border-indigo-50 bg-indigo-50/20 p-6 shadow-inner md:grid-cols-3">
        <div>
          <label className="mb-2 ml-1 block text-[9px] font-black uppercase tracking-[0.2em] text-indigo-300">
            Nama Pengirim
          </label>
          <input
            type="text"
            value={notif.name}
            onChange={(e) => handleUpdate(notif.id, { name: e.target.value })}
            className="w-full rounded-xl border border-indigo-100 bg-white px-4 py-3 text-sm font-bold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Misal: Rini (HRD)"
          />
        </div>
        <div>
          <label className="mb-2 ml-1 block text-[9px] font-black uppercase tracking-[0.2em] text-indigo-300">
            Avatar Profile URL
          </label>
          <input
            type="text"
            value={notif.avatar}
            onChange={(e) => handleUpdate(notif.id, { avatar: e.target.value })}
            className="w-full rounded-xl border border-indigo-100 bg-white px-4 py-3 font-mono text-[10px] shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="https://..."
          />
        </div>
        <div>
          <div className="mb-2 ml-1 flex items-center justify-between">
            <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-indigo-300">
              Pesan Notifikasi
            </label>
            <button
              onClick={() => handleAiGenerateNotif(notif)}
              disabled={generatingNotifId === notif.id}
              className="text-indigo-400 transition-colors hover:text-indigo-600 disabled:opacity-50"
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
            className="w-full rounded-xl border border-indigo-100 bg-white px-4 py-3 text-sm font-bold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Isi pesan di Island..."
          />
        </div>
      </div>
    </div>
  );
}
