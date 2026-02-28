'use client';

import { useState } from 'react';
import { Pencil, MessageSquare, X } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import AdminButton from '../components/AdminButton';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminTestimonial } from '../hooks/useAdminTestimonial';
import { Testimonial } from '@/types/testimonial';

// Modular Components
import AIGenerator from './components/AIGenerator';
import ChatEditor from './components/ChatEditor';
import TestimonialCard from './components/TestimonialCard';

export default function AdminTestimonialClient() {
  const { csrfToken, isAdmin, isLoading: authLoading } = useAdminAuth();
  const {
    testimonials,
    projects,
    loading,
    _error,
    isAiGenerating,
    lastUpdated,
    generateAITestimonial,
    createTestimonial,
    updateTestimonial,
    deleteTestimonial
  } = useAdminTestimonial(csrfToken);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<Testimonial>>({
    name: '',
    notificationText: '',
    isActive: true,
    messages: [],
    projectId: ''
  });

  if (authLoading || (loading && testimonials.length === 0)) {
    return (
      <AdminLayout
        title="WhatsApp Testimonial"
        subtitle="Memuat data..."
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Testimonial' }]}
        titleIcon={<MessageSquare className="h-5 w-5" aria-hidden />}
        titleAccent="bg-green-50 text-green-700"
      >
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mr-3"></div>
          Memuat data...
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AdminLayout
        title="Unauthorized"
        subtitle="Access Denied"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }]}
        titleIcon={<X size={20} />}
        titleAccent="bg-red-50 text-red-700"
      >
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Akses Terbatas</h2>
          <p className="text-gray-600 mb-6">Silakan login terlebih dahulu untuk mengelola Testimonial.</p>
          <a href="/admin/login" className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">Login Sekarang</a>
        </div>
      </AdminLayout>
    );
  }

  const handleAiFill = async (topic: string, count: number) => {
    const data = await generateAITestimonial(topic, count);
    if (data) {
      setFormData(prev => ({
        ...prev,
        name: data.name,
        notificationText: data.notificationText,
        messages: data.messages.map((m: { text?: string; isMe?: boolean; time?: string; status?: string }, idx: number) => ({ ...m, id: Date.now() + idx }))
      }));
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: '', notificationText: '', isActive: true, messages: [], projectId: '' });
  };

  const handleSave = async () => {
    const success = editingId
      ? await updateTestimonial(editingId!, formData)
      : await createTestimonial(formData);

    if (success) resetForm();
  };

  return (
    <AdminLayout
      title="Dynamic Island WA"
      subtitle="Atur simulasi notifikasi WhatsApp di Dynamic Island"
      breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'WhatsApp Notif' }]}
      titleIcon={<MessageSquare className="h-5 w-5" aria-hidden />}
      titleAccent="bg-green-50 text-green-700"
    >
      <div className="space-y-8">
        <AIGenerator onGenerate={handleAiFill} isLoading={isAiGenerating} />

        {/* Main Form Section */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Pencil size={20} className="text-violet-600" />
              {editingId ? 'Edit Testimonial' : 'Manual Input'}
            </h2>
            {editingId && (
              <button onClick={resetForm} className="text-sm text-red-500 hover:underline">Discard Changes</button>
            )}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Nama Kontak</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                  placeholder="Contoh: Pak Budi (Klien)"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Link ke Project (Opsional)</label>
                <select
                  value={formData.projectId || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, projectId: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all text-sm"
                >
                  <option value="">-- Pilih Project --</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Pesan Notifikasi (Dynamic Island)</label>
              <input
                type="text"
                value={formData.notificationText || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, notificationText: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                placeholder="Mas, desainnya sudah oke ya!"
              />
            </div>

            <ChatEditor
              messages={formData.messages || []}
              onChange={(msgs) => setFormData(prev => ({ ...prev, messages: msgs }))}
              projects={projects}
              projectId={formData.projectId}
            />

            <AdminButton
              onClick={handleSave}
              disabled={!formData.name || !formData.notificationText}
              variant="primary"
              className="w-full bg-violet-600 hover:bg-violet-700 py-3 rounded-xl shadow-lg shadow-violet-200 text-base"
            >
              {editingId ? 'Simpan Perubahan' : 'Simpan Testimoni'}
            </AdminButton>
          </div>
        </div>

        {/* Database Section */}
        <div className="space-y-6 pt-12 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Database Testimonial</h3>
              <p className="text-sm text-gray-500 mt-1">Total {testimonials.length} simulasi aktif</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Update Terakhir</p>
              <p className="text-sm font-medium text-gray-600">{lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : '-'}</p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-50">
              {[1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <TestimonialCard
                  key={t.id}
                  testimonial={t}
                  onEdit={() => { setEditingId(t.id); setFormData(t); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  onDelete={() => deleteTestimonial(t.id)}
                  onToggleStatus={() => updateTestimonial(t.id, { isActive: t.isActive === false })}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
