import React, { useState } from 'react';
import { Plus, Trash2, Save, Bell, Eye, EyeOff, Pencil, X } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { AboutIslandNotification } from '@/types/about';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useConfirm } from '@/components/admin/ConfirmDialog';

// Subcomponents
import { NotificationFormRow } from './notification-manager/NotificationFormRow';
import { ConversationManagerRow } from './notification-manager/ConversationManagerRow';

interface NotificationsManagerProps {
  notifications: AboutIslandNotification[];
  onUpdate: (notifications: AboutIslandNotification[]) => void;
}

export default function NotificationsManager({
  notifications,
  onUpdate,
}: NotificationsManagerProps) {
  const [localNotifications, setLocalNotifications] = useState<AboutIslandNotification[]>(
    notifications || []
  );
  const [selectedNotifId, setSelectedNotifId] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();
  const { csrfToken } = useAdminAuth();
  const { confirm } = useConfirm();
  const [saving, setSaving] = useState(false);
  const [generatingAiId, setGeneratingAiId] = useState<string | null>(null);
  const [generatingNotifId, setGeneratingNotifId] = useState<string | null>(null);

  const handleAdd = () => {
    const newNotif: AboutIslandNotification = {
      id: crypto.randomUUID(),
      name: 'Nama Pengirim',
      message: 'Isi pesan notifikasi...',
      avatar:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop',
      isActive: true,
      conversation: [],
      status: 'Online',
    };
    setLocalNotifications([...localNotifications, newNotif]);
    setSelectedNotifId(newNotif.id); // Langsung buka mode edit untuk notifikasi baru
  };

  const handleUpdate = (id: string, updates: Partial<AboutIslandNotification>) => {
    setLocalNotifications(
      localNotifications.map((n: AboutIslandNotification) =>
        n.id === id ? { ...n, ...updates } : n
      )
    );
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Hapus notifikasi?',
      message: 'Notifikasi ini akan dihapus dari daftar Dynamic Island.',
      confirmText: 'Hapus',
      cancelText: 'Batal',
      tone: 'danger',
    });
    if (ok) {
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
          'x-csrf-token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ senderName: notif.name }),
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
          'x-csrf-token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({
          senderName: notif.name,
          notifMessage: notif.message,
        }),
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
        id: timestamp + i,
      }));

      handleUpdate(notif.id, {
        conversation: [...(notif.conversation || []), ...sanitizedMessages],
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
      <div className="flex items-start justify-between gap-4 rounded-lg border border-indigo-200 bg-indigo-50 p-4 sm:items-center">
        <div>
          <h3 className="flex items-center gap-2 font-bold text-indigo-800">
            <Bell className="h-5 w-5" /> Kelola Notifikasi Dynamic Island
          </h3>
          <p className="mt-1 text-sm italic text-indigo-600">
            Klik ikon Edit untuk menyesuaikan data pengirim dan alur chatting WhatsApp.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-white px-4 py-2 text-sm font-bold text-indigo-700 transition-colors hover:bg-slate-50"
          >
            <Plus size={16} /> Tambah
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save size={16} /> {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>

      {/* List View Container */}
      <div className="mb-20 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {/* Table Header - Desktop Only */}
        <div className="hidden grid-cols-[80px_1fr_120px] items-center border-b border-gray-200 bg-gray-50 px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 md:grid">
          <div>Avatar</div>
          <div className="text-center">Status Notifikasi</div>
          <div className="text-right">Actions</div>
        </div>

        <div className="divide-y divide-gray-100">
          {localNotifications.map((notif: AboutIslandNotification) => (
            <div
              key={notif.id}
              className={`group px-2 py-6 transition-colors hover:bg-indigo-50/20 md:px-3 ${!notif.isActive ? 'bg-gray-50/50' : ''}`}
            >
              <div className="flex flex-col items-center gap-4 md:grid md:grid-cols-[80px_1fr_120px]">
                {/* Avatar */}
                <div className="relative w-[60px] shrink-0">
                  <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-white bg-gray-100 shadow-sm ring-2 ring-indigo-50">
                    <img
                      src={notif.avatar}
                      alt={notif.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${notif.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                  ></div>
                </div>

                {/* Status Toggle */}
                <div className="flex justify-center">
                  <button
                    onClick={() => handleUpdate(notif.id, { isActive: !notif.isActive })}
                    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all ${
                      notif.isActive ? 'text-green-600' : 'text-gray-400'
                    }`}
                  >
                    {notif.isActive ? (
                      <>
                        <Eye size={12} strokeWidth={3} /> Aktif
                      </>
                    ) : (
                      <>
                        <EyeOff size={12} strokeWidth={3} /> Draft
                      </>
                    )}
                  </button>
                </div>

                {/* Actions */}
                <div className="flex w-full items-center justify-end gap-2 md:w-auto">
                  <button
                    onClick={() =>
                      setSelectedNotifId(selectedNotifId === notif.id ? null : notif.id)
                    }
                    className={`rounded-lg p-2 transition-all ${
                      selectedNotifId === notif.id
                        ? 'bg-amber-100 text-amber-600'
                        : 'text-indigo-600 hover:bg-indigo-50 active:bg-indigo-100'
                    }`}
                    title={selectedNotifId === notif.id ? 'Tutup' : 'Edit'}
                  >
                    {selectedNotifId === notif.id ? <X size={20} /> : <Pencil size={20} />}
                  </button>
                  <button
                    onClick={() => handleDelete(notif.id)}
                    className="inline-flex items-center justify-center rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                    title="Hapus"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {selectedNotifId === notif.id && (
                <div className="animate-in fade-in slide-in-from-top-4 mt-6 border-t border-gray-100 pb-4 pt-8 duration-500 ease-out">
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
          <div className="bg-gray-50 py-20 text-center">
            <Bell className="mx-auto mb-4 h-16 w-16 text-gray-200 opacity-50" />
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">
              Belum ada notifikasi
            </h3>
            <p className="mt-2 text-xs text-gray-300">
              Buat notifikasi pertama Anda untuk menghidupkan Dynamic Island.
            </p>
            <button
              onClick={handleAdd}
              className="mt-6 rounded-lg bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700"
            >
              Tambah Sekarang
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
