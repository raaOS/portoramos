import React from 'react';
import { m, AnimatePresence } from 'motion/react';
import { Check, CheckCheck } from 'lucide-react';
import type { ChatMessage } from '../../data/mockChats';
import type { Project } from '@/types/projects';
import { getVideoPosterSource, getVideoPreviewSource, isVideoSource } from '@/lib/mediaPreview';

interface ChatMessagesProps {
  messages: ChatMessage[];
  isTyping: boolean;
  getProjectById: (id: string) => Project | undefined;
  onOpenProject: (project: Project) => void;
  onPreviewMedia: (src: string, title: string, type: 'image' | 'video') => void;
}

const ChatMediaPreview = React.memo(function ChatMediaPreview({
  src,
  alt,
  className,
}: {
  src: string;
  alt?: string;
  className?: string;
}) {
  const isVideo = isVideoSource(src);

  if (isVideo) {
    const previewSrc = getVideoPreviewSource(src);
    const posterSrc = getVideoPosterSource(src);

    return (
      <video
        src={previewSrc}
        poster={posterSrc}
        className={className}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        disablePictureInPicture
      />
    );
  }

  return <img src={src} alt={alt} className={className} loading="lazy" />;
});

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isTyping,
  getProjectById,
  onOpenProject,
  onPreviewMedia,
}) => {
  return (
    <div className="relative flex w-full flex-1 flex-col gap-2 overflow-y-auto bg-[#e5ddd5] px-4 py-4 dark:bg-[#0b141a]">
      {/* Pattern Background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: `url('/assets/whatsapp-bg.webp')`,
          backgroundSize: '400px',
          backgroundRepeat: 'repeat',
        }}
      />

      {/* Date Indicator */}
      <div className="z-10 mb-2 flex w-full justify-center">
        <span className="rounded-md bg-[#d9ddcf] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#54656f] shadow-sm dark:bg-[#1f2c34] dark:text-gray-300">
          Today
        </span>
      </div>

      <div className="z-10 flex w-full flex-col gap-2">
        <AnimatePresence initial={false}>
          {Array.isArray(messages) &&
            messages.map((msg) => {
              const project =
                msg.projectId && typeof getProjectById === 'function'
                  ? getProjectById(msg.projectId)
                  : null;

              // Fallback source for media if project is missing or as a primary source
              const mediaSrc = project?.cover || msg.imageSrc;
              return (
                <m.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex max-w-[85%] flex-col ${msg.isMe ? 'items-end self-end' : 'items-start self-start'} group relative`}
                >
                  <div
                    className={`relative rounded-2xl px-3 py-1.5 text-[13.5px] leading-relaxed shadow-sm ${
                      msg.isMe
                        ? 'rounded-tr-none bg-[#d9fdd3] text-[#111b21] dark:bg-[#005c4b] dark:text-[#e9edef]'
                        : 'rounded-tl-none bg-white text-[#111b21] dark:bg-[#202c33] dark:text-[#e9edef]'
                    }`}
                    style={{ wordBreak: 'break-word' }}
                  >
                    {/* Tail SVG */}
                    <svg
                      viewBox="0 0 8 13"
                      width="8"
                      height="13"
                      className={`absolute top-0 ${msg.isMe ? '-right-[8px] text-[#d9fdd3] dark:text-[#005c4b]' : '-left-[8px] scale-x-[-1] transform text-white dark:text-[#202c33]'} z-20 overflow-visible fill-current`}
                    >
                      <path d="M5.188 0H0v12.191L8 1.733V0h-2.812z"></path>
                    </svg>

                    {/* Message Content */}
                    {(msg.type === 'project' || (msg.type === 'image' && msg.projectId)) && (
                      <m.div
                        whileHover={{ scale: 1.02 }}
                        onClick={() => project && onOpenProject(project)}
                        className="group/card mb-2 block cursor-pointer overflow-hidden rounded-xl border border-black/5 bg-black/5 p-1.5 no-underline dark:bg-white/5"
                      >
                        <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-gray-100">
                          {mediaSrc ? (
                            <ChatMediaPreview
                              src={mediaSrc}
                              alt={project?.title || 'Project Preview'}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-110"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gray-200 dark:bg-gray-800">
                              <span className="text-[10px] font-bold uppercase text-gray-400">
                                No Preview
                              </span>
                            </div>
                          )}
                        </div>
                        {(project || msg.text) && (
                          <div className="p-2">
                            <h4 className="line-clamp-1 text-[12px] font-bold uppercase leading-tight text-[#111b21] dark:text-white">
                              {project?.title || 'Project Preview'}
                            </h4>
                            <p className="mt-0.5 line-clamp-2 text-[10px] text-gray-500 dark:text-gray-400">
                              {project?.description || 'Click to view project details'}
                            </p>
                          </div>
                        )}
                      </m.div>
                    )}

                    {msg.type === 'image' && !msg.projectId && msg.imageSrc && (
                      <div
                        className="mb-2 aspect-[4/3] w-full max-w-[240px] cursor-pointer overflow-hidden rounded-xl border border-black/5 bg-gray-100 transition-opacity hover:opacity-90"
                        onClick={() => {
                          if (msg.imageSrc) {
                            const isVideo =
                              msg.imageSrc.toLowerCase().endsWith('.mp4') ||
                              msg.imageSrc.toLowerCase().endsWith('.webm');
                            onPreviewMedia(
                              msg.imageSrc,
                              'Image Preview',
                              isVideo ? 'video' : 'image'
                            );
                          }
                        }}
                      >
                        <ChatMediaPreview
                          src={msg.imageSrc}
                          alt="Sent image"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}

                    <div className="whitespace-pre-wrap">{msg.text}</div>

                    {/* Time & Read Status */}
                    <div
                      className={`-mb-1 mt-1 flex items-center justify-end gap-1 ${msg.isMe ? 'text-[#667781] dark:text-white/60' : 'text-[#667781] dark:text-white/50'}`}
                    >
                      <span className="text-[9px] font-bold uppercase tracking-tighter">
                        {msg.time}
                      </span>
                      {msg.isMe &&
                        (msg.status === 'read' ? (
                          <CheckCheck className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                        ) : (
                          <Check className="h-3 w-3 text-gray-400" />
                        ))}
                    </div>
                  </div>
                </m.div>
              );
            })}

          {/* Remote Typing Indicator */}
          {isTyping && (
            <m.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="relative flex max-w-[85%] flex-col items-start self-start"
            >
              <div className="relative min-w-[60px] rounded-2xl rounded-tl-none bg-white px-3 py-1.5 text-[#667781] shadow-sm dark:bg-[#202c33] dark:text-[#8696a0]">
                <svg
                  viewBox="0 0 8 13"
                  width="8"
                  height="13"
                  className="absolute -left-[8px] top-0 z-20 scale-x-[-1] transform overflow-visible fill-current text-white dark:text-[#202c33]"
                >
                  <path d="M5.188 0H0v12.191L8 1.733V0h-2.812z"></path>
                </svg>
                <div className="flex items-center justify-center gap-1.5 py-1">
                  <m.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                    className="h-1.5 w-1.5 rounded-full bg-[#8696a0]"
                  />
                  <m.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                    className="h-1.5 w-1.5 rounded-full bg-[#8696a0]"
                  />
                  <m.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                    className="h-1.5 w-1.5 rounded-full bg-[#8696a0]"
                  />
                </div>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
