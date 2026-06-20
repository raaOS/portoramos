'use client';

import { useState } from 'react';
import { Pencil, ChevronDown } from 'lucide-react';
import AdminButton from '@/app/admin/components/AdminButton';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminTestimonial } from '@/app/admin/hooks/useAdminTestimonial';
import { Testimonial, ChatHistoryMessage } from '@/types/testimonial';

// Modular Components
import AIGenerator from '@/app/admin/communications/notifications/components/AIGenerator';
import ChatEditor from '@/app/admin/communications/notifications/components/ChatEditor';
import TestimonialCard from '@/app/admin/communications/notifications/components/TestimonialCard';
import AdminLoading from '@/components/admin/AdminLoading';

export default function AdminTestimonialClient() {
  const { csrfToken, isAdmin, isLoading: authLoading } = useAdminAuth();
  const {
    testimonials,
    projects,
    loading,
    isAiGenerating,
    lastUpdated,
    generateAITestimonial,
    createTestimonial,
    updateTestimonial,
    deleteTestimonial,
  } = useAdminTestimonial(csrfToken);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Testimonial>>({
    name: '',
    notificationText: '',
    isActive: true,
    messages: [],
    projectId: '',
  });

  if (authLoading || (loading && testimonials.length === 0)) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <AdminLoading size="page" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Akses Terbatas</h2>
        <p className="mb-6 text-gray-600">
          Silakan login terlebih dahulu untuk mengelola Testimonial.
        </p>
        <a
          href="/admin/login"
          className="rounded-lg bg-green-600 px-6 py-2 font-semibold text-white hover:bg-green-700"
        >
          Login Sekarang
        </a>
      </div>
    );
  }

  const handleAiFill = async (topic: string, count: number) => {
    const data = await generateAITestimonial(topic, count);
    if (data) {
      // Generate unique numeric IDs per-message. Sebelumnya: `Date.now() + idx`
      // yang rentan collision kalau 2 batch di-generate dalam ms yang sama
      // (misal klik tombol generate cepat 2x) → React key conflict & state dedup salah.
      // Sekarang pakai base timestamp + index dengan margin besar agar unik.
      const baseId = Date.now();
      setFormData((prev) => ({
        ...prev,
        name: data.name,
        notificationText: data.notificationText,
        messages: data.messages.map(
          (m: { text?: string; isMe?: boolean; time?: string; status?: string }, idx: number) => ({
            ...m,
            id: baseId * 1000 + idx,
          })
        ),
      }));
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: '', notificationText: '', isActive: true, messages: [], projectId: '' });
  };

  const handleSave = async () => {
    const success = editingId
      ? await updateTestimonial(editingId, formData)
      : await createTestimonial(formData);

    if (success) resetForm();
  };

  return (
    <div className="mt-4 space-y-8">
      <AIGenerator onGenerate={handleAiFill} isLoading={isAiGenerating} />

      {/* Main Form Section */}
      <div className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <Pencil size={20} className="text-violet-600" />
            {editingId ? 'Edit Testimonial' : 'Manual Input'}
          </h2>
          {editingId && (
            <button onClick={resetForm} className="text-sm text-red-500 hover:underline">
              Discard Changes
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-gray-400">
                Nama Kontak
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition-all focus:border-violet-400 focus:bg-white"
                placeholder="Contoh: Pak Budi (Klien)"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-gray-400">
                Link ke Project (Opsional)
              </label>
              <div className="relative">
                <select
                  value={formData.projectId || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, projectId: e.target.value }))}
                  className="w-full cursor-pointer appearance-none rounded-lg border border-gray-200 bg-gray-50 py-3 pl-4 pr-10 text-sm outline-none transition-all focus:border-violet-400 focus:bg-white"
                >
                  <option value="">-- Pilih Project --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-gray-400">
              Pesan Notifikasi (Dynamic Island)
            </label>
            <input
              type="text"
              value={formData.notificationText || ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notificationText: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition-all focus:border-violet-400 focus:bg-white"
              placeholder="Mas, desainnya sudah oke ya!"
            />
          </div>

          <ChatEditor
            messages={formData.messages || []}
            onChange={(msgs: ChatHistoryMessage[]) =>
              setFormData((prev) => ({ ...prev, messages: msgs }))
            }
            projects={projects}
            projectId={formData.projectId}
          />

          <AdminButton
            onClick={handleSave}
            disabled={!formData.name || !formData.notificationText}
            variant="primary"
            className="w-full rounded-lg bg-violet-600 py-3 text-base shadow-lg shadow-violet-200 hover:bg-violet-700"
          >
            {editingId ? 'Simpan Perubahan' : 'Simpan Testimoni'}
          </AdminButton>
        </div>
      </div>

      {/* Database Section */}
      <div className="space-y-6 border-t border-gray-100 pt-12">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Database Testimonial</h3>
            <p className="mt-1 text-sm text-gray-500">Total {testimonials.length} simulasi aktif</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Update Terakhir
            </p>
            <p className="text-sm font-medium text-gray-600">
              {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : '-'}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 opacity-50 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <TestimonialCard
                key={t.id}
                testimonial={t}
                onEdit={() => {
                  setEditingId(t.id);
                  setFormData(t);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onDelete={() => deleteTestimonial(t.id)}
                onToggleStatus={() => updateTestimonial(t.id, { isActive: t.isActive === false })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
