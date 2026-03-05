import { ProjectFormData } from '@/hooks/useProjectForm';
import { Loader2, Trash2 } from 'lucide-react';
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
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cover Image/Video URL *
                </label>

                {/* Manual URL Input */}
                <div className="flex gap-2 items-center mb-4">
                    <input
                        type="text"
                        value={formData.cover}
                        onChange={(e) => updateField('cover', e.target.value)}
                        className={`flex-1 px-3 py-2 border rounded-none focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.cover ? 'border-red-300' : 'border-gray-300'
                            }`}
                        placeholder="https://... or /assets/..."
                    />
                    {formData.cover && (
                        <button
                            type="button"
                            onClick={() => handleDeleteMedia('cover')}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            title="Hapus / Clear"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                    {isDetectingDimensions && (
                        <div className="flex items-center px-2 text-violet-600">
                            <Loader2 className="w-5 h-5 animate-spin" />
                        </div>
                    )}
                </div>

                {/* Uploader with Deferred Mode */}
                <AdminFileUpload
                    onUpload={handleUploadComplete} // Handles initial load or manual URL if needed
                    onFileSelect={(file) => {
                        // Create preview URL
                        const url = URL.createObjectURL(file);
                        updateField('cover', url);
                        // Notify parent to store File
                        if (onFileChange) onFileChange(file);
                    }}
                    autoUpload={false} // DEFERRED MODE
                    multiple={false}
                    accept="image/*,video/*"
                    maxSize={500}
                    enableCrop={true}
                    enableVideoTrim={true}
                    className="mt-2"
                />

                {errors.cover && (
                    <p className="mt-1 text-sm text-red-600">{errors.cover}</p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Cover Width</label>
                    <input
                        type="number"
                        value={formData.coverWidth}
                        readOnly
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-none text-gray-500 text-sm"
                    />
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Cover Height</label>
                    <input
                        type="number"
                        value={formData.coverHeight}
                        readOnly
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-none text-gray-500 text-sm"
                    />
                </div>
            </div>

            {/* Comparison Media Section - ONLY SHOW IF FORMAT IS COMPARISON */}
            {mediaFormat === 'comparison' && (
                <div className="pt-6 border-t border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                        Comparison Media (Before & After)
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Before Image */}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-xs font-medium text-gray-700">Before Image (Original)</label>
                                <select
                                    value={formData.comparison?.beforeType || 'image'}
                                    onChange={(e) => updateField('comparison', {
                                        ...formData.comparison,
                                        beforeType: e.target.value as 'image' | 'video'
                                    })}
                                    className="text-[10px] border-gray-300 rounded py-0.5 px-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="image">Image</option>
                                    <option value="video">Video</option>
                                </select>
                            </div>
                            <div className="flex gap-2 items-center mb-2">
                                <input
                                    type="text"
                                    value={formData.comparison?.beforeImage || ''}
                                    onChange={(e) => updateField('comparison', { ...formData.comparison, beforeImage: e.target.value })}
                                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="/assets/..."
                                />
                                {formData.comparison?.beforeImage && (
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteMedia('before')}
                                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                        title="Hapus / Clear"
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
                                className="mt-1"
                                folder="comparisons"
                                customFilename={slug ? `${slug}-before` : undefined}
                            />
                            {!slug && <p className="text-[10px] text-orange-500 mt-1">Enter title/slug first for auto-naming</p>}
                        </div>

                        {/* After Image */}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-xs font-medium text-gray-700">After Image (Result)</label>
                                <select
                                    value={formData.comparison?.afterType || 'image'}
                                    onChange={(e) => updateField('comparison', {
                                        ...formData.comparison,
                                        afterType: e.target.value as 'image' | 'video'
                                    })}
                                    className="text-[10px] border-gray-300 rounded py-0.5 px-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="image">Image</option>
                                    <option value="video">Video</option>
                                </select>
                            </div>
                            <div className="flex gap-2 items-center mb-2">
                                <input
                                    type="text"
                                    value={formData.comparison?.afterImage || ''}
                                    onChange={(e) => updateField('comparison', { ...formData.comparison, afterImage: e.target.value })}
                                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="/assets/..."
                                />
                                {formData.comparison?.afterImage && (
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteMedia('after')}
                                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                        title="Hapus / Clear"
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
                                className="mt-1"
                                customFilename={slug ? `${slug}-after` : undefined}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
