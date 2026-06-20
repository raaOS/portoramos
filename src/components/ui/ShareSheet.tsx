'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Twitter, Linkedin, MessageCircle, Link, X, Share2 } from 'lucide-react';

interface ShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
  onCopyLink: () => void;
}

export default function ShareSheet({ isOpen, onClose, url, title, onCopyLink }: ShareSheetProps) {
  // Trap Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = [
    {
      name: 'Twitter',
      icon: <Twitter size={24} />,
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      color: 'bg-[#1DA1F2] text-white hover:bg-[#1a91da]',
    },
    {
      name: 'LinkedIn',
      icon: <Linkedin size={24} />,
      href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`,
      color: 'bg-[#0A66C2] text-white hover:bg-[#0958a8]',
    },
    {
      name: 'WhatsApp',
      icon: <MessageCircle size={24} />,
      href: `https://api.whatsapp.com/send?text=${encodedTitle} %2D ${encodedUrl}`,
      color: 'bg-[#25D366] text-white hover:bg-[#20ba59]',
    },
  ];

  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-end justify-center p-4 sm:items-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          role="dialog"
          aria-label="Share Project"
          aria-modal="true"
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-sm rounded-t-2xl bg-white p-6 shadow-2xl dark:bg-[#1e1e1e] sm:rounded-2xl"
        >
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Share Project
            </h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close share sheet"
              className="inline-flex items-center justify-center rounded-full bg-gray-100 p-2 text-gray-600 transition-colors hover:bg-gray-200 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/20"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {canNativeShare && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.share({ title, url });
                    onClose();
                  } catch {
                    // User cancelled — no action needed
                  }
                }}
                className="flex flex-col items-center gap-2"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm transition-colors hover:bg-blue-600">
                  <Share2 size={24} />
                </div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Share</span>
              </button>
            )}

            {shareLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2"
                onClick={onClose}
              >
                <div
                  className={`\${link.color} flex h-14 w-14 items-center justify-center rounded-full shadow-sm transition-colors`}
                >
                  {link.icon}
                </div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {link.name}
                </span>
              </a>
            ))}

            <button
              type="button"
              onClick={() => {
                onCopyLink();
                onClose();
              }}
              className="flex flex-col items-center gap-2"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-700 shadow-sm transition-colors hover:bg-gray-200 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/20">
                <Link size={24} />
              </div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Copy</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
