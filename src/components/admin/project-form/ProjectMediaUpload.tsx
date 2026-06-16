/**
 * Project Media Upload — Upload media cover dan thumbnail proyek.
 *
 * Menangani upload gambar cover, thumbnail, dan comparison before/after
 * untuk setiap proyek, dengan preview dan kemampuan hapus.
 *
 * @module components/admin/project-form/ProjectMediaUpload
 */
import { ProjectFormData } from '@/hooks/useProjectForm';
import { Loader2, Trash2, Image as ImageIcon, Video, HelpCircle } from 'lucide-react';
import AdminFileUpload from '@/app/admin/components/AdminFileUpload';
import { useEffect, useRef, useCallback } from 'react';
import { extractStoragePath } from '@/lib/media';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import { useToast } from '@/contexts/ToastContext';

interface ProjectMediaUploadProps {
  formData: ProjectFormData;
  errors: Record<string, string>;
  isDetectingDimensions: boolean;
  updateField: <K extends keyof ProjectFormData>(field: K, value: ProjectFormData[K]) => void;
  slug?: string;
  onFileChange?: (file: File | null) => void;
  mediaFormat?: 'single' | 'comparison' | 'gallery';
  onNewUpload?: (url: string) => void;
  csrfToken?: string | null;
}

export default function ProjectMediaUpload({
  formData,
  errors,
  isDetectingDimensions,
  updateField,
  slug,
  onFileChange,
  mediaFormat,
  onNewUpload,
  csrfToken,
}: ProjectMediaUploadProps) {
  const { confirm } = useConfirm();
  const { showError } = useToast();

  const handleUploadComplete = (urls: string[]) => {
    if (urls.length > 0) {
      updateField('cover', urls[0]);
      if (onNewUpload) onNewUpload(urls[0]);
    }
  };

  // [Deep Audit] Memory Leak Prevention
  const prevCover = useRef(formData.cover);
  const prevBefore = useRef(formData.comparison?.beforeImage);
  const prevAfter = useRef(formData.comparison?.afterImage);

  useEffect(() => {
    const checkAndRevoke = (
      current: string | undefined,
      prevRef: React.MutableRefObject<string | undefined>
    ) => {
      if (prevRef.current && prevRef.current !== current && prevRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(prevRef.current);
      }
      prevRef.current = current;
    };

    checkAndRevoke(formData.cover, prevCover);
    checkAndRevoke(formData.comparison?.beforeImage, prevBefore);
    checkAndRevoke(formData.comparison?.afterImage, prevAfter);

    const coverToRevoke = prevCover.current;
    const beforeToRevoke = prevBefore.current;
    const afterToRevoke = prevAfter.current;

    return () => {
      if (coverToRevoke?.startsWith('blob:')) URL.revokeObjectURL(coverToRevoke);
      if (beforeToRevoke?.startsWith('blob:')) URL.revokeObjectURL(beforeToRevoke);
      if (afterToRevoke?.startsWith('blob:')) URL.revokeObjectURL(afterToRevoke);
    };
  }, [formData.cover, formData.comparison?.beforeImage, formData.comparison?.afterImage]);

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
    } else {
      updateField('comparison', {
        ...formData.comparison,
        [field === 'before' ? 'beforeImage' : 'afterImage']: '',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* 2 Column Layout: Canvas Preview | Control Panel */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left: Viewport / Canvas (Blackroom) */}
        <div className="relative flex aspect-video md:h-[220px] md:aspect-auto items-center justify-center rounded-xl bg-slate-950 border border-slate-900 overflow-hidden shadow-inner group">
          {/* Blueprint Grid Lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-10"></div>
          
          {formData.cover ? (
            <div className="relative z-10 w-full h-full flex items-center justify-center p-2">
              {formData.cover?.match(/\.(mp4|webm|mov)$/i) ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <video
                    src={formData.cover}
                    className="max-w-full max-h-full object-contain rounded-md shadow-lg"
                    controls
                    muted
                  />
                  <div className="absolute top-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-[8px] font-mono tracking-wider text-slate-300 uppercase flex items-center gap-1">
                    <Video className="h-2.5 w-2.5" /> VIDEO
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    src={formData.cover}
                    alt="Cover"
                    className="max-w-full max-h-full object-contain rounded-md shadow-lg"
                  />
                  <div className="absolute top-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-[8px] font-mono tracking-wider text-slate-300 uppercase flex items-center gap-1">
                    <ImageIcon className="h-2.5 w-2.5" /> IMAGE
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="relative z-10 text-center text-slate-500">
              <ImageIcon className="mx-auto mb-2 h-8 w-8 stroke-[1.2] text-slate-700" />
              <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">No Preview Available</p>
            </div>
          )}
        </div>

        {/* Right: Controller Inspector */}
        <div className="flex flex-col justify-center space-y-4">
          <div>
            <label className="mb-1 block font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Image / Video URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={formData.cover}
                onChange={(e) => updateField('cover', e.target.value)}
                className={`flex-1 rounded-md border bg-white px-3 py-2 text-xs transition-all focus:border-slate-800 focus:outline-none ${
                  errors.cover ? 'border-red-300 bg-red-50/10' : 'border-slate-200 hover:border-slate-300'
                }`}
                placeholder="https://... or /assets/..."
              />
              {formData.cover && (
                <button
                  type="button"
                  onClick={() => handleDeleteMedia('cover')}
                  className="rounded-md border border-slate-200 p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  title="Clear Media"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              {isDetectingDimensions && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
            </div>
            {errors.cover && <p className="mt-1 text-[10px] text-red-500">{errors.cover}</p>}
          </div>

          <div className="rounded-md border border-dashed border-slate-200 p-1 hover:border-slate-300 transition-colors bg-slate-50/30">
            <AdminFileUpload
              onUpload={handleUploadComplete}
              onFileSelect={(file) => {
                const url = URL.createObjectURL(file);
                updateField('cover', url);
                if (onFileChange) onFileChange(file);
              }}
              autoUpload={false}
              multiple={false}
              accept="image/*,video/*"
              maxSize={500}
              enableCrop={true}
              enableVideoTrim={true}
            />
          </div>

          {/* Dimension Details telemetry */}
          {(formData.coverWidth || formData.coverHeight) && (
            <div className="flex items-center gap-3 pt-0.5 font-mono text-[9px] text-slate-400 tracking-wider">
              <span>
                WIDTH: <span className="font-bold text-slate-700">{formData.coverWidth || '-'}px</span>
              </span>
              <span>
                HEIGHT: <span className="font-bold text-slate-700">{formData.coverHeight || '-'}px</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Comparison Viewport Section */}
      {mediaFormat === 'comparison' && (
        <div className="grid grid-cols-1 gap-6 border-t border-slate-100 pt-6 md:grid-cols-2">
          {/* Before Column */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-50 pb-1.5">
              <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400">Before / Kiri</span>
              <select
                value={formData.comparison?.beforeType || 'image'}
                onChange={(e) =>
                  updateField('comparison', {
                    ...formData.comparison,
                    beforeType: e.target.value as 'image' | 'video',
                  })
                }
                className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-600 outline-none hover:border-slate-300 transition-colors"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>

            {/* Before Viewport */}
            <div className="relative aspect-video flex items-center justify-center rounded-lg bg-slate-950 border border-slate-900 overflow-hidden shadow-inner">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:16px_16px] opacity-10"></div>
              {formData.comparison?.beforeImage ? (
                <div className="relative z-10 w-full h-full flex items-center justify-center p-2">
                  {formData.comparison?.beforeType === 'video' ||
                  formData.comparison?.beforeImage?.match(/\.(mp4|webm|mov)$/i) ? (
                    <video
                      src={formData.comparison.beforeImage}
                      className="max-w-full max-h-full object-contain rounded shadow"
                      controls
                      muted
                    />
                  ) : (
                    <img
                      src={formData.comparison.beforeImage}
                      alt="Before"
                      className="max-w-full max-h-full object-contain rounded shadow"
                    />
                  )}
                </div>
              ) : (
                <div className="relative z-10 text-center text-slate-600">
                  <HelpCircle className="mx-auto mb-1 h-6 w-6 stroke-[1.2]" />
                  <span className="font-mono text-[8px] uppercase tracking-wider">Before State Empty</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={formData.comparison?.beforeImage || ''}
                onChange={(e) =>
                  updateField('comparison', { ...formData.comparison, beforeImage: e.target.value })
                }
                className="flex-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:border-slate-800 focus:outline-none transition-all"
                placeholder="Image/Video URL"
              />
              {formData.comparison?.beforeImage && (
                <button
                  type="button"
                  onClick={() => handleDeleteMedia('before')}
                  className="rounded-md border border-slate-200 p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="rounded-md border border-dashed border-slate-200 p-1 hover:border-slate-300 transition-colors bg-slate-50/30">
              <AdminFileUpload
                onUpload={(urls) => {
                  if (urls.length > 0)
                    updateField('comparison', { ...formData.comparison, beforeImage: urls[0] });
                }}
                onFileSelect={(file) => {
                  const url = URL.createObjectURL(file);
                  updateField('comparison', { ...formData.comparison, beforeImage: url });
                  if (onFileChange) onFileChange(file);
                }}
                autoUpload={true}
                multiple={false}
                accept="image/*,video/*"
                maxSize={500}
                folder="comparisons"
                customFilename={slug ? `${slug}-before` : undefined}
              />
            </div>
          </div>

          {/* After Column */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-50 pb-1.5">
              <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400">After / Kanan</span>
              <select
                value={formData.comparison?.afterType || 'image'}
                onChange={(e) =>
                  updateField('comparison', {
                    ...formData.comparison,
                    afterType: e.target.value as 'image' | 'video',
                  })
                }
                className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-600 outline-none hover:border-slate-300 transition-colors"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>

            {/* After Viewport */}
            <div className="relative aspect-video flex items-center justify-center rounded-lg bg-slate-950 border border-slate-900 overflow-hidden shadow-inner">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:16px_16px] opacity-10"></div>
              {formData.comparison?.afterImage ? (
                <div className="relative z-10 w-full h-full flex items-center justify-center p-2">
                  {formData.comparison?.afterType === 'video' ||
                  formData.comparison?.afterImage?.match(/\.(mp4|webm|mov)$/i) ? (
                    <video
                      src={formData.comparison.afterImage}
                      className="max-w-full max-h-full object-contain rounded shadow"
                      controls
                      muted
                    />
                  ) : (
                    <img
                      src={formData.comparison.afterImage}
                      alt="After"
                      className="max-w-full max-h-full object-contain rounded shadow"
                    />
                  )}
                </div>
              ) : (
                <div className="relative z-10 text-center text-slate-600">
                  <HelpCircle className="mx-auto mb-1 h-6 w-6 stroke-[1.2]" />
                  <span className="font-mono text-[8px] uppercase tracking-wider">After State Empty</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={formData.comparison?.afterImage || ''}
                onChange={(e) =>
                  updateField('comparison', { ...formData.comparison, afterImage: e.target.value })
                }
                className="flex-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:border-slate-800 focus:outline-none transition-all"
                placeholder="Image/Video URL"
              />
              {formData.comparison?.afterImage && (
                <button
                  type="button"
                  onClick={() => handleDeleteMedia('after')}
                  className="rounded-md border border-slate-200 p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="rounded-md border border-dashed border-slate-200 p-1 hover:border-slate-300 transition-colors bg-slate-50/30">
              <AdminFileUpload
                onUpload={(urls) => {
                  if (urls.length > 0)
                    updateField('comparison', { ...formData.comparison, afterImage: urls[0] });
                }}
                autoUpload={true}
                multiple={false}
                accept="image/*,video/*"
                maxSize={500}
                customFilename={slug ? `${slug}-after` : undefined}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
