import React, { useRef, useEffect } from 'react';
import { MessageSquare, Plus, Trash2, Clock, Check, Sparkles, Wand2, Loader2 } from 'lucide-react';
import { AboutIslandNotification, ChatMessage } from '@/types/about';
import { useConfirm } from '@/components/admin/ConfirmDialog';

interface ConversationManagerRowProps {
  notif: AboutIslandNotification;
  handleUpdate: (id: string, updates: Partial<AboutIslandNotification>) => void;
  handleAiGenerate: (notif: AboutIslandNotification) => Promise<void>;
  generatingAiId: string | null;
}

export function ConversationManagerRow({
  notif,
  handleUpdate,
  handleAiGenerate,
  generatingAiId,
}: ConversationManagerRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { confirm } = useConfirm();

  // Auto-resize chat textareas and auto-scroll to bottom
  useEffect(() => {
    if (!scrollRef.current) return;

    // Auto-resize chat bubbles only
    const textareas = scrollRef.current.querySelectorAll('textarea.chat-textarea');
    textareas.forEach((ta) => {
      const el = ta as HTMLTextAreaElement;
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    });

    // Auto-scroll to bottom when conversation changes
    const scrollContainer = scrollRef.current;
    scrollContainer.scrollTo({
      top: scrollContainer.scrollHeight,
      behavior: 'smooth',
    });
  }, [notif.conversation]);

  return (
    <div className="space-y-4 border-t border-gray-50 pt-8">
      {/* Magic AI Helper Section */}
      <div className="mb-4 rounded-3xl border border-violet-100 bg-gradient-to-r from-violet-50 to-fuchsia-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="flex items-center gap-2 text-sm font-bold text-violet-900">
              <Sparkles className="h-4 w-4 text-violet-600" />
              Magic AI Chat Helper
            </h4>
            <p className="mt-0.5 text-[10px] font-medium text-violet-600">
              Generate alur chat otomatis berdasarkan pengirim & pesan di atas.
            </p>
          </div>

          <button
            onClick={() => handleAiGenerate(notif)}
            disabled={generatingAiId === notif.id}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-white shadow-lg shadow-violet-200 transition-all hover:bg-violet-700 disabled:opacity-50"
          >
            {generatingAiId === notif.id ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Thinking...
              </>
            ) : (
              <>
                <Wand2 className="h-3 w-3" />
                Generate Chat
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mb-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-green-100 bg-green-50 p-2 text-green-600 shadow-sm">
            <MessageSquare size={20} />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-tight text-gray-800">
              Kustomisasi Chat WA
            </h4>
            <p className="text-[10px] font-medium text-gray-400">
              Alur percakapan setelah notifikasi diklik.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 self-end sm:self-auto">
          <div className="mr-1 flex flex-col items-end">
            <span className="mb-1.5 text-[9px] font-black uppercase leading-none tracking-[0.2em] text-indigo-300">
              Status Online
            </span>
            <input
              type="text"
              value={notif.status || ''}
              onChange={(e) => handleUpdate(notif.id, { status: e.target.value })}
              className="w-28 rounded border-none bg-indigo-50 px-2 py-1 text-right text-xs font-black text-indigo-600 placeholder:text-gray-300 focus:ring-0"
              placeholder="Online"
            />
          </div>
          <button
            onClick={() => {
              const newMsg: ChatMessage = {
                id: Date.now(),
                text: 'Pesan baru...',
                isMe: false,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: 'read',
              };
              handleUpdate(notif.id, { conversation: [...(notif.conversation || []), newMsg] });
            }}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-black uppercase tracking-tighter text-white shadow-md transition-all hover:bg-indigo-700"
          >
            <Plus size={16} /> Tambah Balon Chat
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="custom-scrollbar relative space-y-5 overflow-hidden rounded-[2rem] border border-gray-200/50 bg-gray-50/50 p-3 shadow-inner md:p-4"
      >
        <div className="max-h-[600px] space-y-6 overflow-y-auto pr-2">
          {(notif.conversation || []).map((msg: ChatMessage, idx: number) => (
            <div
              key={msg.id}
              className={`group/msg flex items-start gap-4 ${msg.isMe ? 'flex-row-reverse' : 'flex-row'} animate-in zoom-in-95 duration-300`}
            >
              {/* Avatar icon in chat for Them */}
              {!msg.isMe && (
                <div className="mt-2 h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white shadow-md">
                  <img src={notif.avatar} alt={notif.name} className="h-full w-full object-cover" />
                </div>
              )}

              <div
                className={`max-w-[100%] flex-1 rounded-2xl border px-4 pb-3 pt-3 transition-all ${msg.isMe ? 'rounded-tr-none border-[#beddb0] bg-[#DCF8C6] text-gray-800' : 'rounded-tl-none border-black/10 bg-white text-gray-800'}`}
              >
                <div className="flex flex-col gap-2">
                  {/* Participant Label at the TOP */}
                  <div
                    className={`flex items-center gap-1.5 ${msg.isMe ? 'flex-row' : 'flex-row'}`}
                  >
                    {msg.isMe && <div className="h-2 w-2 rounded-full bg-green-500" />}
                    <button
                      onClick={() => {
                        const newConv = [...(notif.conversation || [])];
                        newConv[idx] = { ...msg, isMe: !msg.isMe };
                        handleUpdate(notif.id, { conversation: newConv });
                      }}
                      className={`border-none text-[9px] font-black uppercase tracking-widest outline-none transition-all focus:outline-none ${msg.isMe ? 'text-green-700' : 'text-gray-400'} flex items-center gap-1 hover:opacity-100`}
                    >
                      {msg.isMe ? 'SAYA (DESIGNER)' : 'DIA (GUEST)'}
                    </button>
                  </div>
                  <textarea
                    value={msg.text}
                    onChange={(e) => {
                      const newConv = [...(notif.conversation || [])];
                      newConv[idx] = { ...msg, text: e.target.value };
                      handleUpdate(notif.id, { conversation: newConv });
                    }}
                    rows={1}
                    className="chat-textarea w-full resize-none overflow-hidden border-none bg-transparent p-0 text-sm font-semibold leading-normal tracking-tight placeholder:text-gray-400 focus:ring-0 md:text-base"
                    placeholder="Tulis pesan..."
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = `${target.scrollHeight}px`;
                    }}
                  />

                  <div
                    className={`mt-1 flex items-center gap-3 border-t border-black/5 pt-2 ${msg.isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`flex items-center gap-1 ${msg.isMe ? 'opacity-60' : 'opacity-40'}`}
                    >
                      <Clock size={11} />
                      <input
                        type="text"
                        value={msg.time}
                        onChange={(e) => {
                          const newConv = [...(notif.conversation || [])];
                          newConv[idx] = { ...msg, time: e.target.value };
                          handleUpdate(notif.id, { conversation: newConv });
                        }}
                        className="w-10 border-none bg-transparent p-0 text-[10px] font-bold focus:ring-0"
                      />
                    </div>
                    <div
                      className={`flex -space-x-1.5 ${msg.isMe ? 'text-blue-500' : 'text-blue-500 opacity-40'}`}
                    >
                      <Check size={12} strokeWidth={3} />
                      <Check size={12} strokeWidth={3} />
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={async () => {
                  const ok = await confirm({
                    title: 'Hapus balon chat?',
                    message: 'Pesan ini akan dihapus dari percakapan.',
                    confirmText: 'Hapus',
                    cancelText: 'Batal',
                    tone: 'danger',
                  });
                  if (ok) {
                    const newConv = (notif.conversation || []).filter(
                      (m: ChatMessage) => m.id !== msg.id
                    );
                    handleUpdate(notif.id, { conversation: newConv });
                  }
                }}
                className="shrink-0 self-center rounded-2xl p-3 text-gray-200 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover/msg:opacity-100"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>

        {(notif.conversation || []).length === 0 && (
          <div className="rounded-[2rem] border-2 border-dashed border-indigo-100/50 bg-white/50 py-24 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50">
              <MessageSquare className="h-10 w-10 text-indigo-200" />
            </div>
            <h5 className="text-base font-black uppercase tracking-[0.2em] text-gray-400">
              Belum Ada Chat
            </h5>
            <p className="mx-auto mt-2 max-w-[250px] text-xs font-medium text-gray-300">
              Mulai buat percakapan dengan menekan tombol Tambah Balon Chat di atas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
