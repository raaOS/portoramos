'use client';

import { useState } from 'react';
import { AlertCircle, AlertTriangle, Square, ChevronDown, ChevronUp, Circle, Camera } from 'lucide-react';
import Image from 'next/image';

// Types (should actully be in a types file, but keeping collocated for now per existing pattern)
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

export interface LighthouseScores {
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

interface LighthouseReportProps {
    scores: LighthouseScores;
}

export default function LighthouseReport({ scores }: LighthouseReportProps) {
    const [expandedAudits, setExpandedAudits] = useState<Record<string, boolean>>({});
    const [showScreenshot, setShowScreenshot] = useState(false);

    const toggleAudit = (id: string) => {
        setExpandedAudits(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KiB', 'MiB', 'GiB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return { text: 'text-emerald-600', bg: 'bg-emerald-600', ring: 'text-emerald-100', bgSoft: 'bg-emerald-50' };
        if (score >= 50) return { text: 'text-amber-600', bg: 'bg-amber-600', ring: 'text-amber-100', bgSoft: 'bg-amber-50' };
        return { text: 'text-red-600', bg: 'bg-red-600', ring: 'text-red-100', bgSoft: 'bg-red-50' };
    };

    const Gauge = ({ score, label }: { score: number; label: string }) => {
        const { text, ring } = getScoreColor(score);
        const radius = 40;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (score / 100) * circumference;

        return (
            <div className="flex flex-col items-center">
                <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="64" cy="64" r={radius} fill="none" stroke="currentColor" strokeWidth="8" className={ring} />
                        <circle cx="64" cy="64" r={radius} fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={offset} className={`${text} transition-all duration-1000 ease-out`} strokeLinecap="round" />
                    </svg>
                    <div className={`absolute inset-0 flex items-center justify-center text-4xl font-bold ${text}`}>
                        {score}
                    </div>
                </div>
                <span className="mt-2 font-medium text-gray-700">{label}</span>
            </div>
        );
    };

    const MetricCard = ({ label, value, icon }: { label: string; value: string; icon: any }) => (
        <div className="flex items-center justify-between p-3 border-b border-gray-100 last:border-0 sm:border sm:rounded-lg sm:p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
                {icon}
                <span className="text-sm text-gray-600 font-medium">{label}</span>
            </div>
            <span className="text-lg font-bold text-gray-900 font-mono">{value || '-'}</span>
        </div>
    );

    const AuditRow = ({ audit, type }: { audit: AuditItem, type: 'opportunity' | 'diagnostic' }) => {
        const isExpanded = expandedAudits[audit.id];
        const severity = audit.score === 0 || audit.scoreDisplayMode === 'error' ? 'red' : 'amber';
        const Icon = severity === 'red' ? AlertTriangle : Square;
        const iconColor = severity === 'red' ? 'text-red-500' : 'text-amber-500 fill-amber-500';

        return (
            <div className="border-b border-gray-200 last:border-0">
                <button
                    onClick={() => toggleAudit(audit.id)}
                    className="w-full text-left py-4 px-2 hover:bg-gray-50 flex items-start gap-3 transition-colors group"
                >
                    <div className="mt-1">
                        <Icon size={16} className={iconColor} />
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-center pr-2">
                            <span className="text-gray-900 font-medium group-hover:text-blue-600 transition-colors">
                                {audit.title}
                            </span>
                            {audit.displayValue && (
                                <span className="text-red-600 text-sm font-semibold">{audit.displayValue}</span>
                            )}
                        </div>
                        {isExpanded && (
                            <p className="text-sm text-gray-500 mt-1 mb-2">
                                {audit.description.split('[')[0]}
                                <a
                                    href={audit.description.match(/\((.*?)\)/)?.[1] || '#'}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-600 hover:underline ml-1"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    Learn more
                                </a>
                            </p>
                        )}
                    </div>
                    <div className="mt-1 text-gray-400">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                </button>

                {isExpanded && audit.details?.items && audit.details.items.length > 0 && (
                    <div className="bg-gray-50 p-4 overflow-x-auto animate-in slide-in-from-top-2 duration-200">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-100">
                                <tr>
                                    {audit.details.headings?.map((h: any, idx: number) => (
                                        <th key={idx} className="px-3 py-2">{h.label}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {audit.details.items.map((item: any, idx: number) => (
                                    <tr key={idx} className="border-b border-gray-200 last:border-0 bg-white">
                                        {audit.details?.headings?.map((h: any, hIdx: number) => {
                                            const val = item[h.key];
                                            return (
                                                <td key={hIdx} className="px-3 py-2 text-gray-700 truncate max-w-[200px] border-b border-gray-100" title={String(val)}>
                                                    {h.valueType === 'url' ? (
                                                        <div className="truncate text-gray-900 font-mono text-xs">{String(val)}</div>
                                                    ) : h.valueType === 'bytes' ? (
                                                        formatBytes(Number(val))
                                                    ) : h.valueType === 'ms' ? (
                                                        `${Math.round(Number(val))} ms`
                                                    ) : (
                                                        String(val)
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
            {/* Screenshot Toggle */}
            {scores?.audits?.screenshot && (
                <div className="flex justify-end pt-2">
                    <button
                        onClick={() => setShowScreenshot(!showScreenshot)}
                        className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-2"
                    >
                        <Camera size={16} />
                        {showScreenshot ? 'Hide Screenshot' : 'View Full Page Screenshot'}
                    </button>
                </div>
            )}

            {/* Screenshot Modal/Card */}
            {showScreenshot && scores?.audits?.screenshot && (
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <h3 className="font-bold text-gray-900 mb-4">Google Bot View</h3>
                    <div className="relative w-full aspect-[9/16] md:aspect-video rounded-lg overflow-hidden border border-gray-100">
                        <Image
                            src={scores.audits.screenshot}
                            alt="Full page screenshot"
                            fill
                            className="object-contain bg-gray-50"
                            unoptimized
                        />
                    </div>
                </div>
            )}

            {/* Gauges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 justify-items-center">
                <Gauge score={scores.performance} label="Performance" />
                <Gauge score={scores.accessibility} label="Accessibility" />
                <Gauge score={scores.bestPractices} label="Best Practices" />
                <Gauge score={scores.seo} label="SEO" />
            </div>

            <hr className="border-gray-200" />

            {/* Metrics Grid */}
            {scores.coreWebVitals && (
                <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 px-2">Metrics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <MetricCard
                            label="First Contentful Paint"
                            value={scores.coreWebVitals.fcp}
                            icon={<Circle size={12} className="text-emerald-500 fill-emerald-500" />}
                        />
                        <MetricCard
                            label="Largest Contentful Paint"
                            value={scores.coreWebVitals.lcp}
                            icon={<Square size={12} className="text-amber-500 fill-amber-500 transform rotate-45" />}
                        />
                        <MetricCard
                            label="Total Blocking Time"
                            value={scores.coreWebVitals.tbt}
                            icon={<AlertTriangle size={12} className="text-red-500 fill-red-500" />}
                        />
                        <MetricCard
                            label="Cumulative Layout Shift"
                            value={scores.coreWebVitals.cls}
                            icon={<Square size={12} className="text-emerald-500 fill-emerald-500" />}
                        />
                        <MetricCard
                            label="Speed Index"
                            value={scores.coreWebVitals.si}
                            icon={<Circle size={12} className="text-emerald-500 fill-emerald-500" />}
                        />
                    </div>
                </div>
            )}

            {/* Opportunities */}
            {scores.audits?.opportunities && scores.audits.opportunities.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <h3 className="text-base font-bold text-gray-900">OPPORTUNITIES</h3>
                        <p className="text-sm text-gray-500 mt-1">These suggestions can help your page load faster. They don't directly affect the Performance score.</p>
                    </div>
                    <div className="divide-y divide-gray-200">
                        {scores.audits.opportunities.map((audit) => (
                            <AuditRow key={audit.id} audit={audit} type="opportunity" />
                        ))}
                    </div>
                </div>
            )}

            {/* Diagnostics */}
            {scores.audits?.diagnostics && scores.audits.diagnostics.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <h3 className="text-base font-bold text-gray-900">DIAGNOSTICS</h3>
                        <p className="text-sm text-gray-500 mt-1">More information about the performance of your application.</p>
                    </div>
                    <div className="divide-y divide-gray-200">
                        {scores.audits.diagnostics.map((audit) => (
                            <AuditRow key={audit.id} audit={audit} type="diagnostic" />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
