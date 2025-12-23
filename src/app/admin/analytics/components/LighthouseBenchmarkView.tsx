'use client';

import { useState } from 'react';
import { Play, Loader2, Swords, Trophy, XCircle, CheckCircle2 } from 'lucide-react';
import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';

interface BenchmarkScores {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
    lcp: string;
    cls: string;
}

export default function LighthouseBenchmarkView() {
    const [url1, setUrl1] = useState('');
    const [url2, setUrl2] = useState('');
    const [loading, setLoading] = useState(false);
    const [result1, setResult1] = useState<BenchmarkScores | null>(null);
    const [result2, setResult2] = useState<BenchmarkScores | null>(null);
    const [error, setError] = useState('');

    const runBenchmark = async () => {
        if (!url1 || !url2) {
            setError('Please enter both URLs to compare');
            return;
        }

        setLoading(true);
        setError('');
        setResult1(null);
        setResult2(null);

        try {
            // Run parallel requests
            const [p1, p2] = await Promise.all([
                fetch(`/api/lighthouse?url=${encodeURIComponent(url1)}&strategy=mobile`),
                fetch(`/api/lighthouse?url=${encodeURIComponent(url2)}&strategy=mobile`)
            ]);

            const d1 = await p1.json();
            const d2 = await p2.json();

            if (d1.error) throw new Error(`URL 1 Error: ${d1.error}`);
            if (d2.error) throw new Error(`URL 2 Error: ${d2.error}`);

            setResult1({
                performance: d1.performance,
                accessibility: d1.accessibility,
                bestPractices: d1.bestPractices,
                seo: d1.seo,
                lcp: d1.coreWebVitals?.lcp || '-',
                cls: d1.coreWebVitals?.cls || '-'
            });

            setResult2({
                performance: d2.performance,
                accessibility: d2.accessibility,
                bestPractices: d2.bestPractices,
                seo: d2.seo,
                lcp: d2.coreWebVitals?.lcp || '-',
                cls: d2.coreWebVitals?.cls || '-'
            });

        } catch (err: any) {
            setError(err.message || 'Failed to run benchmark');
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return '#059669';
        if (score >= 50) return '#d97706';
        return '#dc2626';
    };

    const SmallGauge = ({ score }: { score: number }) => {
        const color = getScoreColor(score);
        const data = [{ value: score, fill: color }];
        return (
            <div className="relative w-16 h-16 flex items-center justify-center">
                <RadialBarChart width={64} height={64} cx="50%" cy="50%" innerRadius="60%" outerRadius="100%" barSize={4} data={data} startAngle={90} endAngle={-270}>
                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                    <RadialBar background dataKey="value" cornerRadius={30} />
                </RadialBarChart>
                <div className="absolute inset-0 flex items-center justify-center text-sm font-bold" style={{ color }}>{score}</div>
            </div>
        );
    };

    const StatRow = ({ label, val1, val2, highlightHigher = true }: { label: string; val1: number | string; val2: number | string; highlightHigher?: boolean }) => {
        let win1 = false;
        let win2 = false;

        // Simple number comparison logic
        if (typeof val1 === 'number' && typeof val2 === 'number') {
            if (highlightHigher) {
                if (val1 > val2) win1 = true;
                if (val2 > val1) win2 = true;
            } else {
                // Usually lower is better for metrics like LCP logic, but here we passed strings mostly for web vitals
                // Ideally parse numbers. Assuming we compare scores (highlightHigher=true).
            }
        }

        return (
            <div className="grid grid-cols-3 items-center py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                <div className={`text-center font-bold ${win1 ? 'text-emerald-600' : 'text-gray-900'} flex justify-center items-center gap-2`}>
                    {win1 && <Trophy className="w-4 h-4 text-amber-500" />}
                    {val1}
                </div>
                <div className="text-center text-sm font-medium text-gray-500 uppercase tracking-wider">{label}</div>
                <div className={`text-center font-bold ${win2 ? 'text-emerald-600' : 'text-gray-900'} flex justify-center items-center gap-2`}>
                    {val2}
                    {win2 && <Trophy className="w-4 h-4 text-amber-500" />}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Battle Input */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-2xl shadow-xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                <div className="flex items-center justify-center mb-8 relative z-10">
                    <div className="bg-white/10 px-4 py-1 rounded-full border border-white/20 flex items-center gap-2 backdrop-blur-md">
                        <Swords className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-bold tracking-wide">VERSUS MODE</span>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4 relative z-10">
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">Challenger (You)</label>
                        <input
                            type="url"
                            className="w-full bg-slate-950/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                            placeholder="https://your-site.com"
                            value={url1}
                            onChange={(e) => setUrl1(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-500 text-slate-900 font-black text-xl shadow-lg shadow-amber-500/20 shrink-0 transform md:translate-y-3">
                        VS
                    </div>

                    <div className="flex-1 w-full">
                        <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">Opponent</label>
                        <input
                            type="url"
                            className="w-full bg-slate-950/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                            placeholder="https://competitor.com"
                            value={url2}
                            onChange={(e) => setUrl2(e.target.value)}
                        />
                    </div>
                </div>

                <div className="mt-8 flex justify-center relative z-10">
                    <button
                        onClick={runBenchmark}
                        disabled={loading || !url1 || !url2}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 px-8 rounded-xl shadow-lg shadow-amber-500/20 transition-all transform hover:scale-105 disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Play fill="currentColor" />}
                        {loading ? 'FIGHTING...' : 'START BATTLE'}
                    </button>
                </div>

                {error && <div className="mt-4 text-center text-red-400 text-sm bg-red-900/20 p-2 rounded-lg border border-red-500/20">{error}</div>}
            </div>

            {/* Results */}
            {result1 && result2 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-8 duration-700">
                    <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200 p-4">
                        <div className="font-bold text-center truncate px-2">{url1}</div>
                        <div className="text-center text-gray-400 font-mono text-xs flex items-center justify-center">METRICS</div>
                        <div className="font-bold text-center truncate px-2">{url2}</div>
                    </div>

                    <div className="p-6">
                        <StatRow label="Performance" val1={result1.performance} val2={result2.performance} />
                        <StatRow label="Accessibility" val1={result1.accessibility} val2={result2.accessibility} />
                        <StatRow label="Best Practices" val1={result1.bestPractices} val2={result2.bestPractices} />
                        <StatRow label="SEO" val1={result1.seo} val2={result2.seo} />

                        <div className="py-2"></div>

                        {/* Since user asked for simple side by side, we keep it visual */}
                        <div className="flex justify-center mt-6">
                            {result1.performance > result2.performance ? (
                                <div className="bg-emerald-100 text-emerald-800 px-6 py-2 rounded-full font-bold flex items-center gap-2">
                                    <Trophy size={18} />
                                    Winner: Left
                                </div>
                            ) : result1.performance < result2.performance ? (
                                <div className="bg-emerald-100 text-emerald-800 px-6 py-2 rounded-full font-bold flex items-center gap-2">
                                    <Trophy size={18} />
                                    Winner: Right
                                </div>
                            ) : (
                                <div className="bg-gray-100 text-gray-800 px-6 py-2 rounded-full font-bold">
                                    Draw!
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
