'use client';

import { useState, useEffect, useCallback } from 'react';
import { Project } from '@/types/projects';
import AdminModal from './AdminModal';
import AdminButton from './AdminButton';
import { useToast } from '@/contexts/ToastContext';
import { Loader2, Trash2, MessageCircle } from 'lucide-react';

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
    onSyncTrigger: () => void;
}

export default function ManageCommentsModal({ project, onClose, onSyncTrigger }: ManageCommentsModalProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const { showSuccess, showError } = useToast();

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
        fetchComments();
    }, [fetchComments]);

    const handleDelete = async (commentId: string) => {
        if (!confirm('Delete this comment permanently?')) return;

        setDeletingId(commentId);
        try {
            const res = await fetch('/api/comments', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug: project.slug, commentId })
            });

            if (res.ok) {
                showSuccess('Comment deleted');
                fetchComments(); // Reload to be safe (handles nested deletions)
                onSyncTrigger(); // Sync to GitHub
            } else {
                throw new Error('Failed to delete');
            }
        } catch (e) {
            showError('Failed to delete comment');
        } finally {
            setDeletingId(null);
        }
    };

    // Recursive renderer for comments
    const renderComment = (comment: Comment, depth = 0) => (
        <div key={comment.id} className={`bg-gray-50 border border-gray-100 rounded-lg p-3 mb-2 ${depth > 0 ? 'ml-6 border-l-4 border-l-violet-100' : ''}`}>
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-gray-900">{comment.author}</span>
                        <span className="text-xs text-gray-500">{comment.time}</span>
                        {comment.likes > 0 && <span className="text-xs text-red-500 bg-red-50 px-1.5 rounded-full">❤️ {comment.likes}</span>}
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.text}</p>
                </div>
                <button
                    onClick={() => handleDelete(comment.id)}
                    disabled={deletingId === comment.id}
                    className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors disabled:opacity-50"
                    title="Delete Comment"
                >
                    {deletingId === comment.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
            </div>
            {/* Nested Replies */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                    {comment.replies.map(reply => renderComment(reply, depth + 1))}
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
                <AdminButton variant="secondary" onClick={onClose}>Close</AdminButton>
            }
        >
            <div className="min-h-[300px] max-h-[60vh] overflow-y-auto">
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
                    </div>
                ) : comments.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No comments on this project yet.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {comments.map(c => renderComment(c))}
                    </div>
                )}
            </div>
        </AdminModal>
    );
}
