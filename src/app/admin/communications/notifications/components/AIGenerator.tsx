'use client';

import React, { useState } from 'react';
import { Sparkles, Wand2, Loader2 } from 'lucide-react';

interface AIGeneratorProps {
  onGenerate: (topic: string, count: number) => Promise<void>;
  isLoading: boolean;
}

export default function AIGenerator({ onGenerate, isLoading }: AIGeneratorProps) {
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(3);

  return (
    <div className="group relative overflow-hidden rounded-xl border border-green-100 bg-gradient-to-br from-green-50 to-emerald-50 p-6 shadow-sm">
      <div className="absolute right-0 top-0 p-4 opacity-10 transition-transform group-hover:rotate-12">
        <Sparkles size={64} className="text-green-600" />
      </div>

      <div className="relative z-10">
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-lg bg-green-600 p-1.5 text-white">
            <Wand2 size={18} />
          </div>
          <h3 className="text-lg font-bold text-green-900">AI Magic Testimonial</h3>
        </div>

        <p className="mb-6 text-sm leading-relaxed text-green-700">
          Bantu buatkan testimoni natural (sopan & santai) hanya dengan satu klik.
        </p>

        <div className="flex flex-col gap-3 md:flex-row">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="flex-1 rounded-lg border border-green-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Contoh: Desain Banner Ads / Manipulasi Produk"
          />
          <select
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="rounded-lg border border-green-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500 md:w-32"
          >
            <option value={3}>3 Pesan</option>
            <option value={5}>5 Pesan</option>
            <option value={7}>7 Pesan</option>
          </select>
          <button
            onClick={() => onGenerate(topic, count)}
            disabled={isLoading || !topic}
            className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-green-200 transition-all hover:bg-green-700 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generate
          </button>
        </div>
      </div>
    </div>
  );
}
