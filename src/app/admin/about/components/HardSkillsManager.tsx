'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Save, X, MoveUp, MoveDown } from 'lucide-react';

interface HardSkill {
    id: string;
    name: string;
    icon: string;
    level: string;
    color: string;
    details: string[];
}

export default function HardSkillsManager() {
    const [skills, setSkills] = useState<HardSkill[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<HardSkill | null>(null);
    const [isAdding, setIsAdding] = useState(false);

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
                setSkills(data);
            }
        } catch (error) {
            console.error('Error fetching skills:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveOrder = async (newSkills: HardSkill[]) => {
        setSkills(newSkills);
        await fetch('/api/hard-skills', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
        setEditForm({ ...skill });
        setIsAdding(false);
    };

    const handleAdd = () => {
        const newSkill: HardSkill = {
            id: Date.now().toString(),
            name: '',
            icon: '',
            level: 'Intermediate',
            color: '#000000',
            details: ['', '', '', '']
        };
        setEditForm(newSkill);
        setIsAdding(true);
        setEditingId(null);
    };

    const handleSave = async () => {
        if (!editForm) return;

        let newSkills = [...skills];
        if (isAdding) {
            newSkills.push(editForm);
        } else {
            newSkills = newSkills.map(s => s.id === editForm.id ? editForm : s);
        }

        await saveOrder(newSkills);
        setEditingId(null);
        setIsAdding(false);
        setEditForm(null);
    };

    const updateFormDetail = (index: number, value: string) => {
        if (!editForm) return;
        const newDetails = [...editForm.details];
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
                                    onChange={e => setEditForm({ ...editForm, level: e.target.value })}
                                    className="w-full p-2 border rounded-lg"
                                >
                                    <option value="Basic">Basic</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                    <option value="Expert">Expert</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Icon URL (SVG)</label>
                                <input
                                    type="text"
                                    value={editForm.icon}
                                    onChange={e => setEditForm({ ...editForm, icon: e.target.value })}
                                    className="w-full p-2 border rounded-lg"
                                    placeholder="https://cdn..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Color (Hex)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={editForm.color}
                                        onChange={e => setEditForm({ ...editForm, color: e.target.value })}
                                        className="h-10 w-10 p-1 rounded cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={editForm.color}
                                        onChange={e => setEditForm({ ...editForm, color: e.target.value })}
                                        className="w-full p-2 border rounded-lg"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Capabilities (4 Points)</label>
                            <div className="space-y-2">
                                {editForm.details.map((detail, idx) => (
                                    <input
                                        key={idx}
                                        type="text"
                                        value={detail}
                                        onChange={e => updateFormDetail(idx, e.target.value)}
                                        className="w-full p-2 border rounded-lg"
                                        placeholder={`Point ${idx + 1}`}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <button
                                onClick={() => { setIsAdding(false); setEditingId(null); setEditForm(null); }}
                                className="px-4 py-2 text-gray-600 hover:text-black"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 flex items-center gap-2"
                            >
                                <Save size={18} /> Save Skill
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Skills List */}
            <div className="bg-white rounded-xl border shadow-sm divide-y">
                {skills.map((skill, index) => (
                    <div key={skill.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col gap-1">
                                <button
                                    disabled={index === 0}
                                    onClick={() => moveUp(index)}
                                    className="p-1 text-gray-400 hover:text-black disabled:opacity-30"
                                >
                                    <MoveUp size={16} />
                                </button>
                                <button
                                    disabled={index === skills.length - 1}
                                    onClick={() => moveDown(index)}
                                    className="p-1 text-gray-400 hover:text-black disabled:opacity-30"
                                >
                                    <MoveDown size={16} />
                                </button>
                            </div>
                            <img src={skill.icon} alt="" className="w-8 h-8 object-contain" />
                            <div>
                                <h4 className="font-bold">{skill.name}</h4>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                    {skill.level}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-2">
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
                    </div>
                ))}
                {skills.length === 0 && !loading && (
                    <div className="p-8 text-center text-gray-500">
                        No skills found. Add one to get started.
                    </div>
                )}
            </div>
        </div>
    );
}
