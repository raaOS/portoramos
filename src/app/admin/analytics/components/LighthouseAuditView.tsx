'use client';

import { useState } from 'react';
import { Smartphone, Monitor, Play, Loader2, AlertCircle, AlertTriangle, ChevronDown, ChevronUp, CheckCircle, Circle, Square, Camera } from 'lucide-react';
import Image from 'next/image';
import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';

// Reusing interfaces (should ideally be shared types, but defining here for speed)
interface AuditItem {
    id: string;
    title: string;
    description: string;
    score: number;
    displayValue?: string;
    scoreDisplayMode: string;
    details?: {
        type: string;
        items?: any[];
        headings?: any[];
        overallSavingsMs?: number;
        overallSavingsBytes?: number;
    };
}

interface Scores {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
    coreWebVitals?: {
        lcp: string;
        fcp: string;
        cls: string;
        tbt: string;
        si: string;
    };
    audits?: {
        opportunities: AuditItem[];
        diagnostics: AuditItem[];
        screenshot?: string; // Base64
    };
}

import LighthouseReport from './LighthouseReport';

export default function LighthouseAuditView() {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [strategy, setStrategy] = useState<'mobile' | 'desktop'>('mobile');
    const [scores, setScores] = useState<Scores | null>(null);
    const [error, setError] = useState('');

    const runAudit = async () => {
        if (!url) {
            setError('Please enter a URL');
            return;
        }

        // Check for localhost
        if (url.includes('localhost') || url.includes('127.0.0.1')) {
            setError('Google PageSpeed Insights cannot access "localhost". Please use a public URL (e.g., your Vercel deployment URL).');
            return;
        }

        setLoading(true);
        setError('');
        setScores(null);

        try {
            const res = await fetch(`/api/lighthouse?url=${encodeURIComponent(url)}&strategy=${strategy}`);
            const data = await res.json();

            if (data.error) {
                throw new Error(data.error);
            }

            setScores(data);

            // Save to history automatically
            await saveToHistory(url, data);

        } catch (err: any) {
            setError(err.message || 'Failed to run audit');
        } finally {
            setLoading(false);
        }
    };

    const saveToHistory = async (url: string, data: Scores) => {
        try {
            await fetch('/api/lighthouse/history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url,
                    scores: {
                        performance: data.performance,
                        accessibility: data.accessibility,
                        bestPractices: data.bestPractices,
                        seo: data.seo
                    }
                })
            });
        } catch (e) {
            console.error('Failed to save history', e);
        }
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            {/* Input Section */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm sticky top-4 z-10 space-y-4 md:space-y-0 relative">
                <div className="flex flex-col md:flex-row gap-4">
                    <input
                        type="url"
                        placeholder="https://example.com"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />

                    <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setStrategy('mobile')}
                            className={`p-2 rounded-md transition-all flex items-center gap-2 text-sm font-medium ${strategy === 'mobile' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Smartphone size={18} />
                            Mobile
                        </button>
                        <button
                            onClick={() => setStrategy('desktop')}
                            className={`p-2 rounded-md transition-all flex items-center gap-2 text-sm font-medium ${strategy === 'desktop' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Monitor size={18} />
                            Desktop
                        </button>
                    </div>

                    <button
                        onClick={runAudit}
                        disabled={loading || !url}
                        className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors min-w-[140px] justify-center"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Play size={20} />}
                        {loading ? 'Analyzing...' : 'Analyze'}
                    </button>
                </div>
                {error && (
                    <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2 border border-red-100">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}
            </div>

            {scores && <LighthouseReport scores={scores} />}
        </div>
    );
}
