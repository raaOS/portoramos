'use client';

import React, { useState, useEffect, startTransition } from 'react';
import { motion } from 'motion/react';
import type { Comment } from '@/lib/magic';
import { useToast } from '@/contexts/ToastContext';
import { deleteCommentFromList, updateCommentTextInList } from './comment-section/utils/commentUtils';
import { CommentItem } from './comment-section/components/CommentItem';
import { CommentInputBar } from './comment-section/components/CommentInputBar';

interface CommentSectionProps {
  slug: string;
  comments: Comment[];
  setComments: (comments: Comment[]) => void;
  className?: string;
  isExpanded?: boolean;
  isAdmin?: boolean;
}

export default function CommentSection({
  slug,
  comments,
  setComments,
  className = '',
  isAdmin = false,
}: CommentSectionProps) {
  // Guest Identity State
  const [guestName, setGuestName] = useState('');
  const [tempGuestName, setTempGuestName] = useState('');
  const [isSettingName, setIsSettingName] = useState(false);

  // Local Editing State (for admin inline edits)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const handleDeleteComment = (commentId: string) => {
    setComments(deleteCommentFromList(comments, commentId));
    if (editingCommentId === commentId) {
      setEditingCommentId(null);
    }
  };

  const handleStartEdit = (commentId: string, currentText: string) => {
    setEditingCommentId(commentId);
    setEditingText(currentText);
  };

  const handleSaveEdit = (commentId: string) => {
    if (!editingText.trim()) return;
    setComments(updateCommentTextInList(comments, commentId, editingText));
    setEditingCommentId(null);
  };

  // Comment Input State
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showWarning } = useToast();

  // Load Guest Name from localStorage (Client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedName = localStorage.getItem('guest-name');
      startTransition(() => {
        if (savedName) {
          setGuestName(savedName);
        } else {
          setIsSettingName(true); // Prompt to set name if none exists
        }
      });
    }
  }, []);

  const handleSaveName = () => {
    if (!tempGuestName.trim()) return;
    const name = tempGuestName.trim();
    setGuestName(name);
    localStorage.setItem('guest-name', name);
    setIsSettingName(false);
  };

  const handlePostComment = async () => {
    if (!commentText.trim() || !guestName) return;

    setIsSubmitting(true);

    const newComment: Comment = {
      id: Date.now().toString(),
      text: commentText.trim(),
      name: guestName,
      time: new Date().toISOString(),
      likes: 0,
      replies: [],
    };

    const updatedComments = [newComment, ...comments];

    // Optimistic Update
    setComments(updatedComments);
    setCommentText(''); // Clear input immediately

    try {
      // Send to API with security fields (Honeypot is empty string)
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: slug,
          comment: newComment,
          website_url: '', // Anti-spam honeypot (must be empty)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          showWarning('Terlalu banyak komentar! Tunggu 10 detik.');
        } else {
          console.error('Server error:', errorData);
        }
      }
    } catch (error) {
      console.error('Failed to submit comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Accordion Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group flex w-full items-center justify-between py-2 text-gray-500 transition-colors hover:text-gray-900 dark:hover:text-white"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest">
            {comments.length} Komentar
          </span>
          {comments.length > 0 && !isOpen && (
            <div className="flex -space-x-2">
              {comments.slice(0, 3).map((c, i) => (
                <div
                  key={i}
                  className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-[8px] font-bold uppercase text-gray-400 dark:border-gray-900 dark:bg-gray-800"
                >
                  {c.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              ))}
            </div>
          )}
        </div>
        <svg
          className={`h-4 w-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Comments List (Collapsible / Smooth Accordion) */}
      <motion.div
        initial={false}
        animate={{
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0,
          marginBottom: isOpen ? 24 : 0,
        }}
        transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
        className="overflow-hidden"
      >
        <div className="space-y-8 py-2">
          {comments.length === 0 ? (
            <p className="py-4 text-center text-[11px] italic text-gray-400">
              Belum ada komentar. Jadilah yang pertama! ✨
            </p>
          ) : (
            comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                isAdmin={isAdmin}
                editingCommentId={editingCommentId}
                editingText={editingText}
                setEditingText={setEditingText}
                onStartEdit={handleStartEdit}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={() => setEditingCommentId(null)}
                onDeleteComment={handleDeleteComment}
              />
            ))
          )}
        </div>
      </motion.div>

      {/* Input Section */}
      <CommentInputBar
        guestName={guestName}
        isSettingName={isSettingName}
        setIsSettingName={setIsSettingName}
        tempGuestName={tempGuestName}
        setTempGuestName={setTempGuestName}
        commentText={commentText}
        setCommentText={setCommentText}
        isSubmitting={isSubmitting}
        onSaveName={handleSaveName}
        onPostComment={handlePostComment}
      />
    </div>
  );
}
