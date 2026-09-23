'use client';

import React from 'react';
import {
  MessageSquare,
  Link as LinkIcon,
  Image as ImageIcon,
  CheckCheck,
  Trash2,
  ArrowLeftRight,
} from 'lucide-react';
import type { ChatHistoryMessage } from '@/types/testimonial';
import type { Project } from '@/types/projects';
import { AutoResizeTextarea } from './AutoResizeTextarea';
import { ProjectMessageAttachment } from './ProjectMessageAttachment';
import { ImageMessageAttachment } from './ImageMessageAttachment';

interface ChatMessageBubbleProps {
  msg: ChatHistoryMessage;
  index: number;
  projects: Project[];
  projectId?: string;
  uploadProgress?: number;
  onUpdateMessage: (index: number, updates: Partial<ChatHistoryMessage>) => void;
  onRemoveMessage: (id: number) => void;
  onSetUploadProgress: (messageId: number, progress?: number) => void;
}

export function ChatMessageBubble({
  msg,
  index,
  projects,
  projectId,
  uploadProgress,
  onUpdateMessage,
  onRemoveMessage,
  onSetUploadProgress,
}: ChatMessageBubbleProps) {
  return (
    <div
      className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'} group mb-3 items-end gap-2`}
    >
      <div
        className={`relative max-w-[80%] rounded-lg px-3 pb-1 pt-2 text-[14.2px] shadow-sm ${msg.isMe ? 'rounded-tr-none bg-[#d9fdd3]' : 'rounded-tl-none bg-white'} `}
      >
        {/* Type Selector & Actions */}
        <div className="mb-2 flex items-center justify-between gap-4 border-b border-black/5 pb-1.5">
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() =>
                onUpdateMessage(index, {
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
              type="button"
              onClick={() =>
                onUpdateMessage(index, {
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
              type="button"
              onClick={() => onUpdateMessage(index, { type: 'image', projectId: undefined })}
              className={`flex h-7 w-7 items-center justify-center rounded transition-all ${msg.type === 'image' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-black/5'}`}
              title="Upload/Link Gambar"
            >
              <ImageIcon size={14} />
            </button>
          </div>

          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => onUpdateMessage(index, { isMe: !msg.isMe })}
              className="flex h-7 w-7 items-center justify-center rounded text-gray-400 transition-all hover:bg-green-50 hover:text-green-600"
              title="Tukar Pengirim"
            >
              <ArrowLeftRight size={14} />
            </button>
            <button
              type="button"
              onClick={() => onRemoveMessage(msg.id)}
              className="flex h-7 w-7 items-center justify-center rounded text-gray-300 transition-all hover:bg-red-50 hover:text-red-500"
              title="Hapus Pesan"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Project Selector & Preview */}
        {msg.type === 'project' && (
          <ProjectMessageAttachment
            projectId={msg.projectId}
            projects={projects}
            onSelectProject={(selectedProjectId) =>
              onUpdateMessage(index, { projectId: selectedProjectId })
            }
          />
        )}

        {/* Image URL Input & Project Picker */}
        {msg.type === 'image' && (
          <ImageMessageAttachment
            messageId={msg.id}
            imageSrc={msg.imageSrc}
            projects={projects}
            uploadProgress={uploadProgress}
            onSetUploadProgress={onSetUploadProgress}
            onSelectImageSrc={(selectedSrc) => onUpdateMessage(index, { imageSrc: selectedSrc })}
          />
        )}

        {/* Text Input */}
        <AutoResizeTextarea
          value={msg.text}
          onChange={(e) => onUpdateMessage(index, { text: e.target.value })}
          className="w-full min-w-[200px] resize-none overflow-hidden border-none bg-transparent p-0 leading-[19px] text-[#111b21] focus:ring-0"
          placeholder={
            msg.type === 'project' ? 'Tulis pesan tentang project...' : 'Tulis pesan...'
          }
        />

        {/* Footer: Time & Actions */}
        <div className="mt-1 flex h-4 select-none items-center justify-end gap-1">
          <input
            value={msg.time}
            onChange={(e) => onUpdateMessage(index, { time: e.target.value })}
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
}
