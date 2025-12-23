'use client';

import { useState, useEffect } from 'react';
import { Play, Loader2, Link as LinkIcon, AlertCircle, ArrowRight, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Project } from '@/types/projects';
import LighthouseReport, { LighthouseScores } from './LighthouseReport';

interface PageResult {
    url: string;
    path: string;
    status: 'pending' | 'scanning' | 'complete' | 'error';
    scores?: LighthouseScores;
    error?: string;
}

export default function LighthouseSiteAuditView() {
    const [baseUrl, setBaseUrl] = useState('');
    const [pages, setPages] = useState<PageResult[]>([]);
    const [scanning, setScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [selectedPage, setSelectedPage] = useState<PageResult | null>(null);

    // Initial setup: Determine base URL and fetch projects
    useEffect(() => {
        // Simple heuristic for base URL - can be improved or made configurable
        if (typeof window !== 'undefined') {
            setBaseUrl(window.location.origin);
        }

        const fetchRoutes = async () => {
            try {
                // 1. Static Routes
                const staticRoutes = ['/', '/about', '/work', '/contact'];

                // 2. Fetch Dynamic Projects
                const res = await fetch('/api/projects');
                const data = await res.json();
                const projects: Project[] = data.projects || [];

                const projectRoutes = projects
                    //.filter(p => !p.isHidden) // Optional: only scan public pages
                    .map(p => `/work/${p.slug}`);

                const allRoutes = [...staticRoutes, ...projectRoutes];

                setPages(allRoutes.map(path => ({
                    url: '', // Will be constructed with baseUrl
                    path,
                    status: 'pending'
                })));

            } catch (error) {
                console.error('Failed to fetch routes', error);
            }
        };

        fetchRoutes();
    }, []);

    const runSiteAudit = async () => {
        if (!baseUrl) return;

        setScanning(true);
        setSelectedPage(null);
        setProgress(0);

        // Reset statuses
        const initialPages = pages.map(p => ({
            ...p,
            url: `${baseUrl}${p.path}`,
            status: 'pending' as const,
            scores: undefined,
            error: undefined
        }));
        setPages(initialPages);

        // Execute Sequentially
        for (let i = 0; i < initialPages.length; i++) {
            const page = initialPages[i];
            const urlToScan = page.url;

            // Update status to scanning
            setPages(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'scanning' } : p));

            try {
                // Check if localhost
                if (urlToScan.includes('localhost') || urlToScan.includes('127.0.0.1')) {
                    throw new Error('Cannot audit localhost. Please deploy to Vercel first.');
                }

                const res = await fetch(`/api/lighthouse?url=${encodeURIComponent(urlToScan)}&strategy=mobile`);
                const result = await res.json();

                if (result.error) throw new Error(result.error);

                setPages(prev => prev.map((p, idx) => idx === i ? {
                    ...p,
                    status: 'complete',
                    scores: result
                } : p));

            } catch (err: any) {
                setPages(prev => prev.map((p, idx) => idx === i ? {
                    ...p,
                    status: 'error',
                    error: err.message || 'Scan failed'
                } : p));
            } finally {
                setProgress(((i + 1) / initialPages.length) * 100);
            }
        }

        setScanning(false);
    };

    const getScoreBadge = (score?: number) => {
        if (score === undefined) return <span className="text-gray-300">-</span>;
        let color = 'bg-red-100 text-red-700';
        if (score >= 90) color = 'bg-emerald-100 text-emerald-700';
        else if (score >= 50) color = 'bg-amber-100 text-amber-700';

        return (
            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${color}`}>
                {score}
            </span>
        );
    };

    const StatusIcon = ({ status }: { status: string }) => {
        if (status === 'scanning') return <Loader2 className="animate-spin text-blue-500" size={18} />;
        if (status === 'complete') return <CheckCircle2 className="text-emerald-500" size={18} />;
        if (status === 'error') return <XCircle className="text-red-500" size={18} />;
        return <div className="w-4 h-4 rounded-full border-2 border-gray-200" />;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Control */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h3 className="font-bold text-gray-900 text-lg">Full Site Audit</h3>
                    <p className="text-gray-500 text-sm">Detected {pages.length} pages in your sitemap.</p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    {baseUrl.includes('localhost') && (
                        <div className="px-3 py-1 bg-amber-50 text-amber-700 text-xs rounded border border-amber-200 flex items-center gap-2">
                            <AlertTriangle size={12} />
                            Requires Public URL (Not Localhost) - Set manually?
                            <input
                                className="bg-white border border-amber-300 rounded px-1 text-xs w-32"
                                placeholder="https://..."
                                onChange={(e) => setBaseUrl(e.target.value)}
                            />
                        </div>
                    )}

                    <button
                        onClick={runSiteAudit}
                        disabled={scanning || pages.length === 0}
                        className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm transition-all active:scale-95"
                    >
                        {scanning ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
                        {scanning ? `Scanning ${Math.round(progress)}%` : 'Start Scan'}
                    </button>
                </div>
            </div>

            {/* Results Table */}
            {pages.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* List */}
                    <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col max-h-[600px]">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 font-medium text-gray-700 text-sm flex justify-between items-center">
                            <span>Pages Report Card</span>
                            <span className="text-xs text-gray-500 font-normal">{pages.filter(p => p.status === 'complete').length} / {pages.length} Done</span>
                        </div>
                        <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
                            {pages.map((page, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => page.status === 'complete' && setSelectedPage(page)}
                                    disabled={page.status !== 'complete'}
                                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors hover:bg-gray-50 ${selectedPage === page ? 'bg-blue-50 ring-1 ring-inset ring-blue-200' : ''}`}
                                >
                                    <div className="mt-0.5"><StatusIcon status={page.status} /></div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-900 truncate" title={page.path}>{page.path}</div>
                                        {page.error ? (
                                            <div className="text-xs text-red-500 truncate">{page.error}</div>
                                        ) : (
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="text-[10px] text-gray-400 uppercase tracking-wider">PERF</div>
                                                <div className={`h-1.5 w-12 rounded-full ${!page.scores ? 'bg-gray-100' : page.scores.performance >= 90 ? 'bg-emerald-500' : page.scores.performance >= 50 ? 'bg-amber-400' : 'bg-red-500'}`}></div>
                                            </div>
                                        )}
                                    </div>
                                    {page.status === 'complete' && <ArrowRight size={14} className="text-gray-300" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Detail View */}
                    <div className="lg:col-span-2">
                        {selectedPage ? (
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 animate-in slide-in-from-right-4 duration-500">
                                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                            <LinkIcon size={20} className="text-gray-400" />
                                            {selectedPage.path}
                                        </h2>
                                        <a href={selectedPage.url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline mt-1 block px-7">{selectedPage.url}</a>
                                    </div>
                                    <button onClick={() => setSelectedPage(null)} className="md:hidden text-sm text-gray-500">Close</button>
                                </div>
                                {selectedPage.scores && <LighthouseReport scores={selectedPage.scores} />}
                            </div>
                        ) : (
                            <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 h-full min-h-[400px] flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                                <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                                    <AlertCircle size={32} className="text-gray-300" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-600 mb-2">Select a Page</h3>
                                <p className="max-w-xs mx-auto">Click on any "Complete" row on the left to view the full detailed audit report for that page.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
