'use client';

import React, { useState } from 'react';

interface SocialMediaFormProps {
  data: Record<string, string>;
  onUpdate: (d: Record<string, string>) => void;
}

const PLATFORMS = [
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/username' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/username' },
  { key: 'twitter', label: 'Twitter / X', placeholder: 'https://x.com/username' },
  { key: 'behance', label: 'Behance', placeholder: 'https://behance.net/username' },
];

export function SocialMediaForm({ data, onUpdate }: SocialMediaFormProps) {
  const [form, setForm] = useState(data || {});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {PLATFORMS.map((p) => (
        <div key={p.key}>
          <label className="mb-1 block text-sm font-medium capitalize text-gray-700">
            {p.label}
          </label>
          <input
            type="text"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
            placeholder={p.placeholder}
            value={form[p.key] || ''}
            onChange={(e) => setForm({ ...form, [p.key]: e.target.value })}
          />
        </div>
      ))}

      <div className="pt-4">
        <button
          type="submit"
          className="rounded-lg bg-gray-900 px-6 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-black"
        >
          Update Social Links
        </button>
      </div>
    </form>
  );
}
