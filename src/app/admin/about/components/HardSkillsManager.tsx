'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Save, X, MoveUp, MoveDown, Sparkles, Loader2, Search } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { HardSkill, HardSkillLevel } from '@/types/hardSkill';

export default function HardSkillsManager() {
    const [skills, setSkills] = useState<HardSkill[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<HardSkill | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSearchingIcon, setIsSearchingIcon] = useState(false);
    const { csrfToken } = useAdminAuth();

    // Initial fetch
    useEffect(() => {
        fetchSkills();
    }, []);

    const fetchSkills = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/hard-skills');
            if (res.ok) {
                const data = await res.json();
                setSkills(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Error fetching skills:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAutoIcon = async () => {
        if (!editForm?.name) {
            alert('Please enter a Skill Name first!');
            return;
        }

        setIsSearchingIcon(true);
        try {
            const res = await fetch('/api/utils/search-icon', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken
                },
                credentials: 'include',
                body: JSON.stringify({ query: editForm.name })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.iconUrl) {
                    setEditForm(prev => prev ? { ...prev, iconUrl: data.iconUrl } : null);
                }
            } else {
                alert('Icon not found. Please try manually or check the name.');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSearchingIcon(false);
        }
    };

    const handleAiGenerate = async () => {
        if (!editForm?.name) {
            alert('Please enter a Skill Name first!');
            return;
        }

        setIsGenerating(true);
        try {
            const res = await fetch('/api/ai/suggest-skills', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken
                },
                credentials: 'include',
                body: JSON.stringify({ skillName: editForm.name })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.details && Array.isArray(data.details)) {
                    // Ensure exactly 4 items
                    const newDetails = [...data.details, '', '', '', ''].slice(0, 4);
                    setEditForm(prev => prev ? { ...prev, details: newDetails } : null);
                }
            } else {
                alert('Failed to generate suggestions. Please try again.');
            }
        } catch (err) {
            console.error(err);
            alert('Error connecting to AI.');
        } finally {
            setIsGenerating(false);
        }
    };

    const saveOrder = async (newSkills: HardSkill[]) => {
        setSkills(newSkills);
        await fetch('/api/hard-skills', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-csrf-token': csrfToken
            },
            credentials: 'include',
            body: JSON.stringify(newSkills),
        });
    };

    const moveUp = (index: number) => {
        if (index === 0) return;
        const newSkills = [...skills];
        [newSkills[index - 1], newSkills[index]] = [newSkills[index], newSkills[index - 1]];
        saveOrder(newSkills);
    };

    const moveDown = (index: number) => {
        if (index === skills.length - 1) return;
        const newSkills = [...skills];
        [newSkills[index + 1], newSkills[index]] = [newSkills[index], newSkills[index + 1]];
        saveOrder(newSkills);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this skill?')) return;
        const newSkills = skills.filter(s => s.id !== id);
        saveOrder(newSkills);
    };

    const handleEdit = (skill: HardSkill) => {
        setEditingId(skill.id);
        // Ensure details has 4 items for the form
        const details = skill.details ? [...skill.details, '', '', '', ''].slice(0, 4) : ['', '', '', ''];
        setEditForm({ ...skill, details });
        setIsAdding(false);
    };

    const handleAdd = () => {
        const newSkill: HardSkill = {
            id: `hard-${Date.now()}`,
            name: '',
            iconUrl: '',
            level: 'Intermediate',
            order: skills.length + 1,
            details: ['', '', '', ''],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: true
        };
        setEditForm(newSkill);
        setIsAdding(true);
        setEditingId(null);
    };

    const handleSave = async () => {
        if (!editForm) return;

        // Clean empty details
        const cleanedDetails = (editForm.details || []).filter(d => d.trim() !== '');
        const skillToSave = {
            ...editForm,
            details: cleanedDetails,
            updatedAt: new Date().toISOString()
        };

        let newSkills = [...skills];
        if (isAdding) {
            newSkills.push(skillToSave);
        } else {
            newSkills = newSkills.map(s => s.id === editForm.id ? skillToSave : s);
        }

        await saveOrder(newSkills);
        setEditingId(null);
        setIsAdding(false);
        setEditForm(null);
    };

    const updateFormDetail = (index: number, value: string) => {
        if (!editForm) return;
        const newDetails = [...(editForm.details || ['', '', '', ''])];
        newDetails[index] = value;
        setEditForm({ ...editForm, details: newDetails });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Hard Skills Manager</h2>
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
                >
                    <Plus size={18} /> Add New Skill
                </button>
            </div>

            {/* Editor Modal/Form */}
            <AnimatePresence>
                {(editingId || isAdding) && editForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-6 space-y-4"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">{isAdding ? 'Add New Skill' : 'Edit Skill'}</h3>
                            <button onClick={() => { setIsAdding(false); setEditingId(null); setEditForm(null); }}><X size={20} /></button>
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
                                        onClick={handleAutoIcon}
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
                            {/* Color removed as it's deprecated */}
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-medium">Capabilities (4 Points)</label>
                                <button
                                    onClick={handleAiGenerate}
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
                                onClick={() => { setIsAdding(false); setEditingId(null); setEditForm(null); }}
                                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 flex items-center gap-2"
                            >
                                <Save size={18} /> Save Changes
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* List */}
            {loading ? (
                <div className="text-center py-8 text-gray-500">Loading skills...</div>
            ) : (
                <div className="space-y-2">
                    {skills.map((skill, index) => (
                        <motion.div
                            layout
                            key={skill.id}
                            className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 group hover:shadow-md transition-shadow"
                        >
                            <div className="flex flex-col gap-1 text-gray-300">
                                <button onClick={() => moveUp(index)} className="hover:text-black disabled:opacity-30" disabled={index === 0}>
                                    <MoveUp size={16} />
                                </button>
                                <button onClick={() => moveDown(index)} className="hover:text-black disabled:opacity-30" disabled={index === skills.length - 1}>
                                    <MoveDown size={16} />
                                </button>
                            </div>

                            <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center p-2 shrink-0">
                                {skill.iconUrl ? (
                                    <Image
                                        src={skill.iconUrl}
                                        alt={skill.name}
                                        width={40}
                                        height={40}
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <div className="text-xs text-gray-400">No Icon</div>
                                )}
                            </div>

                            <div className="flex-1">
                                <h3 className="font-bold">{skill.name}</h3>
                                <div className="text-xs text-gray-500 flex gap-2">
                                    <span className="bg-gray-100 px-2 py-0.5 rounded">{skill.level}</span>
                                    <span>{skill.details?.length || 0} capabilities</span>
                                </div>
                            </div>

                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleEdit(skill)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(skill.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </motion.div>
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
