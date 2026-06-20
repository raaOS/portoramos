/**
 * Project Step Actions - Tombol navigasi form proyek.
 * @module components/admin/project-form/components/ProjectStepActions
 */
import { Project } from '@/types/projects';
import { Loader2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProjectStepActionsProps {
  isUploading: boolean;
  isSuccess?: boolean;
  project?: Project;
  uploadProgress?: number | null;
  onCancel: () => void;
  onSubmit: () => void;
}

export default function ProjectStepActions({
  isUploading,
  isSuccess = false,
  project,
  uploadProgress,
  onCancel,
  onSubmit,
}: ProjectStepActionsProps) {
  const secondaryBtnClass =
    'rounded border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 shadow-sm transition-all hover:border-slate-800 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-200';

  const getPrimaryBtnClass = () => {
    const base =
      'rounded px-4 py-1.5 text-xs font-bold uppercase tracking-wider shadow-sm transition-all duration-300 flex items-center justify-center gap-1.5 min-w-[100px] relative overflow-hidden select-none';
    if (isSuccess) {
      return `${base} bg-emerald-600 text-white`;
    }
    if (isUploading) {
      return `${base} bg-slate-700 text-slate-200 cursor-not-allowed`;
    }
    return `${base} bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200`;
  };

  return (
    <div className="flex w-full items-center justify-between px-1">
      <motion.button
        type="button"
        className={secondaryBtnClass}
        onClick={onCancel}
        disabled={isUploading || isSuccess}
        whileHover={!(isUploading || isSuccess) ? { scale: 1.02 } : {}}
        whileTap={!(isUploading || isSuccess) ? { scale: 0.98 } : {}}
      >
        Batal
      </motion.button>

      <div className="flex items-center gap-3">
        <AnimatePresence>
          {uploadProgress !== null && uploadProgress !== undefined && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex w-24 flex-col gap-1"
              aria-label={`Upload progress ${uploadProgress}%`}
            >
              <div className="flex items-center justify-between font-mono text-[8px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <span>Mengunggah</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-0.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-slate-800 dark:bg-slate-300 transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          layout
          type="button"
          className={getPrimaryBtnClass()}
          onClick={onSubmit}
          disabled={isUploading || isSuccess}
          whileHover={!(isUploading || isSuccess) ? { scale: 1.02 } : {}}
          whileTap={!(isUploading || isSuccess) ? { scale: 0.98 } : {}}
        >
          {/* Subtle success pulse background burst */}
          {isSuccess && (
            <motion.span
              initial={{ scale: 0.8, opacity: 0.5 }}
              animate={{ scale: 2.2, opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="absolute inset-0 rounded bg-emerald-400 pointer-events-none"
            />
          )}

          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.span
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                >
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </motion.div>
                <span>Tersimpan</span>
              </motion.span>
            ) : isUploading ? (
              <motion.span
                key="uploading"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5"
              >
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Menyimpan...</span>
              </motion.span>
            ) : (
              <motion.span
                key="idle"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center justify-center"
              >
                {project ? 'Simpan' : 'Buat'}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  );
}
