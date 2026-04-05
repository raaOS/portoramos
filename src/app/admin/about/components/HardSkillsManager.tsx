'use client';

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { HardSkill } from '@/types/hardSkill';
import { useHardSkills } from '../hooks/useHardSkills';
import SkillEditor from './SkillEditor';
import SkillListItem from './SkillListItem';

export default function HardSkillsManager() {
    const { csrfToken } = useAdminAuth();
    const { 
        skills, loading, moveUp, moveDown, 
        deleteSkill, addOrUpdateSkill 
    } = useHardSkills(csrfToken || undefined);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<HardSkill | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSearchingIcon, setIsSearchingIcon] = useState(false);

    const handleAutoIcon = async () => {
        if (!editForm?.name) return alert('Please enter a Skill Name first!');
        setIsSearchingIcon(true);
        try {
            const res = await fetch('/api/utils/search-icon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken || '' },
                body: JSON.stringify({ query: editForm.name })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.iconUrl) setEditForm(prev => prev ? { ...prev, iconUrl: data.iconUrl } : null);
            } else alert('Icon not found.');
        } finally { setIsSearchingIcon(false); }
    };

    const handleAiGenerate = async () => {
        if (!editForm?.name) return alert('Please enter a Skill Name first!');
        setIsGenerating(true);
        try {
            const res = await fetch('/api/ai/suggest-skills', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken || '' },
                body: JSON.stringify({ skillName: editForm.name })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.details) {
                    const newDetails = [...data.details, '', '', '', ''].slice(0, 4);
                    setEditForm(prev => prev ? { ...prev, details: newDetails } : null);
                }
            }
        } finally { setIsGenerating(false); }
    };

    const handleSave = async (skill: HardSkill) => {
        const cleanedDetails = (skill.details || []).filter(d => d.trim() !== '');
        await addOrUpdateSkill({ ...skill, details: cleanedDetails, updatedAt: new Date().toISOString() }, isAdding);
        setEditingId(null);
        setIsAdding(false);
        setEditForm(null);
    };

    const handleEdit = (skill: HardSkill) => {
        setEditingId(skill.id);
        const details = skill.details ? [...skill.details, '', '', '', ''].slice(0, 4) : ['', '', '', ''];
        setEditForm({ ...skill, details });
        setIsAdding(false);
    };

    const handleAdd = () => {
        setEditForm({
            id: `hard-${Date.now()}`, name: '', iconUrl: '', level: 'Intermediate',
            order: skills.length + 1, details: ['', '', '', ''],
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isActive: true
        });
        setIsAdding(true);
        setEditingId(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Hard Skills Manager</h2>
                <button onClick={handleAdd} className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
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
                        onClose={() => { setIsAdding(false); setEditingId(null); setEditForm(null); }}
                        onSave={handleSave}
                        onAutoIcon={handleAutoIcon}
                        onAiGenerate={handleAiGenerate}
                        setEditForm={setEditForm}
                    />
                )}
            </AnimatePresence>

            {loading ? <div className="text-center py-8 text-gray-500">Loading skills...</div> : (
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
                        <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed">
                            No hard skills added yet.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
