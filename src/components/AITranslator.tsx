'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, X, Copy, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AITranslatorProps {
    text: string;
    className?: string;
    context?: string; // Optional context like "Project Title"
}

export default function AITranslator({ text, className = '', context = '' }: AITranslatorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [translation, setTranslation] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Simple string hash for cache key
    const getCacheKey = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return `gemini_trans_${hash}`;
    };

    const handleTranslate = async () => {
        setIsOpen(true);
        if (translation) return; // Don't re-translate if already done in memory state

        // 1. Check LocalStorage Cache
        const cacheKey = getCacheKey(text);
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            setTranslation(cached);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text, targetLanguage: 'English' }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to translate');
            }

            // 2. Save to Cache
            localStorage.setItem(cacheKey, data.translation);
            setTranslation(data.translation);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (translation) {
            navigator.clipboard.writeText(translation);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <>
            <button
                onClick={handleTranslate}
                className={`inline-flex items-center gap-1.5 h-6 px-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors duration-200 ${className}`}
                title="Translate with AI"
            >
                <Sparkles className="w-3 h-3" />
                <span className="leading-none">AI Translate</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <Portal>
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100"
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                                    <div className="flex items-center gap-2 text-blue-700">
                                        <Sparkles className="w-5 h-5" />
                                        <h3 className="font-semibold text-lg">AI Translation</h3>
                                    </div>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="p-6">

                                    {/* Original Text Preview */}
                                    <div className="mb-6">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                            Original (English)
                                        </p>
                                        <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 leading-relaxed border border-gray-100 max-h-32 overflow-y-auto">
                                            {text}
                                        </div>
                                    </div>

                                    {/* Translation Area */}
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                            English Translation
                                            {loading && <span className="text-blue-500 animate-pulse text-[10px] lowercase">(generating...)</span>}
                                        </p>

                                        <div className="relative">
                                            {loading ? (
                                                <div className="p-8 flex flex-col items-center justify-center bg-blue-50/30 rounded-lg border border-blue-100 border-dashed min-h-[120px]">
                                                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                                                    <p className="text-sm text-blue-600 font-medium">Asking AI...</p>
                                                </div>
                                            ) : error ? (
                                                <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                                                    <p className="font-medium">Translation failed</p>
                                                    <p className="text-xs mt-1 opacity-80">{error}</p>
                                                </div>
                                            ) : (
                                                <div className="group relative">
                                                    <div className="p-4 bg-white rounded-lg text-gray-800 text-base leading-relaxed border-2 border-blue-100 shadow-sm min-h-[100px]">
                                                        {translation}
                                                    </div>
                                                    {/* Copy Button */}
                                                    <button
                                                        onClick={copyToClipboard}
                                                        className="absolute top-2 right-2 p-2 bg-white border border-gray-200 shadow-sm rounded-md text-gray-500 hover:text-blue-600 hover:border-blue-200 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                        title="Copy translation"
                                                    >
                                                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                </div>

                                {/* Footer */}
                                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </Portal>
                )}
            </AnimatePresence>
        </>
    );
}

// Simple Portal Component
function Portal({ children }: { children: React.ReactNode }) {
    if (typeof window === 'undefined') return null;
    return createPortal(children, document.body);
}
