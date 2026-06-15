// ═══════════════════════════════════════════════════════════════════
// SECTION MAP (DesignPhilosophyForm.tsx — 758 lines)
// L1-270:   Imports, Zod schemas, types (DesignPhilosophyData, WorkflowStep)
// L271-311: DesignPhilosophyForm component — state, useQuery, CSRF
// L312-365: togglePhase, handleChange, handlePhaseChange — form handlers
// L366-470: handleAddSubStep, handleRemoveSubStep — nested array mutations
// L471-758: JSX render — phase cards, sub-step lists, save button
// ═══════════════════════════════════════════════════════════════════
'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import {
  Save,
  Loader2,
  Sparkles,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  RotateCcw,
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import {
  ADMIN_DATA_GC_TIME,
  ADMIN_DATA_STALE_TIME,
  ADMIN_PLACEHOLDER_DATA,
  ADMIN_QUERY_KEYS,
  fetchAdminAboutPhilosophy,
} from '@/app/admin/lib/adminQueries';

// Types - Hanya Workflow, hapus Legacy
interface SubStep {
  id: string;
  title: string;
  description: string;
  status?: 'default' | 'in-progress' | 'completed' | 'pending';
}

interface WorkflowStep {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  description: string;
  type: 'phase' | 'decision' | 'terminator';
  color: 'amber' | 'blue' | 'purple' | 'rose' | 'emerald';
  icon: string;
  subSteps: SubStep[];
  nextSteps: string[];
  loopTargets: string[];
}

interface DesignPhilosophyData {
  heading: string;
  subheading: string;
  workflowSteps: WorkflowStep[];
}

const AVAILABLE_ICONS = [
  'Search',
  'Lightbulb',
  'Palette',
  'GitPullRequest',
  'CheckCircle2',
  'Sparkles',
  'Target',
  'Zap',
];
const COLORS = [
  { value: 'amber', label: '🟡 Amber (Discovery)', bg: 'bg-amber-100', border: 'border-amber-400' },
  { value: 'blue', label: '🔵 Blue (Strategy)', bg: 'bg-blue-100', border: 'border-blue-400' },
  {
    value: 'purple',
    label: '🟣 Purple (Execution)',
    bg: 'bg-purple-100',
    border: 'border-purple-400',
  },
  { value: 'rose', label: '🔴 Rose (Refinement)', bg: 'bg-rose-100', border: 'border-rose-400' },
  {
    value: 'emerald',
    label: '🟢 Emerald (Delivery)',
    bg: 'bg-emerald-100',
    border: 'border-emerald-400',
  },
];

