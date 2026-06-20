import { Cpu, Search, X } from 'lucide-react';
import { ProjectFormData } from '@/hooks/useProjectForm';
import { ALL_SOFTWARE_CATEGORIES } from './constants';
import SoftwareToolCard from './SoftwareToolCard';
import type { ProjectBasicInfoUpdateField } from './types';

interface ProjectSoftwarePickerModalProps {
  activeCategory: string;
  formData: ProjectFormData;
  searchQuery: string;
  onActiveCategoryChange: (category: string) => void;
  onClose: () => void;
  onSearchChange: (query: string) => void;
  updateField: ProjectBasicInfoUpdateField;
}

function getFilteredSoftwareItems(searchQuery: string) {
  const allItems = ALL_SOFTWARE_CATEGORIES.flatMap((category) => category.items);
  return Array.from(new Set(allItems)).filter((item) =>
    item.replace('_', ' ').toLowerCase().includes(searchQuery.toLowerCase())
  );
}

export default function ProjectSoftwarePickerModal({
  activeCategory,
  formData,
  searchQuery,
  onActiveCategoryChange,
  onClose,
  onSearchChange,
  updateField,
}: ProjectSoftwarePickerModalProps) {
  const selectedSoftware = formData.software || [];

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

  const renderSoftwareGrid = () => {
    if (searchQuery) {
      const filteredItems = getFilteredSoftwareItems(searchQuery);

      if (filteredItems.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Cpu className="mb-2 h-8 w-8 stroke-[1.2] text-slate-400" />
            <p className="font-mono text-xs text-slate-400">
              Tidak ada software ditemukan untuk "{searchQuery}"
            </p>
          </div>
        );
      }

      return (
        <div className="space-y-3">
          <h4 className="mb-2 font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Hasil Pencarian untuk "{searchQuery}"
          </h4>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {filteredItems.map((tool) => (
              <SoftwareToolCard
                key={tool}
                tool={tool}
                isSelected={selectedSoftware.includes(tool)}
                variant="picker"
                onToggle={toggleSoftware}
              />
            ))}
          </div>
        </div>
      );
    }

    const category = ALL_SOFTWARE_CATEGORIES.find((item) => item.title === activeCategory);
    if (!category) return null;

    return (
      <div className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-3">
        {category.items.map((tool) => (
          <SoftwareToolCard
            key={tool}
            tool={tool}
            isSelected={selectedSoftware.includes(tool)}
            variant="picker"
            onToggle={toggleSoftware}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="backdrop-blur-xs animate-in fade-in fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 duration-200">
      <div className="animate-in zoom-in-95 relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-xl border border-slate-100 bg-white p-5 shadow-2xl duration-150">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-800">
              Tambah Software & Tools
            </h3>
            <p className="mt-0.5 text-[9px] text-slate-400">
              Pilih dari pustaka ikon software visual
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari software (contoh: Indesign, Final Cut)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-md border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs placeholder-slate-400 outline-none transition-colors focus:border-slate-800 focus:ring-0"
          />
        </div>

        {!searchQuery && (
          <div className="scrollbar-none -mx-1 mb-4 flex flex-nowrap gap-1.5 overflow-x-auto border-b border-slate-100 px-1 pb-2">
            {ALL_SOFTWARE_CATEGORIES.map((category) => {
              const isActive = activeCategory === category.title;
              return (
                <button
                  key={category.title}
                  type="button"
                  onClick={() => onActiveCategoryChange(category.title)}
                  className={`flex-shrink-0 cursor-pointer rounded-md border px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-wider transition-all ${
                    isActive
                      ? 'shadow-xs border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-slate-50/50 text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  {category.title}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-1">{renderSoftwareGrid()}</div>

        <div className="mt-4 flex justify-end border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-slate-900 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-slate-800"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
