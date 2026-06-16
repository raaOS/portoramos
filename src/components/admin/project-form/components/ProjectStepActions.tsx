/**
 * Project Step Actions — Tombol navigasi antar langkah form proyek.
 * @module components/admin/project-form/components/ProjectStepActions
 */
import React from 'react';
import AdminButton from '@/app/admin/components/AdminButton';
import { Project } from '@/types/projects';

interface ProjectStepActionsProps {
  isUploading: boolean;
  project?: Project;
  uploadProgress?: number | null;
  onCancel: () => void;
  onSubmit: () => void;
}

export default function ProjectStepActions({
  isUploading,
  project,
  uploadProgress,
  onCancel,
  onSubmit,
}: ProjectStepActionsProps) {
  const secondaryBtnClass = "bg-white border border-slate-200 text-slate-500 hover:border-slate-800 hover:text-slate-900 transition-all rounded px-4 py-1.5 text-xs font-bold uppercase tracking-wider shadow-sm";
  const primaryBtnClass = "bg-slate-900 text-white hover:bg-slate-800 transition-all rounded px-4 py-1.5 text-xs font-bold uppercase tracking-wider shadow-sm disabled:bg-slate-100 disabled:text-slate-400";

  return (
    <div className="flex w-full items-center justify-between px-1">
      {/* Left side: Cancel */}
      <div>
        <AdminButton 
          className={secondaryBtnClass} 
          onClick={onCancel} 
          disabled={isUploading}
        >
          Batal
        </AdminButton>
      </div>

      {/* Right side: Save/Submit & Upload Progress */}
      <div className="flex items-center gap-3">
        {uploadProgress !== null && uploadProgress !== undefined && (
          <div className="w-24 flex flex-col gap-1" aria-label={`Upload progress ${uploadProgress}%`}>
            <div className="flex items-center justify-between font-mono text-[8px] text-slate-400 font-bold uppercase tracking-wider">
              <span>Mengunggah</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-0.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-slate-800 transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
        <AdminButton 
          className={primaryBtnClass}
          onClick={onSubmit} 
          disabled={isUploading}
        >
          {isUploading ? 'Menyimpan...' : project ? 'Simpan' : 'Buat'}
        </AdminButton>
      </div>
    </div>
  );
}
