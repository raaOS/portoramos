'use client';

import React, { useState } from 'react';
import { Image as ImageIcon, Wand2, Plus } from 'lucide-react';
import type { ChatHistoryMessage } from '@/types/testimonial';
import type { Project } from '@/types/projects';
import { extractStoragePath } from '@/lib/media';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import { ChatMessageBubble } from './chat-editor/ChatMessageBubble';

interface ChatEditorProps {
  messages: ChatHistoryMessage[];
  onChange: (messages: ChatHistoryMessage[]) => void;
  projects: Project[];
  projectId?: string;
}

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
          await fetch(`/api/admin/upload?path=${encodeURIComponent(storagePath)}`, {
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

  const handleSetUploadProgress = (messageId: number, progress?: number) => {
    setUploadProgressById((prev) => {
      const next = { ...prev };
      if (progress === undefined) {
        delete next[messageId];
      } else {
        next[messageId] = progress;
      }
      return next;
    });
  };

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

      <div className="relative flex h-[500px] flex-col overflow-hidden rounded-lg border border-green-100 bg-[#efeae2] shadow-inner">
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-100"
          style={{
            backgroundImage: 'url("/assets/whatsapp-bg.webp")',
            backgroundRepeat: 'repeat',
            backgroundSize: '400px',
          }}
        ></div>

        <div className="custom-scrollbar z-10 flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((msg, index) => (
            <ChatMessageBubble
              key={msg.id}
              msg={msg}
              index={index}
              projects={projects}
              projectId={projectId}
              uploadProgress={uploadProgressById[msg.id]}
              onUpdateMessage={updateMessage}
              onRemoveMessage={removeMessage}
              onSetUploadProgress={handleSetUploadProgress}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
