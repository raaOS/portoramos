'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Testimonial, TestimonialData, ChatHistoryMessage } from '@/types/testimonial';
import { Project } from '@/types/projects';
import AdminButton from '../components/AdminButton';
import AdminLayout from '../components/AdminLayout';
import { useAutoUpdate } from '@/hooks/useAutoUpdate';
import { useToast } from '@/contexts/ToastContext';
import { Quote, Pencil, Trash2, MessageSquare, Plus, User, CheckCheck, Clock, Sparkles, Wand2, Loader2, Eye, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import StatusToggle from '../components/StatusToggle';
import { useAdminAuth } from '@/hooks/useAdminAuth';


import { getAvatarUrl, getAvatarColors } from '@/lib/avatar';

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

export default function AdminTestimonialClient() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // AI Helper States
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState(3);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const [formData, setFormData] = useState<Partial<Testimonial>>({
    name: '',
    notificationText: '',
    isActive: true,
    messages: [],
    projectId: ''
  });

  // Load projects
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        const data = await response.json();
        setProjects(data.projects || []);
      } catch (err) {
        console.error('Error loading projects:', err);
      }
    };
    loadProjects();
  }, []);

  const { showSuccess, showError } = useToast();
  const { csrfToken } = useAdminAuth();

  // Load testimonials
  const loadTestimonials = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/testimonial');
      const data: TestimonialData = await response.json();
      setTestimonials(data.testimonials);
      setError(null);
    } catch (error) {
      console.error('Error loading testimonials:', error);
      setError('Failed to load testimonials');
      showError('Failed to load testimonials.');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const { lastUpdated, refresh } = useAutoUpdate(loadTestimonials);

  // AI Generation Logic
  const handleAiGenerate = async () => {
    if (!aiTopic) {
      showError('Masukkan topik desain dulu!');
      return;
    }

    if (!csrfToken) {
      showError('Sesi belum siap, tunggu sebentar...');
      return;
    }

    setIsAiGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-testimonial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        credentials: 'include',
        body: JSON.stringify({ topic: aiTopic, messageCount: aiCount })
      });

      if (!response.ok) throw new Error('AI Generation failed');

      const data = await response.json();
      setFormData(prev => ({
        ...prev,
        name: data.name,
        notificationText: data.notificationText,
        messages: data.messages.map((m: any, idx: number) => ({
          ...m,
          id: Date.now() + idx
        }))
      }));
      showSuccess('Konten berhasil dibuat oleh AI!');
    } catch (err) {
      console.error(err);
      showError('Gagal generate AI. Coba lagi.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Create testimonial
  const handleCreate = async () => {
    if (!formData.name || !formData.notificationText) return;

    try {
      const response = await fetch('/api/testimonial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setFormData({ name: '', notificationText: '', isActive: true, messages: [] });
        setAiTopic('');
        refresh();
        showSuccess('Testimonial created successfully.');
      } else {
        showError('Failed to create testimonial.');
      }
    } catch (error) {
      console.error('Error creating testimonial:', error);
      showError('Failed to create testimonial.');
    }
  };

  // Update testimonial
  const handleUpdate = async (id: number) => {
    try {
      const response = await fetch('/api/testimonial', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        credentials: 'include',
        body: JSON.stringify({ id, ...formData })
      });

      if (response.ok) {
        setEditingId(null);
        setFormData({ name: '', notificationText: '', isActive: true, messages: [] });
        refresh();
        showSuccess('Testimonial updated successfully.');
      } else {
        showError('Failed to update testimonial.');
      }
    } catch (error) {
      console.error('Error updating testimonial:', error);
      showError('Failed to update testimonial.');
    }
  };

  // Delete testimonial
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return;

    try {
      const response = await fetch('/api/testimonial', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        credentials: 'include',
        body: JSON.stringify({ id })
      });

      if (response.ok) {
        refresh();
        showSuccess('Testimonial deleted successfully.');
      } else {
        showError('Failed to delete testimonial.');
      }
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      showError('Failed to delete testimonial.');
    }
  };

  const handleEdit = (testimonial: Testimonial) => {
    setEditingId(testimonial.id);
    setFormData(testimonial);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ name: '', notificationText: '', isActive: true, messages: [] });
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* MAIN COLUMN: Input & AI & Live Editor */}
          <div className="lg:col-span-12 space-y-6">

            {/* AI Magic Tool Section */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                <Sparkles size={64} className="text-green-600" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-green-600 p-1.5 rounded-lg text-white">
                    <Wand2 size={18} />
                  </div>
                  <h3 className="text-lg font-bold text-green-900">AI Magic Testimonial</h3>
                </div>

                <p className="text-sm text-green-700 mb-6 leading-relaxed">
                  Bantu buatkan testimoni natural (sopan & santai) hanya dengan satu klik.
                </p>

                <div className="flex flex-col md:flex-row gap-3">
                  <input
                    type="text"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-white border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm"
                    placeholder="Contoh: Desain Banner Ads / Manipulasi Produk"
                  />
                  <select
                    value={aiCount}
                    onChange={(e) => setAiCount(Number(e.target.value))}
                    className="px-4 py-2.5 bg-white border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm md:w-32"
                  >
                    <option value={3}>3 Pesan</option>
                    <option value={5}>5 Pesan</option>
                    <option value={7}>7 Pesan</option>
                  </select>
                  <button
                    onClick={handleAiGenerate}
                    disabled={isAiGenerating || !aiTopic}
                    className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-200 disabled:opacity-50"
                  >
                    {isAiGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Generate
                  </button>
                </div>
              </div>
            </div>

            {/* Main Form Section */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Pencil size={20} className="text-violet-600" />
                  {editingId ? 'Edit Testimonial' : 'Manual Input'}
                </h2>
                {editingId && (
                  <button onClick={handleCancel} className="text-sm text-red-500 hover:underline">Discard Changes</button>
                )}
              </div>

              <div className="space-y-4">
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
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Pesan Notifikasi (Dynamic Island)</label>
                  <input
                    type="text"
                    value={formData.notificationText || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, notificationText: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                    placeholder="Mas, desainnya sudah oke ya!"
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
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>

                {/* Message List Editor */}
                <div className="pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Alur Percakapan</label>
                    <button
                      type="button"
                      onClick={() => {
                        const newMsg: ChatHistoryMessage = {
                          id: Date.now(),
                          text: '',
                          isMe: false,
                          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                          type: 'text'
                        };
                        setFormData(prev => ({ ...prev, messages: [...(prev.messages || []), newMsg] }));
                      }}
                      className="text-xs bg-violet-50 text-violet-600 px-3 py-1.5 rounded-lg hover:bg-violet-100 flex items-center gap-1 font-bold"
                    >
                      <Plus size={14} /> Tambah Balasan
                    </button>
                  </div>

                  <div key="chat-container-root" className="bg-[#efeae2] rounded-xl border border-green-100 overflow-hidden relative h-[500px] flex flex-col shadow-inner">
                    {/* WhatsApp Pattern Overlay - Rendered only after mount to prevent hydration mismatch */}
                    {mounted && (
                      <div
                        key="fixed-bg-pattern-vfinal"
                        className="absolute inset-0 opacity-100 pointer-events-none z-0"
                        style={{
                          backgroundImage: 'url("/assets/whatsapp-bg.png")',
                          backgroundRepeat: 'repeat',
                          backgroundSize: '400px'
                        }}
                      ></div>
                    )}

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 z-10 custom-scrollbar">
                      {formData.messages?.map((msg, index) => (
                        <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'} group items-end gap-2 mb-3`}>

                          {/* Swap Button (Left for Me) */}
                          {msg.isMe && (
                            <button
                              onClick={() => {
                                const newMessages = [...(formData.messages || [])];
                                newMessages[index].isMe = !newMessages[index].isMe;
                                setFormData(prev => ({ ...prev, messages: newMessages }));
                              }}
                              className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-green-600 transition-all transform hover:scale-110"
                              title="Ubah jadi pesan Masuk"
                            >
                              <User size={16} />
                            </button>
                          )}

                          <div className={`relative max-w-[70%] rounded-lg px-2 pt-1.5 pb-1 shadow-sm text-[14.2px] 
                            ${msg.isMe ? 'bg-[#d9fdd3] rounded-tr-none' : 'bg-white rounded-tl-none'}
                          `}>
                            {/* Type Selector */}
                            <div className="flex gap-2 mb-2 border-b border-black/5 pb-1.5">
                              <button
                                onClick={() => {
                                  const newMessages = [...(formData.messages || [])];
                                  newMessages[index].type = 'text';
                                  setFormData(prev => ({ ...prev, messages: newMessages }));
                                }}
                                className={`p-1 rounded ${msg.type === 'text' || !msg.type ? 'bg-black/10' : 'hover:bg-black/5'}`}
                                title="Text Message"
                              >
                                <MessageSquare size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  const newMessages = [...(formData.messages || [])];
                                  newMessages[index].type = 'project';
                                  newMessages[index].projectId = formData.projectId;
                                  setFormData(prev => ({ ...prev, messages: newMessages }));
                                }}
                                className={`p-1 rounded ${msg.type === 'project' ? 'bg-black/10' : 'hover:bg-black/5'}`}
                                title="Project Thumbnail"
                              >
                                <LinkIcon size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  const newMessages = [...(formData.messages || [])];
                                  newMessages[index].type = 'image';
                                  setFormData(prev => ({ ...prev, messages: newMessages }));
                                }}
                                className={`p-1 rounded ${msg.type === 'image' ? 'bg-black/10' : 'hover:bg-black/5'}`}
                                title="Custom Image"
                              >
                                <ImageIcon size={14} />
                              </button>
                            </div>

                            {msg.type === 'project' && (
                              <div className="mb-2 p-2 bg-black/5 rounded-lg border border-black/10">
                                <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Linked Project</span>
                                <select
                                  value={msg.projectId || ''}
                                  onChange={(e) => {
                                    const newMessages = [...(formData.messages || [])];
                                    newMessages[index].projectId = e.target.value;
                                    setFormData(prev => ({ ...prev, messages: newMessages }));
                                  }}
                                  className="w-full bg-white/50 border-none text-xs rounded p-1 outline-none"
                                >
                                  <option value="">-- Pilih --</option>
                                  {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.title}</option>
                                  ))}
                                </select>
                              </div>
                            )}

                            {msg.type === 'image' && (
                              <input
                                type="text"
                                value={msg.imageSrc || ''}
                                onChange={(e) => {
                                  const newMessages = [...(formData.messages || [])];
                                  newMessages[index].imageSrc = e.target.value;
                                  setFormData(prev => ({ ...prev, messages: newMessages }));
                                }}
                                placeholder="URL Gambar..."
                                className="w-full bg-white/50 border-none text-xs rounded p-1 outline-none mb-2"
                              />
                            )}

                            {/* Text Input */}
                            <AutoResizeTextarea
                              value={msg.text}
                              onChange={(e) => {
                                const newMessages = [...(formData.messages || [])];
                                newMessages[index].text = e.target.value;
                                setFormData(prev => ({ ...prev, messages: newMessages }));
                              }}
                              className="w-full bg-transparent border-none focus:ring-0 p-0 text-[#111b21] resize-none overflow-hidden leading-[19px] min-w-[300px]"
                              placeholder={msg.type === 'project' || msg.type === 'image' ? 'Ketik caption (opsional)...' : 'Ketik pesan...'}
                            />

                            {/* Meta & Controls */}
                            <div className="flex justify-end items-center gap-1 mt-1 select-none h-4">
                              <input
                                value={msg.time}
                                onChange={(e) => {
                                  const newMessages = [...(formData.messages || [])];
                                  newMessages[index].time = e.target.value;
                                  setFormData(prev => ({ ...prev, messages: newMessages }));
                                }}
                                className="bg-transparent text-[11px] text-[#667781] w-[35px] text-right border-none focus:ring-0 p-0 h-full"
                              />
                              {msg.isMe && (
                                <span className="text-[#53bdeb] ml-0.5">
                                  <CheckCheck size={15} strokeWidth={1.5} />
                                </span>
                              )}

                              <div className="w-[1px] h-3 bg-black/10 mx-1 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                              <button
                                onClick={() => setFormData(prev => ({ ...prev, messages: prev.messages?.filter(m => m.id !== msg.id) }))}
                                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 transition-opacity"
                                title="Hapus pesan"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>

                            {/* Triangle Tip */}
                            <div className={`absolute top-0 w-0 h-0 border-[6px] border-transparent 
                              ${msg.isMe
                                ? 'right-[-6px] border-t-[#d9fdd3] border-l-[#d9fdd3]'
                                : 'left-[-6px] border-t-white border-r-white'
                              }`}
                            />
                          </div>

                          {/* Swap Button (Right for Contact) */}
                          {!msg.isMe && (
                            <button
                              onClick={() => {
                                const newMessages = [...(formData.messages || [])];
                                newMessages[index].isMe = !newMessages[index].isMe;
                                setFormData(prev => ({ ...prev, messages: newMessages }));
                              }}
                              className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-green-600 transition-all transform hover:scale-110"
                              title="Ubah jadi pesan Keluar"
                            >
                              <User size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-6">
                    <AdminButton
                      onClick={editingId ? () => handleUpdate(editingId) : handleCreate}
                      disabled={!formData.name || !formData.notificationText}
                      variant="primary"
                      className="flex-1 bg-violet-600 hover:bg-violet-700 py-3 rounded-xl shadow-lg shadow-violet-200 text-base"
                    >
                      {editingId ? 'Simpan Perubahan' : 'Simpan Testimoni'}
                    </AdminButton>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
      {/* Testimonials Dashboard (Existing List) */}
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
              <div key={t.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-xl transition-all hover:border-violet-200 group relative">
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-full overflow-hidden border border-gray-100 flex items-center justify-center font-bold shrink-0"
                      style={{
                        backgroundColor: `#${getAvatarColors(t.name).bg}`,
                        color: `#${getAvatarColors(t.name).text}`
                      }}
                    >
                      <img src={getAvatarUrl(t.name)} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-900 truncate text-sm">{t.name}</h4>
                      <div className="flex items-center gap-1 text-[10px] text-gray-400">
                        <Clock size={10} /> {t.messages?.length || 0} Chat
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <StatusToggle
                      isActive={t.isActive !== false}
                      onClick={() => {
                        fetch('/api/testimonial', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
                          credentials: 'include',
                          body: JSON.stringify({ id: t.id, isActive: t.isActive === false })
                        }).then(res => res.ok && refresh());
                      }}
                    />
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-xl mb-4 text-xs italic text-gray-600 border border-gray-100 line-clamp-2">
                  "{t.notificationText}"
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-gray-50 pt-4">
                  <button onClick={() => handleEdit(t)} className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-all">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(t.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
