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
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
        <Sliders className="h-3.5 w-3.5 text-slate-400" />
        <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Metadata Proyek
        </h4>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Client Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.client}
            onChange={(e) => updateField('client', e.target.value)}
            className={`w-full rounded-md border bg-white px-3 py-2 text-xs transition-all focus:outline-none focus:border-slate-800 ${
              errors.client ? 'border-red-300 bg-red-50/10' : 'border-slate-200 hover:border-slate-300'
            }`}
            placeholder="e.g. Personal Work"
          />
          {errors.client && (
            <p className="mt-1 text-[10px] font-medium text-red-500">{errors.client}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400">
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
            className={`w-full rounded-md border bg-white px-3 py-2 text-xs font-mono transition-all focus:outline-none focus:border-slate-800 ${
              errors.year ? 'border-red-300 bg-red-50/10' : 'border-slate-200 hover:border-slate-300'
            }`}
            min="2000"
            max={new Date().getFullYear() + 1}
          />
          {errors.year && <p className="mt-1 text-[10px] font-medium text-red-500">{errors.year}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Role
          </label>
          <input
            type="text"
            value={formData.role || ''}
            onChange={(e) => updateField('role', e.target.value)}
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs transition-all focus:outline-none focus:border-slate-800 hover:border-slate-300"
            placeholder="e.g. Lead Designer"
          />
        </div>

        <div>
          <label className="mb-1 block font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Timeline
          </label>
          <input
            type="text"
            value={formData.timeline || ''}
            onChange={(e) => updateField('timeline', e.target.value)}
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs transition-all focus:outline-none focus:border-slate-800 hover:border-slate-300"
            placeholder="e.g. 2 Weeks"
          />
        </div>

        <div>
          <label className="mb-1 block font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Team
          </label>
          <input
            type="text"
            value={formData.team || ''}
            onChange={(e) => updateField('team', e.target.value)}
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs transition-all focus:outline-none focus:border-slate-800 hover:border-slate-300"
            placeholder="e.g. Solo"
          />
        </div>
      </div>
    </div>
  );
}
