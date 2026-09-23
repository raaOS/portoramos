'use client';

import React, { useState } from 'react';

interface ContactLabelsFormProps {
  labels: Record<string, string>;
  onUpdate: (l: Record<string, string>) => void;
}

export function ContactLabelsForm({ labels, onUpdate }: ContactLabelsFormProps) {
  const [form, setForm] = useState(labels || {});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">Chat Button Text</label>
        <input
          type="text"
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
          placeholder="Chat Langsung"
          value={form.chatButtonText || ''}
          onChange={(e) => setForm({ ...form, chatButtonText: e.target.value })}
        />
      </div>

      <div className="pt-4">
        <button
          type="submit"
          className="rounded-lg bg-gray-900 px-6 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-black"
        >
          Save Settings
        </button>
      </div>
    </form>
  );
}
