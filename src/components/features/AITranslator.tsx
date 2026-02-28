'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface AITranslatorProps {
    text: string;
    className?: string;
    compact?: boolean;
}

// Simple hash for localStorage cache key
function hashStr(str: string) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = ((h << 5) - h) + str.charCodeAt(i);
        h = h & h;
    }
    return `gemini_inline_${h}`;
}

export default function AITranslator({ text, className = '', compact: _compact = false }: AITranslatorProps) {
    const [translation, setTranslation] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [shown, setShown] = useState(false);

    const handleTranslate = async () => {
        // Toggle off if already showing
        if (shown) { setShown(false); return; }

        setShown(true);
        if (translation) return; // already fetched

        // Check cache
        const key = hashStr(text);
        const cached = localStorage.getItem(key);
        if (cached) { setTranslation(cached); return; }

        setLoading(true);
        setError(false);
        try {
            const res = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, targetLanguage: 'English' }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            localStorage.setItem(key, data.translation);
            setTranslation(data.translation);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={className}>
            {shown && !loading && (
                <div className="mt-1.5 mb-1 px-3 py-2 bg-purple-50 border border-purple-100 rounded-lg text-xs text-gray-700 leading-relaxed">
                    {error
                        ? <span className="text-red-400">Translation failed. Try again.</span>
                        : translation
                    }
                </div>
            )}
            <button
                onClick={handleTranslate}
                className="mt-1 text-[11px] font-medium text-blue-500 hover:text-blue-700 hover:underline transition-colors"
                aria-label={shown ? 'Hide translation' : 'See translation'}
            >
                {loading
                    ? <Loader2 className="w-3 h-3 animate-spin inline" />
                    : shown ? 'Hide translation' : 'See translation'
                }
            </button>
        </div>
    );
}
