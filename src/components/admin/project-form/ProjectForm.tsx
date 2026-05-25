/**
 * ProjectForm Component
 * Refactored into sub-components for better maintainability.
 */
import React, { useState } from 'react';
import { useProjectForm, type ProjectFormData } from '@/hooks/useProjectForm';
import { Project, CreateProjectData, UpdateProjectData } from '@/types/projects';
import AdminModal from '@/app/admin/components/AdminModal';
import { useStorageUpload } from '@/app/admin/components/file-upload/hooks/useStorageUpload';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Label } from '@/types/labels';
import { useToast } from '@/contexts/ToastContext';

// Custom Hooks
import { useProjectPurge } from './hooks/useProjectPurge';
import { useProjectWizard } from './hooks/useProjectWizard';

// Sub-components
import ProjectBasicInfo from './ProjectBasicInfo';
import ProjectMediaUpload from './ProjectMediaUpload';
import ProjectNarrative from './ProjectNarrative';
import ProjectAIHelper, { type AIResponse } from './ProjectAIHelper';
import ProjectGalleryManager from './ProjectGalleryManager';
import ProjectStepIndicator from './components/ProjectStepIndicator';
import ProjectStepActions from './components/ProjectStepActions';

const PROJECT_TYPE_OPTIONS = [
  { value: 'commercial', label: 'Komersial' },
  { value: 'visual_art', label: 'Art Visual' },
] as const;

const MEDIA_FORMAT_OPTIONS = [
  { id: 'single', label: 'Cover Saja' },
  { id: 'comparison', label: 'Before / After' },
  { id: 'gallery', label: 'Galeri Item' },
] as const;

type AIUpdatableField = keyof Pick<
  ProjectFormData,
  | 'title'
  | 'description'
  | 'client'
  | 'role'
  | 'team'
  | 'timeline'
  | 'software'
  | 'narrative'
  | 'tags'
  | 'likes'
  | 'shares'
  | 'allowComments'
>;

interface ProjectFormProps {
  project?: Project;
  allProjects?: Project[];
  labels?: Label[];
  onSubmit: (data: CreateProjectData | UpdateProjectData) => Promise<void>;
  onCancel: () => void;
  title: string;
}

