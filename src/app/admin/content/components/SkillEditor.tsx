'use client';
import React from 'react';
import { motion } from 'motion/react';
import { Save, X, Sparkles, Loader2, Search, ChevronDown } from 'lucide-react';
import { HardSkill, HardSkillLevel } from '@/types/hardSkill';

interface SkillEditorProps {
  editForm: HardSkill;
  isAdding: boolean;
  isSearchingIcon: boolean;
  isGenerating: boolean;
  onClose: () => void;
  onSave: (skill: HardSkill) => void;
  onAutoIcon: () => void;
  onAiGenerate: () => void;
  setEditForm: React.Dispatch<React.SetStateAction<HardSkill | null>>;
}

export default function SkillEditor({
  editForm,
  isAdding,
  isSearchingIcon,
  isGenerating,
  onClose,
  onSave,
  onAutoIcon,
  onAiGenerate,
  setEditForm,
}: SkillEditorProps) {
  const updateFormDetail = (index: number, value: string) => {
    const newDetails = [...(editForm.details || ['', '', '', ''])];
    newDetails[index] = value;
    setEditForm({ ...editForm, details: newDetails });
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mb-6 space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold">{isAdding ? 'Add New Skill' : 'Edit Skill'}</h3>
        <button onClick={onClose} aria-label="Close editor">
          <X size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Skill Name</label>
          <input
            type="text"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="e.g. Photoshop"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Level</label>
          <div className="relative">
            <select
              value={editForm.level}
              onChange={(e) =>
                setEditForm({ ...editForm, level: e.target.value as HardSkillLevel })
              }
              className="w-full cursor-pointer appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-10 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Expert">Expert</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-sm font-medium">Icon URL (SVG)</label>
            <button
              onClick={onAutoIcon}
              disabled={isSearchingIcon || !editForm.name}
              className="flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 transition-colors hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSearchingIcon ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Search size={12} />
              )}
              {isSearchingIcon ? 'Searching...' : 'Find Icon'}
            </button>
          </div>
          <input
            type="text"
            value={editForm.iconUrl}
            onChange={(e) => setEditForm({ ...editForm, iconUrl: e.target.value })}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="https://cdn..."
          />
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="block text-sm font-medium">Capabilities (4 Points)</label>
          <button
            onClick={onAiGenerate}
            disabled={isGenerating || !editForm.name}
            className="flex items-center gap-1 rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-600 transition-colors hover:text-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            {isGenerating ? 'Thinking...' : 'AI Auto-Fill'}
          </button>
        </div>
        <div className="space-y-2">
          {(editForm.details || ['', '', '', '']).map((detail, idx) => (
            <input
              key={idx}
              type="text"
              value={detail}
              onChange={(e) => updateFormDetail(idx, e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder={`Capability ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onClose} className="rounded-lg border px-4 py-2 hover:bg-gray-50">
          Cancel
        </button>
        <button
          onClick={() => onSave(editForm)}
          className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-white hover:bg-gray-800"
        >
          <Save size={18} /> Save Changes
        </button>
      </div>
    </motion.div>
  );
}
