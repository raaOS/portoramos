import { Activity } from 'lucide-react';
import { ProjectFormData } from '@/hooks/useProjectForm';
import type { ProjectBasicInfoUpdateField } from './types';

interface ProjectTelemetryFieldsProps {
  formData: ProjectFormData;
  showViralStats: boolean;
  updateField: ProjectBasicInfoUpdateField;
}

export default function ProjectTelemetryFields({
  formData,
  showViralStats,
  updateField,
}: ProjectTelemetryFieldsProps) {
  if (!showViralStats) {
    return (
      <div className="flex h-36 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/20 text-slate-400 dark:border-slate-800 dark:bg-slate-900/10 p-4 text-center">
        <Activity className="mb-2 h-6 w-6 opacity-40 text-slate-400 dark:text-slate-500" />
        <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Belum Ada Metrik Viral
        </span>
        <p className="mt-1 text-[10px] text-slate-400/80 dark:text-slate-500/85">
          Jalankan Viral Stats AI Simulator di sebelah kiri untuk mengisi metrik secara otomatis.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4 pt-1">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
          <Activity className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
          <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Engagement & Telemetry
          </h4>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Likes
            </label>
            <input
              type="number"
              value={formData.likes}
              onChange={(e) => updateField('likes', parseInt(e.target.value) || 0)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-800 placeholder-slate-400 transition-all focus:outline-none focus:ring-0 focus:border-slate-800 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-600 dark:focus:border-slate-300 dark:hover:border-slate-700"
              min="0"
            />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Shares
            </label>
            <input
              type="number"
              value={formData.shares}
              onChange={(e) => updateField('shares', parseInt(e.target.value) || 0)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-800 placeholder-slate-400 transition-all focus:outline-none focus:ring-0 focus:border-slate-800 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-600 dark:focus:border-slate-300 dark:hover:border-slate-700"
              min="0"
            />
          </div>
          <div>
            <label
              className="mb-1 block font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500"
              title="Initial Comment Count"
            >
              Comments
            </label>
            <input
              type="number"
              value={formData.initialCommentCount ?? (formData.id ? 0 : 2)}
              onChange={(e) => updateField('initialCommentCount', parseInt(e.target.value) || 0)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-800 placeholder-slate-400 transition-all focus:outline-none focus:ring-0 focus:border-slate-800 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-600 dark:focus:border-slate-300 dark:hover:border-slate-700"
              min="0"
              max="10"
              placeholder={formData.id ? '0' : '2'}
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/30 dark:border-slate-800/80 dark:bg-slate-900/20 p-2.5">
          <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Allow Comments
          </span>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={formData.allowComments !== false}
              onChange={(e) => updateField('allowComments', e.target.checked)}
            />
            <div className="peer h-4 w-7 rounded-full bg-slate-200 dark:bg-slate-800 after:absolute after:left-[2px] after:top-[2px] after:h-3 after:w-3 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-slate-900 dark:peer-checked:bg-slate-100 peer-checked:after:translate-x-full peer-focus:outline-none"></div>
          </label>
        </div>
      </div>
    </div>
  );
}
