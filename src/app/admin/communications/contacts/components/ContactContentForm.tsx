'use client';

import React, { useState } from 'react';

interface ContactContentFormProps {
  data: { headline: string; subtext: string };
  onUpdate: (d: { headline: string; subtext: string }) => void;
}

export function ContactContentForm({ data, onUpdate }: ContactContentFormProps) {
  const [form, setForm] = useState(data);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Headline (Judul Utama)
        </label>
        <p className="mb-6 text-sm text-gray-500">
          Kelola link media sosial dan kontak yang muncul di folder &quot;Contact&quot; pada About
          OS.
        </p>
        <textarea
          required
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 font-mono text-sm transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
          placeholder="Let's Create..."
          value={form.headline}
          onChange={(e) => setForm({ ...form, headline: e.target.value })}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Subtext (Deskripsi)
        </label>
        <textarea
          required
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
          placeholder="We build digital experiences..."
          value={form.subtext}
          onChange={(e) => setForm({ ...form, subtext: e.target.value })}
        />
      </div>

      <div className="pt-4">
        <button
          type="submit"
          className="rounded-lg bg-gray-900 px-6 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-black"
        >
          Save Content
        </button>
      </div>
    </form>
  );
}
