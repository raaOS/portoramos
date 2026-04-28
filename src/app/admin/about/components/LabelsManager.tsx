'use client';

import React, { useState } from 'react';
import { Trash2, Plus, Tag, Save, AlertCircle } from 'lucide-react';
import { Label } from '@/types/labels';

interface LabelsManagerProps {
    initialLabels: Label[];
    onUpdate: (labels: Label[]) => Promise<boolean>;
    loading?: boolean;
}

const COLOR_OPTIONS = [
    { label: 'Gray', value: 'gray', class: 'bg-gray-100 text-gray-700' },
    { label: 'Blue', value: 'blue', class: 'bg-blue-100 text-blue-700' },
    { label: 'Emerald', value: 'emerald', class: 'bg-emerald-100 text-emerald-700' },
    { label: 'Amber', value: 'amber', class: 'bg-amber-100 text-amber-700' },
    { label: 'Rose', value: 'rose', class: 'bg-rose-100 text-rose-700' },
    { label: 'Indigo', value: 'indigo', class: 'bg-indigo-100 text-indigo-700' },
    { label: 'Violet', value: 'violet', class: 'bg-violet-100 text-violet-700' },
    { label: 'Cyan', value: 'cyan', class: 'bg-cyan-100 text-cyan-700' },
];

export default function LabelsManager({
    initialLabels,
    onUpdate,
    loading = false
}: LabelsManagerProps) {
    const [labels, setLabels] = useState<Label[]>(initialLabels);
    const [isSaving, setIsSaving] = useState(false);

    const [prevInitialLabels, setPrevInitialLabels] = useState(initialLabels);
    if (initialLabels !== prevInitialLabels) {
        setLabels(initialLabels);
        setPrevInitialLabels(initialLabels);
    }

    const handleLabelChange = (index: number, field: keyof Label, value: string) => {
        const newLabels = [...labels];
        newLabels[index] = { ...newLabels[index], [field]: value };
        
        // Auto-generate slug from name if editing name and slug is empty or matches old name
        if (field === 'name') {
            const oldName = labels[index].name;
            const currentSlug = labels[index].slug;
            const generatedSlug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            
            if (!currentSlug || currentSlug === oldName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')) {
                newLabels[index].slug = generatedSlug;
            }
        }
        
        setLabels(newLabels);
    };

    const handleAddLabel = () => {
        const newLabel: Label = {
            id: Math.random().toString(36).substr(2, 9),
            name: '',
            slug: '',
            color: 'gray',
            description: ''
        };
        setLabels([...labels, newLabel]);
    };

    const handleRemoveLabel = (index: number) => {
        const newLabels = labels.filter((_, i) => i !== index);
        setLabels(newLabels);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation: Ensure all labels have names and unique slugs
        const validLabels = labels.filter(l => l.name.trim() !== '');
        
        if (validLabels.length === 0 && labels.length > 0) {
            alert('Harap isi minimal satu nama label.');
            return;
        }

        setIsSaving(true);
        const success = await onUpdate(validLabels);
        setIsSaving(false);
        
        if (success) {
            setLabels(validLabels);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-bold text-blue-800 flex items-center gap-2">
                    <Tag className="w-5 h-5" /> Pengaturan Labels & Tag
                </h3>
                <p className="text-sm text-blue-600 mt-1">
                    Kelola daftar label global yang digunakan untuk mengkategorikan proyek. Label ini akan muncul di filter halaman utama.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {labels.map((label, index) => (
                        <div 
                            key={label.id} 
                            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative group"
                        >
                            <button
                                type="button"
                                onClick={() => handleRemoveLabel(index)}
                                className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                title="Hapus Label"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>

                            <div className="space-y-3">
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                            Nama Label
                                        </label>
                                        <input
                                            type="text"
                                            value={label.name}
                                            onChange={(e) => handleLabelChange(index, 'name', e.target.value)}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                            placeholder="Misal: UI/UX Design"
                                            required
                                        />
                                    </div>
                                    <div className="w-24">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                            Warna
                                        </label>
                                        <select
                                            value={label.color || 'gray'}
                                            onChange={(e) => handleLabelChange(index, 'color', e.target.value)}
                                            className="w-full px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none cursor-pointer"
                                        >
                                            {COLOR_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                        Slug (URL Friendly)
                                    </label>
                                    <input
                                        type="text"
                                        value={label.slug}
                                        onChange={(e) => handleLabelChange(index, 'slug', e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-100 border border-transparent rounded-lg text-xs font-mono text-gray-600 focus:bg-white focus:border-gray-200 outline-none transition-all"
                                        placeholder="ui-ux-design"
                                        required
                                    />
                                </div>

                                <div className="flex items-center gap-2 pt-1">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Preview:</span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                        COLOR_OPTIONS.find(o => o.value === (label.color || 'gray'))?.class || 'bg-gray-100 text-gray-600'
                                    }`}>
                                        {label.name || 'Pratinjau Label'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={handleAddLabel}
                        className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-all min-h-[140px]"
                    >
                        <Plus className="w-6 h-6" />
                        <span className="text-sm font-medium">Tambah Label Baru</span>
                    </button>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-gray-100 mt-8">
                    <div className="flex items-center gap-2 text-amber-600 text-xs bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
                        <AlertCircle className="w-4 h-4" />
                        <span>Pastikan slug unik untuk setiap label.</span>
                    </div>
                    
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isSaving ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        Simpan Perubahan
                    </button>
                </div>
            </form>
        </div>
    );
}
