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
  const [activeTab, setActiveTab] = useState<'challenge' | 'solution' | 'impact'>('challenge');

  const handleNarrativeChange = (field: keyof ProjectFormData['narrative'], value: string) => {
    updateField('narrative', {
      ...formData.narrative,
      [field]: value,
    });
  };

  const isVisualArt = formData.type === 'visual_art';
  const isCommercial = !isVisualArt;

  const tabs = [
    { id: 'challenge', label: isCommercial ? 'Tantangan' : 'Konsep' },
    { id: 'solution', label: isCommercial ? 'Solusi' : 'Proses' },
    { id: 'impact', label: isCommercial ? 'Dampak' : 'Hasil' },
  ] as const;

  const tabStyles = {
    description: {
      bg: 'bg-indigo-600 dark:bg-indigo-500',
      text: 'text-indigo-600 dark:text-indigo-400',
      tint: 'bg-indigo-50/20 dark:bg-indigo-950/5 border-indigo-100/30 dark:border-indigo-900/10',
      placeholder: 'Tulis deskripsi ringkas / tentang proyek di sini...',
    },
    challenge: {
      bg: 'bg-rose-600 dark:bg-rose-500',
      text: 'text-rose-600 dark:text-rose-400',
      tint: 'bg-rose-50/20 dark:bg-rose-950/5 border-rose-100/30 dark:border-rose-900/10',
      placeholder: isCommercial
        ? 'Apa masalah bisnisnya? Jelaskan latar belakang proyek...'
        : 'Apa ide utama di balik karya ini? Pesan apa yang disampaikan...',
    },
    solution: {
      bg: 'bg-amber-500 dark:bg-amber-400',
      text: 'text-amber-655 dark:text-amber-400',
      tint: 'bg-amber-50/30 dark:bg-amber-950/5 border-amber-100/30 dark:border-amber-900/10',
      placeholder: isCommercial
        ? 'Bagaimana solusi desain Anda memecahkan masalah tersebut...'
        : 'Bagaimana cara membuatnya? Teknik, tools, atau alur kerja...',
    },
    impact: {
      bg: 'bg-emerald-600 dark:bg-emerald-500',
      text: 'text-emerald-600 dark:text-emerald-400',
      tint: 'bg-emerald-50/20 dark:bg-emerald-950/5 border-emerald-100/30 dark:border-emerald-900/10',
      placeholder: isCommercial
        ? 'Hasil yang terukur (konversi naik, testimoni, data performa)...'
        : 'Penghargaan, publikasi, pameran, atau detail teknis tambahan...',
    },
  } as const;

  return (
    <div className="space-y-4 font-sans">
      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
        <AlignLeft className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
        <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          {isCommercial ? 'Narasi Komersial' : 'Konsep Artistik'}
        </h4>
      </div>

      <div className="react-tabs-container">
        {/* Browser-style Tabs with curved shoulders */}
        <div className="relative bg-slate-50/80 px-0 pt-1.5 dark:bg-slate-900/30">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-0.5 bg-slate-200/80 dark:bg-slate-800"
          />
          <div
            data-tab-nav
            className="relative z-10 mx-auto grid h-9 min-w-0 items-end"
            style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}
          >
            {/* Animated SVG tab shape */}
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 left-0 z-0 h-9"
              style={{ width: `${100 / tabs.length}%` }}
              animate={{
                x: `${tabs.findIndex((t) => t.id === activeTab) * 100}%`,
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            >
              <svg className="h-full w-full" viewBox="0 0 180 36" preserveAspectRatio="none">
                <path
                  className="fill-white dark:fill-slate-950"
                  d="M0 36H180V35C168 35 163 32 163 22V14C163 6 156 2 146 2H34C24 2 17 6 17 14V22C17 32 12 35 0 35V36Z"
                />
                <path
                  className="fill-none stroke-slate-200/80 dark:stroke-slate-800"
                  d="M0 35C12 35 17 32 17 22V14C17 6 24 2 34 2H146C156 2 163 6 163 14V22C163 32 168 35 180 35"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </motion.div>

            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  onMouseDown={(e) => e.preventDefault()}
                  className={`relative flex h-9 min-w-0 flex-1 cursor-pointer appearance-none items-center justify-center border-0 bg-transparent px-2 text-[11px] font-bold transition-colors duration-150 ${
                    isActive
                      ? `z-20 ${tabStyles[tab.id].text}`
                      : 'z-10 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
                  }`}
                  aria-pressed={isActive}
                >
                  <span className="relative z-10 truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Panel Content Area */}
        <div
          className={`rounded-b-md border-x border-b border-slate-200/80 dark:border-slate-800/80 px-4 py-5 min-h-[180px] ${tabStyles[activeTab].tint} relative z-0 w-full bg-white dark:bg-slate-950 shadow-[0_2px_8px_rgba(0,0,0,0.01)]`}
        >
          <div className="relative z-10">
            {activeTab === 'challenge' && (
              <div className="space-y-1.5">
                <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {isCommercial ? 'Konteks / Tantangan' : 'Konsep / Filosofi'}
                </label>
                <textarea
                  value={isCommercial ? formData.narrative.challenge : formData.narrative.concept}
                  onChange={(e) =>
                    isCommercial
                      ? handleNarrativeChange('challenge', e.target.value)
                      : handleNarrativeChange('concept', e.target.value)
                  }
                  className="w-full min-h-[110px] rounded-md border border-slate-200/80 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 transition-all focus:outline-none focus:ring-0 focus:border-slate-800 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-600 dark:focus:border-slate-300 dark:hover:border-slate-700 leading-relaxed resize-y"
                  placeholder={tabStyles.challenge.placeholder}
                />
                {isCommercial ? (
                  errors?.['narrative.challenge'] && (
                    <p className="mt-1 text-[10px] font-medium text-red-500">{errors['narrative.challenge']}</p>
                  )
                ) : (
                  errors?.['narrative.concept'] && (
                    <p className="mt-1 text-[10px] font-medium text-red-500">{errors['narrative.concept']}</p>
                  )
                )}
              </div>
            )}

            {activeTab === 'solution' && (
              <div className="space-y-1.5">
                <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {isCommercial ? 'Solusi / Strategi' : 'Proses / Teknik'}
                </label>
                <textarea
                  value={isCommercial ? formData.narrative.solution : formData.narrative.process}
                  onChange={(e) =>
                    isCommercial
                      ? handleNarrativeChange('solution', e.target.value)
                      : handleNarrativeChange('process', e.target.value)
                  }
                  className="w-full min-h-[110px] rounded-md border border-slate-200/80 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 transition-all focus:outline-none focus:ring-0 focus:border-slate-800 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-600 dark:focus:border-slate-300 dark:hover:border-slate-700 leading-relaxed resize-y"
                  placeholder={tabStyles.solution.placeholder}
                />
                {isCommercial ? (
                  errors?.['narrative.solution'] && (
                    <p className="mt-1 text-[10px] font-medium text-red-500">{errors['narrative.solution']}</p>
                  )
                ) : (
                  errors?.['narrative.process'] && (
                    <p className="mt-1 text-[10px] font-medium text-red-500">{errors['narrative.process']}</p>
                  )
                )}
              </div>
            )}

            {activeTab === 'impact' && (
              <div className="space-y-1.5">
                <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {isCommercial ? 'Dampak / Hasil' : 'Detail / Resepsi'}
                </label>
                <textarea
                  value={isCommercial ? formData.narrative.impact : formData.narrative.detail}
                  onChange={(e) =>
                    isCommercial
                      ? handleNarrativeChange('impact', e.target.value)
                      : handleNarrativeChange('detail', e.target.value)
                  }
                  className="w-full min-h-[110px] rounded-md border border-slate-200/80 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 transition-all focus:outline-none focus:ring-0 focus:border-slate-800 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-600 dark:focus:border-slate-300 dark:hover:border-slate-700 leading-relaxed resize-y"
                  placeholder={tabStyles.impact.placeholder}
                />
                {isCommercial ? (
                  errors?.['narrative.impact'] && (
                    <p className="mt-1 text-[10px] font-medium text-red-500">{errors['narrative.impact']}</p>
                  )
                ) : (
                  errors?.['narrative.detail'] && (
                    <p className="mt-1 text-[10px] font-medium text-red-500">{errors['narrative.detail']}</p>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
