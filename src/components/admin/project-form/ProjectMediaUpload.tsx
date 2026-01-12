import { ProjectFormData } from '@/hooks/useProjectForm';
import { Loader2 } from 'lucide-react';
import AdminFileUpload from '@/app/admin/components/AdminFileUpload';

interface ProjectMediaUploadProps {
    formData: ProjectFormData;
    errors: Record<string, string>;
    isDetectingDimensions: boolean;
    updateField: <K extends keyof ProjectFormData>(field: K, value: ProjectFormData[K]) => void;
    slug?: string;
    onFileChange?: (file: File | null) => void;
}
export default function ProjectMediaUpload({ formData, errors, isDetectingDimensions, updateField, slug, onFileChange }: ProjectMediaUploadProps) {
    const handleUploadComplete = (urls: string[]) => {
        if (urls.length > 0) {
            updateField('cover', urls[0]);
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
        </div>
    );
}

