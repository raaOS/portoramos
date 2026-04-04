/**
 * ProjectForm Component
 * Refactored into sub-components for better maintainability.
 */
import React, { useState } from 'react';
import { useProjectForm } from '@/hooks/useProjectForm';
import { Project, CreateProjectData, UpdateProjectData } from '@/types/projects';
import AdminModal from '@/app/admin/components/AdminModal';
import { useFirebaseUpload } from '@/app/admin/components/file-upload/hooks/useFirebaseUpload';
import { useAdminAuth } from '@/hooks/useAdminAuth';

// Custom Hooks
import { useProjectPurge } from './hooks/useProjectPurge';
import { useProjectWizard } from './hooks/useProjectWizard';

// Sub-components
import ProjectBasicInfo from './ProjectBasicInfo';
import ProjectMediaUpload from './ProjectMediaUpload';
import ProjectNarrative from './ProjectNarrative';
import ProjectAIHelper from './ProjectAIHelper';
import ProjectGalleryManager from './ProjectGalleryManager';
import ProjectStepIndicator from './components/ProjectStepIndicator';
import ProjectStepActions from './components/ProjectStepActions';

interface ProjectFormProps {
    project?: Project;
    allProjects?: Project[];
    onSubmit: (data: CreateProjectData | UpdateProjectData) => Promise<void>;
    onCancel: () => void;
    title: string;
}

