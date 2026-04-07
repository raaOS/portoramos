'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Twitter, Linkedin, MessageCircle, Link, X } from 'lucide-react';

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
            color: 'bg-[#1DA1F2] text-white hover:bg-[#1a91da]'
        },
        {
            name: 'LinkedIn',
            icon: <Linkedin size={24} />,
            href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`,
            color: 'bg-[#0A66C2] text-white hover:bg-[#0958a8]'
        },
        {
            name: 'WhatsApp',
            icon: <MessageCircle size={24} />,
            href: `https://api.whatsapp.com/send?text=${encodedTitle} %2D ${encodedUrl}`,
            color: 'bg-[#25D366] text-white hover:bg-[#20ba59]'
        }
    ];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    onClick={onClose}
                />
                
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-sm bg-white dark:bg-[#1e1e1e] rounded-t-2xl sm:rounded-2xl shadow-2xl p-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Share Project</h3>
                        <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-white/10 rounded-full hover:bg-gray-200 dark:hover:bg-white/20 transition-colors text-gray-600 dark:text-gray-300">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        {shareLinks.map((link) => (
                            <a
                                key={link.name}
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center gap-2"
                                onClick={onClose}
                            >
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors shadow-sm \${link.color}`}>
                                    {link.icon}
                                </div>
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{link.name}</span>
                            </a>
                        ))}
                        
                        <button
                            onClick={() => {
                                onCopyLink();
                                onClose();
                            }}
                            className="flex flex-col items-center gap-2"
                        >
                            <div className="w-14 h-14 rounded-full flex items-center justify-center bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors shadow-sm text-gray-700 dark:text-gray-300">
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
