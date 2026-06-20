import { Sliders } from 'lucide-react';
import { ProjectFormData } from '@/hooks/useProjectForm';
import type { ProjectBasicInfoUpdateField } from './types';

interface ProjectMetadataFieldsProps {
  formData: ProjectFormData;
  errors: Record<string, string>;
  updateField: ProjectBasicInfoUpdateField;
}

export default function ProjectMetadataFields({
  formData,
  errors,
  updateField,
}: ProjectMetadataFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-800/80">
        <Sliders className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
        <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Metadata Proyek
        </h4>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Client Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.client}
            onChange={(e) => updateField('client', e.target.value)}
            className={`w-full rounded-md border px-3 py-2 text-xs placeholder-slate-400 transition-all focus:outline-none focus:ring-0 dark:placeholder-slate-600 ${
              errors.client
                ? 'border-red-300 bg-red-50/10 text-red-900 focus:border-red-500 dark:border-red-800/50 dark:bg-red-950/10 dark:text-red-200'
                : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 focus:border-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-700 dark:focus:border-slate-300'
            }`}
            placeholder="e.g. Personal Work"
          />
          {errors.client && (
            <p className="mt-1 text-[10px] font-medium text-red-500">{errors.client}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Year <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={formData.year || ''}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '') {
                updateField('year', 0);
              } else {
                const num = parseInt(val);
                if (!isNaN(num)) updateField('year', num);
              }
            }}
            className={`w-full rounded-md border px-3 py-2 font-mono text-xs placeholder-slate-400 transition-all focus:outline-none focus:ring-0 dark:placeholder-slate-600 ${
              errors.year
                ? 'border-red-300 bg-red-50/10 text-red-900 focus:border-red-500 dark:border-red-800/50 dark:bg-red-950/10 dark:text-red-200'
                : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 focus:border-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-700 dark:focus:border-slate-300'
            }`}
            min="2000"
            max={new Date().getFullYear() + 1}
          />
          {errors.year && (
            <p className="mt-1 text-[10px] font-medium text-red-500">{errors.year}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Role
          </label>
          <input
            type="text"
            value={formData.role || ''}
            onChange={(e) => updateField('role', e.target.value)}
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 transition-all hover:border-slate-300 focus:border-slate-800 focus:outline-none focus:ring-0 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-600 dark:hover:border-slate-700 dark:focus:border-slate-300"
            placeholder="e.g. Lead Designer"
          />
        </div>

        <div>
          <label className="mb-1 block font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Timeline
          </label>
          <input
            type="text"
            value={formData.timeline || ''}
            onChange={(e) => updateField('timeline', e.target.value)}
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 transition-all hover:border-slate-300 focus:border-slate-800 focus:outline-none focus:ring-0 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-600 dark:hover:border-slate-700 dark:focus:border-slate-300"
            placeholder="e.g. 2 Weeks"
          />
        </div>

        <div>
          <label className="mb-1 block font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Team
          </label>
          <input
            type="text"
            value={formData.team || ''}
            onChange={(e) => updateField('team', e.target.value)}
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 transition-all hover:border-slate-300 focus:border-slate-800 focus:outline-none focus:ring-0 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-600 dark:hover:border-slate-700 dark:focus:border-slate-300"
            placeholder="e.g. Solo"
          />
        </div>
      </div>
    </div>
  );
}