// Default workflow steps - selalu dipakai kalau data kosong
const DEFAULT_WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 'discovery',
    number: '01',
    title: 'Discovery & Research',
    subtitle: 'Memahami fondasi proyek',
    description: 'Tahap awal untuk memahami masalah bisnis, target audience, dan tujuan desain.',
    type: 'phase',
    color: 'amber',
    icon: 'Search',
    subSteps: [
      {
        id: 'briefing',
        title: 'Briefing & Debrief',
        description: 'Diskusi awal dengan klien',
        status: 'default',
      },
      {
        id: 'research',
        title: 'Research & Observasi',
        description: 'Analisis pasar dan kompetitor',
        status: 'default',
      },
      {
        id: 'reference',
        title: 'Cari Referensi & Asset',
        description: 'Mengumpulkan inspirasi visual',
        status: 'default',
      },
      {
        id: 'sync',
        title: 'Sync dengan Klien',
        description: 'Validasi arah konsep',
        status: 'default',
      },
    ],
    nextSteps: ['strategy'],
    loopTargets: [],
  },
  {
    id: 'strategy',
    number: '02',
    title: 'Strategy & Concept',
    subtitle: 'Merancang pendekatan visual',
    description: 'Menentukan hierarki visual, pesan utama, dan strategi komunikasi.',
    type: 'phase',
    color: 'blue',
    icon: 'Lightbulb',
    subSteps: [
      {
        id: 'message',
        title: 'Definisikan Pesan Utama',
        description: 'Core message yang harus tersampaikan',
        status: 'default',
      },
      {
        id: 'hierarchy',
        title: 'Hierarki Visual',
        description: 'Struktur informasi dan prioritas',
        status: 'default',
      },
      {
        id: 'brainstorm',
        title: 'Brainstorm dengan Tim',
        description: 'Diskusi kreatif eksplorasi ide',
        status: 'default',
      },
      {
        id: 'proposal',
        title: 'Proposal Konsep',
        description: 'Presentasi konsep untuk klien',
        status: 'default',
      },
    ],
    nextSteps: ['execution'],
    loopTargets: ['discovery'],
  },
  {
    id: 'execution',
    number: '03',
    title: 'Execution & Iteration',
    subtitle: 'Mengembangkan desain',
    description: 'Proses kreatif membuat desain dengan iterasi dan revisi.',
    type: 'phase',
    color: 'purple',
    icon: 'Palette',
    subSteps: [
      {
        id: 'wireframe',
        title: 'Draft & Wireframe',
        description: 'Kerangka awal dan layout dasar',
        status: 'default',
      },
      {
        id: 'visual',
        title: 'Desain Visual',
        description: 'Visual dengan detail penuh',
        status: 'default',
      },
      {
        id: 'internal',
        title: 'Review Internal',
        description: 'Evaluasi dengan tim',
        status: 'default',
      },
      {
        id: 'present',
        title: 'Present ke Klien',
        description: 'Tampilkan hasil dan terima feedback',
        status: 'default',
      },
    ],
    nextSteps: ['approval'],
    loopTargets: ['strategy', 'execution'],
  },
  {
    id: 'approval',
    number: '04',
    title: 'Refinement & Approval',
    subtitle: 'Penyempurnaan dan ACC',
    description: 'Tahap revisi akhir hingga persetujuan final.',
    type: 'decision',
    color: 'rose',
    icon: 'GitPullRequest',
    subSteps: [
      {
        id: 'r1',
        title: 'Revisi R1',
        description: 'Perbaikan berdasarkan feedback',
        status: 'default',
      },
      {
        id: 'r2',
        title: 'Revisi R2 (jika perlu)',
        description: 'Penyempurnaan tambahan',
        status: 'default',
      },
      {
        id: 'polish',
        title: 'Final Polish',
        description: 'Detail terakhir dan QC',
        status: 'default',
      },
      { id: 'acc', title: 'ACC dari Klien', description: 'Persetujuan final', status: 'default' },
    ],
    nextSteps: ['delivery'],
    loopTargets: ['execution', 'strategy', 'discovery'],
  },
  {
    id: 'delivery',
    number: '05',
    title: 'Delivery & Result',
    subtitle: 'Serah terima final',
    description: 'Penyerahan aset final dan dokumentasi.',
    type: 'terminator',
    color: 'emerald',
    icon: 'CheckCircle2',
    subSteps: [
      {
        id: 'assets',
        title: 'Prepare Final Assets',
        description: 'File dalam format siap pakai',
        status: 'default',
      },
      {
        id: 'styleguide',
        title: 'Styleguide & Dokumentasi',
        description: 'Panduan penggunaan brand',
        status: 'default',
      },
      {
        id: 'handover',
        title: 'Handover Session',
        description: 'Sesi penjelasan dan Q&A',
        status: 'default',
      },
      {
        id: 'archive',
        title: 'Archive & Closing',
        description: 'Backup dan closing admin',
        status: 'default',
      },
    ],
    nextSteps: [],
    loopTargets: [],
  },
];

