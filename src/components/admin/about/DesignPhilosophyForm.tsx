'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Plus, Trash2, Loader2, Sparkles } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface PhilosophyStep {
    number: string;
    title: string;
    desc: string;
    quote: string;
}

interface DesignPhilosophyData {
    heading: string;
    subheading: string;
    steps: PhilosophyStep[];
}

export default function DesignPhilosophyForm() {
    const [formData, setFormData] = useState<DesignPhilosophyData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { csrfToken } = useAdminAuth();
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/about/philosophy');
                if (res.ok) {
                    const data = await res.json();
                    setFormData(data);
                }
            } catch (error) {
                console.error('Failed to fetch philosophy data:', error);
                setMessage({ type: 'error', text: 'Gagal mengambil data' });
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleChange = (field: keyof DesignPhilosophyData, value: string) => {
        if (!formData) return;
        setFormData({ ...formData, [field]: value });
    };

    const handleStepChange = (index: number, field: keyof PhilosophyStep, value: string) => {
        if (!formData) return;
        const newSteps = [...formData.steps];
        newSteps[index] = { ...newSteps[index], [field]: value };
        setFormData({ ...formData, steps: newSteps });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData) return;

        setIsSaving(true);
        setMessage(null);

        try {
            const res = await fetch('/api/about/philosophy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Perubahan berhasil disimpan! ✨' });
                // Clean up message after 3 seconds
                setTimeout(() => setMessage(null), 3000);
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Gagal menyimpan perubahan.' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (!formData) return null;

    return (
        <form onSubmit={handleSubmit} className="space-y-8 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-6">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-blue-500" />
                        Design Philosophy
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Edit bagian "Filosofi Desain" pada halaman About.
                    </p>
                </div>
                <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-full text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
            </div>

            {message && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-100'
                        : 'bg-red-50 text-red-700 border border-red-100'
                        }`}
                >
                    {message.text}
                </motion.div>
            )}

            <div className="grid gap-6">
                {/* Global Headings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Heading Utama</label>
                        <input
                            type="text"
                            value={formData.heading}
                            onChange={(e) => handleChange('heading', e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Sub-Heading</label>
                        <input
                            type="text"
                            value={formData.subheading}
                            onChange={(e) => handleChange('subheading', e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Steps */}
                <div className="space-y-4">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Steps (3 Poin Utama)</label>

                    <div className="grid gap-6">
                        {formData.steps.map((step, index) => (
                            <div key={index} className="p-5 bg-gray-50 dark:bg-zinc-800/30 rounded-xl border border-gray-200 dark:border-zinc-700 relative group hover:border-blue-200 dark:hover:border-blue-900/50 transition-colors">
                                <div className="absolute top-4 right-4 text-xs font-bold text-gray-300">#{step.number}</div>

                                <div className="grid md:grid-cols-12 gap-6">
                                    <div className="md:col-span-4 space-y-4">
                                        <div>
                                            <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1.5">Judul Step</label>
                                            <input
                                                type="text"
                                                value={step.title}
                                                onChange={(e) => handleStepChange(index, 'title', e.target.value)}
                                                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm font-bold focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1.5">Quote Singkat</label>
                                            <input
                                                type="text"
                                                value={step.quote}
                                                onChange={(e) => handleStepChange(index, 'quote', e.target.value)}
                                                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm italic text-gray-600 focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="md:col-span-8">
                                        <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1.5">Deskripsi / Penjelasan</label>
                                        <textarea
                                            value={step.desc}
                                            onChange={(e) => handleStepChange(index, 'desc', e.target.value)}
                                            rows={4}
                                            className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm leading-relaxed focus:border-blue-500 outline-none resize-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </form>
    );
}
