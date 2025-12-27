import { useState } from 'react';
import { ProjectFormData } from '@/hooks/useProjectForm';
import { Sparkles, Loader2 } from 'lucide-react';

interface ProjectBasicInfoProps {
    formData: ProjectFormData;
    errors: Record<string, string>;
    updateField: <K extends keyof ProjectFormData>(field: K, value: ProjectFormData[K]) => void;
}

export default function ProjectBasicInfo({ formData, errors, updateField }: ProjectBasicInfoProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiOptions, setAiOptions] = useState({
        style: 'estetik & profesional',
        maxTitleWords: 5,
        sentenceCount: 2,
        viralPackage: true // New option
    });

    const isValidMediaUrl = (url: string) => {
        if (!url) return false;
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    const handleAutoFill = async () => {
        if (!formData.cover || !isValidMediaUrl(formData.cover)) {
            alert("Please upload a Valid Cover Image first!");
            return;
        }

        setIsGenerating(true);
        // 1. Generate Caption/Description (Try-Catch to be non-blocking)
        try {
            try {
                const res = await fetch('/api/ai/generate-details', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        imageUrl: formData.cover,
                        ...aiOptions
                    })
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.title) updateField('title', data.title);
                    if (data.description) updateField('description', data.description);
                } else {
                    console.warn("AI Text Gen failed, skipping to Viral Package...");
                }
            } catch (aiError) {
                console.warn("AI Text Gen Network error warning:", aiError);
            }

            // 2. If Viral Package is enabled AND we have a project ID (edit mode) or after save
            // NOTE: For NEW projects, we'll need to handle this after the project is actually created 
            // OR we can generate them and send back to the form state if we add likes/shares to form.
            if (aiOptions.viralPackage) {
                // For existing projects being edited:
                if (formData.id) {
                    await fetch('/api/admin/projects/magic-complete', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            projectId: formData.id,
                            slug: formData.slug || formData.title?.toLowerCase().replace(/ /g, '-') || 'temp-slug'
                        })
                    });
                }
                // Also update local form state for immediate feedback
                updateField('likes', Math.floor(Math.random() * 401) + 100);
                updateField('shares', Math.floor(Math.random() * 81) + 20);
            }
        } catch (e: any) {
            alert(`Auto-Fill Failed: ${e.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* AI Customization Bar */}
            {formData.cover && isValidMediaUrl(formData.cover) && (
                <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-100 rounded-2xl p-4 mb-4 shadow-sm">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between border-b border-violet-100 pb-3">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-violet-600" />
                                <h3 className="font-bold text-gray-900">Magic AI Complete</h3>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <span className="text-xs font-bold text-violet-600 uppercase tracking-widest">Viral Package</span>
                                <div className="relative inline-flex items-center">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={aiOptions.viralPackage}
                                        onChange={(e) => setAiOptions(prev => ({ ...prev, viralPackage: e.target.checked }))}
                                    />
                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
                                </div>
                            </label>
                        </div>

                        <div className="flex flex-col sm:flex-row items-end gap-4">
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                                <div>
                                    <label className="block text-[10px] font-bold text-violet-400 uppercase tracking-wider mb-1">Gaya Bahasa</label>
                                    <select
                                        value={aiOptions.style}
                                        onChange={(e) => setAiOptions(prev => ({ ...prev, style: e.target.value }))}
                                        className="w-full text-xs bg-white border border-violet-200 rounded-md px-2 py-1.5 focus:ring-1 focus:ring-violet-400 outline-none shadow-sm"
                                    >
                                        <option value="estetik & profesional">Estetik & Profesional</option>
                                        <option value="minimalis & elegan">Minimalis & Elegan</option>
                                        <option value="kreatif & berapi-api">Kreatif & Berapi-api</option>
                                        <option value="poetis & mendalam">Poetis & Mendalam</option>
                                        <option value="santai & trendi">Santai & Trendi</option>
                                        <option value="Gen-Z (Casual/Chill)">Gen-Z (Casual/Chill)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-violet-400 uppercase tracking-wider mb-1">Max Kata Judul</label>
                                    <input
                                        type="number"
                                        value={aiOptions.maxTitleWords}
                                        onChange={(e) => setAiOptions(prev => ({ ...prev, maxTitleWords: parseInt(e.target.value) || 5 }))}
                                        className="w-full text-xs bg-white border border-violet-200 rounded-md px-2 py-1.5 focus:ring-1 focus:ring-violet-400 outline-none shadow-sm"
                                        min="1" max="15"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-violet-400 uppercase tracking-wider mb-1">Jml Kalimat Deskripsi</label>
                                    <input
                                        type="number"
                                        value={aiOptions.sentenceCount}
                                        onChange={(e) => setAiOptions(prev => ({ ...prev, sentenceCount: parseInt(e.target.value) || 2 }))}
                                        className="w-full text-xs bg-white border border-violet-200 rounded-md px-2 py-1.5 focus:ring-1 focus:ring-violet-400 outline-none shadow-sm"
                                        min="1" max="5"
                                    />
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleAutoFill}
                                disabled={isGenerating}
                                className="w-full sm:w-auto h-[34px] flex items-center justify-center gap-2 text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 px-6 rounded-lg transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                            >
                                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                {isGenerating ? 'BOOM!...' : 'Magic Complete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between items-center">
                        Title *
                    </label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => updateField('title', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.title ? 'border-red-300 ring-red-200' : 'border-gray-300'
                            }`}
                        placeholder="Project title"
                    />
                    {errors.title && (
                        <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Client *
                    </label>
                    <input
                        type="text"
                        value={formData.client}
                        onChange={(e) => updateField('client', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.client ? 'border-red-300' : 'border-gray-300'
                            }`}
                        placeholder="Client name"
                    />
                    {errors.client && (
                        <p className="mt-1 text-sm text-red-600">{errors.client}</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Year *
                    </label>
                    <input
                        type="number"
                        value={formData.year}
                        onChange={(e) => updateField('year', parseInt(e.target.value) || new Date().getFullYear())}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.year ? 'border-red-300' : 'border-gray-300'
                            }`}
                        min="2000"
                        max={new Date().getFullYear() + 1}
                    />
                    {errors.year && (
                        <p className="mt-1 text-sm text-red-600">{errors.year}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tags
                    </label>
                    <input
                        type="text"
                        value={formData.tags}
                        onChange={(e) => updateField('tags', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                        placeholder="React, Next.js, TypeScript (comma separated)"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                </label>
                <textarea
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.description ? 'border-red-300' : 'border-gray-300'
                        }`}
                    placeholder="Project description"
                />
                {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
            </div>
        </div>
    );
}