export default function DesignPhilosophyForm() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<DesignPhilosophyData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { csrfToken } = useAdminAuth();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(
    new Set(['01', '02', '03', '04', '05'])
  );

  const philosophyQuery = useQuery({
    queryKey: ADMIN_QUERY_KEYS.aboutPhilosophy,
    queryFn: fetchAdminAboutPhilosophy,
    staleTime: ADMIN_DATA_STALE_TIME,
    gcTime: ADMIN_DATA_GC_TIME,
    placeholderData: ADMIN_PLACEHOLDER_DATA.about.designPhilosophy,
  });

  const [prevPhilosophyData, setPrevPhilosophyData] = useState<unknown>(undefined);
  if (philosophyQuery.data && philosophyQuery.data !== prevPhilosophyData) {
    setPrevPhilosophyData(philosophyQuery.data);
    const data = philosophyQuery.data as Partial<DesignPhilosophyData>;
    const safeData: DesignPhilosophyData = {
      heading: data.heading || 'Design Philosophy',
      subheading: data.subheading || 'Strategic Thinking Framework',
      workflowSteps:
        data.workflowSteps && Array.isArray(data.workflowSteps) && data.workflowSteps.length > 0
          ? data.workflowSteps
          : DEFAULT_WORKFLOW_STEPS,
    };

    setFormData(safeData);
  } else if (philosophyQuery.error && formData === null && prevPhilosophyData !== 'error') {
    setPrevPhilosophyData('error');
    setFormData({
      heading: 'Design Philosophy',
      subheading: 'Strategic Thinking Framework',
      workflowSteps: DEFAULT_WORKFLOW_STEPS,
    });
  }

  const togglePhase = (number: string) => {
    setExpandedPhases((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(number)) newSet.delete(number);
      else newSet.add(number);
      return newSet;
    });
  };

  const handleChange = (field: keyof DesignPhilosophyData, value: string) => {
    if (!formData) return;
    setFormData({ ...formData, [field]: value });
  };

  const handlePhaseChange = (index: number, field: keyof WorkflowStep, value: unknown) => {
    if (!formData || !formData.workflowSteps || !formData.workflowSteps[index]) return;
    const newSteps = [...formData.workflowSteps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setFormData({ ...formData, workflowSteps: newSteps });
  };

  const handleSubStepChange = (
    phaseIndex: number,
    subIndex: number,
    field: keyof SubStep,
    value: string
  ) => {
    if (!formData || !formData.workflowSteps) return;
    const phase = formData.workflowSteps[phaseIndex];
    if (!phase || !phase.subSteps || !phase.subSteps[subIndex]) return;

    const newSteps = [...formData.workflowSteps];
    const newSubSteps = [...(newSteps[phaseIndex].subSteps || [])];
    newSubSteps[subIndex] = { ...newSubSteps[subIndex], [field]: value };
    newSteps[phaseIndex] = { ...newSteps[phaseIndex], subSteps: newSubSteps };
    setFormData({ ...formData, workflowSteps: newSteps });
  };

  const handleAddSubStep = (phaseIndex: number) => {
    if (!formData || !formData.workflowSteps || !formData.workflowSteps[phaseIndex]) return;
    const newSteps = [...formData.workflowSteps];
    const newSubStep: SubStep = {
      id: `sub-${Date.now()}`,
      title: 'Sub-step Baru',
      description: 'Deskripsi sub-step',
      status: 'default',
    };
    if (!newSteps[phaseIndex].subSteps) {
      newSteps[phaseIndex].subSteps = [];
    }
    newSteps[phaseIndex].subSteps.push(newSubStep);
    setFormData({ ...formData, workflowSteps: newSteps });
  };

  const handleRemoveSubStep = (phaseIndex: number, subIndex: number) => {
    if (!formData || !formData.workflowSteps || !formData.workflowSteps[phaseIndex]) return;
    const newSteps = [...formData.workflowSteps];
    if (!newSteps[phaseIndex].subSteps) return;
    newSteps[phaseIndex].subSteps.splice(subIndex, 1);
    setFormData({ ...formData, workflowSteps: newSteps });
  };

  const handleLoopTargetToggle = (phaseIndex: number, targetId: string) => {
    if (!formData || !formData.workflowSteps || !formData.workflowSteps[phaseIndex]) return;
    const newSteps = [...formData.workflowSteps];
    const currentTargets = newSteps[phaseIndex].loopTargets || [];
    if (currentTargets.includes(targetId)) {
      newSteps[phaseIndex].loopTargets = currentTargets.filter((id) => id !== targetId);
    } else {
      newSteps[phaseIndex].loopTargets = [...currentTargets, targetId];
    }
    setFormData({ ...formData, workflowSteps: newSteps });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/about/philosophy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        queryClient.setQueryData(ADMIN_QUERY_KEYS.aboutPhilosophy, formData);
        setMessage({ type: 'success', text: 'Perubahan berhasil disimpan! ✨' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error('Failed to save');
      }
    } catch {
      setMessage({ type: 'error', text: 'Gagal menyimpan perubahan.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (philosophyQuery.isLoading || !formData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!formData || !formData.workflowSteps) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        Gagal memuat form. Silakan refresh halaman.
      </div>
    );
  }

  const colorClass = (color: string) => {
    const map: Record<string, string> = {
      amber: 'bg-amber-50 border-amber-300 text-amber-900',
      blue: 'bg-blue-50 border-blue-300 text-blue-900',
      purple: 'bg-purple-50 border-purple-300 text-purple-900',
      rose: 'bg-rose-50 border-rose-300 text-rose-900',
      emerald: 'bg-emerald-50 border-emerald-300 text-emerald-900',
    };
    return map[color] || 'bg-gray-50 border-gray-300';
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-6 dark:border-zinc-800">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Sparkles className="h-5 w-5 text-blue-500" />
            Design Philosophy
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Edit workflow proses desain (5 phase dengan sub-steps)
          </p>
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 rounded-full bg-black px-6 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl p-4 text-sm font-medium ${
            message.type === 'success'
              ? 'border border-green-100 bg-green-50 text-green-700'
              : 'border border-red-100 bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </motion.div>
      )}

      {/* Global Headings */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Heading Utama
          </label>
          <input
            type="text"
            value={formData.heading}
            onChange={(e) => handleChange('heading', e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800/50"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Sub-Heading
          </label>
          <input
            type="text"
            value={formData.subheading}
            onChange={(e) => handleChange('subheading', e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800/50"
          />
        </div>
      </div>

      {/* Workflow Steps Editor */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Workflow Steps ({formData.workflowSteps.length} Phase)
          </label>
          <span className="text-xs text-gray-400">Klik phase untuk expand/collapse</span>
        </div>

        <div className="space-y-3">
          {formData.workflowSteps.map((phase, phaseIndex) => {
            // Defensive: skip invalid phases
            if (!phase) return null;

            const loopTargets = phase.loopTargets || [];
            const subSteps = phase.subSteps || [];

            return (
              <div
                key={phase.id || `phase-${phaseIndex}`}
                className={`overflow-hidden rounded-xl border-2 ${colorClass(phase.color)}`}
              >
                {/* Phase Header */}
                <button
                  type="button"
                  onClick={() => togglePhase(phase.number || String(phaseIndex))}
                  className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-black/5"
                >
                  <GripVertical className="h-5 w-5 text-gray-400" />
                  <span className="text-lg font-bold">{phase.number || phaseIndex + 1}</span>
                  <div className="flex-1">
                    <h3 className="font-bold">{phase.title || 'Untitled'}</h3>
                    <p className="text-sm opacity-70">{phase.subtitle || ''}</p>
                  </div>
                  {loopTargets.length > 0 && (
                    <div className="flex items-center gap-1 rounded-full bg-white/50 px-2 py-1 text-xs">
                      <RotateCcw className="h-3 w-3" />
                      {loopTargets.length} loop
                    </div>
                  )}
                  {expandedPhases.has(phase.number || String(phaseIndex)) ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </button>

                {/* Phase Content */}
                <AnimatePresence>
                  {expandedPhases.has(phase.number || String(phaseIndex)) && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-4 border-t border-black/10 p-4 pt-0">
                        {/* Phase Settings */}
                        <div className="grid grid-cols-2 gap-4 pt-4 md:grid-cols-4">
                          <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase text-gray-500">
                              Judul
                            </label>
                            <input
                              type="text"
                              value={phase.title || ''}
                              onChange={(e) =>
                                handlePhaseChange(phaseIndex, 'title', e.target.value)
                              }
                              className="w-full rounded-lg border border-black/10 bg-white/70 px-3 py-2.5 text-sm font-bold outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase text-gray-500">
                              Subtitle
                            </label>
                            <input
                              type="text"
                              value={phase.subtitle || ''}
                              onChange={(e) =>
                                handlePhaseChange(phaseIndex, 'subtitle', e.target.value)
                              }
                              className="w-full rounded-lg border border-black/10 bg-white/70 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase text-gray-500">
                              Warna
                            </label>
                            <div className="relative">
                              <select
                                value={phase.color || 'amber'}
                                onChange={(e) =>
                                  handlePhaseChange(phaseIndex, 'color', e.target.value)
                                }
                                className="w-full cursor-pointer appearance-none rounded-lg border border-black/10 bg-white/70 px-3 py-2.5 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              >
                                {COLORS.map((c) => (
                                  <option key={c.value} value={c.value}>
                                    {c.label}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            </div>
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase text-gray-500">
                              Icon
                            </label>
                            <div className="relative">
                              <select
                                value={phase.icon || 'Sparkles'}
                                onChange={(e) =>
                                  handlePhaseChange(phaseIndex, 'icon', e.target.value)
                                }
                                className="w-full cursor-pointer appearance-none rounded-lg border border-black/10 bg-white/70 px-3 py-2.5 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              >
                                {AVAILABLE_ICONS.map((icon) => (
                                  <option key={icon} value={icon}>
                                    {icon}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase text-gray-500">
                            Deskripsi Phase
                          </label>
                          <textarea
                            value={phase.description || ''}
                            onChange={(e) =>
                              handlePhaseChange(phaseIndex, 'description', e.target.value)
                            }
                            rows={2}
                            className="w-full rounded-lg border border-black/10 bg-white/70 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        {/* Loop Targets */}
                        <div>
                          <label className="mb-2 block text-[10px] font-bold uppercase text-gray-500">
                            Revisi bisa ke (Loop Targets):
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {formData.workflowSteps.map((targetPhase) => {
                              if (!targetPhase || !targetPhase.id) return null;
                              return (
                                <button
                                  key={targetPhase.id}
                                  type="button"
                                  onClick={() => handleLoopTargetToggle(phaseIndex, targetPhase.id)}
                                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                                    loopTargets.includes(targetPhase.id)
                                      ? 'bg-black text-white'
                                      : 'bg-white/50 text-gray-600 hover:bg-white'
                                  }`}
                                >
                                  {targetPhase.number || '?'} {targetPhase.title || 'Untitled'}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Sub-steps */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold uppercase text-gray-500">
                              Sub-steps ({subSteps.length})
                            </label>
                            <button
                              type="button"
                              onClick={() => handleAddSubStep(phaseIndex)}
                              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                            >
                              <Plus className="h-3 w-3" /> Tambah
                            </button>
                          </div>

                          <div className="space-y-2">
                            {subSteps.map((subStep, subIndex) => {
                              if (!subStep) return null;
                              return (
                                <div
                                  key={subStep.id || `sub-${subIndex}`}
                                  className="flex items-start gap-3 rounded-lg border border-black/5 bg-white/50 p-3"
                                >
                                  <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2">
                                    <input
                                      type="text"
                                      value={subStep.title || ''}
                                      onChange={(e) =>
                                        handleSubStepChange(
                                          phaseIndex,
                                          subIndex,
                                          'title',
                                          e.target.value
                                        )
                                      }
                                      placeholder="Judul sub-step"
                                      className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                    <input
                                      type="text"
                                      value={subStep.description || ''}
                                      onChange={(e) =>
                                        handleSubStepChange(
                                          phaseIndex,
                                          subIndex,
                                          'description',
                                          e.target.value
                                        )
                                      }
                                      placeholder="Deskripsi"
                                      className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSubStep(phaseIndex, subIndex)}
                                    className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </form>
  );
}
