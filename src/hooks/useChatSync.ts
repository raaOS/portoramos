import { useState, useEffect, startTransition } from 'react';
import { v4 as uuidv4 } from 'uuid';
import useSWR from 'swr';
import { soundManager } from '@/components/os/utils/SoundManager';

/**
 * Chat Sync Hook — Real-time messaging untuk visitor ↔ admin.
 *
 * Mengelola state chat (messages, typing indicator, sync error) dengan
 * polling SWR yang dioptimasi untuk Vercel Hobby Free Tier:
 * - 8 detik saat tab aktif, 60 detik saat background (~62% penghematan).
 * - Deduplikasi pesan server-side dengan temp message client-side.
 * - Notifikasi suara saat pesan admin baru diterima (hanya di tab visible).
 *
 * @module useChatSync
 */

interface ChatMessage {
  id: string;
  text: string;
  sender: 'visitor' | 'admin';
  timestamp: number;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error((await res.text()) || 'Network error');
  return res.json();
};

/**
 * Hook untuk sinkronisasi chat visitor ↔ admin secara real-time.
 *
 * @param initialGreeting - Pesan sapaan awal dari admin (opsional)
 * @returns Object berisi messages, sendMessage, typing indicator, dan sync error
 *
 * @example
 * ```tsx
 * const { messages, sendMessage, isSending, isAdminTyping } = useChatSync('Halo!');
 * ```
 */
export function useChatSync(initialGreeting?: string) {
  const [visitorId, setVisitorId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);

  // Initial Visitor ID
  useEffect(() => {
    try {
      const storedId = localStorage.getItem('ramos_visitor_id');
      startTransition(() => {
        if (storedId) {
          setVisitorId(storedId);
        } else {
          const newId = uuidv4();
          localStorage.setItem('ramos_visitor_id', newId);
          setVisitorId(newId);
        }
      });
    } catch {
      startTransition(() => {
        setVisitorId(uuidv4());
      });
    }
  }, []);

  // Track page visibility to optimize polling
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(document.visibilityState === 'visible');
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    return () => window.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Greeting
  useEffect(() => {
    if (visitorId && messages.length === 0 && initialGreeting) {
      startTransition(() => {
        setMessages([
          {
            id: 'greeting',
            text: initialGreeting,
            sender: 'admin',
            timestamp: Date.now(),
          },
        ]);
      });
    }
  }, [visitorId, initialGreeting, messages.length]);

  const [syncError, setSyncError] = useState(false);

  // Polling with Smart Interval — Vercel Hobby Free Tier guard.
  //
  // Sebelumnya: 3s active / 30s background. Untuk 1 visitor yang buka chat
  // window 5 menit = 100 invocations dari satu visitor. Worst case (tab
  // dibiarkan open semalam) = 14,400 invocations dari satu user. Itu
  // gerogoti budget invocation 1M/bulan tanpa value real karena visitor
  // portfolio tidak ekspektasi sub-second message arrival.
  //
  // Sekarang: 8s active / 60s background. Latency reply dari admin
  // sekarang max 8 detik (acceptable untuk chat asynchronous portfolio),
  // tapi invocations turun ~62%. Untuk skala 250 visitor/bulan ini
  // bedanya signifikan dari "boros" jadi "hemat ratusan invocations".
  const { data: _syncData, error: swrError, mutate } = useSWR(
    visitorId ? `/api/chat/sync?visitorId=${visitorId}` : null,
    fetcher,
    {
      refreshInterval: isPageVisible ? 8000 : 60000,
      revalidateOnFocus: true,
      dedupingInterval: 2000,
      onSuccess: (data) => {
        setSyncError(false);
        if (data?.success) {
          // Update typing status from server
          if (data.isAdminTyping !== undefined) {
            setIsAdminTyping(data.isAdminTyping);
          }

          if (Array.isArray(data.messages)) {
            if (data.messages.length === 0) {
              setMessages((prev) => {
                if (prev.length === 0 || (prev.length === 1 && prev[0].id === 'greeting')) {
                  return prev;
                }
                return initialGreeting
                  ? [
                      {
                        id: 'greeting',
                        text: initialGreeting,
                        sender: 'admin',
                        timestamp: Date.now(),
                      },
                    ]
                  : [];
              });
            } else {
              setMessages((prev) => {
                const newMessages = [...prev];
                let hasNewAdminMessage = false;

                data.messages.forEach((serverMsg: ChatMessage) => {
                  const existingTempIndex = newMessages.findIndex(
                    (m) =>
                      m.id.startsWith('temp-') &&
                      m.text === serverMsg.text &&
                      m.sender === serverMsg.sender
                  );
                  const hasConfirmed = newMessages.find((m) => m.id === serverMsg.id);

                  if (!hasConfirmed) {
                    if (existingTempIndex >= 0) {
                      newMessages[existingTempIndex] = serverMsg;
                    } else {
                      newMessages.push(serverMsg);
                      if (serverMsg.sender === 'admin') hasNewAdminMessage = true;
                    }
                  }
                });

                if (hasNewAdminMessage) {
                  if (typeof document === 'undefined' || document.visibilityState === 'visible') {
                    soundManager.play('notification');
                  }
                }

                return newMessages;
              });
            }
          }
        }
      },
    }
  );

  const sendMessage = async (text: string) => {
    if (!text.trim() || isSending || !visitorId) return;

    setIsSending(true);
    const tempId = `temp-${Date.now()}`;
    const newMessage: ChatMessage = {
      id: tempId,
      text: text.trim(),
      sender: 'visitor',
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, newMessage]);
    soundManager.play('sent');

    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId,
          message: text.trim(),
          pageUrl: window.location.href,
        }),
      });
      const data = await res.json();

      if (data.success && data.message) {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? data.message : m)));
      }
    } catch (error) {
      console.error('Send failed', error);
    } finally {
      setIsSending(false);
    }
  };

  const clearMessages = async () => {
    if (!visitorId) return;

    const oldVisitorId = visitorId;
    const newVisitorId = uuidv4();

    // Reset local state to initial greeting
    setMessages(
      initialGreeting
        ? [
            {
              id: 'greeting',
              text: initialGreeting,
              sender: 'admin',
              timestamp: Date.now(),
            },
          ]
        : []
    );

    // Set fresh visitorId locally & in localStorage
    try {
      localStorage.setItem('ramos_visitor_id', newVisitorId);
    } catch {
      // ignore
    }
    setVisitorId(newVisitorId);

    try {
      await fetch('/api/chat/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId: oldVisitorId }),
      });
      mutate();
    } catch (error) {
      console.error('Clear chat failed', error);
    }
  };

  return {
    visitorId,
    messages,
    setMessages,
    sendMessage,
    clearMessages,
    isSending,
    isAdminTyping,
    setIsAdminTyping,
    syncError: syncError || !!swrError,
  };
}
