/**
 * Project Step Actions — Tombol navigasi antar langkah form proyek.
 * @module components/admin/project-form/components/ProjectStepActions
 */
import React from 'react';
import AdminButton from '@/app/admin/components/AdminButton';
import { Project } from '@/types/projects';

interface ProjectStepActionsProps {
  currentStep: number;
  isUploading: boolean;
  isFormRevealed: boolean;
  project?: Project;
  uploadProgress?: number | null;
  onCancel: () => void;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onRevealManual: () => void;
}

export default function ProjectStepActions({
  currentStep,
  isUploading,
  isFormRevealed,
  project,
  uploadProgress,
  onCancel,
  onBack,
  onNext,
  onSubmit,
  onRevealManual,
}: ProjectStepActionsProps) {
  return (
    <div className="flex w-full items-center justify-between space-x-3 px-2">
      {/* Left side actions (Cancel / Back) */}
      <div>
        {currentStep === 1 ? (
          <AdminButton variant="secondary" onClick={onCancel} disabled={isUploading}>
            {' '}
            Batal{' '}
          </AdminButton>
        ) : (
          <AdminButton variant="secondary" onClick={onBack} disabled={isUploading}>
            {' '}
            Kembali{' '}
          </AdminButton>
        )}
      </div>

      {/* Right side actions (Next / Submit) */}
      <div>
        {currentStep < 3 ? (
          <AdminButton onClick={onNext}> Lanjut: Tahap {currentStep + 1} </AdminButton>
        ) : (
          <div className="flex items-center gap-2">
            {!isFormRevealed && (
              <button
                type="button"
                onClick={onRevealManual}
                className="px-2 text-[10px] font-bold uppercase text-gray-400 transition-colors hover:text-black"
              >
                Lewati AI & Isi Manual
              </button>
            )}
            <AdminButton onClick={onSubmit} disabled={isUploading || !isFormRevealed}>
              {isUploading ? 'Menyimpan...' : project ? 'Simpan Perubahan' : 'Buat Project'}
            </AdminButton>
            {uploadProgress !== null && uploadProgress !== undefined && (
              <div className="w-24" aria-label={`Upload progress ${uploadProgress}%`}>
                <div className="mb-1 text-right font-mono text-[10px] text-gray-500">
                  {uploadProgress}%
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-gray-900 transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
