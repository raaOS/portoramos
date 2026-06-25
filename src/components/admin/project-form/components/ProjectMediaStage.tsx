import { AnimatePresence, motion } from 'motion/react';
import { Loader2, MessageSquare, Trash2, X } from 'lucide-react';
import type { GalleryItem } from '@/types/projects';
import type { ProjectFormData } from '@/hooks/useProjectForm';
import type { Comment } from '@/lib/magic';
import { isVideoLink } from '@/lib/media';
import AdminFileUpload from '@/app/admin/components/AdminFileUpload';
import Media from '@/components/shared/Media';
import { Compare } from '@/components/ui/compare';
import {
  ProjectComments,
  ProjectInteractionBar,
} from '@/components/projects/project-detail/components';
import { MEDIA_FORMAT_OPTIONS, PROJECT_TYPE_OPTIONS } from '../projectFormConstants';
import type {
  ProjectFormUpdateField,
  ProjectMediaFormat,
  SetComments,
} from '../types';
import MediaStageUrlInput from './MediaStageUrlInput';

interface ProjectMediaStageProps {
  formData: ProjectFormData;
  errors: Record<string, string>;
  isDetectingDimensions: boolean;
  mediaFormat: ProjectMediaFormat;
  setMediaFormat: (format: ProjectMediaFormat) => void;
  isCommentsOpen: boolean;
  setIsCommentsOpen: (isOpen: boolean) => void;
  comments: Comment[];
  setComments: SetComments;
  totalCommentCount: number;
  isProjectLiked: boolean;
  setIsProjectLiked: (isLiked: boolean) => void;
  activeProjectSlug: string;
  pendingCoverFile: File | null;
  metrics: {
    likes: number;
    shares: number;
  };
  updateField: ProjectFormUpdateField;
  onDeleteMedia: (field: 'cover' | 'before' | 'after') => void | Promise<void>;
  onCoverFileSelect: (file: File) => void;
  onCoverDeferredUpload: (urls: string[]) => void;
  onCoverUrlChange: (value: string) => void;
  onNewUpload: (url: string) => void;
}

function MediaPreview({
  src,
  kind,
  alt,
}: {
  src: string;
  kind: GalleryItem['kind'];
  alt: string;
}) {
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
}

export default function ProjectMediaStage({
  formData,
  errors,
  isDetectingDimensions,
  mediaFormat,
  setMediaFormat,
  isCommentsOpen,
  setIsCommentsOpen,
  comments,
  setComments,
  totalCommentCount,
  isProjectLiked,
  setIsProjectLiked,
  activeProjectSlug,
  pendingCoverFile,
  metrics,
  updateField,
  onDeleteMedia,
  onCoverFileSelect,
  onCoverDeferredUpload,
  onCoverUrlChange,
  onNewUpload,
}: ProjectMediaStageProps) {
  const coverKind: GalleryItem['kind'] =
    pendingCoverFile && formData.cover.startsWith('blob:')
      ? pendingCoverFile.type.startsWith('video/')
        ? 'video'
        : 'image'
      : isVideoLink(formData.cover)
        ? 'video'
        : 'image';
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

  const handleBeforeUrlChange = (value: string) => {
    updateField('comparison', {
      ...formData.comparison,
      beforeImage: value,
      beforeType: isVideoLink(value) ? 'video' : 'image',
    });
  };

  const renderCoverUploadButton = (label: string, compact = false) => (
    <div
      className={`flex flex-col items-center gap-2 ${compact ? 'cover-overlay-upload' : 'scale-110'}`}
    >
      <AdminFileUpload
        variant="button"
        onUpload={onCoverDeferredUpload}
        onFileSelect={onCoverFileSelect}
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
            onNewUpload(urls[0]);
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

  return (
    <div className="group relative flex min-h-[350px] flex-col overflow-hidden rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/10 lg:col-span-6">
      <div className="dark:border-slate-850 scrollbar-none mb-4 flex w-full items-center gap-3 overflow-x-auto border-b border-slate-100 pb-4">
        <div className="flex flex-shrink-0 items-center gap-2.5">
          <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Tipe
          </span>
          {PROJECT_TYPE_OPTIONS.map((option) => {
            const isSelected = formData.type === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => updateField('type', option.value)}
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
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>

        <span className="h-5 w-px flex-shrink-0 bg-slate-200 dark:bg-slate-800" aria-hidden="true" />

        <div className="flex flex-shrink-0 items-center gap-2.5">
          <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Format
          </span>
          {MEDIA_FORMAT_OPTIONS.map((option) => {
            const isSelected = mediaFormat === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setMediaFormat(option.id)}
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
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-[460px] sm:flex sm:max-w-[520px] sm:flex-row sm:items-center sm:justify-start">
        <div className="flex w-full max-w-[440px] flex-shrink-0 flex-col">
          <div
            className={`relative aspect-[4/5] w-full overflow-hidden rounded-[22px] border-2 bg-slate-100 shadow-sm transition-all duration-300 dark:bg-slate-950 ${errors.cover ? 'animate-pulse border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'border-slate-200 dark:border-slate-800'}`}
          >
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
                        <MediaPreview src={beforeSrc} kind={beforeKind} alt="Before media" />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-500">
                          {renderBeforeUploadButton('Upload Before')}
                        </div>
                      )}
                    </div>
                    <div className="relative h-full overflow-hidden bg-slate-100 dark:bg-slate-950">
                      {afterSrc ? (
                        <MediaPreview src={afterSrc} kind={afterKind} alt="After media" />
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
                          onClick={() => void onDeleteMedia('before')}
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
                          onClick={() => void onDeleteMedia('after')}
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
                              onClick={() => void onDeleteMedia('cover')}
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
                      placeholder={afterOverrideSrc ? 'After override URL...' : 'Cover media URL...'}
                      onValueChange={
                        afterOverrideSrc
                          ? (value) =>
                              updateField('comparison', {
                                ...formData.comparison,
                                afterImage: value,
                                afterType: isVideoLink(value) ? 'video' : 'image',
                              })
                          : onCoverUrlChange
                      }
                      label={afterOverrideSrc ? 'After URL' : 'Cover URL'}
                    />
                  </div>
                )}
              </>
            ) : (
              <>
                {hasCover ? (
                  <MediaPreview
                    src={formData.cover}
                    kind={coverKind}
                    alt={formData.title || 'Cover media'}
                  />
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
                      onClick={() => void onDeleteMedia('cover')}
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
                      onValueChange={onCoverUrlChange}
                      label="Cover URL"
                    />
                  </div>
                )}
              </>
            )}

            {mediaFormat === 'single' && (hasCover || isDetectingDimensions) && !isCommentsOpen && (
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
  );
}
