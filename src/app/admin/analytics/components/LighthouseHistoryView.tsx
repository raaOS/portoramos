'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, Loader2 } from 'lucide-react';

interface HistoryItem {
    id: string;
    date: string;
    url: string;
    scores: {
        performance: number;
        accessibility: number;
        bestPractices: number;
        seo: number;
    };
}

export default function LighthouseHistoryView() {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch('/api/lighthouse/history');
                const data = await res.json();
                // Reverse to show oldest to newest left to right
                setHistory(Array.isArray(data) ? data.reverse() : []);
            } catch (error) {
                console.error('Failed to load history', error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    const formatDate = (isoString: string) => {
        return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No audit history found yet.</p>
                <p className="text-sm text-gray-400">Run an audit in the "Audit" tab to start tracking.</p>
            </div>
        );
    }

    // Prepare data for chart
    const chartData = history.map(item => ({
        date: formatDate(item.date),
        performance: item.scores.performance,
        accessibility: item.scores.accessibility,
        bestPractices: item.scores.bestPractices,
        seo: item.scores.seo,
    }));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                        📈
                    </span>
                    Performance Trends
                </h3>

                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis
                                dataKey="date"
                                stroke="#9CA3AF"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                            />
                            <YAxis
                                stroke="#9CA3AF"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                domain={[0, 100]}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Line type="monotone" dataKey="performance" stroke="#059669" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Performance" />
                            <Line type="monotone" dataKey="accessibility" stroke="#d97706" strokeWidth={2} dot={{ r: 4 }} name="Accessibility" />
                            <Line type="monotone" dataKey="bestPractices" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="Best Practices" />
                            <Line type="monotone" dataKey="seo" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} name="SEO" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="font-semibold text-gray-900">Recent Audits</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-white text-gray-500 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 font-medium">Date</th>
                                <th className="px-6 py-3 font-medium">URL</th>
                                <th className="px-6 py-3 font-medium text-center">Perf</th>
                                <th className="px-6 py-3 font-medium text-center">Acc</th>
                                <th className="px-6 py-3 font-medium text-center">Best</th>
                                <th className="px-6 py-3 font-medium text-center">SEO</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {history.slice().reverse().slice(0, 50).map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-gray-600 font-mono text-xs">{formatDate(item.date)}</td>
                                    <td className="px-6 py-4 text-gray-900 truncate max-w-[200px]" title={item.url}>{item.url}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-bold ${item.scores.performance >= 90 ? 'bg-emerald-100 text-emerald-700' :
                                                item.scores.performance >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {item.scores.performance}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center text-gray-600">{item.scores.accessibility}</td>
                                    <td className="px-6 py-4 text-center text-gray-600">{item.scores.bestPractices}</td>
                                    <td className="px-6 py-4 text-center text-gray-600">{item.scores.seo}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
