import { ProjectFormData } from '@/hooks/useProjectForm';
import { Loader2 } from 'lucide-react';

interface ProjectMediaUploadProps {
    formData: ProjectFormData;
    errors: Record<string, string>;
    isDetectingDimensions: boolean;
    updateField: <K extends keyof ProjectFormData>(field: K, value: ProjectFormData[K]) => void;
}

export default function ProjectMediaUpload({ formData, errors, isDetectingDimensions, updateField }: ProjectMediaUploadProps) {
    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cover Image/Video URL *
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={formData.cover}
                        onChange={(e) => updateField('cover', e.target.value)}
                        className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.cover ? 'border-red-300' : 'border-gray-300'
                            }`}
                        placeholder="https://..."
                    />
                    {isDetectingDimensions && (
                        <div className="flex items-center px-2 text-violet-600">
                            <Loader2 className="w-5 h-5 animate-spin" />
                        </div>
                    )}
                </div>
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
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-gray-500 text-sm"
                    />
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Cover Height</label>
                    <input
                        type="number"
                        value={formData.coverHeight}
                        readOnly
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-gray-500 text-sm"
                    />
                </div>
            </div>
        </div>
    );
}
