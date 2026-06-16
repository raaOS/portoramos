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

const TABS = [
  { id: 'content', label: '1. Unggah Konten' },
  { id: 'detail', label: '2. Detail & Cerita' },
  { id: 'viral', label: '3. Atribut & Viral' },
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

  // Tab state: 'content' (Media setup), 'detail' (Content & Story AI), 'viral' (Stats & Comments AI)
  const [activeTab, setActiveTab] = useState<'content' | 'detail' | 'viral'>('content');
  // Telemetry stats visibility state - hidden by default unless stats exist or AI runs
  const [showViralStats, setShowViralStats] = useState((formData.likes ?? 0) > 0 || (formData.shares ?? 0) > 0 || !!project?.id);

  // Extracted Hooks
  const {
    mediaFormat,
    setMediaFormat,
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
          isUploading={isUploading}
          project={project}
          uploadProgress={submitUploadProgress}
          onCancel={handleFormCancel}
          onSubmit={() => handleSubmit()}
        />
      }
    >
      <form onSubmit={handleSubmit} className="min-h-0 flex flex-col">
        {/* Modern Tab Switcher */}
        <div className="flex border-b border-slate-100 mb-5 gap-6">
          {TABS.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${isActive
                    ? 'border-slate-800 text-slate-800'
                    : 'border-transparent text-slate-400 hover:text-slate-650'
                  }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab Panel Content */}
        <div className="min-h-0 flex-1">
          {/* TAB 1: UNGGAH KONTEN (Tipe, Format, Cover, Gallery) */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              {/* Setup & Format Selectors */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                {/* Case Study Type */}
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400">Tipe</span>
                  <div className="flex rounded-full border border-slate-200/60 bg-slate-50/50 p-0.5">
                    {PROJECT_TYPE_OPTIONS.map((opt) => {
                      const isSelected = formData.type === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => updateField('type', opt.value)}
                          className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${isSelected
                              ? 'bg-slate-900 text-white shadow-sm'
                              : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Media Format */}
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400">Format</span>
                  <div className="flex rounded-full border border-slate-200/60 bg-slate-50/50 p-0.5">
                    {MEDIA_FORMAT_OPTIONS.map((opt) => {
                      const isSelected = mediaFormat === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setMediaFormat(opt.id)}
                          className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${isSelected
                              ? 'bg-slate-900 text-white shadow-sm'
                              : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Media Cover */}
              <div className="space-y-3">
                <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Media Cover</h3>
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

              {/* Gallery Manager */}
              {mediaFormat === 'gallery' && (
                <div className="space-y-3 border-t border-slate-100 pt-5">
                  <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Gallery Items</h3>
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

          {/* TAB 2: DETAIL & CERITA AI (AI Konten + inputs Judul, Deskripsi, Cerita, Metadata) */}
          {activeTab === 'detail' && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Left Column: AI Assistant for Content (col-span-2) */}
              <div className="lg:col-span-2">
                <ProjectAIHelper
                  cover={formData.cover}
                  pendingFile={pendingCoverFile}
                  slug={formData.slug || ''}
                  projectId={project?.id}
                  mode="content"
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
                    ];

                    updates.forEach(([field, value]) => {
                      if (value !== undefined) updateField(field, value);
                    });
                  }}
                  onGenerateViral={() => { }}
                />
              </div>

              {/* Right Column: Input fields for Title, Description, Narrative, and Basic Metadata (col-span-3) */}
              <div className="lg:col-span-3 lg:border-l lg:border-slate-100 lg:pl-8 space-y-6">
                {/* Title input */}
                <div className="space-y-2">
                  <div>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => updateField('title', e.target.value)}
                      className="w-full text-2xl font-extrabold text-slate-800 placeholder-slate-200 focus:outline-none bg-transparent focus:ring-0 p-0 border-none tracking-tight"
                      placeholder="Judul Proyek..."
                    />
                    {errors.title && <p className="mt-1 text-[10px] text-red-500 font-medium">{errors.title}</p>}
                  </div>
                </div>

                {/* Narrative Sections */}
                <div className="border-t border-slate-100 pt-5">
                  <ProjectNarrative formData={formData} updateField={updateField} errors={errors} />
                </div>

                {/* Basic Info Metadata Inspector */}
                <div className="border-t border-slate-100 pt-5">
                  <ProjectBasicInfo
                    formData={formData}
                    errors={errors}
                    updateField={updateField}
                    allProjects={allProjects}
                    labels={labels}
                    mode="metadata"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ATRIBUT & VIRAL AI (AI Viral + Telemetry inputs) */}
          {activeTab === 'viral' && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Left Column: AI Assistant for Viral Stats (col-span-2) */}
              <div className="lg:col-span-2">
                <ProjectAIHelper
                  cover={formData.cover}
                  pendingFile={pendingCoverFile}
                  slug={formData.slug || ''}
                  projectId={project?.id}
                  mode="viral"
                  onGenerate={() => { }}
                  onGenerateViral={(likes, shares, commentsCount) => {
                    updateField('likes', likes);
                    updateField('shares', shares);
                    updateField('initialCommentCount', commentsCount);
                    updateField('allowComments', true);
                    setShowViralStats(true); // Dynamically reveal input fields!
                  }}
                />
              </div>

              {/* Right Column: Telemetry metrics input fields (col-span-3) */}
              <div className="lg:col-span-3 lg:border-l lg:border-slate-100 lg:pl-8">
                <ProjectBasicInfo
                  formData={formData}
                  errors={errors}
                  updateField={updateField}
                  allProjects={allProjects}
                  labels={labels}
                  mode="telemetry"
                  showViralStats={showViralStats}
                />
              </div>
            </div>
          )}
        </div>
      </form>
    </AdminModal>
  );
}
