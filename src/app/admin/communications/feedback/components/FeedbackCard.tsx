'use client';

import React from 'react';
import { Check, Clock, EyeOff, Star, Trash2 } from 'lucide-react';
import type { FeedbackStatus } from '@/lib/validations';
import { formatFeedbackDate, getFeedbackStatusClass } from '../utils/feedbackUtils';

export interface FeedbackItem {
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

interface FeedbackCardProps {
  item: FeedbackItem;
  disabled: boolean;
  onUpdateStatus: (id: string, status: FeedbackStatus, isPublic?: boolean) => void;
  onDelete: (id: string) => void;
}

export function FeedbackCard({ item, disabled, onUpdateStatus, onDelete }: FeedbackCardProps) {
  const status = item.status ?? 'pending';

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getFeedbackStatusClass(
                status
              )}`}
            >
              {status}
            </span>
            <span className="text-sm font-medium text-gray-900">{item.name || 'Anonymous'}</span>
            <span className="text-sm text-gray-400">{formatFeedbackDate(item.createdAt)}</span>
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
            onClick={() => onUpdateStatus(item.id, 'approved', true)}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            Approve
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onUpdateStatus(item.id, 'hidden', false)}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-700 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            <EyeOff className="h-4 w-4" />
            Hide
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onUpdateStatus(item.id, 'pending', false)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <Clock className="h-4 w-4" />
            Pending
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onDelete(item.id)}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}
