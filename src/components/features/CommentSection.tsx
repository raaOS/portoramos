'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Comment } from '@/lib/magic';

interface CommentSectionProps {
  slug: string;
  comments: Comment[];
  setComments: (comments: Comment[]) => void;
  className?: string;
  isExpanded?: boolean;
}

export default function CommentSection({
  slug,
  comments,
  setComments,
  className = ''
}: CommentSectionProps) {
  // Guest Identity State
  const [guestName, setGuestName] = useState('');
  const [tempGuestName, setTempGuestName] = useState('');
  const [isSettingName, setIsSettingName] = useState(false);

  // Comment Input State
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Guest Name from localStorage (Client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedName = localStorage.getItem('guest-name');
      if (savedName) {
        setGuestName(savedName);
      } else {
        setIsSettingName(true); // Prompt to set name if none exists
      }
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
      replies: []
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
          comments: updatedComments,
          website_url: '' // Anti-spam honeypot (must be empty)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          alert("Too many comments! Please wait 10 seconds.");
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
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors group"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest">
            {comments.length} Komentar
          </span>
          {comments.length > 0 && !isOpen && (
            <div className="flex -space-x-2">
              {comments.slice(0, 3).map((c, i) => (
                <div key={i} className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-800 border-2 border-white dark:border-gray-900 flex items-center justify-center text-[8px] font-bold uppercase text-gray-400">
                  {c.name[0]}
                </div>
              ))}
            </div>
          )}
        </div>
        <svg
          className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
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
          marginBottom: isOpen ? 24 : 0
        }}
        transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
        className="overflow-hidden"
      >
        <div className="space-y-8 py-2">
          {comments.length === 0 ? (
            <p className="text-center text-[11px] text-gray-400 py-4 italic">Belum ada komentar. Jadilah yang pertama! ✨</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="group">
                <div className="flex gap-4">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0 flex items-center justify-center text-white text-[13px] font-bold uppercase shadow-lg">
                    {comment.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{comment.name}</span>
                      <span className="text-[10px] text-gray-400">
                        {formatRelativeTime(comment.createdAt || comment.time || '')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {comment.text}
                    </p>
                  </div>
                </div>
                {/* Render Replies (Read-Only) */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-13 mt-4 space-y-4 border-l-2 border-gray-100 dark:border-gray-800 pl-4">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex gap-3">
                        <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-800 flex-shrink-0 flex items-center justify-center text-gray-600 dark:text-gray-400 text-[10px] font-bold uppercase ring-1 ring-gray-200 dark:ring-gray-700">
                          {reply.name[0]}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{reply.name}</span>
                            <span className="text-[9px] text-gray-400">
                              {formatRelativeTime(reply.createdAt || reply.time || '')}
                            </span>
                          </div>
                          <p className="text-xs text-gray-700 dark:text-gray-400">
                            {reply.text}
                          </p>
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
      <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
        {!guestName || isSettingName ? (
          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
              Isi namamu dulu untuk mulai berkomentar 😊
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                autoFocus
                value={tempGuestName}
                onChange={(e) => setTempGuestName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                placeholder="Ketik namamu..."
                className="flex-1 bg-transparent border-none border-b border-black/10 dark:border-white/10 px-0 py-2.5 text-sm focus:border-red-500 dark:text-white transition-all outline-none focus:outline-none focus:ring-0"
              />
              <button
                onClick={handleSaveName}
                disabled={!tempGuestName.trim()}
                className="bg-[#E60023] hover:bg-[#ad001b] text-white px-6 py-2.5 rounded-full text-sm font-bold transition-colors disabled:opacity-50 border-none outline-none shadow-sm"
              >
                Simpan
              </button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                Komentar sebagai <span className="text-red-500">{guestName}</span>
              </p>
              <button
                onClick={() => {
                  setTempGuestName(guestName);
                  setIsSettingName(true);
                }}
                className="text-[11px] text-gray-300 hover:text-red-500 transition-colors underline decoration-dotted underline-offset-4"
              >
                Ganti nama
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                placeholder="Tulis komentar..."
                className="w-full bg-transparent border-none border-b border-black/10 dark:border-white/10 px-0 py-3 text-sm focus:border-red-500 dark:text-white transition-all outline-none focus:outline-none focus:ring-0 pr-12"
              />
              <button
                onClick={handlePostComment}
                disabled={!commentText.trim() || isSubmitting}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-red-500 hover:text-red-600 transition-colors disabled:opacity-30"
              >
                <svg className="w-5 h-5 rotate-90" fill="currentColor" viewBox="0 0 20 20">
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
