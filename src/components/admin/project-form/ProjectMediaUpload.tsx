import { ProjectFormData } from '@/hooks/useProjectForm';
import { Loader2, Trash2, Image as ImageIcon } from 'lucide-react';
import AdminFileUpload from '@/app/admin/components/AdminFileUpload';
import { useEffect, useRef } from 'react';
import { deleteFromGitHub, getGithubPathFromUrl } from '@/lib/githubUpload';

interface ProjectMediaUploadProps {
    formData: ProjectFormData;
    errors: Record<string, string>;
    isDetectingDimensions: boolean;
    updateField: <K extends keyof ProjectFormData>(field: K, value: ProjectFormData[K]) => void;
    slug?: string;
    onFileChange?: (file: File | null) => void;
    mediaFormat?: 'single' | 'comparison' | 'gallery';
}
export default function ProjectMediaUpload({ formData, errors, isDetectingDimensions, updateField, slug, onFileChange, mediaFormat }: ProjectMediaUploadProps) {
    const handleUploadComplete = (urls: string[]) => {
        if (urls.length > 0) {
            updateField('cover', urls[0]);
        }
    };

    // [Deep Audit] Memory Leak Prevention
    // Revoke Blob URLs when they are replaced or component unmounts
    // This prevents memory bloat during heavy editing sessions.
    const prevCover = useRef(formData.cover);
    const prevBefore = useRef(formData.comparison?.beforeImage);
    const prevAfter = useRef(formData.comparison?.afterImage);

    useEffect(() => {
        const checkAndRevoke = (current: string | undefined, prevRef: React.MutableRefObject<string | undefined>) => {
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

    const handleDeleteMedia = async (field: 'cover' | 'before' | 'after') => {
        let url = '';
        if (field === 'cover') url = formData.cover;
        else if (field === 'before') url = formData.comparison?.beforeImage || '';
        else if (field === 'after') url = formData.comparison?.afterImage || '';

        if (!url) return;

        const githubPath = getGithubPathFromUrl(url);
        if (githubPath) {
            const confirmDelete = window.confirm(
                "Apakah Anda ingin menghapus file ini PERMANEN dari GitHub?\n\n" +
                "Klik OK untuk hapus permanen (bersihkan GitHub).\n" +
                "Klik Batal untuk hanya menghapus dari input ini saja."
            );

            if (confirmDelete) {
                const success = await deleteFromGitHub(githubPath);
                if (!success) {
                    alert("Gagal menghapus file dari GitHub. Input akan dibersihkan.");
                }
            }
        } else {
            if (!url.startsWith('blob:') && !window.confirm("Hapus link media ini?")) return;
        }

        // Clear the field
        if (field === 'cover') {
            updateField('cover', '');
        } else {
            updateField('comparison', {
                ...formData.comparison,
                [field === 'before' ? 'beforeImage' : 'afterImage']: ''
            });
        }
    };

    return (
        <div className="space-y-4">
            {/* 2 Column Layout: Preview | Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Preview */}
                <div className="flex items-center justify-center bg-gray-50 rounded-lg border border-gray-100 min-h-[200px]">
                    {formData.cover ? (
                        <div className="relative group p-4">
                            <div className="bg-gray-100 rounded-lg overflow-hidden max-h-56">
                                {formData.cover?.match(/\.(mp4|webm|mov)$/i) ? (
                                    <video 
                                        src={formData.cover} 
                                        className="w-auto h-auto max-h-56 object-contain"
                                        controls
                                    />
                                ) : (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={formData.cover}
                                        alt="Cover"
                                        className="w-auto h-auto max-h-56 object-contain"
                                    />
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-400">
                            <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p className="text-xs">Belum ada preview</p>
                        </div>
                    )}
                </div>

                {/* Right: Controls */}
                <div className="space-y-4">
                    {/* URL Input */}
                    <div>
                        <label className="block text-xs text-gray-500 mb-1.5">Image/Video URL</label>
                        <div className="flex gap-2 items-center">
                            <input
                                type="text"
                                value={formData.cover}
                                onChange={(e) => updateField('cover', e.target.value)}
                                className={`flex-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:border-gray-400 transition-colors ${errors.cover ? 'border-red-300' : 'border-gray-200'}`}
                                placeholder="https://... or /assets/..."
                            />
                            {formData.cover && (
                                <button
                                    type="button"
                                    onClick={() => handleDeleteMedia('cover')}
                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                    title="Hapus / Clear"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                            {isDetectingDimensions && (
                                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                            )}
                        </div>
                        {errors.cover && (
                            <p className="mt-1 text-xs text-red-600">{errors.cover}</p>
                        )}
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
                        <div className="flex items-center gap-4 text-xs text-gray-500 pt-2">
                            <span>Width: <span className="text-gray-700 font-medium">{formData.coverWidth || '-'}</span> px</span>
                            <span>Height: <span className="text-gray-700 font-medium">{formData.coverHeight || '-'}</span> px</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Comparison Section - Clean Cards with Preview */}
            {mediaFormat === 'comparison' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                    {/* Before */}
                    <div className="bg-gray-50/50 rounded-lg border border-gray-100 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium text-gray-700">Before</span>
                            <select
                                value={formData.comparison?.beforeType || 'image'}
                                onChange={(e) => updateField('comparison', {
                                    ...formData.comparison,
                                    beforeType: e.target.value as 'image' | 'video'
                                })}
                                className="text-[10px] border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none focus:border-gray-400"
                            >
                                <option value="image">Image</option>
                                <option value="video">Video</option>
                            </select>
                        </div>
                        
                        {/* Preview - Maintains original aspect ratio */}
                        {formData.comparison?.beforeImage && (
                            <div className="mb-3 relative group flex justify-center">
                                <div className="bg-gray-100 rounded-lg overflow-hidden max-h-40">
                                    {(formData.comparison?.beforeType === 'video' || formData.comparison?.beforeImage?.match(/\.(mp4|webm|mov)$/i)) ? (
                                        <video 
                                            src={formData.comparison.beforeImage} 
                                            className="w-auto h-auto max-h-40 object-contain"
                                            controls
                                        />
                                    ) : (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={formData.comparison.beforeImage}
                                            alt="Before"
                                            className="w-auto h-auto max-h-40 object-contain"
                                        />
                                    )}
                                </div>
                            </div>
                        )}
                        
                        <div className="flex gap-2 items-center mb-2">
                            <input
                                type="text"
                                value={formData.comparison?.beforeImage || ''}
                                onChange={(e) => updateField('comparison', { ...formData.comparison, beforeImage: e.target.value })}
                                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-gray-400"
                                placeholder="/assets/..."
                            />
                            {formData.comparison?.beforeImage && (
                                <button
                                    type="button"
                                    onClick={() => handleDeleteMedia('before')}
                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <AdminFileUpload
                            onUpload={(urls) => {
                                if (urls.length > 0) updateField('comparison', { ...formData.comparison, beforeImage: urls[0] });
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
                    <div className="bg-gray-50/50 rounded-lg border border-gray-100 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium text-gray-700">After</span>
                            <select
                                value={formData.comparison?.afterType || 'image'}
                                onChange={(e) => updateField('comparison', {
                                    ...formData.comparison,
                                    afterType: e.target.value as 'image' | 'video'
                                })}
                                className="text-[10px] border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none focus:border-gray-400"
                            >
                                <option value="image">Image</option>
                                <option value="video">Video</option>
                            </select>
                        </div>
                        
                        {/* Preview - Maintains original aspect ratio */}
                        {formData.comparison?.afterImage && (
                            <div className="mb-3 relative group flex justify-center">
                                <div className="bg-gray-100 rounded-lg overflow-hidden max-h-40">
                                    {(formData.comparison?.afterType === 'video' || formData.comparison?.afterImage?.match(/\.(mp4|webm|mov)$/i)) ? (
                                        <video 
                                            src={formData.comparison.afterImage} 
                                            className="w-auto h-auto max-h-40 object-contain"
                                            controls
                                        />
                                    ) : (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={formData.comparison.afterImage}
                                            alt="After"
                                            className="w-auto h-auto max-h-40 object-contain"
                                        />
                                    )}
                                </div>
                            </div>
                        )}
                        
                        <div className="flex gap-2 items-center mb-2">
                            <input
                                type="text"
                                value={formData.comparison?.afterImage || ''}
                                onChange={(e) => updateField('comparison', { ...formData.comparison, afterImage: e.target.value })}
                                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-gray-400"
                                placeholder="/assets/..."
                            />
                            {formData.comparison?.afterImage && (
                                <button
                                    type="button"
                                    onClick={() => handleDeleteMedia('after')}
                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <AdminFileUpload
                            onUpload={(urls) => {
                                if (urls.length > 0) updateField('comparison', { ...formData.comparison, afterImage: urls[0] });
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
