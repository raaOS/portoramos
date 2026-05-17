'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Clock, EyeOff, RefreshCw, Star, Trash2 } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { getWritableCsrfToken } from '@/lib/security/client-csrf';
import type { FeedbackStatus } from '@/lib/validations';

type FeedbackFilter = FeedbackStatus | 'all';

interface FeedbackItem {
  id: string;
  rating: number;
  message?: string;
  name?: string;
  fromPath?: string;
  device?: string | null;
  status?: FeedbackStatus;
  isPublic?: boolean;
  source?: string;
  createdAt?: string;
}

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

const FILTERS: Array<{ value: FeedbackFilter; label: string }> = [
  { value: 'all', label: 'Semua' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'deleted', label: 'Deleted' },
];

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function statusClass(status?: FeedbackStatus) {
  switch (status) {
    case 'approved':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'hidden':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    case 'deleted':
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-amber-50 text-amber-700 border-amber-200';
  }
}

export default function AdminFeedbackClient() {
  const { csrfToken, isAdmin, isLoading: authLoading } = useAdminAuth();
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
      const payload = await response.json() as ApiResponse<FeedbackListPayload>;
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
      const payload = await response.json() as ApiResponse<{ id: string; status: FeedbackStatus; isPublic: boolean }>;
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
    if (!confirm('Hapus feedback ini secara permanen?')) return;
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
      const payload = await response.json() as ApiResponse<{ id: string }>;
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
          <p className="mt-1 text-sm text-gray-500">Moderasi rating exit-intent sebelum ditampilkan publik.</p>
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

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              filter === item.value
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {item.label}
            {item.value !== 'all' && counts[item.value] ? ` (${counts[item.value]})` : ''}
          </button>
        ))}
      </div>

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
          {items.map((item) => {
            const disabled = busyId === item.id;
            const status = item.status ?? 'pending';

            return (
              <article key={item.id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(status)}`}>
                        {status}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{item.name || 'Anonymous'}</span>
                      <span className="text-sm text-gray-400">{formatDate(item.createdAt)}</span>
                    </div>

                    <div className="flex items-center gap-1 text-amber-500">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          className={`h-4 w-4 ${index < item.rating ? 'fill-current' : 'text-gray-300'}`}
                        />
                      ))}
                      <span className="ml-2 text-sm text-gray-500">{item.rating}/5</span>
                    </div>

                    <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                      {item.message || 'Tidak ada pesan tambahan.'}
                    </p>

                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      <span>Path: {item.fromPath || '/'}</span>
                      <span>Device: {item.device || 'unknown'}</span>
                      <span>Source: {item.source || 'exit-intent'}</span>
                      <span>Public: {item.isPublic ? 'yes' : 'no'}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => void updateFeedback(item.id, 'approved', true)}
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => void updateFeedback(item.id, 'hidden', false)}
                      className="inline-flex items-center gap-2 rounded-lg bg-gray-700 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                    >
                      <EyeOff className="h-4 w-4" />
                      Hide
                    </button>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => void updateFeedback(item.id, 'pending', false)}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <Clock className="h-4 w-4" />
                      Pending
                    </button>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => void deleteFeedback(item.id)}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
