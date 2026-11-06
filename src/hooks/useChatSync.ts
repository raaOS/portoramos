import { useState, useEffect, useCallback, useRef, startTransition } from 'react';
import { soundManager } from '@/components/os/utils/SoundManager';

/**
 * Chat Sync Hook — Real-time messaging untuk visitor ↔ admin.
 *
 * Mengelola state chat (messages, typing indicator, sync error) dengan
 * polling native yang dioptimasi untuk Vercel Hobby Free Tier:
 * - 8 detik saat tab aktif, 60 detik saat background (~62% penghematan).
 * - Deduplikasi pesan server-side dengan temp message client-side.
 * - Notifikasi suara saat pesan admin baru diterima (hanya di tab visible).
 * - Zero external library dependency (bebas SWR / React Query).
 * - Signed visitor session (HMAC) — mencegah IDOR pada sync/clear/send.
 *
 * @module useChatSync
 */

interface ChatMessage {
  id: string;
  text: string;
  sender: 'visitor' | 'admin';
  timestamp: number;
}

interface ChatSessionState {
  visitorId: string;
  signature: string;
}

const SESSION_STORAGE_KEY = 'ramos_chat_session';

function readStoredSession(): ChatSessionState | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ChatSessionState>;
    if (typeof parsed.visitorId === 'string' && typeof parsed.signature === 'string') {
      if (parsed.visitorId && parsed.signature) {
        return { visitorId: parsed.visitorId, signature: parsed.signature };
      }
    }
    return null;
  } catch {
    return null;
  }
}

function writeStoredSession(session: ChatSessionState) {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // ignore quota / private mode
  }
}

async function requestNewSession(): Promise<ChatSessionState> {
  const res = await fetch('/api/chat/session', { method: 'POST' });
  if (!res.ok) {
    throw new Error('Failed to issue chat session');
  }
  const data = (await res.json()) as { visitorId?: string; signature?: string };
  if (!data.visitorId || !data.signature) {
    throw new Error('Invalid chat session payload');
  }
  const session = { visitorId: data.visitorId, signature: data.signature };
  writeStoredSession(session);
  return session;
}

function getCsrfHeader(): Record<string, string> {
  try {
    const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
    if (match && match[1]) {
      return { 'x-csrf-token': decodeURIComponent(match[1]) };
    }
  } catch {
    // ignore
  }
  return {};
}

const fetcher = async (url: string) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error((await res.text()) || 'Network error');
    return res.json();
  } finally {
    window.clearTimeout(timeoutId);
  }
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
  const [session, setSession] = useState<ChatSessionState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const sessionRef = useRef<ChatSessionState | null>(null);

  // Keep ref in sync outside of render (react-hooks/refs forbids ref writes
  // during render body).
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Initial signed visitor session (server-issued HMAC).
  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const stored = readStoredSession();
        if (stored) {
          if (!cancelled) {
            startTransition(() => setSession(stored));
          }
          return;
        }
        const fresh = await requestNewSession();
        if (!cancelled) {
          startTransition(() => setSession(fresh));
        }
      } catch (error) {
        console.error('Chat session bootstrap failed', error);
      }
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const visitorId = session?.visitorId ?? '';

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
  const lastFetchTimeRef = useRef(0);
  const syncInProgressRef = useRef(false);

  const performSync = useCallback(
    async (currentSession: ChatSessionState) => {
      if (!currentSession?.visitorId || syncInProgressRef.current) return;
      const now = Date.now();
      // Deduping interval: 2000ms
      if (now - lastFetchTimeRef.current < 2000) return;
      lastFetchTimeRef.current = now;
      syncInProgressRef.current = true;

      try {
        const params = new URLSearchParams({
          visitorId: currentSession.visitorId,
          sig: currentSession.signature,
        });
        const data = await fetcher(`/api/chat/sync?${params.toString()}`);
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
                // Skip churn if nothing changed (same length + same last id)
                if (
                  prev.length > 0 &&
                  data.messages.length === prev.filter((m) => !m.id.startsWith('temp-')).length
                ) {
                  const lastServer = data.messages[data.messages.length - 1];
                  const lastLocal = prev[prev.length - 1];
                  if (lastLocal && lastServer && lastLocal.id === lastServer.id) {
                    return prev;
                  }
                }

                const newMessages = [...prev];
                let hasNewAdminMessage = false;
                let changed = false;

                data.messages.forEach((serverMsg: ChatMessage) => {
                  const existingTempIndex = newMessages.findIndex(
                    (m) =>
                      m.id.startsWith('temp-') &&
                      m.text === serverMsg.text &&
                      m.sender === serverMsg.sender
                  );
                  const hasConfirmed = newMessages.find((m) => m.id === serverMsg.id);

                  if (!hasConfirmed) {
                    changed = true;
                    if (existingTempIndex >= 0) {
                      newMessages[existingTempIndex] = serverMsg;
                    } else {
                      newMessages.push(serverMsg);
                      if (serverMsg.sender === 'admin') hasNewAdminMessage = true;
                    }
                  }
                });

                if (!changed) return prev;

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
      } catch {
        setSyncError(true);
      } finally {
        syncInProgressRef.current = false;
      }
    },
    [initialGreeting]
  );

  // Polling with Smart Interval & Focus Revalidation
  useEffect(() => {
    if (!session?.visitorId) return;

    // Asynchronous initial sync to avoid synchronous setState within effect body
    const initialTimer = setTimeout(() => {
      void performSync(session);
    }, 0);

    const intervalMs = isPageVisible ? 8000 : 60000;
    const timer = setInterval(() => {
      void performSync(session);
    }, intervalMs);

    const handleFocus = () => {
      void performSync(session);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(timer);
      window.removeEventListener('focus', handleFocus);
    };
  }, [session, isPageVisible, performSync]);

  const sendMessage = async (text: string) => {
    const current = sessionRef.current;
    if (!text.trim() || isSending || !current?.visitorId) return;

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
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 20_000);
      let succeeded = false;
      try {
        const res = await fetch('/api/chat/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            visitorId: current.visitorId,
            signature: current.signature,
            message: text.trim(),
            pageUrl: window.location.href,
          }),
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.message) {
            setMessages((prev) => prev.map((m) => (m.id === tempId ? data.message : m)));
            succeeded = true;
          }
        }
      } finally {
        window.clearTimeout(timeoutId);
      }

      if (!succeeded) {
        // Rollback phantom message so UI does not show a send that never persisted.
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      }
    } catch (error) {
      console.error('Send failed', error);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setIsSending(false);
    }
  };

  const clearMessages = async () => {
    const current = sessionRef.current;
    if (!current?.visitorId) return;

    // Reset local state to initial greeting first for snappy UX
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

    try {
      const res = await fetch('/api/chat/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getCsrfHeader(),
        },
        body: JSON.stringify({
          visitorId: current.visitorId,
          signature: current.signature,
        }),
      });
      if (!res.ok) {
        console.error('Clear chat failed', await res.text().catch(() => res.statusText));
        return;
      }

      const fresh = await requestNewSession();
      startTransition(() => setSession(fresh));
      lastFetchTimeRef.current = 0;
      void performSync(fresh);
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
    syncError,
  };
}
