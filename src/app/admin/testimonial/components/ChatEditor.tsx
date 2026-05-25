'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  MessageSquare,
  Link as LinkIcon,
  Image as ImageIcon,
  CheckCheck,
  Trash2,
  Plus,
  ArrowLeftRight,
  Wand2,
} from 'lucide-react';
import { ChatHistoryMessage } from '@/types/testimonial';
import { Project } from '@/types/projects';
import AdminFileUpload from '@/app/admin/components/AdminFileUpload';
import { extractStoragePath, isVideoLink } from '@/lib/media';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useConfirm } from '@/components/admin/ConfirmDialog';

interface ChatEditorProps {
  messages: ChatHistoryMessage[];
  onChange: (messages: ChatHistoryMessage[]) => void;
  projects: Project[];
  projectId?: string;
}

const AutoResizeTextarea = ({
  value,
  onChange,
  className,
  placeholder,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
  placeholder?: string;
}) => {
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

export default function ChatEditor({ messages, onChange, projects, projectId }: ChatEditorProps) {
  const { csrfToken } = useAdminAuth();
  const { confirm } = useConfirm();
  const [uploadProgressById, setUploadProgressById] = useState<Record<number, number>>({});

  const addMessage = (type: 'text' | 'image' | 'project' = 'text') => {
    const newMsg: ChatHistoryMessage = {
      id: Date.now(),
      text: type === 'project' ? 'Ini hasil projectnya' : '',
      isMe: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: type,
      projectId: type === 'project' ? projectId || projects[0]?.id || '' : undefined,
    };
    onChange([...messages, newMsg]);
  };

  const updateMessage = (index: number, updates: Partial<ChatHistoryMessage>) => {
    const newMessages = [...messages];
    newMessages[index] = { ...newMessages[index], ...updates };
    onChange(newMessages);
  };

  const removeMessage = async (id: number) => {
    const msgToDelete = messages.find((m) => m.id === id);
    const storagePath = msgToDelete?.imageSrc ? extractStoragePath(msgToDelete.imageSrc) : null;

    // Physical Cleanup for Direct Uploads
    if (msgToDelete?.imageSrc && storagePath) {
      const confirmDelete = await confirm({
        title: 'Hapus pesan dan file?',
        message:
          'Pesan ini berisi gambar di Storage. Hapus juga file ' +
          'aslinya dari Storage? File yang dihapus tidak bisa dipulihkan.',
        confirmText: 'Hapus Permanen',
        cancelText: 'Batal',
        tone: 'danger',
      });

      if (confirmDelete) {
        try {
          await fetch(`/api/upload?path=${encodeURIComponent(storagePath)}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
              'x-csrf-token': csrfToken || '',
            },
          });
        } catch (e) {
          console.error('Failed to delete physical chat image', e);
        }
      } else {
        return; // Cancel the whole deletion if they didn't want to choose
      }
    }

    onChange(messages.filter((m) => m.id !== id));
  };

  const getProjectById = (id: string) => projects.find((p) => p.id === id || p.slug === id);

  return (
    <div className="pt-4">
      <div className="mb-4 flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400">
          Alur Percakapan
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => addMessage('text')}
            className="flex items-center gap-1 rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-600 hover:bg-violet-100"
          >
            <Plus size={14} /> Teks
          </button>
          <button
            type="button"
            onClick={() => addMessage('image')}
            className="flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-100"
          >
            <ImageIcon size={14} /> Gambar
          </button>
          <button
            type="button"
            onClick={() => addMessage('project')}
            className="flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-bold text-green-600 hover:bg-green-100"
            aria-label="Tambah link project"
          >
            <Wand2 size={14} aria-hidden="true" /> Link Project
          </button>
        </div>
      </div>

      <div className="relative flex h-[500px] flex-col overflow-hidden rounded-xl border border-green-100 bg-[#efeae2] shadow-inner">
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-100"
          style={{
            backgroundImage: 'url("/assets/whatsapp-bg.webp")',
            backgroundRepeat: 'repeat',
            backgroundSize: '400px',
          }}
        ></div>

        <div className="custom-scrollbar z-10 flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((msg, index) => {
            const linkedProject =
              msg.type === 'project' && msg.projectId ? getProjectById(msg.projectId) : null;
            const uploadProgress = uploadProgressById[msg.id];

            return (
              <div
                key={msg.id}
                className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'} group mb-3 items-end gap-2`}
              >
                <div
                  className={`relative max-w-[80%] rounded-lg px-3 pb-1 pt-2 text-[14.2px] shadow-sm ${msg.isMe ? 'rounded-tr-none bg-[#d9fdd3]' : 'rounded-tl-none bg-white'} `}
                >
                  {/* Type Selector & Actions */}
                  <div className="mb-2 flex items-center justify-between gap-4 border-b border-black/5 pb-1.5">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() =>
                          updateMessage(index, {
                            type: 'text',
                            projectId: undefined,
                            imageSrc: undefined,
                          })
                        }
                        className={`flex h-7 w-7 items-center justify-center rounded transition-all ${msg.type === 'text' || !msg.type ? 'bg-black/10 text-black' : 'text-gray-400 hover:bg-black/5'}`}
                        title="Teks"
                      >
                        <MessageSquare size={14} />
                      </button>
                      <button
                        onClick={() =>
                          updateMessage(index, {
                            type: 'project',
                            projectId: projectId || projects[0]?.id || '',
                          })
                        }
                        className={`flex h-7 w-7 items-center justify-center rounded transition-all ${msg.type === 'project' ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:bg-black/5'}`}
                        title="Link Project"
                      >
                        <LinkIcon size={14} />
                      </button>
                      <button
                        onClick={() =>
                          updateMessage(index, { type: 'image', projectId: undefined })
                        }
                        className={`flex h-7 w-7 items-center justify-center rounded transition-all ${msg.type === 'image' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-black/5'}`}
                        title="Upload/Link Gambar"
                      >
                        <ImageIcon size={14} />
                      </button>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => updateMessage(index, { isMe: !msg.isMe })}
                        className="flex h-7 w-7 items-center justify-center rounded text-gray-400 transition-all hover:bg-green-50 hover:text-green-600"
                        title="Tukar Pengirim"
                      >
                        <ArrowLeftRight size={14} />
                      </button>
                      <button
                        onClick={() => removeMessage(msg.id)}
                        className="flex h-7 w-7 items-center justify-center rounded text-gray-300 transition-all hover:bg-red-50 hover:text-red-500"
                        title="Hapus Pesan"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Project Selector & Preview */}
                  {msg.type === 'project' && (
                    <div className="mb-2">
                      <select
                        value={msg.projectId || ''}
                        onChange={(e) => updateMessage(index, { projectId: e.target.value })}
                        className="mb-2 w-full rounded-lg border border-black/10 bg-white/70 p-2 text-xs outline-none"
                      >
                        <option value="">-- Pilih Project --</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id || p.slug}>
                            {p.title} {p.client ? `- ${p.client}` : ''}
                          </option>
                        ))}
                      </select>

                      {/* Project Preview */}
                      {linkedProject && (
                        <div className="mt-2 overflow-hidden rounded-lg border border-black/10 bg-white/80">
                          {linkedProject.cover ? (
                            <div className="relative h-24 bg-gray-100">
                              {isVideoLink(linkedProject.cover) ? (
                                <video
                                  src={linkedProject.cover + '#t=0.1'}
                                  className="h-full w-full object-cover"
                                  autoPlay
                                  muted
                                  loop
                                  playsInline
                                />
                              ) : (
                                <img
                                  src={linkedProject.cover}
                                  alt={`${linkedProject.title} - ${linkedProject.client || 'Project'}`}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                              <div className="absolute bottom-2 left-2 right-2">
                                <p className="truncate text-xs font-bold text-white">
                                  {linkedProject.title}
                                </p>
                                <p className="truncate text-[10px] text-white/80">
                                  {linkedProject.client}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex h-16 items-center justify-center bg-gradient-to-br from-green-400 to-green-600">
                              <span className="text-xs font-bold text-white">
                                {linkedProject.title}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Image URL Input & Project Picker */}
                  {msg.type === 'image' && (
                    <div className="mb-2 space-y-3">
                      {/* Direct Upload Section */}
                      <div className="flex flex-col gap-1.5 rounded-xl border border-blue-100/50 bg-blue-50/30 p-2">
                        <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-blue-600">
                          Upload Langsung
                        </label>
                        <div className="group relative">
                          <div className="rounded-lg border border-blue-100 bg-white p-3 text-center transition-all hover:border-blue-300">
                            <p className="text-[11px] font-medium text-gray-500">
                              {uploadProgress === undefined
                                ? 'Klik atau Drag untuk Upload'
                                : `Uploading ${uploadProgress}%`}
                            </p>
                            {uploadProgress !== undefined && (
                              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-blue-50">
                                <div
                                  className="h-full rounded-full bg-blue-500 transition-all duration-200"
                                  style={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                            )}
                          </div>
                          <div className="absolute inset-0 cursor-pointer overflow-hidden opacity-0">
                            <AdminFileUpload
                              folder="assets/testimonials"
                              multiple={false}
                              onUploadStart={() => {
                                setUploadProgressById((prev) => ({ ...prev, [msg.id]: 0 }));
                              }}
                              onUploadProgress={(progress) => {
                                setUploadProgressById((prev) => ({ ...prev, [msg.id]: progress }));
                              }}
                              onUploadEnd={() => {
                                window.setTimeout(() => {
                                  setUploadProgressById((prev) => {
                                    const next = { ...prev };
                                    delete next[msg.id];
                                    return next;
                                  });
                                }, 800);
                              }}
                              onUpload={(urls) => {
                                if (urls && urls[0]) updateMessage(index, { imageSrc: urls[0] });
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="relative flex items-center py-1">
                        <div className="flex-grow border-t border-gray-200/50"></div>
                        <span className="mx-2 flex-shrink text-[9px] font-bold uppercase tracking-widest text-gray-300">
                          Atau
                        </span>
                        <div className="flex-grow border-t border-gray-200/50"></div>
                      </div>

                      {/* Optional Project Picker for Image Source */}
                      <div className="flex flex-col gap-1">
                        <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Ambil dari Project
                        </label>
                        <select
                          value=""
                          onChange={(e) => {
                            const p = getProjectById(e.target.value);
                            if (p) updateMessage(index, { imageSrc: p.cover });
                          }}
                          className="w-full rounded-lg border border-black/10 bg-white/70 p-2 text-xs outline-none"
                        >
                          <option value="">-- Pilih Project (Auto-fill URL) --</option>
                          {projects.map((p) => (
                            <option key={p.id} value={p.id || p.slug}>
                              {p.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      {msg.imageSrc && (
                        <div className="mt-2 max-h-48 overflow-hidden rounded-lg border border-white/50 bg-gray-100 shadow-lg">
                          {isVideoLink(msg.imageSrc) ? (
                            <video
                              src={msg.imageSrc + '#t=0.1'}
                              className="h-full w-full object-cover"
                              autoPlay
                              muted
                              loop
                              playsInline
                            />
                          ) : (
                            <img
                              src={msg.imageSrc}
                              alt="Preview"
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iMzAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2YxZjFmMSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNDAiIGZpbGw9IiNjY2MiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7im6A8L3RleHQ+PC9zdmc+';
                              }}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Text Input */}
                  <AutoResizeTextarea
                    value={msg.text}
                    onChange={(e) => updateMessage(index, { text: e.target.value })}
                    className="w-full min-w-[200px] resize-none overflow-hidden border-none bg-transparent p-0 leading-[19px] text-[#111b21] focus:ring-0"
                    placeholder={
                      msg.type === 'project' ? 'Tulis pesan tentang project...' : 'Tulis pesan...'
                    }
                  />

                  {/* Footer: Time & Actions */}
                  <div className="mt-1 flex h-4 select-none items-center justify-end gap-1">
                    <input
                      value={msg.time}
                      onChange={(e) => updateMessage(index, { time: e.target.value })}
                      className="w-[40px] border-none bg-transparent p-0 text-right text-[11px] text-[#667781] focus:ring-0"
                    />
                    {msg.isMe && (
                      <span className="ml-0.5 text-[#53bdeb]">
                        <CheckCheck size={15} strokeWidth={1.5} />
                      </span>
                    )}
                  </div>

                  {/* Triangle tip */}
                  <div
                    className={`absolute top-0 h-0 w-0 border-[6px] border-transparent ${msg.isMe ? 'right-[-6px] border-l-[#d9fdd3] border-t-[#d9fdd3]' : 'left-[-6px] border-r-white border-t-white'} `}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
