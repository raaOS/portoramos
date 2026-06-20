'use client';

import React, { useState, useEffect, startTransition } from 'react';
import { motion } from 'motion/react';
import { Comment } from '@/lib/magic';
import dynamic from 'next/dynamic';
import { useToast } from '@/contexts/ToastContext';
import { Pencil, Trash2 } from 'lucide-react';

const AITranslator = dynamic(() => import('@/components/features/AITranslator'), { ssr: false });

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

  const handleDeleteComment = (commentId: string | undefined) => {
    if (!commentId) return;
    const filterComment = (list: any[]): any[] => {
      return list
        .filter((c) => c.id !== commentId)
        .map((c) => ({
          ...c,
          replies: c.replies ? filterComment(c.replies) : [],
        }));
    };
    setComments(filterComment(comments));
    if (editingCommentId === commentId) {
      setEditingCommentId(null);
    }
  };

  const handleStartEdit = (commentId: string | undefined, currentText: string) => {
    if (!commentId) return;
    setEditingCommentId(commentId);
    setEditingText(currentText);
  };

  const handleSaveEdit = (commentId: string | undefined) => {
    if (!commentId) return;
    if (!editingText.trim()) return;

    const updateCommentText = (list: any[]): any[] => {
      return list.map((c) => {
        if (c.id === commentId) {
          return { ...c, text: editingText.trim() };
        }
        return {
          ...c,
          replies: c.replies ? updateCommentText(c.replies) : [],
        };
      });
    };

    setComments(updateCommentText(comments));
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

  const formatRelativeTime = (dateString: string) => {
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
              <div key={comment.id} className="group">
                <div className="flex gap-4">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-[13px] font-bold uppercase text-white shadow-lg">
                    {comment.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-baseline gap-2">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {comment.name}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {formatRelativeTime(comment.createdAt || comment.time || '')}
                      </span>
                    </div>
                    {editingCommentId === comment.id ? (
                      <div className="mt-1 space-y-2">
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="w-full rounded border border-indigo-200 p-2 text-sm outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                          rows={2}
                        />
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(comment.id)}
                            className="bg-indigo-650 rounded px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-700"
                          >
                            Simpan
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCommentId(null)}
                            className="dark:bg-slate-850 dark:text-slate-350 rounded bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="group/text relative flex items-start gap-2">
                        <p className="flex-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                          {comment.text}
                        </p>
                        {isAdmin && (
                          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover/text:opacity-100">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(comment.id, comment.text)}
                              className="hover:text-indigo-650 p-1 text-slate-400 dark:hover:text-indigo-400"
                              title="Edit Ulasan"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteComment(comment.id)}
                              className="hover:text-red-650 p-1 text-slate-400 dark:hover:text-red-400"
                              title="Hapus Ulasan"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    <AITranslator text={comment.text} compact={true} />
                  </div>
                </div>
                {/* Render Replies (Read-Only) */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-13 mt-4 space-y-4 border-l-2 border-gray-100 pl-4 dark:border-gray-800">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex gap-3">
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold uppercase text-gray-600 ring-1 ring-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700">
                          {reply.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1">
                          <div className="mb-1 flex items-baseline gap-2">
                            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                              {reply.name}
                            </span>
                            <span className="text-[9px] text-gray-400">
                              {formatRelativeTime(reply.createdAt || reply.time || '')}
                            </span>
                          </div>
                          {editingCommentId === reply.id ? (
                            <div className="mt-1 space-y-2">
                              <textarea
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                className="w-full rounded border border-indigo-200 p-2 text-xs outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                                rows={2}
                              />
                              <div className="flex gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(reply.id)}
                                  className="bg-indigo-650 rounded px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-indigo-700"
                                >
                                  Simpan
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingCommentId(null)}
                                  className="dark:bg-slate-850 dark:text-slate-350 rounded bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800"
                                >
                                  Batal
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="group/text relative flex items-start gap-2">
                              <p className="flex-1 text-xs text-gray-700 dark:text-gray-400">
                                {reply.text}
                              </p>
                              {isAdmin && (
                                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover/text:opacity-100">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEdit(reply.id, reply.text)}
                                    className="hover:text-indigo-650 p-1 text-slate-400 dark:hover:text-indigo-400"
                                    title="Edit Balasan"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteComment(reply.id)}
                                    className="hover:text-red-650 p-1 text-slate-400 dark:hover:text-red-400"
                                    title="Hapus Balasan"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                          <AITranslator text={reply.text} compact={true} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Input Section - Moved Below Toggle & List */}
      <div className="border-t border-gray-100 pt-4 dark:border-gray-800">
        {!guestName || isSettingName ? (
          <div className="space-y-4">
            <p className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
              Isi namamu dulu untuk mulai berkomentar 😊
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={tempGuestName}
                onChange={(e) => setTempGuestName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveName();
                  }
                }}
                placeholder="Ketik namamu..."
                className="flex-1 border-b border-none border-black/10 bg-transparent px-0 py-2.5 text-sm outline-none transition-all focus:border-red-500 focus:outline-none focus:ring-0 dark:border-white/10 dark:text-white"
              />
              <button
                type="button"
                onClick={handleSaveName}
                disabled={!tempGuestName.trim()}
                className="rounded-full border-none bg-[#E60023] px-6 py-2.5 text-sm font-bold text-white shadow-sm outline-none transition-colors hover:bg-[#ad001b] disabled:opacity-50"
              >
                Simpan
              </button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Komentar sebagai <span className="text-red-500">{guestName}</span>
              </p>
              <button
                type="button"
                onClick={() => {
                  setTempGuestName(guestName);
                  setIsSettingName(true);
                }}
                className="text-[11px] text-gray-300 underline decoration-dotted underline-offset-4 transition-colors hover:text-red-500"
              >
                Ganti nama
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handlePostComment();
                  }
                }}
                placeholder="Tulis komentar..."
                className="w-full border-b border-none border-black/10 bg-transparent px-0 py-3 pr-12 text-sm outline-none transition-all focus:border-red-500 focus:outline-none focus:ring-0 dark:border-white/10 dark:text-white"
              />
              <button
                type="button"
                onClick={handlePostComment}
                disabled={!commentText.trim() || isSubmitting}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-red-500 transition-colors hover:text-red-600 disabled:opacity-30"
              >
                <svg className="h-5 w-5 rotate-90" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
