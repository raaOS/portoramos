import { describe, it, expect } from 'vitest';
import {
  formatRelativeTime,
  deleteCommentFromList,
  updateCommentTextInList,
} from './commentUtils';
import type { Comment } from '@/lib/magic';

describe('commentUtils', () => {
  describe('formatRelativeTime', () => {
    it('returns Baru saja for empty or recent time', () => {
      expect(formatRelativeTime('')).toBe('Baru saja');
      expect(formatRelativeTime(new Date().toISOString())).toBe('Baru saja');
    });

    it('formats minutes ago', () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      expect(formatRelativeTime(fiveMinAgo)).toBe('5 menit yang lalu');
    });

    it('formats hours ago', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
      expect(formatRelativeTime(twoHoursAgo)).toBe('2 jam yang lalu');
    });

    it('formats days ago', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString();
      expect(formatRelativeTime(threeDaysAgo)).toBe('3 hari yang lalu');
    });
  });

  describe('deleteCommentFromList', () => {
    const sampleComments: Comment[] = [
      {
        id: 'c1',
        text: 'Top comment',
        name: 'Alice',
        time: '',
        likes: 0,
        replies: [{ id: 'r1', text: 'Reply 1', name: 'Bob', time: '', likes: 0 }],
      },
      { id: 'c2', text: 'Second comment', name: 'Charlie', time: '', likes: 0, replies: [] },
    ];

    it('deletes top-level comment by id', () => {
      const updated = deleteCommentFromList(sampleComments, 'c1');
      expect(updated.length).toBe(1);
      expect(updated[0].id).toBe('c2');
    });

    it('deletes nested reply by id', () => {
      const updated = deleteCommentFromList(sampleComments, 'r1');
      expect(updated.length).toBe(2);
      expect(updated[0].replies?.length).toBe(0);
    });
  });

  describe('updateCommentTextInList', () => {
    const sampleComments: Comment[] = [
      {
        id: 'c1',
        text: 'Original',
        name: 'Alice',
        time: '',
        likes: 0,
        replies: [{ id: 'r1', text: 'Reply original', name: 'Bob', time: '', likes: 0 }],
      },
    ];

    it('updates top-level comment text', () => {
      const updated = updateCommentTextInList(sampleComments, 'c1', 'Edited text');
      expect(updated[0].text).toBe('Edited text');
    });

    it('updates nested reply text', () => {
      const updated = updateCommentTextInList(sampleComments, 'r1', 'Edited reply');
      expect(updated[0].replies?.[0].text).toBe('Edited reply');
    });
  });
});
