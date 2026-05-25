'use client';

import React, { useState } from 'react';
import { Trash2, Eye, EyeOff, Plus } from 'lucide-react';

interface SkillItem {
  text?: string;
  description?: string;
  isDraft?: boolean;
}

interface SoftSkillsData {
  items?: SkillItem[];
  texts?: string[];
  descriptions?: string[];
}

interface SoftSkillsSubmitData {
  items: Array<{ text: string; description: string; isDraft: boolean }>;
}

interface SoftSkillsSectionFormProps {
  data: SoftSkillsData;
  onUpdate: (data: SoftSkillsSubmitData) => void;
}

export default function SoftSkillsSectionForm({ data, onUpdate }: SoftSkillsSectionFormProps) {
  // Initialize items by zipping texts and descriptions OR using new items array
  const initializeItems = () => {
    if (data?.items && Array.isArray(data.items)) {
      return data.items.map((i: SkillItem) => ({
        text: i.text || '',
        description: i.description || '',
        isDraft: i.isDraft || false,
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
        isDraft: false, // Default to published for migrated items
      });
    }

    if (items.length === 0) {
      items.push({ text: '', description: '', isDraft: false });
    }

    return items;
  };

  const [items, setItems] =
    useState<{ text: string; description: string; isDraft: boolean }[]>(initializeItems);

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
    const validItems = items.filter((item) => item.text.trim() || item.description.trim());

    // Save as new 'items' structure
    const submitData = {
      items: validItems,
    };

    onUpdate(submitData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-lg font-medium text-gray-900">Skillset (Interpersonal)</h3>
        <p className="mb-4 text-sm text-gray-600">
          Daftar soft skills yang ditampilkan dalam tab Skillset di jendela About.
        </p>
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-lg border border-gray-200 bg-gray-50 p-4"
        >
          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={index}
                className={`group relative flex items-start gap-4 rounded-md border p-3 shadow-sm transition-colors ${
                  item.isDraft
                    ? 'border-dashed border-gray-300 bg-gray-50 opacity-75'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="mb-1 block text-xs font-medium text-gray-500">
                        Nama Skill (Teks)
                      </label>
                      <input
                        type="text"
                        value={item.text}
                        onChange={(e) => handleItemChange(index, 'text', e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="e.g. Kreativitas & Inovasi"
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleDraft(index)}
                      className={`mt-5 rounded-lg p-2 transition-colors ${
                        item.isDraft
                          ? 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                      title={
                        item.isDraft ? 'Currently Draft (Hidden)' : 'Currently Published (Visible)'
                      }
                    >
                      {item.isDraft ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="mt-5 inline-flex h-fit items-center justify-center rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                      title="Remove Skill"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      Deskripsi
                    </label>
                    <textarea
                      rows={2}
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Jelaskan skill ini..."
                      required
                    />
                  </div>
                </div>

                {/* Visual Badge for Draft status */}
                <div className="pointer-events-none absolute right-2 top-2">
                  {item.isDraft && (
                    <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-bold uppercase text-gray-400">
                      Draft
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center gap-2 rounded-md bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
            >
              <Plus className="h-4 w-4" />
              Tambah Skill Baru
            </button>
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              Perbarui Soft Skills
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
