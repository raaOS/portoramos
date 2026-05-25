'use client';

import { useState, useEffect, useCallback } from 'react';
import { Project } from '@/types/projects';
import AdminModal from './AdminModal';
import AdminButton from './AdminButton';
import { useToast } from '@/contexts/ToastContext';
import { Loader2, Trash2, MessageCircle } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useConfirm } from '@/components/admin/ConfirmDialog';

interface Comment {
  id: string;
  text: string;
  author: string;
  time: string;
  likes: number;
  replies?: Comment[];
}

interface ManageCommentsModalProps {
  project: Project;
  onClose: () => void;
}

export default function ManageCommentsModal({ project, onClose }: ManageCommentsModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();
  const { csrfToken } = useAdminAuth();
  const { confirm } = useConfirm();

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/comments?slug=${project.slug}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (e) {
      console.error(e);
      showError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [project.slug, showError]);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchComments();
    });
  }, [fetchComments]);

  const handleDelete = async (commentId: string) => {
    const ok = await confirm({
      title: 'Hapus komentar?',
      message: 'Komentar akan dihapus permanen, termasuk semua reply-nya.',
      confirmText: 'Hapus',
      cancelText: 'Batal',
      tone: 'danger',
    });
    if (!ok) return;

    setDeletingId(commentId);
    try {
      const res = await fetch('/api/comments', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ slug: project.slug, commentId }),
      });

      if (res.ok) {
        showSuccess('Comment deleted');
        fetchComments(); // Reload to be safe (handles nested deletions)
      } else {
        throw new Error('Failed to delete');
      }
    } catch {
      showError('Failed to delete comment');
    } finally {
      setDeletingId(null);
    }
  };

  // Recursive renderer for comments
  const renderComment = (comment: Comment, depth = 0) => (
    <div
      key={comment.id}
      className={`mb-2 rounded-lg border border-gray-100 bg-gray-50 p-3 ${depth > 0 ? 'ml-6 border-l-4 border-l-violet-100' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">{comment.author}</span>
            <span className="text-xs text-gray-500">{comment.time}</span>
            {comment.likes > 0 && (
              <span className="rounded-full bg-red-50 px-1.5 text-xs text-red-500">
                ❤️ {comment.likes}
              </span>
            )}
          </div>
          <p className="whitespace-pre-wrap text-sm text-gray-700">{comment.text}</p>
        </div>
        <button
          onClick={() => handleDelete(comment.id)}
          disabled={deletingId === comment.id}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          title="Delete Comment"
        >
          {deletingId === comment.id ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </button>
      </div>
      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2 border-t border-gray-100 pt-2">
          {comment.replies.map((reply) => renderComment(reply, depth + 1))}
        </div>
      )}
    </div>
  );

  return (
    <AdminModal
      isOpen={true}
      onClose={onClose}
      title={`Comments for: ${project.title}`}
      size="lg"
      actions={
        <AdminButton variant="secondary" onClick={onClose}>
          Close
        </AdminButton>
      }
    >
      <div className="max-h-[60vh] min-h-[300px] overflow-y-auto">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
          </div>
        ) : comments.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <MessageCircle className="mx-auto mb-3 h-12 w-12 text-gray-300" />
            <p>No comments on this project yet.</p>
          </div>
        ) : (
          <div className="space-y-3">{comments.map((c) => renderComment(c))}</div>
        )}
      </div>
    </AdminModal>
  );
}
