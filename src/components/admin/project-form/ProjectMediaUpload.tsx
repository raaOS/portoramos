import { ProjectFormData } from '@/hooks/useProjectForm';
import { Loader2, Trash2, Image as ImageIcon } from 'lucide-react';
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
  // Revoke Blob URLs when they are replaced or component unmounts
  // This prevents memory bloat during heavy editing sessions.
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

    // Capture values for cleanup
    const coverToRevoke = prevCover.current;
    const beforeToRevoke = prevBefore.current;
    const afterToRevoke = prevAfter.current;

    return () => {
      // Cleanup on unmount (only if blob)
      if (coverToRevoke?.startsWith('blob:')) URL.revokeObjectURL(coverToRevoke);
      if (beforeToRevoke?.startsWith('blob:')) URL.revokeObjectURL(beforeToRevoke);
      if (afterToRevoke?.startsWith('blob:')) URL.revokeObjectURL(afterToRevoke);
    };
  }, [formData.cover, formData.comparison?.beforeImage, formData.comparison?.afterImage]);

  const deleteMedia = useCallback(
    async (path: string) => {
      try {
        const res = await fetch(`/api/upload?path=${encodeURIComponent(path)}`, {
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
            return; // abort UI removal if deletion fails
          }
        } else {
          return; // user cancelled the prompt
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

    // Clear the field
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
    <div className="space-y-4">
      {/* 2 Column Layout: Preview | Controls */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left: Preview */}
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-gray-100 bg-gray-50">
          {formData.cover ? (
            <div className="group relative p-4">
              <div className="max-h-56 overflow-hidden rounded-lg bg-gray-100">
                {formData.cover?.match(/\.(mp4|webm|mov)$/i) ? (
                  <video
                    src={formData.cover}
                    className="h-auto max-h-56 w-auto object-contain"
                    controls
                  />
                ) : (
                  <img
                    src={formData.cover}
                    alt="Cover"
                    className="h-auto max-h-56 w-auto object-contain"
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400">
              <ImageIcon className="mx-auto mb-2 h-12 w-12 opacity-50" />
              <p className="text-xs">Belum ada preview</p>
            </div>
          )}
        </div>

        {/* Right: Controls */}
        <div className="space-y-4">
          {/* URL Input */}
          <div>
            <label className="mb-1.5 block text-xs text-gray-500">Image/Video URL</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={formData.cover}
                onChange={(e) => updateField('cover', e.target.value)}
                className={`flex-1 rounded-md border px-3 py-2 text-sm transition-colors focus:border-gray-400 focus:outline-none ${errors.cover ? 'border-red-300' : 'border-gray-200'}`}
                placeholder="https://... or /assets/..."
              />
              {formData.cover && (
                <button
                  type="button"
                  onClick={() => handleDeleteMedia('cover')}
                  className="p-2 text-gray-400 transition-colors hover:text-red-500"
                  title="Hapus / Clear"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              {isDetectingDimensions && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
            </div>
            {errors.cover && <p className="mt-1 text-xs text-red-600">{errors.cover}</p>}
          </div>

          {/* Uploader */}
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

          {/* Dimensions */}
          {(formData.coverWidth || formData.coverHeight) && (
            <div className="flex items-center gap-4 pt-2 text-xs text-gray-500">
              <span>
                Width:{' '}
                <span className="font-medium text-gray-700">{formData.coverWidth || '-'}</span> px
              </span>
              <span>
                Height:{' '}
                <span className="font-medium text-gray-700">{formData.coverHeight || '-'}</span> px
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Comparison Section - Clean Cards with Preview */}
      {mediaFormat === 'comparison' && (
        <div className="grid grid-cols-1 gap-4 border-t border-gray-100 pt-4 md:grid-cols-2">
          {/* Before */}
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">Before</span>
              <select
                value={formData.comparison?.beforeType || 'image'}
                onChange={(e) =>
                  updateField('comparison', {
                    ...formData.comparison,
                    beforeType: e.target.value as 'image' | 'video',
                  })
                }
                className="rounded border border-gray-200 bg-white px-2 py-1 text-[10px] focus:border-gray-400 focus:outline-none"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>

            {/* Preview - Maintains original aspect ratio */}
            {formData.comparison?.beforeImage && (
              <div className="group relative mb-3 flex justify-center">
                <div className="max-h-40 overflow-hidden rounded-lg bg-gray-100">
                  {formData.comparison?.beforeType === 'video' ||
                  formData.comparison?.beforeImage?.match(/\.(mp4|webm|mov)$/i) ? (
                    <video
                      src={formData.comparison.beforeImage}
                      className="h-auto max-h-40 w-auto object-contain"
                      controls
                    />
                  ) : (
                    <img
                      src={formData.comparison.beforeImage}
                      alt="Before"
                      className="h-auto max-h-40 w-auto object-contain"
                    />
                  )}
                </div>
              </div>
            )}

            <div className="mb-2 flex items-center gap-2">
              <input
                type="text"
                value={formData.comparison?.beforeImage || ''}
                onChange={(e) =>
                  updateField('comparison', { ...formData.comparison, beforeImage: e.target.value })
                }
                className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                placeholder="/assets/..."
              />
              {formData.comparison?.beforeImage && (
                <button
                  type="button"
                  onClick={() => handleDeleteMedia('before')}
                  className="p-2 text-gray-400 transition-colors hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
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

          {/* After */}
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">After</span>
              <select
                value={formData.comparison?.afterType || 'image'}
                onChange={(e) =>
                  updateField('comparison', {
                    ...formData.comparison,
                    afterType: e.target.value as 'image' | 'video',
                  })
                }
                className="rounded border border-gray-200 bg-white px-2 py-1 text-[10px] focus:border-gray-400 focus:outline-none"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>

            {/* Preview - Maintains original aspect ratio */}
            {formData.comparison?.afterImage && (
              <div className="group relative mb-3 flex justify-center">
                <div className="max-h-40 overflow-hidden rounded-lg bg-gray-100">
                  {formData.comparison?.afterType === 'video' ||
                  formData.comparison?.afterImage?.match(/\.(mp4|webm|mov)$/i) ? (
                    <video
                      src={formData.comparison.afterImage}
                      className="h-auto max-h-40 w-auto object-contain"
                      controls
                    />
                  ) : (
                    <img
                      src={formData.comparison.afterImage}
                      alt="After"
                      className="h-auto max-h-40 w-auto object-contain"
                    />
                  )}
                </div>
              </div>
            )}

            <div className="mb-2 flex items-center gap-2">
              <input
                type="text"
                value={formData.comparison?.afterImage || ''}
                onChange={(e) =>
                  updateField('comparison', { ...formData.comparison, afterImage: e.target.value })
                }
                className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                placeholder="/assets/..."
              />
              {formData.comparison?.afterImage && (
                <button
                  type="button"
                  onClick={() => handleDeleteMedia('after')}
                  className="p-2 text-gray-400 transition-colors hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
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
      )}
    </div>
  );
}
