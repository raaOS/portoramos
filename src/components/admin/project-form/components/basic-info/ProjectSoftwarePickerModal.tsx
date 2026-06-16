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
            <Cpu className="h-8 w-8 text-slate-400 stroke-[1.2] mb-2" />
            <p className="text-xs text-slate-400 font-mono">
              Tidak ada software ditemukan untuk "{searchQuery}"
            </p>
          </div>
        );
      }

      return (
        <div className="space-y-3">
          <h4 className="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-2">
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
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 pt-1">
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-xl bg-white p-5 shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-800">
              Tambah Software & Tools
            </h3>
            <p className="text-[9px] text-slate-400 mt-0.5">Pilih dari pustaka ikon software visual</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
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
            className="w-full rounded-md border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs outline-none focus:border-slate-800 focus:ring-0 transition-colors placeholder-slate-400"
          />
        </div>

        {!searchQuery && (
          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 border-b border-slate-100 scrollbar-none flex-nowrap -mx-1 px-1">
            {ALL_SOFTWARE_CATEGORIES.map((category) => {
              const isActive = activeCategory === category.title;
              return (
                <button
                  key={category.title}
                  type="button"
                  onClick={() => onActiveCategoryChange(category.title)}
                  className={`px-3 py-1.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded-md border transition-all flex-shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                      : 'bg-slate-50/50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  {category.title}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-1">{renderSoftwareGrid()}</div>

        <div className="border-t border-slate-100 pt-3 mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-slate-900 hover:bg-slate-800 text-white px-4 py-1.5 text-xs font-bold transition-all uppercase tracking-wider"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
