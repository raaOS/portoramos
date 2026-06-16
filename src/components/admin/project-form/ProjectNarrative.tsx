/**
 * Project Narrative — Form narasi dan cerita di balik proyek.
 *
 * Menangani input deskripsi panjang, cerita proses, dan tantangan
 * yang dihadapi selama pengerjaan proyek, dengan layout tab yang
 * identik dengan halaman detail visual proyek.
 *
 * @module components/admin/project-form/ProjectNarrative
 */
import { useState } from 'react';
import { ProjectFormData } from '@/hooks/useProjectForm';
import { AlignLeft } from 'lucide-react';
import { motion } from 'motion/react';

interface ProjectNarrativeProps {
  formData: ProjectFormData;
  updateField: <K extends keyof ProjectFormData>(field: K, value: ProjectFormData[K]) => void;
  errors?: Record<string, string>;
}

export default function ProjectNarrative({ formData, updateField, errors }: ProjectNarrativeProps) {
  const [activeTab, setActiveTab] = useState<'description' | 'challenge' | 'solution' | 'impact'>('description');

  const handleNarrativeChange = (field: keyof ProjectFormData['narrative'], value: string) => {
    updateField('narrative', {
      ...formData.narrative,
      [field]: value,
    });
  };

  const isVisualArt = formData.type === 'visual_art';
  const isCommercial = !isVisualArt;

  const tabs = [
    { id: 'description', label: 'Tentang' },
    { id: 'challenge', label: isCommercial ? 'Tantangan' : 'Konsep' },
    { id: 'solution', label: isCommercial ? 'Solusi' : 'Proses' },
    { id: 'impact', label: isCommercial ? 'Dampak' : 'Hasil' },
  ] as const;

  const tabStyles = {
    description: {
      bg: 'bg-indigo-600 dark:bg-indigo-500',
      tint: 'bg-indigo-50/20 border-indigo-100/30',
      placeholder: 'Tulis deskripsi ringkas / tentang proyek di sini...',
    },
    challenge: {
      bg: 'bg-rose-600 dark:bg-rose-500',
      tint: 'bg-rose-50/20 border-rose-100/30',
      placeholder: isCommercial
        ? 'Apa masalah bisnisnya? Jelaskan latar belakang proyek...'
        : 'Apa ide utama di balik karya ini? Pesan apa yang disampaikan...',
    },
    solution: {
      bg: 'bg-amber-500 dark:bg-amber-400',
      tint: 'bg-amber-50/30 border-amber-100/30',
      placeholder: isCommercial
        ? 'Bagaimana solusi desain Anda memecahkan masalah tersebut...'
        : 'Bagaimana cara membuatnya? Teknik, tools, atau alur kerja...',
    },
    impact: {
      bg: 'bg-emerald-600 dark:bg-emerald-500',
      tint: 'bg-emerald-50/20 border-emerald-100/30',
      placeholder: isCommercial
        ? 'Hasil yang terukur (konversi naik, testimoni, data performa)...'
        : 'Penghargaan, publikasi, pameran, atau detail teknis tambahan...',
    },
  } as const;

  return (
    <div className="space-y-4 font-sans">
      {/* Narrative Section Header */}
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
        <AlignLeft className="h-3.5 w-3.5 text-slate-400" />
        <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {isCommercial ? 'Narasi Komersial' : 'Konsep Artistik'}
        </h3>
      </div>

      <div className="react-tabs-container">
        {/* Tab List Line */}
        <div className="relative z-10 w-full border-b border-slate-200/80">
          <div className="relative flex items-end px-0">
            {/* Animated Pill */}
            <motion.div
              className={`absolute -bottom-px z-10 h-full rounded-t-md ${tabStyles[activeTab].bg}`}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              style={{
                left: `${(tabs.findIndex((t) => t.id === activeTab) / tabs.length) * 100}%`,
                width: `${100 / tabs.length}%`,
              }}
            />

            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative -mb-[1px] flex flex-1 items-center justify-center px-4 py-2 text-xs font-bold outline-none transition-colors duration-150 ${
                    isActive ? 'z-20 text-white' : 'z-0 text-slate-400 hover:text-slate-650'
                  }`}
                >
                  <span className="relative z-10 text-center">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Panel Content Area */}
        <div
          className={`border-x border-b border-slate-200/80 rounded-b-md px-4 py-5 min-h-[180px] ${tabStyles[activeTab].tint} relative z-0 w-full bg-white dark:bg-slate-950 shadow-[0_2px_8px_rgba(0,0,0,0.01)]`}
        >
          <div className="relative z-10">
            {activeTab === 'description' && (
              <div className="space-y-1.5">
                <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Tentang Proyek / Deskripsi
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  className="w-full min-h-[110px] rounded-md border border-slate-200/80 bg-white px-3 py-2 text-xs transition-all focus:border-slate-800 focus:outline-none placeholder-slate-350 leading-relaxed resize-y"
                  placeholder={tabStyles.description.placeholder}
                />
                {errors?.description && (
                  <p className="mt-1 text-[10px] text-red-500 font-medium">{errors.description}</p>
                )}
              </div>
            )}

            {activeTab === 'challenge' && (
              <div className="space-y-1.5">
                <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  {isCommercial ? 'Konteks / Tantangan' : 'Konsep / Filosofi'}
                </label>
                <textarea
                  value={isCommercial ? formData.narrative.challenge : formData.narrative.concept}
                  onChange={(e) =>
                    isCommercial
                      ? handleNarrativeChange('challenge', e.target.value)
                      : handleNarrativeChange('concept', e.target.value)
                  }
                  className="w-full min-h-[110px] rounded-md border border-slate-200/80 bg-white px-3 py-2 text-xs transition-all focus:border-slate-800 focus:outline-none placeholder-slate-350 leading-relaxed resize-y"
                  placeholder={tabStyles.challenge.placeholder}
                />
              </div>
            )}

            {activeTab === 'solution' && (
              <div className="space-y-1.5">
                <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  {isCommercial ? 'Solusi / Strategi' : 'Proses / Teknik'}
                </label>
                <textarea
                  value={isCommercial ? formData.narrative.solution : formData.narrative.process}
                  onChange={(e) =>
                    isCommercial
                      ? handleNarrativeChange('solution', e.target.value)
                      : handleNarrativeChange('process', e.target.value)
                  }
                  className="w-full min-h-[110px] rounded-md border border-slate-200/80 bg-white px-3 py-2 text-xs transition-all focus:border-slate-800 focus:outline-none placeholder-slate-350 leading-relaxed resize-y"
                  placeholder={tabStyles.solution.placeholder}
                />
              </div>
            )}

            {activeTab === 'impact' && (
              <div className="space-y-1.5">
                <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  {isCommercial ? 'Dampak / Hasil' : 'Detail / Resepsi'}
                </label>
                <textarea
                  value={isCommercial ? formData.narrative.impact : formData.narrative.detail}
                  onChange={(e) =>
                    isCommercial
                      ? handleNarrativeChange('impact', e.target.value)
                      : handleNarrativeChange('detail', e.target.value)
                  }
                  className="w-full min-h-[110px] rounded-md border border-slate-200/80 bg-white px-3 py-2 text-xs transition-all focus:border-slate-800 focus:outline-none placeholder-slate-350 leading-relaxed resize-y"
                  placeholder={tabStyles.impact.placeholder}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
