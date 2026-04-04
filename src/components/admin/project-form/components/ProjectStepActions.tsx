import React from 'react';
import AdminButton from '@/app/admin/components/AdminButton';
import { Project } from '@/types/projects';

interface ProjectStepActionsProps {
    currentStep: number;
    isUploading: boolean;
    isFormRevealed: boolean;
    project?: Project;
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
    onCancel,
    onBack,
    onNext,
    onSubmit,
    onRevealManual
}: ProjectStepActionsProps) {
    return (
        <div className="flex space-x-3 w-full justify-between items-center px-2">
            {/* Left side actions (Cancel / Back) */}
            <div>
                {currentStep === 1 ? (
                    <AdminButton variant="secondary" onClick={onCancel} disabled={isUploading}> Batal </AdminButton>
                ) : (
                    <AdminButton variant="secondary" onClick={onBack} disabled={isUploading}> Kembali </AdminButton>
                )}
            </div>

            {/* Right side actions (Next / Submit) */}
            <div>
                {currentStep < 3 ? (
                    <AdminButton onClick={onNext}> Lanjut: Tahap {currentStep + 1} </AdminButton>
                ) : (
                    <div className="flex gap-2">
                        {!isFormRevealed && (
                            <button
                                type="button"
                                onClick={onRevealManual}
                                className="text-[10px] font-bold uppercase text-gray-400 hover:text-black transition-colors px-2"
                            >
                                Lewati AI & Isi Manual
                            </button>
                        )}
                        <AdminButton onClick={onSubmit} disabled={isUploading || !isFormRevealed}>
                            {isUploading ? 'Menyimpan...' : (project ? 'Simpan Perubahan' : 'Buat Project')}
                        </AdminButton>
                    </div>
                )}
            </div>
        </div>
    );
}
