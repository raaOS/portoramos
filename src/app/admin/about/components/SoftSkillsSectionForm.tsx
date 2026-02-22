'use client';

import React, { useState } from 'react';
import { Trash2, Eye, EyeOff, Plus } from 'lucide-react';

interface SoftSkillsSectionFormProps {
    data: any;
    onUpdate: (data: any) => void;
}

export default function SoftSkillsSectionForm({
    data,
    onUpdate
}: SoftSkillsSectionFormProps) {
    // Initialize items by zipping texts and descriptions OR using new items array
    const initializeItems = () => {
        if (data?.items && Array.isArray(data.items)) {
            return data.items.map((i: any) => ({
                text: i.text || '',
                description: i.description || '',
                isDraft: i.isDraft || false
            }));
        }

        // Fallback migration for old data
        const texts = data?.texts || [];
        const descriptions = data?.descriptions || [];
        const maxLength = Math.max(texts.length, descriptions.length);
        const items = [];

        for (let i = 0; i < maxLength; i++) {
            items.push({
                text: texts[i] || '',
                description: descriptions[i] || '',
                isDraft: false // Default to published for migrated items
            });
        }

        if (items.length === 0) {
            items.push({ text: '', description: '', isDraft: false });
        }

        return items;
    };

    const [items, setItems] = useState<{ text: string; description: string; isDraft: boolean }[]>(initializeItems);

    const handleItemChange = (index: number, field: 'text' | 'description', value: string) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const toggleDraft = (index: number) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], isDraft: !newItems[index].isDraft };
        setItems(newItems);
    };

    const handleAddItem = () => {
        setItems([...items, { text: '', description: '', isDraft: true }]); // Default new items to Draft
    };

    const handleRemoveItem = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Filter out empty items
        const validItems = items.filter(item => item.text.trim() || item.description.trim());

        // Save as new 'items' structure
        const submitData = {
            items: validItems
        };

        onUpdate(submitData);
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Soft Skills</h3>
                <p className="text-sm text-gray-600 mb-4">Daftar soft skills yang ditampilkan dalam bentuk morphing text.</p>
                <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-6">

                    <div className="space-y-4">
                        {items.map((item, index) => (
                            <div
                                key={index}
                                className={`flex gap-4 items-start p-3 border rounded-md shadow-sm group transition-colors relative ${item.isDraft ? 'bg-gray-50 border-dashed border-gray-300 opacity-75' : 'bg-white border-gray-200'
                                    }`}
                            >
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1">
                                            <label className="block text-xs font-medium text-gray-500 mb-1">
                                                Nama Skill (Teks)
                                            </label>
                                            <input
                                                type="text"
                                                value={item.text}
                                                onChange={(e) => handleItemChange(index, 'text', e.target.value)}
                                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                placeholder="e.g. Kreativitas & Inovasi"
                                                required
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => toggleDraft(index)}
                                            className={`p-2 rounded-lg mt-5 transition-colors ${item.isDraft
                                                ? 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                                                : 'bg-green-50 text-green-600 hover:bg-green-100'
                                                }`}
                                            title={item.isDraft ? "Currently Draft (Hidden)" : "Currently Published (Visible)"}
                                        >
                                            {item.isDraft ? (
                                                <EyeOff className="w-5 h-5" />
                                            ) : (
                                                <Eye className="w-5 h-5" />
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleRemoveItem(index)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-5 h-fit"
                                            title="Remove Skill"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">
                                            Deskripsi
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={item.description}
                                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            placeholder="Jelaskan skill ini..."
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Visual Badge for Draft status */}
                                <div className="absolute top-2 right-2 pointer-events-none">
                                    {item.isDraft && (
                                        <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">Draft</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between items-center pt-2">
                        <button
                            type="button"
                            onClick={handleAddItem}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Tambah Skill Baru
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium shadow-sm transition-colors"
                        >
                            Perbarui Soft Skills
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
