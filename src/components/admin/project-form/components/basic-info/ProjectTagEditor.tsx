import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Plus, Tag, X } from 'lucide-react';
import { ProjectFormData } from '@/hooks/useProjectForm';
import type { ProjectBasicInfoUpdateField } from './types';

interface ProjectTagEditorProps {
  formData: ProjectFormData;
  updateField: ProjectBasicInfoUpdateField;
}

export default function ProjectTagEditor({ formData, updateField }: ProjectTagEditorProps) {
  const [isAddingNewTag, setIsAddingNewTag] = useState(false);
  const [newTagValue, setNewTagValue] = useState('');
  const [morphingTag, setMorphingTag] = useState<string | null>(null);

  const currentTagsList = useMemo(() => {
    return formData.tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t);
  }, [formData.tags]);

  const handleToggleTag = (tag: string) => {
    const normalizedTag = tag.trim();
    if (!normalizedTag) return;

    const current = new Set(
      formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t)
    );

    let found = false;
    for (const t of Array.from(current)) {
      if (t.toLowerCase() === normalizedTag.toLowerCase()) {
        current.delete(t);
        found = true;
        break;
      }
    }

    if (!found) {
      current.add(normalizedTag);
    }

    updateField('tags', Array.from(current).join(', '));
  };

  const commitNewTag = (tag: string) => {
    const normalizedTag = tag.trim();
    if (!normalizedTag) return;

    const isExistingTag = currentTagsList.some(
      (currentTag) => currentTag.toLowerCase() === normalizedTag.toLowerCase()
    );
    if (!isExistingTag) {
      setMorphingTag(normalizedTag);
    }

    handleToggleTag(normalizedTag);
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
        <Tag className="h-3.5 w-3.5 text-slate-400" />
        <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Tags & Kategori
        </h4>
      </div>
      <div>
        <div className="flex flex-wrap gap-2 items-center">
          {currentTagsList.length === 0 && !isAddingNewTag ? (
            <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400 mr-1">
              Belum ada tag
            </span>
          ) : (
            currentTagsList.map((tag) => {
              const isMorphing = morphingTag?.toLowerCase() === tag.toLowerCase();
              return (
                <motion.div
                  key={tag}
                  layout
                  initial={
                    isMorphing
                      ? { width: 144, height: 36, opacity: 0.96, borderRadius: 8, scale: 0.98 }
                      : false
                  }
                  animate={{ width: 'auto', height: 32, opacity: 1, borderRadius: 999, scale: 1 }}
                  transition={{
                    width: { type: 'spring', stiffness: 240, damping: 24 },
                    height: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
                    borderRadius: { duration: 0.48, ease: [0.22, 1, 0.36, 1] },
                    opacity: { duration: 0.2 },
                    scale: { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
                  }}
                  onAnimationComplete={() => {
                    if (isMorphing) setMorphingTag(null);
                  }}
                  className="flex h-8 items-center gap-2.5 rounded-full border border-slate-200 bg-white pl-4 pr-2.5 text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all"
                >
                  <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-600">
                    {tag}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    className="flex h-4 w-4 items-center justify-center text-slate-400 transition-colors hover:text-red-500 cursor-pointer"
                    style={{ minWidth: 'unset', minHeight: 'unset' }}
                    title={`Hapus tag ${tag}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </motion.div>
              );
            })
          )}

          <AnimatePresence>
            {isAddingNewTag && (
              <motion.div
                layout
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 152, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{
                  width: { type: 'spring', stiffness: 260, damping: 28 },
                  opacity: { duration: 0.18 },
                }}
                className="overflow-hidden flex-shrink-0 flex items-center p-1"
              >
                <input
                  type="text"
                  value={newTagValue}
                  onChange={(e) => setNewTagValue(e.target.value)}
                  onBlur={() => {
                    const val = newTagValue.trim();
                    if (val) {
                      commitNewTag(val);
                    }
                    setIsAddingNewTag(false);
                    setNewTagValue('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      const val = newTagValue.trim();
                      if (val) {
                        commitNewTag(val);
                      }
                      setIsAddingNewTag(false);
                      setNewTagValue('');
                    } else if (e.key === 'Escape') {
                      setIsAddingNewTag(false);
                      setNewTagValue('');
                    } else if (e.key === 'Backspace' && newTagValue === '') {
                      setIsAddingNewTag(false);
                    }
                  }}
                  autoFocus
                  placeholder="Tag..."
                  className="h-9 w-36 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-medium tracking-normal text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-[border-color,box-shadow] placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-300 focus:shadow-[0_0_0_2px_rgba(148,163,184,0.14)] focus:ring-0"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {!isAddingNewTag && (
              <motion.button
                layout
                type="button"
                onClick={() => setIsAddingNewTag(true)}
                initial={{ opacity: 0, scale: 0.85, x: -4 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.85, x: -4 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center justify-center h-[22px] w-[22px] rounded-lg border border-dashed border-slate-300 hover:border-slate-400 bg-slate-50/10 hover:bg-slate-50/40 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer group"
                style={{ minWidth: 'unset', minHeight: 'unset' }}
                title="Tambah Tag"
              >
                <Plus className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        <p className="mt-2.5 font-mono text-[8px] text-slate-400">
          Pilih tag kategori yang akan ditampilkan di halaman detail proyek. Klik (+) untuk menambah atau mengetik tag baru secara langsung.
        </p>
      </div>
    </div>
  );
}
