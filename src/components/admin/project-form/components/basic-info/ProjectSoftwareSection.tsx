import { Cpu, Plus } from 'lucide-react';
import { ProjectFormData } from '@/hooks/useProjectForm';
import { DEFAULT_VISIBLE_SOFTWARE } from './constants';
import SoftwareToolCard from './SoftwareToolCard';
import type { ProjectBasicInfoUpdateField } from './types';

interface ProjectSoftwareSectionProps {
  formData: ProjectFormData;
  updateField: ProjectBasicInfoUpdateField;
  onOpenModal: () => void;
}

export default function ProjectSoftwareSection({
  formData,
  updateField,
  onOpenModal,
}: ProjectSoftwareSectionProps) {
  const selectedSoftware = formData.software || [];
  const visibleTools = selectedSoftware.length > 0 ? selectedSoftware : DEFAULT_VISIBLE_SOFTWARE;

  const toggleSoftware = (tool: string) => {
    if (selectedSoftware.includes(tool)) {
      updateField(
        'software',
        selectedSoftware.filter((t) => t !== tool)
      );
    } else {
      updateField('software', [...selectedSoftware, tool]);
    }
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
        <Cpu className="h-3.5 w-3.5 text-slate-400" />
        <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Software & Tools
        </h4>
      </div>
      <div>
        <div className="flex flex-wrap gap-2.5">
          {visibleTools.map((tool) => (
            <SoftwareToolCard
              key={tool}
              tool={tool}
              isSelected={selectedSoftware.includes(tool)}
              variant="summary"
              onToggle={toggleSoftware}
            />
          ))}

          <button
            type="button"
            onClick={onOpenModal}
            className="group flex h-[90px] w-[94px] flex-shrink-0 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/20 p-2 transition-all hover:border-slate-300 hover:bg-slate-50/60"
            title="Tambah Software & Tools Lainnya"
          >
            <div className="group-hover:text-slate-650 flex h-9 w-9 items-center justify-center !rounded-md bg-slate-100 text-slate-400 transition-colors group-hover:bg-slate-200/80">
              <Plus className="h-5 w-5" />
            </div>
            <span className="mt-2.5 font-mono text-[8.5px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-600">
              Lainnya
            </span>
          </button>
        </div>
        <p className="mt-2.5 font-mono text-[8px] text-slate-400">
          Pilih ikon software yang akan ditampilkan di halaman detail proyek. Klik (+) untuk
          menambah tools lainnya.
        </p>
      </div>
    </div>
  );
}
