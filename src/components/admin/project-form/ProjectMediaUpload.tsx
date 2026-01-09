import { ProjectFormData } from '@/hooks/useProjectForm';
import { Loader2, UploadCloud } from 'lucide-react';
import { useRef, useState } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

interface ProjectMediaUploadProps {
    formData: ProjectFormData;
    errors: Record<string, string>;
    isDetectingDimensions: boolean;
    updateField: <K extends keyof ProjectFormData>(field: K, value: ProjectFormData[K]) => void;
}

export default function ProjectMediaUpload({ formData, errors, isDetectingDimensions, updateField }: ProjectMediaUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [status, setStatus] = useState<string>(''); // 'idle', 'loading-core', 'compressing', 'uploading'
    const [progress, setProgress] = useState(0); // 0-100
    const [compressionResult, setCompressionResult] = useState<string | null>(null);
    const [quality, setQuality] = useState<'turbo' | 'high'>('turbo');

    // FFmpeg Ref
    const ffmpegRef = useRef<FFmpeg | null>(null);

    // Load FFmpeg
    const loadFFmpeg = async () => {
        if (ffmpegRef.current) return ffmpegRef.current;

        setStatus('Loading Compression Core...');
        const ffmpeg = new FFmpeg();

        // Use toBlobURL + Local Files
        // This bypasses "Expression too dynamic" (Bundler) errors.
        // And works because we fixed CSP "Failed to fetch" (Blob blocking).
        const baseURL = window.location.origin + '/ffmpeg';
        try {
            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            });
            console.log('✅ FFmpeg Loaded Successfully');
        } catch (e) {
            console.error('❌ FFmpeg Load Failed:', e);
            throw new Error('Compression engine failed to load. Check console for details.');
        }

        ffmpegRef.current = ffmpeg;
        return ffmpeg;
    };

    // Compress Video (Client Side)
    const compressVideoClient = async (file: File, onProgress: (p: number) => void): Promise<File> => {
        setStatus('Initializing Compressor...');
        const ffmpeg = await loadFFmpeg();

        setStatus('Compressing Video (Wait)...');

        const inputName = 'input.mp4';
        const outputName = 'output.mp4';
        const startTime = Date.now();

        // Write file
        await ffmpeg.writeFile(inputName, await fetchFile(file));

        // Progress Handler
        ffmpeg.on('progress', ({ progress }) => {
            // progress is 0 to 1
            const percent = Math.round(progress * 100);
            onProgress(percent);

            // Calculate ETA
            if (progress > 0) {
                const elapsed = (Date.now() - startTime) / 1000; // seconds
                const estimatedTotal = elapsed / progress;
                const remaining = Math.round(estimatedTotal - elapsed);

                setStatus(`Compressing Video (${percent}%) - ~${remaining}s remaining...`);
            } else {
                setStatus(`Compressing Video (${percent}%)...`);
            }
        });

        // Determine settings based on state
        const crf = quality === 'high' ? '23' : '27';
        const preset = quality === 'high' ? 'medium' : 'fast';

        // Run compression
        await ffmpeg.exec([
            '-i', inputName,
            '-vf', "scale='if(gt(iw,ih),-2,720)':'if(gt(iw,ih),720,-2)'",
            '-c:v', 'libx264',
            '-crf', crf,
            '-preset', preset,
            '-r', '30',
            '-an',
            '-movflags', '+faststart',
            outputName
        ]);

        // Read output
        const data = await ffmpeg.readFile(outputName);

        // Create new file
        const blob = new Blob([data as any], { type: 'video/mp4' });
        return new File([blob], file.name, { type: 'video/mp4' });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 100MB Limit for Video input (since we compress it)
        // 10MB Limit for Image
        const isVideo = file.type.startsWith('video/');
        const limit = isVideo ? 100 : 10;

        if (file.size > limit * 1024 * 1024) {
            alert(`File too large. Maximum size is ${limit}MB.`);
            return;
        }

        setStatus('Preparing...');
        setProgress(0);

        try {
            let fileToUpload = file;

            // 1. COMPRESS (If Video)
            if (isVideo) {
                try {
                    fileToUpload = await compressVideoClient(file, (p) => setProgress(p));
                    if (fileToUpload) {
                        const originalSize = (file.size / (1024 * 1024)).toFixed(1);
                        const compressedSize = (fileToUpload.size / (1024 * 1024)).toFixed(1);
                        const reduction = Math.round(((file.size - fileToUpload.size) / file.size) * 100);

                        setCompressionResult(`${originalSize}MB → ${compressedSize}MB (-${reduction}%)`);
                    }
                } catch (err) {
                    console.error('Compression critical error', err);
                    alert('Compression Failed! Please check console. Upload aborted.');
                    setStatus('');
                    return; // Abort upload
                }
            }

            // 2. UPLOAD
            setStatus('Uploading...');
            setProgress(0); // Reset for upload phase

            const formData = new FormData();
            formData.append('file', fileToUpload);

            // DETECT ENVIRONMENT via Hostname (Simple heuristic)
            // But actually, why distinguish? API routes handle logic.
            // Wait, previous code checked localhost to decide endpoint?
            // "const endpoint = isLocal ? '/api/upload' : '/api/upload/github';"
            // This logic is fragile. Usually we always use one endpoint (e.g. /api/upload) 
            // and let the server decide based on ENV variables (GITHUB_TOKEN present?).
            // But let's respect existing logic for now to avoid breaking stuff.
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const endpoint = isLocal ? '/api/upload?folder=temp' : '/api/upload/github?folder=temp';

            // XHR for upload progress is complex with fetch.
            // Let's use fake progress or omitted for upload, OR standard fetch.
            // Since we compressed it, it's small now.

            const res = await fetch(endpoint, {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error('Upload failed');

            const data = await res.json();
            if (data.url) { // Local returns 'url', GitHub returns 'url'
                updateField('cover', data.url);
            }
        } catch (error) {
            console.error(error);
            alert('Upload failed, check console');
        } finally {
            setStatus('');
            setProgress(0);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-4">
            {/* QUALITY SELECTOR */}
            {!status && !formData.cover && (
                <div className="flex gap-2 mb-4">
                    <button
                        type="button"
                        onClick={() => setQuality('turbo')}
                        className={`flex-1 flex justify-center items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all ${quality === 'turbo'
                            ? 'bg-violet-50 border-violet-500 text-violet-700 shadow-sm'
                            : 'bg-white border-gray-200 text-gray-500 hover:border-violet-200'
                            }`}
                    >
                        <span>🚀</span> Turbo (Web)
                    </button>
                    <button
                        type="button"
                        onClick={() => setQuality('high')}
                        className={`flex-1 flex justify-center items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all ${quality === 'high'
                            ? 'bg-violet-50 border-violet-500 text-violet-700 shadow-sm'
                            : 'bg-white border-gray-200 text-gray-500 hover:border-violet-200'
                            }`}
                    >
                        <span>💎</span> High (Detail)
                    </button>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cover Image/Video URL *
                </label>
                <div className="flex gap-2 items-center">
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
                        disabled={!!status}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 flex items-center gap-2 min-w-[100px] justify-center"
                        title="Upload Local File"
                    >
                        {status ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                        <span className="hidden sm:inline">{status ? 'Busy' : 'Upload'}</span>
                    </button>

                    {isDetectingDimensions && (
                        <div className="flex items-center px-2 text-violet-600">
                            <Loader2 className="w-5 h-5 animate-spin" />
                        </div>
                    )}
                </div>

                {/* Status Bar */}
                {status && (
                    <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-xs text-gray-600">
                            <span>{status}</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                                className="bg-violet-600 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {/* Compression Result Banner */}
                {compressionResult && !status && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700 font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                        <UploadCloud className="w-3 h-3" />
                        <span>Saved: {compressionResult}</span>
                    </div>
                )}

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

