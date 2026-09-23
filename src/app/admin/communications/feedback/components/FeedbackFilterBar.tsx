'use client';

import React from 'react';
import type { FeedbackStatus } from '@/lib/validations';

export type FeedbackFilter = FeedbackStatus | 'all';

export const FEEDBACK_FILTERS: Array<{ value: FeedbackFilter; label: string }> = [
  { value: 'all', label: 'Semua' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'deleted', label: 'Deleted' },
];

interface FeedbackFilterBarProps {
  filter: FeedbackFilter;
  counts: Record<string, number>;
  onSelectFilter: (filter: FeedbackFilter) => void;
}

export function FeedbackFilterBar({ filter, counts, onSelectFilter }: FeedbackFilterBarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {FEEDBACK_FILTERS.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onSelectFilter(item.value)}
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
  );
}
