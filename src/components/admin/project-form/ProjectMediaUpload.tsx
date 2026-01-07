import { ProjectFormData } from '@/hooks/useProjectForm';
import { Loader2, UploadCloud, Wand2 } from 'lucide-react';
import { useRef, useState } from 'react';

interface ProjectMediaUploadProps {
    formData: ProjectFormData;
    errors: Record<string, string>;
    isDetectingDimensions: boolean;
    updateField: <K extends keyof ProjectFormData>(field: K, value: ProjectFormData[K]) => void;
}

export default function ProjectMediaUpload({ formData, errors, isDetectingDimensions, updateField }: ProjectMediaUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            // DETECT ENVIRONMENT via Hostname
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const endpoint = isLocal ? '/api/upload' : '/api/upload/github';

            const res = await fetch(endpoint, {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error('Upload failed');

            const data = await res.json();
            if (data.url) {
                updateField('cover', data.url);
            }
        } catch (error) {
            console.error(error);
            alert('Upload failed, check console');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

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
                        placeholder="https://... or /assets/..."
                    />

                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileChange}
                        accept="image/*,video/*"
                    />

                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 flex items-center gap-2"
                        title="Upload Local File"
                    >
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                        <span className="hidden sm:inline">Upload</span>
                    </button>

                    {/* Compress Button */}
                    {formData.cover &&
                        (formData.cover.endsWith('.mp4') || formData.cover.endsWith('.mov') || formData.cover.endsWith('.webm')) &&
                        !formData.cover.startsWith('http') && (
                            <CompressButton
                                filePath={formData.cover}
                                onSuccess={() => {
                                    // Force refresh to show new file size if we displayed it, 
                                    // but browsers cache video content heavily. 
                                    // We might need to add timestamp query param to preview.
                                    const timestamp = Date.now();
                                    if (formData.cover.includes('?')) {
                                        updateField('cover', formData.cover.split('?')[0] + `?t=${timestamp}`);
                                    } else {
                                        updateField('cover', formData.cover + `?t=${timestamp}`);
                                    }
                                }}
                            />
                        )}

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

function CompressButton({ filePath, onSuccess }: { filePath: string, onSuccess: () => void }) {
    const [isCompressing, setIsCompressing] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const handleCompress = async () => {
        if (!confirm('Compress this video? This will overwrite the original file with a smaller version.')) return;

        setIsCompressing(true);
        setResult(null);

        try {
            const res = await fetch('/api/admin/compress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filePath })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Compression failed');

            setResult(`${data.originalSize} -> ${data.newSize} (-${data.saved})`);
            onSuccess();
        } catch (error) {
            console.error(error);
            alert(error instanceof Error ? error.message : 'Compression failed');
        } finally {
            setIsCompressing(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <button
                type="button"
                onClick={handleCompress}
                disabled={isCompressing}
                className="px-4 py-2 bg-pink-50 text-pink-700 border border-pink-200 rounded-md hover:bg-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-300 flex items-center gap-2"
                title="Compress Video"
            >
                {isCompressing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                <span className="hidden sm:inline">Compress</span>
            </button>
            {result && <span className="text-xs text-green-600 font-medium whitespace-nowrap">{result}</span>}
        </div>
    );
}

