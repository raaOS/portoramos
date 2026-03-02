'use client';

import { useState } from 'react';
import { Smartphone, Monitor, Play, Loader2, AlertCircle, Copy, Check } from 'lucide-react';

import { useAdminAuth } from '@/hooks/useAdminAuth';
import LighthouseReport, { type LighthouseScores, type AuditItem } from './LighthouseReport';

type Scores = LighthouseScores;

export default function LighthouseAuditView() {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [strategy, setStrategy] = useState<'mobile' | 'desktop'>('mobile');
    const [scores, setScores] = useState<Scores | null>(null);
    const { csrfToken } = useAdminAuth();
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

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
        setCopied(false);

        try {
            const res = await fetch(`/api/lighthouse?url=${encodeURIComponent(url)}&strategy=${strategy}`, {
                credentials: 'include'
            });
            const data = await res.json();

            if (data.error) {
                throw new Error(data.error);
            }

            setScores(data);

            // Save to history automatically
            await saveToHistory(url, data);

        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to run audit');
        } finally {
            setLoading(false);
        }
    };

    const saveToHistory = async (auditUrl: string, data: Scores) => {
        try {
            await fetch('/api/lighthouse/history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken
                },
                credentials: 'include',
                body: JSON.stringify({
                    url: auditUrl,
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

    const formatDetails = (details?: { type?: string; items?: Array<Record<string, unknown>>; headings?: Array<{ key: string; label?: string; text?: string; valueType?: string }> }) => {
        if (!details || !details.items || details.items.length === 0) return '';

        // Handle Table format
        if (details.type === 'table' && details.headings) {
            const headings = details.headings.map((h) => h.text || h.label).join('\t');
            const rows = details.items.map((item) => {
                return details.headings?.map((h) => {
                    const val = item[h.key];
                    // Simple formatting for bytes/time if needed, or raw value
                    if (h.valueType === 'bytes') return `${(Number(val) / 1024).toFixed(2)} KiB`;
                    if (h.valueType === 'ms') return `${val} ms`;
                    // Handle URL objects often returned by Lighthouse
                    if (typeof val === 'object' && val !== null && 'url' in val) return String((val as {url: string}).url);
                    return String(val);
                }).join('\t');
            }).join('\n');

            return `\n${headings}\n${rows}`;
        }
        return '';
    };

    const handleCopyResult = () => {
        if (!scores) return;

        const date = new Date().toLocaleString();

        const formatSection = (title: string, items?: AuditItem[]) => {
            if (!items || items.length === 0) return '';
            const content = items.map(item => {
                const head = `\n${item.title}\n${item.displayValue || ''}\n${item.description}`;
                const detailTable = formatDetails(item.details);
                return `${head}${detailTable}`;
            }).join('\n-------------------------------------------------\n');
            return `\n${title}\n${'-'.repeat(title.length)}\n${content}`;
        };

        const text = `
Lighthouse Analysis Report
--------------------------
Date: ${date}
URL: ${url}
Strategy: ${strategy.toUpperCase()}

OVERALL SCORES
--------------
Performance:   ${scores.performance}
Accessibility: ${scores.accessibility}
Best Practices: ${scores.bestPractices}
SEO:           ${scores.seo}

CORE WEB VITALS
---------------
LCP (Largest Contentful Paint): ${scores.coreWebVitals?.lcp || 'N/A'}
FCP (First Contentful Paint):   ${scores.coreWebVitals?.fcp || 'N/A'}
CLS (Cumulative Layout Shift):  ${scores.coreWebVitals?.cls || 'N/A'}
TBT (Total Blocking Time):      ${scores.coreWebVitals?.tbt || 'N/A'}
SI  (Speed Index):              ${scores.coreWebVitals?.si || 'N/A'}

${formatSection('OPPORTUNITIES', scores.audits?.opportunities)}

${formatSection('DIAGNOSTICS', scores.audits?.diagnostics)}
`.trim();

        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
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

                    {scores && (
                        <button
                            onClick={handleCopyResult}
                            className={`px-4 py-2 font-medium rounded-lg border transition-all flex items-center gap-2 min-w-[120px] justify-center ${copied
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            {copied ? <Check size={18} /> : <Copy size={18} />}
                            {copied ? 'Copied!' : 'Copy Result'}
                        </button>
                    )}
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
