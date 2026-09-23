import type { FeedbackStatus } from '@/lib/validations';

export function formatFeedbackDate(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function getFeedbackStatusClass(status?: FeedbackStatus): string {
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
