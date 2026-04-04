"use client"
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, X, Sparkles, Loader2, Search } from 'lucide-react';
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
  setEditForm
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
      className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-6 space-y-4"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">{isAdding ? 'Add New Skill' : 'Edit Skill'}</h3>
        <button onClick={onClose} aria-label="Close editor"><X size={20} /></button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Skill Name</label>
          <input
            type="text"
            value={editForm.name}
            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
            className="w-full p-2 border rounded-lg"
            placeholder="e.g. Photoshop"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Level</label>
          <select
            value={editForm.level}
            onChange={e => setEditForm({ ...editForm, level: e.target.value as HardSkillLevel })}
            className="w-full p-2 border rounded-lg"
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="Expert">Expert</option>
          </select>
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium">Icon URL (SVG)</label>
            <button
              onClick={onAutoIcon}
              disabled={isSearchingIcon || !editForm.name}
              className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium bg-blue-50 px-2 py-1 rounded-md"
            >
              {isSearchingIcon ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
              {isSearchingIcon ? 'Searching...' : 'Find Icon'}
            </button>
          </div>
          <input
            type="text"
            value={editForm.iconUrl}
            onChange={e => setEditForm({ ...editForm, iconUrl: e.target.value })}
            className="w-full p-2 border rounded-lg"
            placeholder="https://cdn..."
          />
        </div>
      </div>
      
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="block text-sm font-medium">Capabilities (4 Points)</label>
          <button
            onClick={onAiGenerate}
            disabled={isGenerating || !editForm.name}
            className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium bg-purple-50 px-2 py-1 rounded-md"
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
              onChange={e => updateFormDetail(idx, e.target.value)}
              className="w-full p-2 border rounded-lg"
              placeholder={`Capability ${idx + 1}`}
            />
          ))}
        </div>
      </div>
      
      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={onClose}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(editForm)}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 flex items-center gap-2"
        >
          <Save size={18} /> Save Changes
        </button>
      </div>
    </motion.div>
  );
}
