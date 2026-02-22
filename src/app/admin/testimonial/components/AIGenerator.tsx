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
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                <Sparkles size={64} className="text-green-600" />
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                    <div className="bg-green-600 p-1.5 rounded-lg text-white">
                        <Wand2 size={18} />
                    </div>
                    <h3 className="text-lg font-bold text-green-900">AI Magic Testimonial</h3>
                </div>

                <p className="text-sm text-green-700 mb-6 leading-relaxed">
                    Bantu buatkan testimoni natural (sopan & santai) hanya dengan satu klik.
                </p>

                <div className="flex flex-col md:flex-row gap-3">
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="flex-1 px-4 py-2.5 bg-white border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm"
                        placeholder="Contoh: Desain Banner Ads / Manipulasi Produk"
                    />
                    <select
                        value={count}
                        onChange={(e) => setCount(Number(e.target.value))}
                        className="px-4 py-2.5 bg-white border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm md:w-32"
                    >
                        <option value={3}>3 Pesan</option>
                        <option value={5}>5 Pesan</option>
                        <option value={7}>7 Pesan</option>
                    </select>
                    <button
                        onClick={() => onGenerate(topic, count)}
                        disabled={isLoading || !topic}
                        className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-200 disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        Generate
                    </button>
                </div>
            </div>
        </div>
    );
}
