/**
 * ProjectForm Component
 * Refactored into sub-components for better maintainability.
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useProjectForm, type ProjectFormData } from '@/hooks/useProjectForm';
import { Project, CreateProjectData, UpdateProjectData, GalleryItem } from '@/types/projects';
import { useStorageUpload } from '@/app/admin/components/file-upload/hooks/useStorageUpload';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Label } from '@/types/labels';
import { useToast } from '@/contexts/ToastContext';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import { extractStoragePath, isVideoLink } from '@/lib/media';
import AdminFileUpload from '@/app/admin/components/AdminFileUpload';

import {
  ArrowLeft,
  BookOpen,
  Info,
  MessageSquare,
  Image as ImageIcon,
  Loader2,
  Trash2,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { Comment } from '@/lib/magic';
import Media from '@/components/shared/Media';
import { Compare } from '@/components/ui/compare';

// Custom components from project-detail
import {
  ProjectInteractionBar,
  ProjectComments,
} from '@/components/projects/project-detail/components';

// Custom Hooks
import { useProjectPurge } from './hooks/useProjectPurge';
import { useProjectWizard } from './hooks/useProjectWizard';

// Sub-components
import ProjectBasicInfo from './ProjectBasicInfo';
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
] as const;

const TABS = [
  { id: 'ringkasan', label: 'Ringkasan', Icon: Info },
  { id: 'proses', label: 'Proses', Icon: BookOpen },
  { id: 'galeri', label: 'Galeri', Icon: ImageIcon },
] as const;

function countFilledProjectContentFields(formData: ProjectFormData) {
  const textFields = [
    formData.title,
    formData.description,
    formData.client,
    formData.role,
    formData.team,
    formData.timeline,
    formData.tags,
    ...Object.values(formData.narrative || {}),
  ];

  const filledTextCount = textFields.filter(
    (value) => typeof value === 'string' && value.trim().length > 0
  ).length;
  const hasCustomSoftware = (formData.software || []).some((tool) => {
    const normalizedTool = tool.trim().toLowerCase();
    return normalizedTool.length > 0 && normalizedTool !== 'photoshop';
  });

  return filledTextCount + (hasCustomSoftware ? 1 : 0);
}

function createPreviewSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

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

interface ProjectWindowModalProps {
  title: string;
  onClose: () => void | Promise<void>;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
}

interface MediaStageUrlInputProps {
  value: string;
  placeholder: string;
  label: string;
  onValueChange: (value: string) => void;
}

function MediaStageUrlInput({ value, placeholder, label, onValueChange }: MediaStageUrlInputProps) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="font-mono text-[8px] font-bold uppercase tracking-[0.22em] text-slate-600 dark:text-slate-400">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className="h-8 min-w-0 rounded-md border border-slate-200 bg-white/90 px-2.5 text-[11px] text-slate-800 outline-none backdrop-blur-md transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-0 dark:border-slate-800 dark:bg-slate-950/90 dark:text-slate-100 dark:placeholder:text-slate-600 dark:focus:border-slate-700"
        placeholder={placeholder}
      />
    </label>
  );
}

function ProjectWindowModal({ title, onClose, actions, children }: ProjectWindowModalProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef<DragState | null>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        void onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleTitlebarPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) return;

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
    };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleTitlebarPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    const maxX = window.innerWidth * 0.42;
    const maxY = window.innerHeight * 0.42;
    const nextX = dragState.originX + event.clientX - dragState.startX;
    const nextY = dragState.originY + event.clientY - dragState.startY;

    setPosition({
      x: Math.max(-maxX, Math.min(maxX, nextX)),
      y: Math.max(-maxY, Math.min(maxY, nextY)),
    });
  };

  const handleTitlebarPointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    dragStateRef.current = null;
    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center overflow-hidden bg-slate-950/45 p-0 backdrop-blur-[2px] md:p-6">
      <div className="absolute inset-0" onClick={() => void onClose()} />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-window-title"
        className="relative z-10 flex h-[100dvh] w-full flex-col overflow-hidden rounded-none border border-white/70 bg-white text-left shadow-2xl transition-shadow md:h-[min(860px,calc(100dvh-3rem))] md:max-w-[1268px] md:rounded-[18px]"
        style={{ transform: `translate3d(${position.x}px, ${position.y}px, 0)` }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className={`flex h-14 flex-shrink-0 touch-none select-none items-center justify-between gap-4 bg-white px-4 md:h-[58px] md:px-6 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onPointerDown={handleTitlebarPointerDown}
          onPointerMove={handleTitlebarPointerMove}
          onPointerUp={handleTitlebarPointerEnd}
          onPointerCancel={handleTitlebarPointerEnd}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden items-center gap-1.5 md:flex" aria-hidden="true">
              <span className="h-3 w-3 rounded-full bg-red-400" />
              <span className="h-3 w-3 rounded-full bg-amber-300" />
              <span className="h-3 w-3 rounded-full bg-emerald-400" />
            </div>
            <h3
              id="project-window-title"
              className="min-w-0 truncate text-base font-bold tracking-tight text-slate-900"
            >
              {title}
            </h3>
          </div>

          <button
            type="button"
            onClick={() => void onClose()}
            onPointerDown={(event) => event.stopPropagation()}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
            aria-label="Tutup form proyek"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white px-4 py-4 md:px-6 md:py-5"
          data-lenis-prevent
        >
          {children}
        </div>

        {actions && (
          <div className="flex-shrink-0 border-t border-slate-200 bg-slate-50/95 px-4 py-4 md:px-6">
            {actions}
          </div>
        )}
      </section>
    </div>,
    document.body
  );
}

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

  // Tab state
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'proses' | 'galeri'>('ringkasan');
  // Telemetry stats visibility state - hidden by default unless stats exist or AI runs
  const [showViralStats, setShowViralStats] = useState(
    (formData.likes ?? 0) > 0 || (formData.shares ?? 0) > 0 || !!project?.id
  );

  // Local state for reviews/comments & like status in uploader preview
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isProjectLiked, setIsProjectLiked] = useState(false);

  // Flow control states for Column 2 (Manual vs Auto flow)
  const [creationMode, setCreationMode] = useState<'undecided' | 'manual' | 'auto'>(
    project?.id ? 'manual' : 'undecided'
  );
  const [hasGeneratedContent, setHasGeneratedContent] = useState(project?.id ? true : false);
  const [isAIHelperExpanded, setIsAIHelperExpanded] = useState(true);

  // Extracted Hooks
  const { mediaFormat, setMediaFormat } = useProjectWizard(project);

  const { trackNewUpload, executeCleanup, handleCancelCleanup, purgeUrl } = useProjectPurge(
    project,
    csrfToken
  );

  // Local state for deferred upload
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState(false);
  const [submitUploadProgress, setSubmitUploadProgress] = useState<number | null>(null);
  const coverBlobUrlRef = useRef<string | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

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

  // Refs to track original comments and metrics for potential rollback on cancel
  const originalCommentsRef = useRef<Comment[] | null>(null);
  const originalMetricsRef = useRef<{ likes: number; shares: number } | null>(null);
  const hasGeneratedViralRef = useRef<boolean>(false);
  const generatedCommentsRef = useRef<Comment[] | null>(null);

  useEffect(() => {
    if (project && originalMetricsRef.current === null) {
      originalMetricsRef.current = {
        likes: project.likes || 0,
        shares: project.shares || 0,
      };
    }
  }, [project]);

  // Fetch comments if editing an existing project
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

  // Mock objects for Preview (WYSIWYG)
  const coverKind = useMemo<GalleryItem['kind']>(() => {
    if (pendingCoverFile && formData.cover.startsWith('blob:')) {
      return pendingCoverFile.type.startsWith('video/') ? 'video' : 'image';
    }

    return isVideoLink(formData.cover) ? 'video' : 'image';
  }, [formData.cover, pendingCoverFile]);

  const beforeSrc = formData.comparison?.beforeImage || '';
  const beforeKind: GalleryItem['kind'] =
    formData.comparison?.beforeType || (isVideoLink(beforeSrc) ? 'video' : 'image');
  const afterOverrideSrc = formData.comparison?.afterImage || '';
  const afterSrc = afterOverrideSrc || formData.cover;
  const afterKind: GalleryItem['kind'] = afterOverrideSrc
    ? formData.comparison?.afterType || (isVideoLink(afterOverrideSrc) ? 'video' : 'image')
    : coverKind;
  const hasCover = Boolean(formData.cover);
  const comparisonReady = Boolean(beforeSrc && afterSrc);

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

  const galleryItemCount = useMemo(() => {
    const singleItems = formData.galleryItems.filter((item) => item.isActive !== false).length;
    const groupedItems = formData.galleryGroups.reduce(
      (total, group) => total + group.items.filter((item) => item.isActive !== false).length,
      0
    );

    return singleItems + groupedItems;
  }, [formData.galleryGroups, formData.galleryItems]);

  const activeTabIndex = Math.max(
    0,
    TABS.findIndex((tab) => tab.id === activeTab)
  );

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

  const handleBeforeUrlChange = (value: string) => {
    updateField('comparison', {
      ...formData.comparison,
      beforeImage: value,
      beforeType: isVideoLink(value) ? 'video' : 'image',
    });
  };

  const renderMediaPreview = (src: string, kind: GalleryItem['kind'], alt: string) => {
    if (!src) return null;

    if (kind === 'video') {
      return (
        <Media
          kind="video"
          src={src}
          alt={alt}
          width={900}
          height={1125}
          className="h-full w-full"
          autoplay={true}
          muted={true}
          loop={true}
          playsInline={true}
          controls={false}
          objectFit="cover"
        />
      );
    }

    if (src.startsWith('blob:')) {
      return <img src={src} alt={alt} className="h-full w-full object-cover" draggable={false} />;
    }

    return (
      <Media
        kind="image"
        src={src}
        alt={alt}
        width={900}
        height={1125}
        priority={true}
        className="h-full w-full"
        objectFit="cover"
      />
    );
  };

  const getTabErrors = (tabId: 'ringkasan' | 'proses' | 'galeri') => {
    if (!errors || Object.keys(errors).length === 0) return false;

    if (tabId === 'ringkasan') {
      return !!(
        errors.title ||
        errors.slug ||
        errors.description ||
        errors.client ||
        errors.role ||
        errors.team ||
        errors.timeline ||
        errors.software ||
        errors.likes ||
        errors.shares ||
        errors.cover
      );
    }
    if (tabId === 'proses') {
      return !!(
        errors['narrative.about'] ||
        errors['narrative.challenge'] ||
        errors['narrative.solution'] ||
        errors['narrative.impact'] ||
        Object.keys(errors).some((k) => k.startsWith('narrative.'))
      );
    }
    if (tabId === 'galeri') {
      return !!(errors.gallery || Object.keys(errors).some((k) => k.startsWith('gallery')));
    }
    return false;
  };

  const renderCoverUploadButton = (label: string, compact = false) => (
    <div
      className={`flex flex-col items-center gap-2 ${compact ? 'cover-overlay-upload' : 'scale-110'}`}
    >
      <AdminFileUpload
        variant="button"
        onUpload={handleCoverDeferredUpload}
        onFileSelect={handleCoverFileSelect}
        autoUpload={false}
        multiple={false}
        accept="image/*,video/*"
        maxSize={500}
        enableCrop={true}
        enableVideoTrim={true}
      />
      {!compact && (
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-300">
          {label}
        </span>
      )}
    </div>
  );

  const renderBeforeUploadButton = (label: string, compact = false) => (
    <div
      className={`flex flex-col items-center gap-2 ${compact ? 'cover-overlay-upload' : 'scale-110'}`}
    >
      <AdminFileUpload
        variant="button"
        onUpload={(urls) => {
          if (urls.length > 0) {
            updateField('comparison', {
              ...formData.comparison,
              beforeImage: urls[0],
              beforeType: isVideoLink(urls[0]) ? 'video' : 'image',
            });
            trackNewUpload(urls[0]);
          }
        }}
        autoUpload={true}
        multiple={false}
        accept="image/*,video/*"
        maxSize={500}
        folder="comparisons"
        customFilename={formData.slug ? `${formData.slug}-before` : undefined}
      />
      {!compact && (
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-300">
          {label}
        </span>
      )}
    </div>
  );

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

      if (hasGeneratedViralRef.current) {
        submitData.comments = generatedCommentsRef.current ?? comments;
      }

      // Submit Data to DB First!
      await onSubmit(submitData);

      // Successfully saved, prevent rollback on close
      hasGeneratedViralRef.current = false;

      setIsSavedSuccessfully(true);

      // Wait for success checklist animation to play
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // [Garbage Collection Execution]
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

  const projectSetupControls = (
    <div className="dark:border-slate-850 scrollbar-none mb-4 flex w-full items-center gap-3 overflow-x-auto border-b border-slate-100 pb-4">
      {/* Case Study Type */}
      <div className="flex flex-shrink-0 items-center gap-2.5">
        <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400">
          Tipe
        </span>
        {PROJECT_TYPE_OPTIONS.map((opt) => {
          const isSelected = formData.type === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => updateField('type', opt.value)}
              className="group flex items-center gap-1.5 whitespace-nowrap text-[10px] font-bold uppercase tracking-wider text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
              aria-pressed={isSelected}
            >
              <span
                className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border transition-colors ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-500'
                    : 'border-slate-300 bg-white group-hover:border-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:group-hover:border-slate-400'
                }`}
                aria-hidden="true"
              >
                {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </span>
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>

      <span className="h-5 w-px flex-shrink-0 bg-slate-200 dark:bg-slate-800" aria-hidden="true" />

      {/* Media Format */}
      <div className="flex flex-shrink-0 items-center gap-2.5">
        <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400">
          Format
        </span>
        {MEDIA_FORMAT_OPTIONS.map((opt) => {
          const isSelected = mediaFormat === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setMediaFormat(opt.id)}
              className="group flex items-center gap-1.5 whitespace-nowrap text-[10px] font-bold uppercase tracking-wider text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
              aria-pressed={isSelected}
            >
              <span
                className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border transition-colors ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-500'
                    : 'border-slate-300 bg-white group-hover:border-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:group-hover:border-slate-400'
                }`}
                aria-hidden="true"
              >
                {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </span>
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

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
          {/* Left Column (Media & Interaction) */}
          <div className="group relative flex min-h-[350px] flex-col overflow-hidden rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/10 lg:col-span-6">
            {projectSetupControls}

            <div className="relative mx-auto w-full max-w-[460px] sm:flex sm:max-w-[520px] sm:flex-row sm:items-center sm:justify-start">
              <div className="flex w-full max-w-[440px] flex-shrink-0 flex-col">
                <div className={`relative aspect-[4/5] w-full overflow-hidden rounded-[22px] border-2 bg-slate-100 shadow-sm transition-all duration-300 dark:bg-slate-950 ${errors.cover ? 'animate-pulse border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'border-slate-200 dark:border-slate-800'}`}>
                  {mediaFormat === 'comparison' ? (
                    <>
                      {comparisonReady ? (
                        <Compare
                          firstImage={beforeSrc}
                          secondImage={afterSrc}
                          firstMediaType={beforeKind}
                          secondMediaType={afterKind}
                          className="h-full w-full rounded-[22px]"
                          firstImageClassName="rounded-[22px] object-cover object-center"
                          secondImageClassname="rounded-[22px] object-cover object-center"
                          slideMode="hover"
                          firstSlideLabel=""
                          secondSlideLabel=""
                        />
                      ) : (
                        <div className="grid h-full grid-cols-2">
                          <div className="relative h-full overflow-hidden border-r border-white/60 bg-slate-100 dark:border-slate-800 dark:bg-slate-950">
                            {beforeSrc ? (
                              renderMediaPreview(beforeSrc, beforeKind, 'Before media')
                            ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-500">
                                {renderBeforeUploadButton('Upload Before')}
                              </div>
                            )}
                          </div>
                          <div className="relative h-full overflow-hidden bg-slate-100 dark:bg-slate-950">
                            {afterSrc ? (
                              renderMediaPreview(afterSrc, afterKind, 'After media')
                            ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-500">
                                {renderCoverUploadButton('Upload Cover')}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {!isCommentsOpen && (
                        <div className="absolute left-3 top-3 z-40 flex items-center gap-1.5 drop-shadow-[0_1px_2.5px_rgba(0,0,0,0.85)]">
                          <span className="px-1.5 font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-white/85">
                            Before
                          </span>
                          {beforeSrc && (
                            <>
                              <span className="h-3.5 w-px bg-white/35" aria-hidden="true" />
                              {renderBeforeUploadButton('', true)}
                              <span className="h-3.5 w-px bg-white/35" aria-hidden="true" />
                              <button
                                type="button"
                                onClick={() => handleDeleteMedia('before')}
                                className="flex h-6 w-6 items-center justify-center rounded-md text-white/75 transition-colors hover:text-red-400"
                                title="Hapus Before"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </>
                          )}
                        </div>
                      )}

                      {!isCommentsOpen && (
                        <div className="absolute right-3 top-3 z-40 flex items-center gap-1.5 drop-shadow-[0_1px_2.5px_rgba(0,0,0,0.85)]">
                          <span className="px-1.5 font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-white/85">
                            {afterOverrideSrc ? 'After Override' : 'Cover / After'}
                          </span>
                          {afterOverrideSrc ? (
                            <>
                              <span className="h-3.5 w-px bg-white/35" aria-hidden="true" />
                              <button
                                type="button"
                                onClick={() => handleDeleteMedia('after')}
                                className="flex h-6 w-6 items-center justify-center rounded-md text-white/75 transition-colors hover:text-red-400"
                                title="Pakai Cover Media"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </>
                          ) : (
                            <>
                              {hasCover && (
                                <>
                                  <span className="h-3.5 w-px bg-white/35" aria-hidden="true" />
                                  {renderCoverUploadButton('', true)}
                                  <span className="h-3.5 w-px bg-white/35" aria-hidden="true" />
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteMedia('cover')}
                                    className="flex h-6 w-6 items-center justify-center rounded-md text-white/75 transition-colors hover:text-red-400"
                                    title="Hapus Cover"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      )}

                      {!isCommentsOpen && (
                        <div className="absolute bottom-3 left-3 right-3 z-20 grid gap-2 md:grid-cols-2">
                          <MediaStageUrlInput
                            value={beforeSrc}
                            placeholder="Before media URL..."
                            onValueChange={handleBeforeUrlChange}
                            label="Before URL"
                          />
                          <MediaStageUrlInput
                            value={afterOverrideSrc || formData.cover}
                            placeholder={
                              afterOverrideSrc ? 'After override URL...' : 'Cover media URL...'
                            }
                            onValueChange={
                              afterOverrideSrc
                                ? (value) =>
                                    updateField('comparison', {
                                      ...formData.comparison,
                                      afterImage: value,
                                      afterType: isVideoLink(value) ? 'video' : 'image',
                                    })
                                : handleCoverUrlChange
                            }
                            label={afterOverrideSrc ? 'After URL' : 'Cover URL'}
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {hasCover ? (
                        renderMediaPreview(
                          formData.cover,
                          coverKind,
                          formData.title || 'Cover media'
                        )
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-slate-500">
                          {renderCoverUploadButton('Upload Cover')}
                        </div>
                      )}

                      {hasCover && !isCommentsOpen && (
                        <div className="absolute right-3 top-3 z-40 flex items-center gap-1.5 drop-shadow-[0_1px_2.5px_rgba(0,0,0,0.85)]">
                          {renderCoverUploadButton('', true)}
                          <span className="h-3.5 w-px bg-white/35" aria-hidden="true" />
                          <button
                            type="button"
                            onClick={() => handleDeleteMedia('cover')}
                            className="flex h-6 w-6 items-center justify-center rounded-md text-white/75 transition-colors hover:text-red-400"
                            title="Hapus Cover"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}

                      {!isCommentsOpen && (
                        <div className="absolute bottom-3 left-3 right-3 z-20">
                          <MediaStageUrlInput
                            value={formData.cover}
                            placeholder="Cover media URL..."
                            onValueChange={handleCoverUrlChange}
                            label="Cover URL"
                          />
                        </div>
                      )}
                    </>
                  )}

                  {mediaFormat === 'single' &&
                    (hasCover || isDetectingDimensions) &&
                    !isCommentsOpen && (
                      <div className="absolute left-3 top-3 z-20 flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-white drop-shadow-[0_1px_2.5px_rgba(0,0,0,0.85)]">
                        {isDetectingDimensions ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <span>{formData.coverWidth || '-'}w</span>
                            <span className="text-white/35">/</span>
                            <span>{formData.coverHeight || '-'}h</span>
                          </>
                        )}
                      </div>
                    )}
                </div>

                {errors.cover && (
                  <p className="mt-2 text-center text-[10px] font-medium text-red-500">
                    {errors.cover}
                  </p>
                )}
              </div>

              {formData.cover && !isCommentsOpen && (
                <div className="pointer-events-none absolute inset-y-0 right-2 z-30 flex items-center sm:relative sm:inset-y-auto sm:right-auto sm:flex sm:w-[80px] sm:flex-shrink-0 sm:justify-center">
                  <div className="pointer-events-auto">
                    <ProjectInteractionBar
                      isProjectLiked={isProjectLiked}
                      metrics={metrics}
                      comments={comments}
                      translations={null}
                      translateLoading={false}
                      likePending={false}
                      onLike={() => setIsProjectLiked(!isProjectLiked)}
                      onShare={() => {
                        updateField('shares', (formData.shares || 0) + 1);
                      }}
                      onTranslate={() => {}}
                      onScrollToComments={() => setIsCommentsOpen(true)}
                      orientation="vertical"
                      projectSlug={activeProjectSlug}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Comments Drawer Overlay */}
            <AnimatePresence>
              {isCommentsOpen && (
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                  className="absolute inset-0 z-30 flex flex-col rounded-xl bg-white/95 p-4 backdrop-blur-xl dark:bg-slate-950/95"
                >
                  <div className="dark:border-slate-850 flex flex-shrink-0 items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare size={14} className="text-indigo-500" />
                      <span className="text-slate-750 text-xs font-semibold dark:text-slate-200">
                        Ulasan ({totalCommentCount})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCommentsOpen(false)}
                      className="text-slate-450 dark:hover:bg-slate-850 dark:hover:text-slate-250 flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-slate-100 hover:text-slate-700"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex-1 select-text overflow-y-auto pr-1 pt-2">
                    {activeProjectSlug ? (
                      <ProjectComments
                        slug={activeProjectSlug}
                        comments={comments}
                        setComments={setComments}
                        allowComments={formData.allowComments}
                        withDivider={false}
                        isVisible={true}
                        animated={false}
                        isAdmin={true}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
                        <p className="font-mono text-[10px] leading-relaxed">
                          Isi Judul Proyek terlebih dahulu untuk menguji modul komentar.
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column (Form Input & Tabs) */}
          <div className="mx-auto flex w-full max-w-[460px] flex-col space-y-6 sm:max-w-[520px] lg:col-span-6">
            {/* Lapisan Pertama: undecided / Pilihan Metode */}
            {creationMode === 'undecided' ? (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col space-y-5 rounded-2xl border border-slate-200/80 bg-white/50 p-6 shadow-lg backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/50"
              >
                <div className="space-y-2 text-center">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Pilih Metode Pengisian Proyek
                  </h3>
                  <p className="mx-auto max-w-sm text-[11px] leading-relaxed text-slate-400">
                    Pilih apakah Anda ingin mengisi data detail proyek secara manual atau secara
                    otomatis menggunakan AI asisten.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {/* Pilihan 1: Manual */}
                  <button
                    type="button"
                    onClick={() => {
                      setCreationMode('manual');
                      setHasGeneratedContent(true); // Since they chose manual, we consider them ready
                    }}
                    className="group flex items-start gap-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-left transition-all hover:border-indigo-500 hover:bg-indigo-50/5 dark:border-slate-800 dark:bg-slate-900/10 dark:hover:border-indigo-500/50"
                  >
                    <div className="rounded-lg bg-slate-200/60 p-2.5 text-slate-600 transition-colors group-hover:bg-indigo-100 group-hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-indigo-950/40">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 dark:text-slate-200 dark:group-hover:text-indigo-400">
                        Isi Manual
                      </h4>
                      <p className="text-[10px] leading-relaxed text-slate-400">
                        Tulis deskripsi, cerita proses narasi, dan pilih galeri media secara manual
                        dari awal.
                      </p>
                    </div>
                  </button>

                  {/* Pilihan 2: Otomatis dengan AI */}
                  <button
                    type="button"
                    onClick={() => {
                      setCreationMode('auto');
                    }}
                    className="group flex items-start gap-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-left transition-all hover:border-indigo-500 hover:bg-indigo-50/5 dark:border-slate-800 dark:bg-slate-900/10 dark:hover:border-indigo-500/50"
                  >
                    <div className="rounded-lg bg-slate-200/60 p-2.5 text-slate-600 transition-colors group-hover:bg-indigo-100 group-hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-indigo-950/40">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 dark:text-slate-200 dark:group-hover:text-indigo-400">
                        Buat Otomatis (Gemini AI)
                      </h4>
                      <p className="text-[10px] leading-relaxed text-slate-400">
                        Gunakan kecerdasan buatan Gemini untuk menghasilkan draf detail proyek &
                        statistik viral berdasarkan cover media.
                      </p>
                    </div>
                  </button>
                </div>
              </motion.div>
            ) : (
              // Lapisan Kedua: manual / auto
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full space-y-6"
              >
                {/* Tombol Back untuk kembali ke pilihan mode */}
                <div className="mb-4 flex">
                  <button
                    type="button"
                    onClick={() => {
                      setCreationMode('undecided');
                      setHasGeneratedContent(false); // BUG FIX: Reset flag agar welcome screen AI tidak ter-skip
                    }}
                    className="group flex items-center gap-1.5 rounded-full bg-slate-100/50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 transition-all hover:bg-slate-200 hover:text-slate-800 dark:bg-slate-900/50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  >
                    <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                    Pilih Metode Lain
                  </button>
                </div>

                {/* Tampilan Konten AI Helpers jika Mode Auto dan belum ter-generate */}
                {creationMode === 'auto' && !hasGeneratedContent && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-indigo-100/30 bg-indigo-50/5 p-4 text-slate-600 dark:border-indigo-900/20 dark:bg-indigo-950/5">
                      <h4 className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400">
                        <Info className="h-4 w-4 text-indigo-500" />
                        Panduan Asisten AI
                      </h4>
                      <p className="mt-1 text-[10px] leading-relaxed text-slate-400 dark:text-slate-500">
                        Unggah file cover proyek terlebih dahulu di kolom sebelah kiri. Asisten
                        Gemini akan membaca media tersebut dan memformulasikan draf detail proyek
                        secara otomatis.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <ProjectAIHelper
                        cover={formData.cover}
                        pendingFile={pendingCoverFile}
                        slug={activeProjectSlug}
                        projectId={project?.id}
                        mode="content"
                        existingContentFieldCount={filledContentFieldCount}
                        onGenerate={(data: AIResponse) => {
                          const updates: Array<
                            [AIUpdatableField, ProjectFormData[AIUpdatableField]]
                          > = [
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

                          setHasGeneratedContent(true);
                          setIsAIHelperExpanded(false);
                        }}
                        onGenerateViral={() => {}}
                        onCoverMissing={() => setFieldError('cover', 'Wajib unggah Cover Media sebelum menggunakan AI Assistant!')}
                      />
                      <ProjectAIHelper
                        cover={formData.cover}
                        pendingFile={pendingCoverFile}
                        slug={activeProjectSlug}
                        projectId={project?.id}
                        mode="viral"
                        existingCommentCount={totalCommentCount}
                        projectTitle={formData.title}
                        projectDescription={formData.description}
                        onGenerate={() => {}}
                        onGenerateViral={(likes, shares, commentsCount, generatedComments) => {
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

                          setHasGeneratedContent(true);
                          setIsAIHelperExpanded(false);
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Form Editor Utama (Akan muncul jika manual, atau jika auto dan sudah ada/pernah generate content) */}
                {(creationMode === 'manual' || hasGeneratedContent) && (
                  <div className="space-y-6">
                    {/* Collapsible AI Helper di bagian atas untuk mode Auto */}
                    {creationMode === 'auto' && (
                      <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-indigo-50/5 shadow-sm transition-all dark:border-indigo-950/40">
                        <button
                          type="button"
                          onClick={() => setIsAIHelperExpanded(!isAIHelperExpanded)}
                          className="flex w-full items-center justify-between bg-indigo-50/20 px-4 py-3 text-left text-xs font-bold text-indigo-600 hover:bg-indigo-50/40 dark:bg-indigo-950/10 dark:text-indigo-400"
                        >
                          <span className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 animate-pulse text-indigo-500" />
                            <span className="font-mono text-[10px] uppercase tracking-wider">
                              Gemini AI Assistant
                            </span>
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[9px] text-slate-400 dark:text-slate-500">
                              {isAIHelperExpanded ? 'Sembunyikan' : 'Tampilkan Opsi'}
                            </span>
                            {isAIHelperExpanded ? (
                              <ChevronUp className="h-4 w-4 text-indigo-400" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-indigo-400" />
                            )}
                          </div>
                        </button>

                        <AnimatePresence initial={false}>
                          {isAIHelperExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="space-y-4 border-t border-indigo-50/60 bg-white p-4 dark:border-indigo-950/40 dark:bg-slate-950"
                            >
                              <div className="grid grid-cols-1 gap-4">
                                <ProjectAIHelper
                                  cover={formData.cover}
                                  pendingFile={pendingCoverFile}
                                  slug={activeProjectSlug}
                                  projectId={project?.id}
                                  mode="content"
                                  existingContentFieldCount={filledContentFieldCount}
                                  onGenerate={(data: AIResponse) => {
                                    const updates: Array<
                                      [AIUpdatableField, ProjectFormData[AIUpdatableField]]
                                    > = [
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
                                  onGenerateViral={() => {}}
                                  onCoverMissing={() => setFieldError('cover', 'Wajib unggah Cover Media sebelum menggunakan AI Assistant!')}
                                />
                                <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                                  <ProjectAIHelper
                                    cover={formData.cover}
                                    pendingFile={pendingCoverFile}
                                    slug={activeProjectSlug}
                                    projectId={project?.id}
                                    mode="viral"
                                    existingCommentCount={totalCommentCount}
                                    projectTitle={formData.title}
                                    projectDescription={formData.description}
                                    onGenerate={() => {}}
                                    onGenerateViral={(
                                      likes,
                                      shares,
                                      commentsCount,
                                      generatedComments
                                    ) => {
                                      updateField('likes', likes);
                                      updateField('shares', shares);
                                      updateField(
                                        'initialCommentCount',
                                        project?.id ? 0 : commentsCount
                                      );
                                      updateField('allowComments', true);
                                      setShowViralStats(true);

                                      if (generatedComments) {
                                        setComments(generatedComments);
                                        generatedCommentsRef.current = generatedComments;
                                        updateField('comments', generatedComments);
                                      }

                                      hasGeneratedViralRef.current = true;
                                    }}
                                  />
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Title input */}
                    <div className="space-y-1">
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => updateField('title', e.target.value)}
                        className="dark:placeholder-slate-650 w-full border-none bg-transparent p-0 text-2xl font-extrabold tracking-tight text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0 dark:text-slate-100"
                        placeholder="Judul Proyek..."
                      />
                      {errors.title && (
                        <p className="mt-1 text-[10px] font-medium text-red-500">{errors.title}</p>
                      )}
                    </div>

                    <div className="min-h-0 flex-1 overflow-hidden rounded-[22px] border-2 border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                      {/* Browser-style Tabs */}
                      <div className="relative rounded-t-[20px] bg-slate-50/90 px-4 pt-2 dark:bg-slate-900/40">
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-0.5 bg-slate-200 dark:bg-slate-800"
                        />
                        <div
                          data-tab-nav
                          className="relative z-10 mx-auto grid h-11 w-[min(100%,560px)] min-w-0 grid-cols-3 items-end"
                        >
                          <motion.div
                            aria-hidden="true"
                            className="pointer-events-none absolute bottom-0 left-0 z-[1] h-11 w-1/3"
                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                            animate={{
                              x: `${activeTabIndex * 100}%`,
                            }}
                          >
                            <svg
                              className="h-full w-full"
                              viewBox="0 0 180 44"
                              preserveAspectRatio="none"
                              overflow="visible"
                            >
                              <path
                                className="fill-white dark:fill-slate-950"
                                d="M0 47H180V43C166 43 160 39 160 27V18C160 8 152 3 140 3H40C28 3 20 8 20 18V27C20 39 14 43 0 43V47Z"
                              />
                              <path
                                className="fill-none stroke-slate-200 dark:stroke-slate-800"
                                d="M0 43C14 43 20 39 20 27V18C20 8 28 3 40 3H140C152 3 160 8 160 18V27C160 39 166 43 180 43"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                vectorEffect="non-scaling-stroke"
                              />
                            </svg>
                          </motion.div>
                          {TABS.map((t) => {
                            const isActive = activeTab === t.id;
                            const hasError = getTabErrors(t.id);
                            const Icon = t.Icon;
                            const showGalleryCount = t.id === 'galeri' && galleryItemCount > 0;

                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => setActiveTab(t.id)}
                                onMouseDown={(e) => e.preventDefault()}
                                className={`relative flex h-11 min-w-0 flex-1 cursor-pointer appearance-none items-center justify-center gap-2 border-0 bg-transparent px-3 text-xs font-extrabold tracking-normal transition-colors duration-200 ${
                                  isActive
                                    ? 'z-20 text-slate-900 dark:text-slate-100'
                                    : 'z-10 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                }}`}
                                aria-pressed={isActive}
                              >
                                <Icon
                                  className={`relative z-10 h-4 w-4 flex-shrink-0 ${
                                    isActive ? 'text-indigo-500' : 'text-slate-400'
                                  }`}
                                  strokeWidth={2.25}
                                />
                                <span className="relative z-10 truncate">{t.label}</span>
                                {showGalleryCount && (
                                  <span
                                    className={`relative z-10 flex h-5 min-w-5 flex-shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-black leading-none ${
                                      isActive
                                        ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-200 dark:text-indigo-700'
                                        : 'bg-white/80 text-slate-500 dark:bg-slate-800 dark:text-slate-300'
                                    }`}
                                  >
                                    {galleryItemCount}
                                  </span>
                                )}
                                {hasError && (
                                  <span className="absolute right-2 top-2 flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Tab Panel Content */}
                      <div className="min-h-0 flex-1 overflow-y-auto bg-white px-5 py-5 dark:bg-slate-950">
                        {/* TAB 1: RINGKASAN */}
                        {activeTab === 'ringkasan' && (
                          <div className="space-y-6">
                            {/* Deskripsi */}
                            <div className="space-y-1">
                              <label className="block font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                Deskripsi Singkat
                              </label>
                              <textarea
                                ref={descriptionRef}
                                value={formData.description || ''}
                                onChange={(e) => updateField('description', e.target.value)}
                                className="dark:placeholder-slate-650 min-h-[95px] w-full resize-none overflow-hidden rounded-md border border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed text-slate-800 placeholder-slate-400 transition-all hover:border-slate-300 focus:border-slate-800 focus:outline-none focus:ring-0 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-700 dark:focus:border-slate-300"
                                placeholder="Deskripsi ringkas proyek..."
                              />
                              {errors.description && (
                                <p className="text-[10px] font-medium text-red-500">
                                  {errors.description}
                                </p>
                              )}
                            </div>

                            {/* Metadata fields */}
                            <ProjectBasicInfo
                              formData={formData}
                              errors={errors}
                              updateField={updateField}
                              allProjects={allProjects}
                              labels={labels}
                              mode="metadata"
                            />

                            {/* Stats & Viral toggle */}
                            <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                  Statistik & Viralitas
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setShowViralStats(!showViralStats)}
                                  className="hover:text-slate-855 dark:text-slate-450 text-[10px] font-semibold text-slate-500 transition-colors dark:hover:text-slate-200"
                                >
                                  {showViralStats ? 'Sembunyikan Opsi' : 'Tampilkan Opsi'}
                                </button>
                              </div>

                              {showViralStats && (
                                <div className="mt-4">
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
                              )}
                            </div>
                          </div>
                        )}

                        {/* TAB 2: PROSES */}
                        {activeTab === 'proses' && (
                          <div className="w-full">
                            <ProjectNarrative
                              formData={formData}
                              updateField={updateField}
                              errors={errors}
                            />
                          </div>
                        )}

                        {/* TAB 3: GALERI */}
                        {activeTab === 'galeri' && (
                          <div className="space-y-3">
                            <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">
                              Gallery Items
                            </h3>
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
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </form>
    </ProjectWindowModal>
  );
}
