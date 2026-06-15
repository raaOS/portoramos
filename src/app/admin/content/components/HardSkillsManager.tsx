'use client';

import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Plus } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { HardSkill } from '@/types/hardSkill';
import { useHardSkills } from '../../hooks/useHardSkills';
import SkillEditor from './SkillEditor';
import SkillListItem from './SkillListItem';
import { useToast } from '@/contexts/ToastContext';

export default function HardSkillsManager() {
  const { csrfToken } = useAdminAuth();
  const { showWarning, showError } = useToast();
  const { skills, loading, moveUp, moveDown, deleteSkill, addOrUpdateSkill } = useHardSkills(
    csrfToken || undefined
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<HardSkill | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSearchingIcon, setIsSearchingIcon] = useState(false);

  const handleAutoIcon = async () => {
    if (!editForm?.name) {
      showWarning('Isi nama skill dulu sebelum mencari ikon.');
      return;
    }
    setIsSearchingIcon(true);
    try {
      const res = await fetch('/api/utils/search-icon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken || '' },
        body: JSON.stringify({ query: editForm.name }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.iconUrl) setEditForm((prev) => (prev ? { ...prev, iconUrl: data.iconUrl } : null));
      } else showError('Ikon tidak ditemukan.');
    } finally {
      setIsSearchingIcon(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!editForm?.name) {
      showWarning('Isi nama skill dulu sebelum generate AI.');
      return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/suggest-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken || '' },
        body: JSON.stringify({ skillName: editForm.name }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.details) {
          const newDetails = [...data.details, '', '', '', ''].slice(0, 4);
          setEditForm((prev) => (prev ? { ...prev, details: newDetails } : null));
        }
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async (skill: HardSkill) => {
    const cleanedDetails = (skill.details || []).filter((d) => d.trim() !== '');
    await addOrUpdateSkill(
      { ...skill, details: cleanedDetails, updatedAt: new Date().toISOString() },
      isAdding
    );
    setEditingId(null);
    setIsAdding(false);
    setEditForm(null);
  };

  const handleEdit = (skill: HardSkill) => {
    setEditingId(skill.id);
    const details = skill.details
      ? [...skill.details, '', '', '', ''].slice(0, 4)
      : ['', '', '', ''];
    setEditForm({ ...skill, details });
    setIsAdding(false);
  };

  const handleAdd = () => {
    setEditForm({
      id: `hard-${Date.now()}`,
      name: '',
      iconUrl: '',
      level: 'Intermediate',
      order: skills.length + 1,
      details: ['', '', '', ''],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    });
    setIsAdding(true);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Skillset (Technical)</h2>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-white transition-colors hover:bg-gray-800"
        >
          <Plus size={18} /> Add New Skill
        </button>
      </div>

      <AnimatePresence>
        {(editingId || isAdding) && editForm && (
          <SkillEditor
            editForm={editForm}
            isAdding={isAdding}
            isGenerating={isGenerating}
            isSearchingIcon={isSearchingIcon}
            onClose={() => {
              setIsAdding(false);
              setEditingId(null);
              setEditForm(null);
            }}
            onSave={handleSave}
            onAutoIcon={handleAutoIcon}
            onAiGenerate={handleAiGenerate}
            setEditForm={setEditForm}
          />
        )}
      </AnimatePresence>

      {loading ? (
        <div className="py-8 text-center text-gray-500">Loading skills...</div>
      ) : (
        <div className="space-y-2">
          {skills.map((skill, index) => (
            <SkillListItem
              key={skill.id}
              skill={skill}
              index={index}
              totalSkills={skills.length}
              onEdit={handleEdit}
              onDelete={deleteSkill}
              onMoveUp={moveUp}
              onMoveDown={moveDown}
            />
          ))}
          {skills.length === 0 && (
            <div className="rounded-lg border border-dashed bg-gray-50 py-8 text-center text-gray-400">
              No hard skills added yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