export default function ProjectForm({ project, allProjects = [], onSubmit, onCancel, title }: ProjectFormProps) {
    const {
        formData,
        errors,
        isDetectingDimensions,
        updateField,
        addGalleryItem,
        removeGalleryItem,
        toggleGalleryItem,
        addGalleryGroup,
        removeGalleryGroup,
        addGalleryItemToGroup,
        removeGalleryItemFromGroup,
        toggleGalleryItemInGroup,
        updateGroupName,
        getSubmitData
    } = useProjectForm(project);

    const { csrfToken } = useAdminAuth();
    const { upload } = useFirebaseUpload({ folder: 'projects', csrfToken: csrfToken || '' });
    
    // Extracted Hooks
    const { 
        currentStep, setCurrentStep, 
        isFormRevealed, revealForm, 
        mediaFormat, setMediaFormat,
        handleNext, handleBack 
    } = useProjectWizard(project);

    const { trackNewUpload, executeCleanup, handleCancelCleanup } = useProjectPurge(project);

    // Local state for deferred upload
    const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const submitData = getSubmitData();
        if (!submitData) return;

        try {
            setIsUploading(true);
            
            // Upload Cover if pending
            if (pendingCoverFile) {
                const { url, success, error: uploadError } = await upload(pendingCoverFile);
                if (!success) throw new Error(uploadError || 'Upload failed');
                submitData.cover = url;
            }

            // Submit Data to DB First!
            await onSubmit(submitData);

            // [Garbage Collection Execution]
            await executeCleanup(submitData);

        } catch (error) {
            console.error("Submit failed", error);
            alert("Gagal menyimpan project. Silakan coba lagi.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleFormCancel = async () => {
        const canCancel = await handleCancelCleanup();
        if (canCancel) onCancel();
    };

    return (
        <AdminModal
            isOpen={true}
            onClose={handleFormCancel}
            title={title}
            size="2xl"
            actions={
                <ProjectStepActions
                    currentStep={currentStep}
                    isUploading={isUploading}
                    isFormRevealed={isFormRevealed}
                    project={project}
                    onCancel={handleFormCancel}
                    onBack={handleBack}
                    onNext={handleNext}
                    onSubmit={() => handleSubmit()}
                    onRevealManual={revealForm}
                />
            }
        >
            <ProjectStepIndicator currentStep={currentStep} />

            <form onSubmit={handleSubmit} className="min-h-[400px]">
                {/* STEP 1: SETUP - Minimalist with Checkbox Style */}
                {currentStep === 1 && (
                    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300 px-2">
                        {/* Section 1: Project Type */}
                        <section>
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-gray-900">Tipe Studi Kasus</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Pilih pendekatan yang sesuai</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                {['commercial', 'visual_art'].map((type) => (
                                    <label key={type} className="group flex items-center gap-3 py-1.5 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="type" 
                                            className="hidden" 
                                            checked={formData.type === type} 
                                            onChange={() => updateField('type', type)} 
                                        />
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                            formData.type === type ? 'border-green-500 bg-green-50' : 'border-gray-300 group-hover:border-gray-400'
                                        }`}>
                                            {formData.type === type && (
                                                <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className={`text-sm ${formData.type === type ? 'font-medium text-green-600' : 'text-gray-500 group-hover:text-gray-700'}`}>
                                            {type === 'commercial' ? 'Komersial' : 'Art Visual'}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </section>

                        {/* Divider */}
                        <div className="h-px bg-gray-100" />

                        {/* Section 2: Media Format */}
                        <section>
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-gray-900">Format Media</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Menentukan input selanjutnya</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                {[
                                    { id: 'single', label: 'Cover Saja' },
                                    { id: 'comparison', label: 'Before / After' },
                                    { id: 'gallery', label: 'Galeri Item' }
                                ].map((fmt) => (
                                    <label key={fmt.id} className="group flex items-center gap-3 py-1.5 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="mediaFormat" 
                                            className="hidden" 
                                            checked={mediaFormat === fmt.id} 
                                            onChange={() => setMediaFormat(fmt.id as any)} 
                                        />
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                            mediaFormat === fmt.id ? 'border-green-500 bg-green-50' : 'border-gray-300 group-hover:border-gray-400'
                                        }`}>
                                            {mediaFormat === fmt.id && (
                                                <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className={`text-sm ${mediaFormat === fmt.id ? 'font-medium text-green-600' : 'text-gray-500 group-hover:text-gray-700'}`}>
                                            {fmt.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </section>
                    </div>
                )}

                {/* STEP 2: MEDIA UPLOADS - Clean Card Layout */}
                {currentStep === 2 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* Cover Image Card */}
                        <div className="bg-white rounded-lg border border-gray-200 p-5">
                            <h3 className="text-sm font-semibold text-gray-900 mb-4">Cover Image</h3>
                            <ProjectMediaUpload
                                formData={formData}
                                errors={errors}
                                isDetectingDimensions={isDetectingDimensions}
                                updateField={updateField}
                                slug={formData.slug}
                                onFileChange={setPendingCoverFile}
                                mediaFormat={mediaFormat}
                                onNewUpload={trackNewUpload}
                            />
                        </div>

                        {/* Gallery Manager - Only for gallery format */}
                        {mediaFormat === 'gallery' && (
                            <div className="bg-white rounded-lg border border-gray-200 p-5">
                                <h3 className="text-sm font-semibold text-gray-900 mb-4">Gallery Items</h3>
                                <ProjectGalleryManager
                                    formData={formData}
                                    addGalleryItem={addGalleryItem}
                                    removeGalleryItem={removeGalleryItem}
                                    toggleGalleryItem={toggleGalleryItem}
                                    addGalleryGroup={addGalleryGroup}
                                    removeGalleryGroup={removeGalleryGroup}
                                    addGalleryItemToGroup={addGalleryItemToGroup}
                                    removeGalleryItemFromGroup={removeGalleryItemFromGroup}
                                    toggleGalleryItemInGroup={toggleGalleryItemInGroup}
                                    updateGroupName={updateGroupName}
                                    onNewUpload={trackNewUpload}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 3: REVIEW & AI */}
                {currentStep === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <ProjectAIHelper
                            cover={formData.cover}
                            pendingFile={pendingCoverFile}
                            slug={formData.slug || ''}
                            projectId={project?.id}
                            onGenerate={(data) => {
                                // Bulk update fields
                                const mapping: Record<string, any> = {
                                    title: data.title,
                                    description: data.description,
                                    client: data.client,
                                    role: data.role,
                                    team: data.team,
                                    timeline: data.timeline,
                                    software: data.software,
                                    narrative: data.narrative,
                                    tags: data.tags?.join(', '),
                                    likes: data.likes,
                                    shares: data.shares,
                                    allowComments: data.isViralPackageRequested ? true : undefined
                                };
                                Object.entries(mapping).forEach(([k, v]) => {
                                    if (v !== undefined) updateField(k as any, v);
                                });
                                revealForm();
                            }}
                        />

                        {isFormRevealed ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                                <ProjectBasicInfo
                                    formData={formData}
                                    errors={errors}
                                    updateField={updateField}
                                    allProjects={allProjects}
                                />

                                <ProjectNarrative
                                    formData={formData}
                                    updateField={updateField}
                                />
                            </div>
                        ) : (
                            <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/30">
                                <p className="text-sm text-gray-400 font-medium italic">Klik tombol &quot;Generate&quot; di atas untuk mengisi detail otomatis</p>
                            </div>
                        )}
                    </div>
                )}
            </form>
        </AdminModal>
    );
}
