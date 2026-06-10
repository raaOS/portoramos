'use client';

import React, { useState } from 'react';
import { Pencil } from 'lucide-react';
import { ExperienceData } from '@/types/experience';
import AdminButton from '@/app/admin/components/AdminButton';

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
      <div className="animate-in fade-in rounded-lg border border-gray-200 bg-gray-50 p-6 shadow-sm duration-200">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Object.keys(statistics).map((key) => (
            <div key={key}>
              <label className="mb-1 block text-sm font-medium capitalize text-gray-700">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </label>
              <input
                type="text"
                value={(formData as Record<string, string>)[key] || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, [key]: e.target.value }))}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
          <div className="col-span-1 flex justify-end gap-2 pt-2 md:col-span-2">
            <AdminButton onClick={() => setEditing(false)} variant="secondary">
              Cancel
            </AdminButton>
            <AdminButton onClick={handleSave} variant="primary">
              Save Changes
            </AdminButton>
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
          className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-600 transition-colors hover:bg-emerald-100 hover:text-emerald-700"
        >
          <Pencil className="h-4 w-4" />
          Edit Stats
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Years Exp.', value: statistics.years },
          { label: 'Projects', value: statistics.projects },
          { label: 'Design Tools', value: statistics.designTools },
          { label: 'Satisfaction', value: statistics.clientSatisfaction },
        ].map((stat, i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-200 bg-white p-5 text-center shadow-sm"
          >
            <div className="mb-1 text-3xl font-bold text-emerald-600">{stat.value}</div>
            <div className="text-sm font-medium text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
