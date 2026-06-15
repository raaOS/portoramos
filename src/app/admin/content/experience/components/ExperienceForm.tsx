'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { WorkExperience } from '@/types/experience';
import AdminButton from '@/app/admin/components/AdminButton';

interface ExperienceFormProps {
  work?: Partial<WorkExperience>;
  onSave: (work: WorkExperience) => void;
  onCancel: () => void;
}

export default function ExperienceForm({ work, onSave, onCancel }: ExperienceFormProps) {
  const [formData, setFormData] = useState<Partial<WorkExperience>>(
    work || {
      id: '',
      position: '',
      company: '',
      year: '',
      duration: '',
      description: [],
      imageUrl: '',
      isActive: true,
    }
  );

  const handleSubmit = () => {
    onSave({
      id: formData.id || crypto.randomUUID(),
      position: formData.position || '',
      company: formData.company || '',
      year: formData.year || '',
      duration: formData.duration || '',
      position_id: formData.position_id,
      description: formData.description || [],
      description_id: formData.description_id,
      imageUrl: formData.imageUrl || '',
      isActive: formData.isActive !== undefined ? formData.isActive : true,
    });
  };

  return (
    <div className="animate-in fade-in rounded-lg border border-gray-200 bg-gray-50 p-6 shadow-sm duration-200">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-md font-semibold text-gray-800">
          {work ? 'Edit Position' : 'Add New Position'}
        </h4>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
            Position
          </label>
          <input
            type="text"
            value={formData.position || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, position: e.target.value }))}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="e.g. Senior Designer"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
            Company
          </label>
          <input
            type="text"
            value={formData.company || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, company: e.target.value }))}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="e.g. Tech Corp"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
            Year
          </label>
          <input
            type="text"
            value={formData.year || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, year: e.target.value }))}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="e.g. 2020-2023"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
            Duration
          </label>
          <input
            type="text"
            value={formData.duration || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, duration: e.target.value }))}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="e.g. 3 years"
          />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
            Image URL
          </label>
          <input
            type="text"
            value={formData.imageUrl || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="https://example.com/company-logo.png"
          />
          {formData.imageUrl && (
            <div className="mt-2 flex max-w-xs items-center gap-3 rounded border border-gray-200 bg-white p-2">
              <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                <Image
                  src={formData.imageUrl}
                  alt="Preview"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <span className="truncate text-xs text-gray-500">{formData.imageUrl}</span>
            </div>
          )}
        </div>
        <div className="md:col-span-2">
          <label className="mt-2 flex cursor-pointer items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.isActive ?? true}
              onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Aktifkan</span>
          </label>
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
            Description (comma separated)
          </label>
          <textarea
            rows={3}
            value={Array.isArray(formData.description) ? formData.description.join(', ') : ''}
            onChange={(e) => {
              setFormData((prev) => ({
                ...prev,
                description: e.target.value
                  .split(',')
                  .map((d) => d.trim())
                  .filter((d) => d),
              }));
            }}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Led design team, Improved UX by 20%, etc."
          />
          <p className="mt-1 text-xs text-gray-500">Each comma creates a new bullet point.</p>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-6">
        <AdminButton onClick={onCancel} variant="secondary">
          Cancel
        </AdminButton>
        <AdminButton onClick={handleSubmit} variant="primary">
          {work ? 'Update Position' : 'Add Position'}
        </AdminButton>
      </div>
    </div>
  );
}
