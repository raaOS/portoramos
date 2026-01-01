'use client';

import { useState } from 'react';
import {
    Bot,
    Search,
    Send,
    CheckCircle2,
    XCircle,
    Clock,
    Zap,
    Target,
    ExternalLink,
    Filter,
    ArrowUpRight,
    Loader2
} from 'lucide-react';
import AdminCard from '../components/AdminCard';
import AdminButton from '../components/AdminButton';

export default function AIHunterClient() {
    const [isHunting, setIsHunting] = useState(false);

    // Dummy data for flow demonstration
    const stats = [
        { label: 'Analysed Today', value: '142', icon: Search, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Proposals Sent', value: '12', icon: Send, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Response Rate', value: '8%', icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Interviews', value: '2', icon: CheckCircle2, color: 'text-amber-600', bg: 'bg-amber-50' },
    ];

    const recentJobs = [
        {
            id: 1,
            company: 'TechFlow Solutions',
            role: 'Senior UI/UX Designer',
            source: 'LinkedIn',
            status: 'sending',
            match: '94%',
            time: '12m ago'
        },
        {
            id: 2,
            company: 'CreativePulse Agency',
            role: 'Digital Art Director',
            source: 'Upwork',
            status: 'success',
            match: '88%',
            time: '1h ago'
        },
        {
            id: 3,
            company: 'Neon Studio',
            role: 'Motion Graphics Artist',
            source: 'Dribbble',
            status: 'failed',
            reason: 'Budget mismatch',
            match: '42%',
            time: '3h ago'
        },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
                        <div className={`p-2 rounded-lg ${stat.bg} ${stat.color} mb-2`}>
                            <stat.icon className="h-5 w-5" />
                        </div>
                        <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{stat.label}</span>
                        <span className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</span>
                    </div>
                ))}
            </div>

            {/* Main Controls */}
            <AdminCard>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${isHunting ? 'bg-indigo-500 animate-pulse' : 'bg-gray-100'}`}>
                            <Bot className={`h-6 w-6 ${isHunting ? 'text-white' : 'text-gray-400'}`} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">AI Hunter Status</h3>
                            <p className="text-sm text-gray-500">
                                {isHunting ? 'Currently scanning High-Value targets' : 'Agent idle. Ready to hunt.'}
                            </p>
                        </div>
                    </div>

                    <AdminButton
                        variant={isHunting ? 'secondary' : 'primary'}
                        onClick={() => setIsHunting(!isHunting)}
                        className="w-full md:w-auto min-w-[160px]"
                    >
                        {isHunting ? 'Stop Hunting' : (
                            <span className="flex items-center gap-2">
                                <Zap className="h-4 w-4 fill-current" />
                                Start Auto-Hunt
                            </span>
                        )}
                    </AdminButton>
                </div>
            </AdminCard>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Discovery Feed */}
                <div className="xl:col-span-2 space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Recent Discovery Feed
                        </h3>
                        <button className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1">
                            View All <ExternalLink className="h-3 w-3" />
                        </button>
                    </div>

                    <div className="space-y-3">
                        {recentJobs.map((job) => (
                            <div key={job.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg bg-gray-50 text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors`}>
                                            <BriefcaseIcon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">{job.role}</h4>
                                            <p className="text-xs text-gray-500">{job.company} • {job.source}</p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="flex items-center gap-2 justify-end mb-1">
                                            <span className="text-[10px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded-full uppercase">
                                                {job.match} Match
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-medium italic">{job.time}</span>
                                        </div>
                                        {job.status === 'success' && (
                                            <span className="text-xs flex items-center gap-1 text-green-600 font-medium justify-end">
                                                <CheckCircle2 className="h-3 w-3" /> Proposal Delivered
                                            </span>
                                        )}
                                        {job.status === 'sending' && (
                                            <span className="text-xs flex items-center gap-1 text-indigo-600 font-medium justify-end">
                                                <Loader2 className="h-3 w-3 animate-spin" /> Analyzing Portfolio...
                                            </span>
                                        )}
                                        {job.status === 'failed' && (
                                            <span className="text-xs flex items-center gap-1 text-red-500 font-medium justify-end">
                                                <XCircle className="h-3 w-3" /> {job.reason}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Configuration Sidebar */}
                <div className="space-y-6">
                    <AdminCard title="Hunting Preferences">
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Target Platforms</label>
                                <div className="flex flex-wrap gap-2">
                                    {['LinkedIn', 'Upwork', 'Dribbble', 'X'].map(p => (
                                        <span key={p} className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-100">
                                            {p}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Minimum Budget</label>
                                <div className="text-lg font-bold text-gray-900">$2,500+</div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 font-medium">
                                <button className="w-full py-2 text-sm text-gray-600 hover:text-indigo-600 flex items-center justify-center gap-2 transition-colors">
                                    <Filter className="h-4 w-4" />
                                    Advanced Filters
                                </button>
                            </div>
                        </div>
                    </AdminCard>

                    <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-xl shadow-indigo-200 relative overflow-hidden group">
                        <Zap className="absolute -right-4 -bottom-4 h-24 w-24 text-white/10 group-hover:scale-110 transition-transform duration-700" />
                        <div className="relative z-10">
                            <h4 className="font-bold text-lg mb-2">Upgrade Ramos AI</h4>
                            <p className="text-indigo-100 text-xs mb-4 leading-relaxed">
                                Enable "Auto-Apply" to let the AI sign and deliver proposals automatically.
                            </p>
                            <button className="bg-white text-indigo-600 px-4 py-2 rounded-xl text-xs font-bold shadow-soft flex items-center gap-2">
                                Learn More <ArrowUpRight className="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function BriefcaseIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="20" height="14" x="2" y="7" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
    );
}
