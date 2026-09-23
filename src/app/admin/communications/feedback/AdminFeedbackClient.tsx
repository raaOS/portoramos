'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { getWritableCsrfToken } from '@/lib/security/client-csrf';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import type { FeedbackStatus } from '@/lib/validations';
import { FeedbackFilterBar, type FeedbackFilter } from './components/FeedbackFilterBar';
import { FeedbackCard, type FeedbackItem } from './components/FeedbackCard';

interface FeedbackListPayload {
  feedback: FeedbackItem[];
  total: number;
}

interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

interface ApiError {
  success: false;
  error: string;
}

type ApiResponse<T> = ApiSuccess<T> | ApiError;

export default function AdminFeedbackClient() {
  const { csrfToken, isAdmin, isLoading: authLoading } = useAdminAuth();
  const { confirm } = useConfirm();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [filter, setFilter] = useState<FeedbackFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const counts = useMemo(() => {
    return items.reduce<Record<string, number>>((acc, item) => {
      const status = item.status ?? 'pending';
      acc[status] = (acc[status] ?? 0) + 1;
      return acc;
    }, {});
  }, [items]);

  const loadFeedback = useCallback(async () => {
    if (authLoading || !isAdmin) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/feedback?status=${filter}&limit=200`, {
        credentials: 'include',
      });
      const payload = (await response.json()) as ApiResponse<FeedbackListPayload>;
      if (!response.ok || !payload.success) {
        throw new Error(payload.success ? 'Failed to load feedback' : payload.error);
      }
      setItems(payload.data.feedback);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feedback');
    } finally {
      setIsLoading(false);
    }
  }, [authLoading, filter, isAdmin]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadFeedback();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadFeedback]);

  const updateFeedback = async (id: string, status: FeedbackStatus, isPublic?: boolean) => {
    setBusyId(id);
    setError(null);

    try {
      const response = await fetch(`/api/feedback/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': getWritableCsrfToken(csrfToken),
        },
        body: JSON.stringify({ status, isPublic }),
      });
      const payload = (await response.json()) as ApiResponse<{
        id: string;
        status: FeedbackStatus;
        isPublic: boolean;
      }>;
      if (!response.ok || !payload.success) {
        throw new Error(payload.success ? 'Failed to update feedback' : payload.error);
      }
      await loadFeedback();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update feedback');
    } finally {
      setBusyId(null);
    }
  };

  const deleteFeedback = async (id: string) => {
    const ok = await confirm({
      title: 'Hapus feedback?',
      message: 'Feedback akan dihapus permanen dan tidak bisa dipulihkan.',
      confirmText: 'Hapus',
      cancelText: 'Batal',
      tone: 'danger',
    });
    if (!ok) return;
    setBusyId(id);
    setError(null);

    try {
      const response = await fetch(`/api/feedback/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'x-csrf-token': getWritableCsrfToken(csrfToken),
        },
      });
      const payload = (await response.json()) as ApiResponse<{ id: string }>;
      if (!response.ok || !payload.success) {
        throw new Error(payload.success ? 'Failed to delete feedback' : payload.error);
      }
      await loadFeedback();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete feedback');
    } finally {
      setBusyId(null);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feedback Visitor</h1>
          <p className="mt-1 text-sm text-gray-500">
            Moderasi rating exit-intent sebelum ditampilkan publik.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadFeedback()}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <FeedbackFilterBar filter={filter} counts={counts} onSelectFilter={setFilter} />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 py-16 text-center text-gray-500">
          Belum ada feedback untuk filter ini.
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <FeedbackCard
              key={item.id}
              item={item}
              disabled={busyId === item.id}
              onUpdateStatus={updateFeedback}
              onDelete={deleteFeedback}
            />
          ))}
        </div>
      )}
    </div>
  );
}
