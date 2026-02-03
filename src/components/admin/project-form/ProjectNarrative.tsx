import { ProjectFormData } from '@/hooks/useProjectForm';
import { Loader2, UploadCloud } from 'lucide-react';
import { useState, useRef } from 'react';

interface ProjectNarrativeProps {
    formData: ProjectFormData;
    updateField: <K extends keyof ProjectFormData>(field: K, value: ProjectFormData[K]) => void;
}

export default function ProjectNarrative({ formData, updateField }: ProjectNarrativeProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleNarrativeChange = (field: keyof ProjectFormData['narrative'], value: string) => {
        updateField('narrative', {
            ...formData.narrative,
            [field]: value
        });
    };

    const handleComparisonChange = (field: 'beforeImage' | 'afterImage' | 'beforeType' | 'afterType', value: string) => {
        updateField('comparison', {
            ...formData.comparison,
            [field]: value
        });
    };

    const handleBeforeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic Size Limit (50MB for raw methods)
        if (file.size > 50 * 1024 * 1024) {
            alert("File too large (>50MB). Please compress it first.");
            return;
        }

        setIsUploading(true);
        try {
            const data = new FormData();
            data.append('file', file);

            // Construct API URL
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            let endpoint = isLocal ? '/api/upload?folder=comparisons' : '/api/upload/github?folder=comparisons';

            // Add Slug if available for naming
            if (formData.slug) {
                endpoint += `&slug=${encodeURIComponent(formData.slug)}`;
            }

            const res = await fetch(endpoint, {
                method: 'POST',
                body: data
            });

            if (!res.ok) throw new Error('Upload Failed');

            const result = await res.json();
            if (result.url) {
                handleComparisonChange('beforeImage', result.url);
            }
        } catch (err) {
            console.error(err);
            alert("Failed to upload before media.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const isVisualArt = formData.type === 'visual_art';
    const isCommercial = !isVisualArt;

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-none border border-gray-200 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${isCommercial ? 'bg-purple-500' : 'bg-pink-500'}`}></span>
                    {isCommercial ? 'Narasi Komersial' : 'Konsep Artistik'}
                </h3>

                <div className="space-y-4">
                    {/* Field 1: Context / Concept */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            {isCommercial ? 'Konteks / Tantangan' : 'Konsep / Filosofi'}
                        </label>
                        <p className="text-[10px] text-gray-500 mb-2">
                            {isCommercial
                                ? 'Apa masalah bisnisnya? Jelaskan "Kenapa" secara spesifik.'
                                : 'Apa ide utamanya? Pesan apa yang ingin disampaikan?'}
                        </p>
                        <textarea
                            value={isCommercial ? formData.narrative.challenge : formData.narrative.concept}
                            onChange={(e) => isCommercial
                                ? handleNarrativeChange('challenge', e.target.value)
                                : handleNarrativeChange('concept', e.target.value)
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[80px]"
                            placeholder={isCommercial ? "cth. Penjualan turun 20%..." : "cth. Eksplorasi dualitas alam..."}
                        />
                    </div>

                    {/* Field 2: Solution / Process */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            {isCommercial ? 'Solusi / Strategi' : 'Proses / Teknik'}
                        </label>
                        <p className="text-[10px] text-gray-500 mb-2">
                            {isCommercial
                                ? 'Bagaimana solusinya? (Design System, UX Research, dll)'
                                : 'Bagaimana cara buatnya? (Tools, Teknik, Fotografi)'}
                        </p>
                        <textarea
                            value={isCommercial ? formData.narrative.solution : formData.narrative.process}
                            onChange={(e) => isCommercial
                                ? handleNarrativeChange('solution', e.target.value)
                                : handleNarrativeChange('process', e.target.value)
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[80px]"
                            placeholder={isCommercial ? "cth. Implementasi design system baru..." : "cth. Menggunakan frequency separation dan overlay 3D..."}
                        />
                    </div>

                    {/* Field 3: Impact / Result */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            {isCommercial ? 'Dampak / Hasil' : 'Detail / Resepsi'}
                        </label>
                        <p className="text-[10px] text-gray-500 mb-2">
                            {isCommercial
                                ? 'Hasil terukur (CTR, Konversi, Feedback).'
                                : 'Penghargaan, fitur, atau detail untuk diperhatikan.'}
                        </p>
                        <textarea
                            value={isCommercial ? formData.narrative.impact : formData.narrative.detail}
                            onChange={(e) => isCommercial
                                ? handleNarrativeChange('impact', e.target.value)
                                : handleNarrativeChange('detail', e.target.value)
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[60px]"
                            placeholder={isCommercial ? "cth. +40% Engagement user..." : "cth. Featured di Behance, Terbaik 2024..."}
                        />
                    </div>
                </div>
            </div>

            {/* Comparison Section moved to ProjectMediaUpload */}
        </div>
    );
}
