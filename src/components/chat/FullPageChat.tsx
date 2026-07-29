'use client';

import React, { useEffect, useRef, useState } from 'react';
import { m } from 'motion/react';
import { Trash2 } from 'lucide-react';
import FullPageChatHeader from './_components/FullPageChatHeader';
import FullPageChatMessages from './_components/FullPageChatMessages';
import FullPageChatFooter from './_components/FullPageChatFooter';
import { useChatSync } from '@/hooks/useChatSync';
import SystemNavFrame from '@/components/layout/SystemNavFrame';
import { useDictionary } from '@/contexts/LanguageContext';

interface FullPageChatContactInfo {
  email?: string;
  socialMedia?: {
    linkedin?: string;
    instagram?: string;
    twitter?: string;
    behance?: string;
    whatsapp?: string;
  };
  headline?: string;
  subtext?: string;
}

interface FullPageChatProps {
  contactInfo?: FullPageChatContactInfo;
  embedded?: boolean;
}

export default function FullPageChat({ contactInfo, embedded = false }: FullPageChatProps) {
  const t = useDictionary();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const { messages, sendMessage, clearMessages, isSending, isAdminTyping, syncError } =
    useChatSync(contactInfo?.subtext || t.chat.defaultPrompt);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAdminTyping]);

  const chatContent = (
    <div
      className={
        embedded
          ? 'relative flex h-full min-h-0 flex-1 overflow-hidden bg-transparent'
          : 'relative flex h-full min-h-[100dvh] flex-1 flex-col items-center justify-center overflow-hidden bg-[#0a0a0a] px-4 pb-32 pt-28'
      }
    >
      <m.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className={
          embedded
            ? 'relative z-10 flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#e5ddd5] dark:bg-[#0b141a]'
            : 'relative z-10 flex h-full w-full flex-col overflow-hidden bg-[#e5ddd5] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] dark:bg-[#0b141a] md:h-[80vh] md:rounded-[2rem]'
        }
        style={embedded ? undefined : { maxWidth: '480px' }}
      >
        <FullPageChatHeader onClearClick={() => setIsConfirmingClear(true)} />
        {syncError && (
          <div className="animate-pulse border-b border-red-500/20 bg-red-500/10 px-4 py-1 text-center text-[10px] text-red-500">
            {t.chat.connectionInterrupted}
          </div>
        )}

        {/* Confirmation Modal to Clear Chat */}
        {isConfirmingClear && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-xs">
            <m.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-2xl dark:bg-[#1f2c34]"
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-500 dark:bg-red-500/20 dark:text-red-400">
                  <Trash2 size={24} />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                  Hapus Percakapan?
                </h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Apakah Anda yakin ingin menghapus seluruh riwayat obrolan ini?
                </p>
                <div className="mt-5 flex w-full gap-2">
                  <button
                    type="button"
                    onClick={() => setIsConfirmingClear(false)}
                    className="flex-1 rounded-xl border border-gray-300 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      clearMessages();
                      setIsConfirmingClear(false);
                    }}
                    className="flex-1 rounded-xl bg-red-500 py-2 text-xs font-semibold text-white shadow-md transition-colors hover:bg-red-600"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </m.div>
          </div>
        )}

        <FullPageChatMessages messages={messages} isTyping={isAdminTyping} bottomRef={bottomRef} />
        <FullPageChatFooter onSend={sendMessage} isSending={isSending} />
      </m.div>

      {!embedded && (
        <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center opacity-40 dark:opacity-20">
          <div className="h-[80vw] max-h-[800px] w-[80vw] max-w-[800px] rounded-full bg-[#00a884] opacity-50 mix-blend-screen blur-[120px]" />
        </div>
      )}
    </div>
  );

  if (embedded) {
    return chatContent;
  }

  return <SystemNavFrame hideFooter={true}>{chatContent}</SystemNavFrame>;
}