export default function ProjectForm({
  project,
  allProjects = [],
  labels = [],
  onSubmit,
  onCancel,
  title,
}: ProjectFormProps) {
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
    getSubmitData,
  } = useProjectForm(project);

  const { csrfToken } = useAdminAuth();
  const { upload } = useStorageUpload({ folder: 'projects', csrfToken: csrfToken || '' });
  const { showError } = useToast();

  // Extracted Hooks
  const {
    currentStep,
    isFormRevealed,
    revealForm,
    mediaFormat,
    setMediaFormat,
    handleNext,
    handleBack,
  } = useProjectWizard(project);

  const { trackNewUpload, executeCleanup, handleCancelCleanup, purgeUrl } = useProjectPurge(
    project,
    csrfToken
  );

  // Local state for deferred upload
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [submitUploadProgress, setSubmitUploadProgress] = useState<number | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const submitData = getSubmitData();
    if (!submitData) return;

    try {
      setIsUploading(true);

      // Upload Cover if pending
      if (pendingCoverFile) {
        setSubmitUploadProgress(0);
        const {
          url,
          success,
          error: uploadError,
        } = await upload(pendingCoverFile, {
          onUploadProgress: setSubmitUploadProgress,
        });
        if (!success) throw new Error(uploadError || 'Upload failed');
        setSubmitUploadProgress(100);
        submitData.cover = url;
      }

      // Submit Data to DB First!
      await onSubmit(submitData);

      // [Garbage Collection Execution]
      await executeCleanup(submitData);
      setPendingCoverFile(null);
    } catch (error) {
      const failedCoverUrl = submitData.cover;
      if (pendingCoverFile && failedCoverUrl && failedCoverUrl !== project?.cover) {
        await purgeUrl(failedCoverUrl);
      }
      console.error('Submit failed', error);
      showError('Gagal menyimpan project. Silakan coba lagi.');
    } finally {
      setIsUploading(false);
      setSubmitUploadProgress(null);
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
          uploadProgress={submitUploadProgress}
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
          <div className="animate-in fade-in zoom-in-95 space-y-8 px-2 duration-300">
            {/* Section 1: Project Type */}
            <section>
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Tipe Studi Kasus</h3>
                <p className="mt-0.5 text-xs text-gray-500">Pilih pendekatan yang sesuai</p>
              </div>
              <div className="flex flex-col gap-2">
                {PROJECT_TYPE_OPTIONS.map((typeOption) => (
                  <label
                    key={typeOption.value}
                    className="group flex cursor-pointer items-center gap-3 py-1.5"
                  >
                    <input
                      type="radio"
                      name="type"
                      className="hidden"
                      checked={formData.type === typeOption.value}
                      onChange={() => updateField('type', typeOption.value)}
                    />
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                        formData.type === typeOption.value
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-300 group-hover:border-gray-400'
                      }`}
                    >
                      {formData.type === typeOption.value && (
                        <svg
                          className="h-3 w-3 text-green-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`text-sm ${formData.type === typeOption.value ? 'font-medium text-green-600' : 'text-gray-500 group-hover:text-gray-700'}`}
                    >
                      {typeOption.label}
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
                <p className="mt-0.5 text-xs text-gray-500">Menentukan input selanjutnya</p>
              </div>
              <div className="flex flex-col gap-2">
                {MEDIA_FORMAT_OPTIONS.map((fmt) => (
                  <label
                    key={fmt.id}
                    className="group flex cursor-pointer items-center gap-3 py-1.5"
                  >
                    <input
                      type="radio"
                      name="mediaFormat"
                      className="hidden"
                      checked={mediaFormat === fmt.id}
                      onChange={() => setMediaFormat(fmt.id)}
                    />
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                        mediaFormat === fmt.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-300 group-hover:border-gray-400'
                      }`}
                    >
                      {mediaFormat === fmt.id && (
                        <svg
                          className="h-3 w-3 text-green-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`text-sm ${mediaFormat === fmt.id ? 'font-medium text-green-600' : 'text-gray-500 group-hover:text-gray-700'}`}
                    >
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
          <div className="animate-in fade-in slide-in-from-right-4 space-y-4 duration-300">
            {/* Cover Image Card */}
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h3 className="mb-4 text-sm font-semibold text-gray-900">Cover Image</h3>
              <ProjectMediaUpload
                formData={formData}
                errors={errors}
                isDetectingDimensions={isDetectingDimensions}
                updateField={updateField}
                slug={formData.slug}
                onFileChange={setPendingCoverFile}
                mediaFormat={mediaFormat}
                onNewUpload={trackNewUpload}
                csrfToken={csrfToken}
              />
            </div>

            {/* Gallery Manager - Only for gallery format */}
            {mediaFormat === 'gallery' && (
              <div className="rounded-lg border border-gray-200 bg-white p-5">
                <h3 className="mb-4 text-sm font-semibold text-gray-900">Gallery Items</h3>
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
          <div className="animate-in fade-in slide-in-from-right-4 space-y-6 duration-300">
            <ProjectAIHelper
              cover={formData.cover}
              pendingFile={pendingCoverFile}
              slug={formData.slug || ''}
              projectId={project?.id}
              onGenerate={(data: AIResponse) => {
                const updates: Array<[AIUpdatableField, ProjectFormData[AIUpdatableField]]> = [
                  ['title', data.title],
                  ['description', data.description],
                  ['client', data.client],
                  ['role', data.role],
                  ['team', data.team],
                  ['timeline', data.timeline],
                  ['software', data.software || []],
                  ['narrative', data.narrative as ProjectFormData['narrative']],
                  ['tags', data.tags?.join(', ') || ''],
                  ['likes', data.likes ?? 0],
                  ['shares', data.shares ?? 0],
                  [
                    'allowComments',
                    data.isViralPackageRequested ? true : (formData.allowComments ?? true),
                  ],
                ];

                updates.forEach(([field, value]) => {
                  if (value !== undefined) updateField(field, value);
                });
                revealForm();
              }}
            />

            {isFormRevealed ? (
              <div className="animate-in slide-in-from-bottom-4 grid grid-cols-1 gap-6 duration-500 md:grid-cols-2">
                <ProjectBasicInfo
                  formData={formData}
                  errors={errors}
                  updateField={updateField}
                  allProjects={allProjects}
                  labels={labels}
                />

                <ProjectNarrative formData={formData} updateField={updateField} />
              </div>
            ) : (
              <div className="flex h-40 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/30">
                <p className="text-sm font-medium italic text-gray-400">
                  Klik tombol &quot;Generate&quot; di atas untuk mengisi detail otomatis
                </p>
              </div>
            )}
          </div>
        )}
      </form>
    </AdminModal>
  );
}
