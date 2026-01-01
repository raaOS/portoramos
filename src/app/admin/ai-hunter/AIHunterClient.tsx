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
    Loader2,
    Eye,
    MessageSquare,
    Check,
    Edit3,
    MapPin
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminCard from '../components/AdminCard';
import AdminButton from '../components/AdminButton';
import AdminModal from '../components/AdminModal';
import { useToast } from '@/contexts/ToastContext';
import { AIJob, AIHunterData, AIHunterSettings } from '@/types/ai-hunter';

export default function AIHunterClient() {
    const queryClient = useQueryClient();
    const { showSuccess, showError } = useToast();
    const [reviewingJob, setReviewingJob] = useState<AIJob | null>(null);
    const [editedDraft, setEditedDraft] = useState('');
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [tempSettings, setTempSettings] = useState<AIHunterSettings | null>(null);

    // 1. Fetch AI Hunter Data
    const { data, isLoading } = useQuery<AIHunterData>({
        queryKey: ['ai-hunter'],
        queryFn: async () => {
            const res = await fetch('/api/ai-hunter');
            if (!res.ok) throw new Error('Failed to fetch AI Hunter data');
            return res.json();
        }
    });

    // 2. Mutations
    const settingsMutation = useMutation({
        mutationFn: async ({ action, settings }: { action: 'startHunt' | 'stopHunt' | 'updateSettings', settings?: Partial<AIHunterSettings> }) => {
            const res = await fetch('/api/ai-hunter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, settings })
            });
            if (!res.ok) throw new Error('Action failed');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-hunter'] });
            showSuccess('Settings updated');
            setIsConfigModalOpen(false);
        },
        onError: (err: any) => showError(err.message)
    });

    const handleOpenConfig = () => {
        if (!data?.settings) return;
        setTempSettings(data.settings);
        setIsConfigModalOpen(true);
    };

    const handleSaveSettings = () => {
        if (!tempSettings) return;
        settingsMutation.mutate({ action: 'updateSettings', settings: tempSettings });
    };

    const jobMutation = useMutation({
        mutationFn: async ({ id, updates }: { id: string, updates: Partial<AIJob> }) => {
            const res = await fetch('/api/ai-hunter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'updateJob',
                    jobId: id,
                    jobUpdates: updates
                })
            });
            if (!res.ok) throw new Error('Failed to update job');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-hunter'] });
            setReviewingJob(null);
        },
        onError: (err: any) => showError(err.message)
    });

    const handleToggleHunt = () => {
        const action = data?.settings.isHunting ? 'stopHunt' : 'startHunt';
        settingsMutation.mutate({ action });
    };

    const handleOpenReview = (job: AIJob) => {
        if (job.status !== 'pending') return;
        setReviewingJob(job);
        setEditedDraft(job.proposalDraft || '');
    };

    const handleApprove = () => {
        if (!reviewingJob) return;
        jobMutation.mutate({
            id: reviewingJob.id,
            updates: {
                status: 'success',
                proposalDraft: editedDraft
            }
        });
        showSuccess('Proposal approved and sent!');
    };

    const handleReject = () => {
        if (!reviewingJob) return;
        jobMutation.mutate({
            id: reviewingJob.id,
            updates: {
                status: 'failed',
                reason: 'Manually rejected by user'
            }
        });
        showSuccess('Proposal rejected');
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    const { jobs = [], settings = { isHunting: false } } = data || {};

    const stats = [
        { label: 'Analysed Total', value: jobs.length.toString(), icon: Search, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Success', value: jobs.filter(j => j.status === 'success').length.toString(), icon: Send, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Pending Review', value: jobs.filter(j => j.status === 'pending').length.toString(), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Failures', value: jobs.filter(j => j.status === 'failed').length.toString(), icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
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
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-all duration-500 ${settings.isHunting ? 'bg-indigo-500 animate-pulse' : 'bg-gray-100'}`}>
                            <Bot className={`h-6 w-6 ${settings.isHunting ? 'text-white' : 'text-gray-400'}`} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">AI Hunter Status</h3>
                            <p className="text-sm text-gray-500">
                                {settings.isHunting ? 'Currently scanning High-Value targets' : 'Agent idle. Ready to hunt.'}
                            </p>
                        </div>
                    </div>

                    <AdminButton
                        variant={settings.isHunting ? 'secondary' : 'primary'}
                        onClick={handleToggleHunt}
                        className="w-full md:w-auto min-w-[160px]"
                        disabled={settingsMutation.isPending}
                    >
                        {settingsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                            settings.isHunting ? 'Stop Hunting' : (
                                <span className="flex items-center gap-2">
                                    <Zap className="h-4 w-4 fill-current" />
                                    Start Auto-Hunt
                                </span>
                            )
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
                    </div>

                    <div className="space-y-3">
                        {jobs.length === 0 ? (
                            <div className="bg-white p-12 rounded-xl border border-dashed border-gray-200 text-center">
                                <p className="text-gray-400">No jobs discovered yet. Start hunting!</p>
                            </div>
                        ) : jobs.map((job) => (
                            <div
                                key={job.id}
                                className={`bg-white p-4 rounded-xl border border-gray-100 shadow-sm transition-all group ${job.status === 'pending' ? 'cursor-pointer hover:border-amber-400 hover:ring-1 hover:ring-amber-400' : ''}`}
                                onClick={() => handleOpenReview(job)}
                            >
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
                                                {job.matchScore || 0}% Match
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-medium italic">
                                                {new Date(job.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        {job.status === 'success' && (
                                            <span className="text-xs flex items-center gap-1 text-green-600 font-medium justify-end">
                                                <CheckCircle2 className="h-3 w-3" /> Proposal Delivered
                                            </span>
                                        )}
                                        {job.status === 'pending' && (
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-lg font-bold border border-amber-200 text-xs">
                                                <MessageSquare className="h-3 w-3" /> Needs Review
                                            </div>
                                        )}
                                        {job.status === 'failed' && (
                                            <span className="text-xs flex items-center gap-1 text-red-500 font-medium justify-end">
                                                <XCircle className="h-3 w-3" /> {job.reason || 'Failed'}
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
                                    {data?.settings.targetPlatforms?.map(p => (
                                        <span key={p} className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-100">
                                            {p}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Minimum Budget</label>
                                <div className="text-lg font-bold text-gray-900">${data?.settings.minBudget}+</div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 font-medium">
                                <button className="w-full py-2 text-sm text-gray-600 hover:text-indigo-600 flex items-center justify-center gap-2 transition-colors">
                                    <SettingsIcon className="h-4 w-4" />
                                    Configure Rules
                                </button>
                            </div>
                        </div>
                    </AdminCard>
                </div>
            </div>

            {/* Review Modal */}
            <AdminModal
                isOpen={!!reviewingJob}
                onClose={() => setReviewingJob(null)}
                title="Review Outreach Proposal"
                size="lg"
                actions={
                    <div className="flex items-center justify-between w-full">
                        <button
                            onClick={handleReject}
                            className="text-red-500 hover:text-red-700 text-sm font-bold flex items-center gap-1"
                        >
                            <XCircle className="h-4 w-4" /> Reject This Lead
                        </button>
                        <div className="flex gap-3">
                            <AdminButton variant="secondary" onClick={() => setReviewingJob(null)}>
                                Later
                            </AdminButton>
                            <AdminButton variant="primary" onClick={handleApprove} disabled={jobMutation.isPending}>
                                {jobMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                                    <span className="flex items-center gap-2">
                                        <Check className="h-4 w-4" /> Approve & Send
                                    </span>
                                )}
                            </AdminButton>
                        </div>
                    </div>
                }
            >
                {reviewingJob && (
                    <div className="space-y-6 py-2">
                        <div className="flex items-start justify-between">
                            <div>
                                <h4 className="text-xl font-bold text-gray-900">{reviewingJob.role}</h4>
                                <p className="text-indigo-600 font-medium">{reviewingJob.company}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-bold bg-green-50 text-green-700 px-3 py-1 rounded-full uppercase">
                                    {reviewingJob.matchScore}% Match
                                </span>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl">
                            <h5 className="text-xs font-bold text-gray-500 uppercase mb-2">Job Description</h5>
                            <p className="text-sm text-gray-700 leading-relaxed italic line-clamp-3">
                                "{reviewingJob.description}"
                            </p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h5 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                                    <Edit3 className="h-3 w-3" /> Ramos's Voice (AI Draft)
                                </h5>
                                <span className="text-[10px] text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded font-bold">PROFESSIONAL TONE</span>
                            </div>
                            <textarea
                                value={editedDraft}
                                onChange={(e) => setEditedDraft(e.target.value)}
                                className="w-full h-48 p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm leading-relaxed outline-none transition-all shadow-inner bg-white"
                                placeholder="Write your email/message here..."
                            />
                            <p className="text-[10px] text-gray-400">
                                * Edit the message above to make it feel more authentic before sending.
                            </p>
                        </div>
                    </div>
                )}
            </AdminModal>

            {/* Configure Rules Modal */}
            <AdminModal
                isOpen={isConfigModalOpen}
                onClose={() => setIsConfigModalOpen(false)}
                title="Configure Hunting Rules"
                size="lg"
                actions={
                    <div className="flex gap-3 justify-end w-full">
                        <AdminButton variant="secondary" onClick={() => setIsConfigModalOpen(false)}>
                            Cancel
                        </AdminButton>
                        <AdminButton variant="primary" onClick={handleSaveSettings} disabled={settingsMutation.isPending}>
                            {settingsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Configuration'}
                        </AdminButton>
                    </div>
                }
            >
                {tempSettings && (
                    <div className="space-y-6 py-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Column */}
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-bold text-gray-700 block mb-2">Job Roles (Keywords)</label>
                                    <input
                                        type="text"
                                        value={tempSettings.roles?.join(', ')}
                                        onChange={(e) => setTempSettings({ ...tempSettings, roles: e.target.value.split(',').map(s => s.trim()) })}
                                        className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                        placeholder="UI Designer, Art Director, etc."
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-gray-700 block mb-2">Location Preference</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={tempSettings.location}
                                            onChange={(e) => setTempSettings({ ...tempSettings, location: e.target.value })}
                                            className="w-full pl-10 p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                            placeholder="e.g. Remote, Indonesia, Worldwide"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-gray-700 block mb-2">Employment Type</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['Freelance', 'Remote', 'Full-time'].map(type => (
                                            <button
                                                key={type}
                                                onClick={() => {
                                                    const current = tempSettings.employmentTypes || [];
                                                    const next = current.includes(type) ? current.filter(t => t !== type) : [...current, type];
                                                    setTempSettings({ ...tempSettings, employmentTypes: next as any });
                                                }}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${tempSettings.employmentTypes?.includes(type) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-400'}`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-bold text-gray-700 block mb-2">Minimum Budget / Salary</label>
                                    <div className="flex gap-2">
                                        <select
                                            value={tempSettings.currency}
                                            onChange={(e) => setTempSettings({ ...tempSettings, currency: e.target.value as 'USD' | 'IDR' })}
                                            className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none"
                                        >
                                            <option value="USD">USD ($)</option>
                                            <option value="IDR">IDR (Rp)</option>
                                        </select>
                                        <input
                                            type="number"
                                            value={tempSettings.minBudget}
                                            onChange={(e) => setTempSettings({ ...tempSettings, minBudget: parseInt(e.target.value) || 0 })}
                                            className="flex-1 p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-gray-700 block mb-2">Pay Frequency</label>
                                    <select
                                        value={tempSettings.payFrequency}
                                        onChange={(e) => setTempSettings({ ...tempSettings, payFrequency: e.target.value as any })}
                                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none"
                                    >
                                        <option value="hourly">Hourly (Per Jam)</option>
                                        <option value="daily">Daily (Per Hari)</option>
                                        <option value="monthly">Monthly (Per Bulan)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-gray-700 block mb-2">Target Platforms</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['LinkedIn', 'Upwork', 'Dribbble', 'X', 'Zippia'].map(p => (
                                            <label key={p} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100 cursor-pointer hover:bg-white hover:border-indigo-200 transition-all">
                                                <input
                                                    type="checkbox"
                                                    checked={tempSettings.targetPlatforms?.includes(p)}
                                                    onChange={(e) => {
                                                        const current = tempSettings.targetPlatforms || [];
                                                        const next = e.target.checked ? [...current, p] : current.filter(t => t !== p);
                                                        setTempSettings({ ...tempSettings, targetPlatforms: next });
                                                    }}
                                                    className="rounded text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <span className="text-[10px] font-bold text-gray-700 uppercase tracking-tight">{p}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 mt-6 border-t border-gray-100">
                            <div className="flex items-center gap-3 text-indigo-600 bg-indigo-50 p-4 rounded-xl">
                                <Bot className="h-5 w-5 shrink-0" />
                                <p className="text-xs leading-relaxed font-medium">
                                    "Saya akan menggunakan aturan ini untuk menyaring lowongan di internet. Semakin spesifik aturan Anda, semakin akurat hasil perburuan saya."
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </AdminModal>
        </div>
    );
}

function BriefcaseIcon({ className }: { className?: string }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
    );
}

function SettingsIcon({ className }: { className?: string }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7h-9" /><path d="M14 17H5" /><circle cx="17" cy="17" r="3" /><circle cx="7" cy="7" r="3" /></svg>
    );
}
