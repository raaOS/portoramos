import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useProjectForm, type ProjectFormData } from '@/hooks/useProjectForm';
import type { CreateProjectData, Project, UpdateProjectData } from '@/types/projects';
import type { Label } from '@/types/labels';
import type { Comment } from '@/lib/magic';
import { useStorageUpload } from '@/app/admin/components/file-upload/hooks/useStorageUpload';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useToast } from '@/contexts/ToastContext';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import { extractStoragePath } from '@/lib/media';
import ProjectEditorPanel from './components/ProjectEditorPanel';
import ProjectMediaStage from './components/ProjectMediaStage';
import ProjectStepActions from './components/ProjectStepActions';
import ProjectWindowModal from './components/ProjectWindowModal';
import { useProjectPurge } from './hooks/useProjectPurge';
import { useProjectWizard } from './hooks/useProjectWizard';
import type { AIResponse } from './ProjectAIHelper';
import {
  countFilledProjectContentFields,
  createPreviewSlug,
  type AIUpdatableField,
} from './projectFormUtils';
import type { ProjectCreationMode, ProjectFormTabId } from './types';

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
    setFieldError,
  } = useProjectForm(project);

  const { csrfToken } = useAdminAuth();
  const { upload } = useStorageUpload({ folder: 'projects', csrfToken: csrfToken || '' });
  const { showError } = useToast();
  const { confirm } = useConfirm();

  const [activeTab, setActiveTab] = useState<ProjectFormTabId>('ringkasan');
  const [showViralStats, setShowViralStats] = useState(
    (formData.likes ?? 0) > 0 || (formData.shares ?? 0) > 0 || !!project?.id
  );
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isProjectLiked, setIsProjectLiked] = useState(false);
  const [creationMode, setCreationMode] = useState<ProjectCreationMode>(
    project?.id ? 'manual' : 'undecided'
  );
  const [hasGeneratedContent, setHasGeneratedContent] = useState(project?.id ? true : false);
  const [isAIHelperExpanded, setIsAIHelperExpanded] = useState(true);
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState(false);
  const [submitUploadProgress, setSubmitUploadProgress] = useState<number | null>(null);

  const { mediaFormat, setMediaFormat } = useProjectWizard(project);
  const { trackNewUpload, executeCleanup, handleCancelCleanup, purgeUrl } = useProjectPurge(
    project,
    csrfToken
  );

  const coverBlobUrlRef = useRef<string | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const originalCommentsRef = useRef<Comment[] | null>(null);
  const originalMetricsRef = useRef<{ likes: number; shares: number } | null>(null);
  const hasGeneratedViralRef = useRef<boolean>(false);
  const generatedCommentsRef = useRef<Comment[] | null>(null);

  const revokeCoverBlobUrl = useCallback((url = coverBlobUrlRef.current) => {
    if (url?.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
    if (url === coverBlobUrlRef.current) {
      coverBlobUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => revokeCoverBlobUrl();
  }, [revokeCoverBlobUrl]);

  useEffect(() => {
    const textarea = descriptionRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [formData.description]);

  useEffect(() => {
    if (project && originalMetricsRef.current === null) {
      originalMetricsRef.current = {
        likes: project.likes || 0,
        shares: project.shares || 0,
      };
    }
  }, [project]);

  useEffect(() => {
    if (project?.slug) {
      fetch(`/api/comments?slug=${project.slug}`)
        .then((res) => res.json())
        .then((data) => {
          const loadedComments = data?.data?.comments ?? data?.comments;
          if (Array.isArray(loadedComments)) {
            setComments(loadedComments);
            if (originalCommentsRef.current === null) {
              originalCommentsRef.current = loadedComments;
            }
          }
        })
        .catch((err) => console.error('Failed to load comments', err));
    }
  }, [project?.slug]);

  const metrics = useMemo(() => {
    return {
      likes: Number(formData.likes) || 0,
      shares: Number(formData.shares) || 0,
    };
  }, [formData.likes, formData.shares]);

  const totalCommentCount = useMemo(
    () => comments.reduce((acc, comment) => acc + 1 + (comment.replies?.length || 0), 0),
    [comments]
  );
  const filledContentFieldCount = countFilledProjectContentFields(formData);
  const activeProjectSlug = formData.slug || project?.slug || createPreviewSlug(formData.title);

  const deleteMedia = useCallback(
    async (path: string) => {
      try {
        const res = await fetch(`/api/admin/upload?path=${encodeURIComponent(path)}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'x-csrf-token': csrfToken || '',
          },
        });
        return res.ok;
      } catch (e) {
        console.error('Delete failed', e);
        return false;
      }
    },
    [csrfToken]
  );

  const handleDeleteMedia = async (field: 'cover' | 'before' | 'after') => {
    let url = '';
    if (field === 'cover') url = formData.cover;
    else if (field === 'before') url = formData.comparison?.beforeImage || '';
    else if (field === 'after') url = formData.comparison?.afterImage || '';

    if (!url) return;

    const isBlob = url.startsWith('blob:');

    if (!isBlob) {
      const storagePath = extractStoragePath(url);
      if (storagePath) {
        const confirmDelete = await confirm({
          title: 'Hapus file ini?',
          message: 'File akan dihapus permanen dari Storage. Aksi ini tidak bisa di-undo.',
          confirmText: 'Hapus',
          cancelText: 'Batal',
          tone: 'danger',
        });
        if (confirmDelete) {
          const success = await deleteMedia(storagePath);
          if (!success) {
            showError('Gagal menghapus file dari Storage. Silakan coba lagi.');
            return;
          }
        } else {
          return;
        }
      } else {
        const ok = await confirm({
          title: 'Hapus link media ini?',
          message: 'Hanya menghapus referensi media dari form, tanpa menyentuh Storage.',
          confirmText: 'Hapus link',
          cancelText: 'Batal',
        });
        if (!ok) return;
      }
    }

    if (field === 'cover') {
      updateField('cover', '');
      setPendingCoverFile(null);
      revokeCoverBlobUrl();
    } else {
      updateField('comparison', {
        ...formData.comparison,
        [field === 'before' ? 'beforeImage' : 'afterImage']: '',
      });
    }
  };

  const handleCoverFileSelect = (file: File) => {
    setPendingCoverFile(file);
  };

  const handleCoverUrlChange = (value: string) => {
    revokeCoverBlobUrl();
    setPendingCoverFile(null);
    updateField('cover', value);
  };

  const handleCoverDeferredUpload = (urls: string[]) => {
    const nextUrl = urls[0];
    if (!nextUrl?.startsWith('blob:')) return;

    revokeCoverBlobUrl();
    coverBlobUrlRef.current = nextUrl;
    updateField('cover', nextUrl);
  };

  const handleContentGenerated = useCallback(
    (data: AIResponse, options?: { revealEditor?: boolean }) => {
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

      if (options?.revealEditor) {
        setHasGeneratedContent(true);
        setIsAIHelperExpanded(false);
      }
    },
    [updateField]
  );

  const handleViralGenerated = useCallback(
    (
      likes: number,
      shares: number,
      commentsCount: number,
      generatedComments?: Comment[],
      options?: { revealEditor?: boolean }
    ) => {
      updateField('likes', likes);
      updateField('shares', shares);
      updateField('initialCommentCount', project?.id ? 0 : commentsCount);
      updateField('allowComments', true);
      setShowViralStats(true);

      if (generatedComments) {
        setComments(generatedComments);
        generatedCommentsRef.current = generatedComments;
        updateField('comments', generatedComments);
      }

      hasGeneratedViralRef.current = true;

      if (options?.revealEditor) {
        setHasGeneratedContent(true);
        setIsAIHelperExpanded(false);
      }
    },
    [project?.id, updateField]
  );

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const submitData = getSubmitData();
    if (!submitData) return;

    try {
      setIsUploading(true);

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

      if (hasGeneratedViralRef.current) {
        submitData.comments = generatedCommentsRef.current ?? comments;
      }

      await onSubmit(submitData);

      hasGeneratedViralRef.current = false;
      setIsSavedSuccessfully(true);

      await new Promise((resolve) => setTimeout(resolve, 1200));

      await executeCleanup(submitData);
      setPendingCoverFile(null);

      onCancel();
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
    if (canCancel) {
      onCancel();
    }
  };

  return (
    <ProjectWindowModal
      onClose={handleFormCancel}
      title={title}
      actions={
        <ProjectStepActions
          isUploading={isUploading}
          isSuccess={isSavedSuccessfully}
          project={project}
          uploadProgress={submitUploadProgress}
          onCancel={handleFormCancel}
          onSubmit={() => handleSubmit()}
        />
      }
    >
      <form onSubmit={handleSubmit} className="project-form-container flex min-h-0 flex-col">
        <div className="grid min-h-[550px] grid-cols-1 gap-8 lg:grid-cols-12">
          <ProjectMediaStage
            formData={formData}
            errors={errors}
            isDetectingDimensions={isDetectingDimensions}
            mediaFormat={mediaFormat}
            setMediaFormat={setMediaFormat}
            isCommentsOpen={isCommentsOpen}
            setIsCommentsOpen={setIsCommentsOpen}
            comments={comments}
            setComments={setComments}
            totalCommentCount={totalCommentCount}
            isProjectLiked={isProjectLiked}
            setIsProjectLiked={setIsProjectLiked}
            activeProjectSlug={activeProjectSlug}
            pendingCoverFile={pendingCoverFile}
            metrics={metrics}
            updateField={updateField}
            onDeleteMedia={handleDeleteMedia}
            onCoverFileSelect={handleCoverFileSelect}
            onCoverDeferredUpload={handleCoverDeferredUpload}
            onCoverUrlChange={handleCoverUrlChange}
            onNewUpload={trackNewUpload}
          />

          <ProjectEditorPanel
            project={project}
            allProjects={allProjects}
            labels={labels}
            formData={formData}
            errors={errors}
            pendingCoverFile={pendingCoverFile}
            activeProjectSlug={activeProjectSlug}
            filledContentFieldCount={filledContentFieldCount}
            totalCommentCount={totalCommentCount}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            creationMode={creationMode}
            setCreationMode={setCreationMode}
            hasGeneratedContent={hasGeneratedContent}
            setHasGeneratedContent={setHasGeneratedContent}
            isAIHelperExpanded={isAIHelperExpanded}
            setIsAIHelperExpanded={setIsAIHelperExpanded}
            showViralStats={showViralStats}
            setShowViralStats={setShowViralStats}
            descriptionRef={descriptionRef}
            updateField={updateField}
            setFieldError={setFieldError}
            onContentGenerated={handleContentGenerated}
            onViralGenerated={handleViralGenerated}
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
      </form>
    </ProjectWindowModal>
  );
}
