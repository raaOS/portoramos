import type { Comment, CommentReply } from '@/lib/magic';

export function formatRelativeTime(dateString: string): string {
  if (!dateString) return 'Baru saja';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Baru saja';

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} jam yang lalu`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} hari yang lalu`;

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks} minggu yang lalu`;

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths} bulan yang lalu`;

  return `${Math.floor(diffInDays / 365)} tahun yang lalu`;
}

export function deleteCommentFromList(list: Comment[], commentId: string): Comment[] {
  const filterReplies = (replies: CommentReply[]): CommentReply[] => {
    return replies.filter((reply) => reply.id !== commentId);
  };
  return list
    .filter((c) => c.id !== commentId)
    .map((c) => ({
      ...c,
      replies: c.replies ? filterReplies(c.replies) : [],
    }));
}

export function updateCommentTextInList(
  list: Comment[],
  commentId: string,
  newText: string
): Comment[] {
  const trimmed = newText.trim();
  const updateReplies = (replies: CommentReply[]): CommentReply[] => {
    return replies.map((reply) => {
      if (reply.id === commentId) {
        return { ...reply, text: trimmed };
      }
      return reply;
    });
  };

  return list.map((c) => {
    if (c.id === commentId) {
      return { ...c, text: trimmed };
    }
    return {
      ...c,
      replies: c.replies ? updateReplies(c.replies) : [],
    };
  });
}
