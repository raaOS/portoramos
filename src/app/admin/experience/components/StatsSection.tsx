'use client';

import React, { useState } from 'react';
import { Pencil } from 'lucide-react';
import { ExperienceData } from '@/types/experience';
import AdminButton from '../../components/AdminButton';

interface StatsSectionProps {
    statistics: ExperienceData['statistics'];
    onUpdate: (stats: ExperienceData['statistics']) => Promise<boolean>;
}

export default function StatsSection({ statistics, onUpdate }: StatsSectionProps) {
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({ ...statistics });

    const handleSave = async () => {
        const success = await onUpdate(formData);
        if (success) setEditing(false);
    };

    if (editing) {
        return (
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 shadow-sm animate-in fade-in duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.keys(statistics).map((key) => (
                        <div key={key}>
                            <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                            </label>
                            <input
                                type="text"
                                value={(formData as any)[key] || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, [key]: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                    ))}
                    <div className="col-span-1 md:col-span-2 flex justify-end gap-2 pt-2">
                        <AdminButton onClick={() => setEditing(false)} variant="secondary">Cancel</AdminButton>
                        <AdminButton onClick={handleSave} variant="primary">Save Changes</AdminButton>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Global Statistics</h3>
                <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                    <Pencil className="w-4 h-4" />
                    Edit Stats
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Years Exp.', value: statistics.years },
                    { label: 'Projects', value: statistics.projects },
                    { label: 'Design Tools', value: statistics.designTools },
                    { label: 'Satisfaction', value: statistics.clientSatisfaction },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm text-center">
                        <div className="text-3xl font-bold text-emerald-600 mb-1">{stat.value}</div>
                        <div className="text-sm font-medium text-gray-500">{stat.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
