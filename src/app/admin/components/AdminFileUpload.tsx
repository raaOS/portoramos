'use client';

import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/contexts/ToastContext';
// FFmpeg imports removed from top-level to improve bundle size
import { Loader2, CheckCircle2 } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';


interface AdminFileUploadProps {
  onUpload: (urls: string[]) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // in MB
  className?: string;
  disabled?: boolean;
  folder?: string;        // 'temp', 'comparisons', or default 'projects'
  customFilename?: string; // Optional custom filename (without extension)
}

export default function AdminFileUpload({
  onUpload,
  accept = 'image/*,video/*',
  multiple = true,
  maxFiles = 10,
  maxSize = 10,
  className = '',
  disabled = false,
  enableCrop = false,
  enableVideoTrim = false,
  autoUpload = true,
  onFileSelect,
  folder,
  customFilename
}: AdminFileUploadProps & { enableCrop?: boolean; enableVideoTrim?: boolean; autoUpload?: boolean; onFileSelect?: (file: File) => void }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showSuccess: success, showError, showWarning } = useToast();
  const { csrfToken } = useAdminAuth();

  // Cropping & Trimming State
  const [activeCrop, setActiveCrop] = useState<{ src: string; file: File } | null>(null);
  const [activeTrim, setActiveTrim] = useState<{ file: File } | null>(null);

  // FFmpeg Ref
  const ffmpegRef = useRef<any>(null);

  const validateFile = useCallback((file: File): string | null => {
    // limit video size to maxSize as well (default 10MB, but can be higher)
    // Caller should pass appropriate maxSize (e.g. 200) for video contexts
    const limit = maxSize;

    if (file.size > limit * 1024 * 1024) {
      return `File ${file.name} is too large. Max size is ${limit}MB.`;
    }

    const acceptedTypes = accept.split(',').map(type => type.trim());
    const fileType = file.type;
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    const isValidType = acceptedTypes.some(type => {
      if (type.endsWith('/*')) {
        const baseType = type.split('/')[0];
        return fileType.startsWith(baseType + '/');
      }
      return fileType === type || fileExtension === type;
    });

    if (!isValidType) {
      return `File ${file.name} is not a supported format.`;
    }

    return null;
  }, [accept, maxSize]);

  const loadFFmpeg = async () => {
    if (ffmpegRef.current) return ffmpegRef.current;
    setStatus('Loading Compression Core...');

    // Dynamic import to save ~500KB from initial bundle
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    const { toBlobURL } = await import('@ffmpeg/util');

    const ffmpeg = new FFmpeg();
    try {
      const baseURL = window.location.origin + '/ffmpeg';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
    } catch (e) {
      throw new Error('Compression engine failed to load.');
    }
    ffmpegRef.current = ffmpeg;
    return ffmpeg;
  };

  const compressVideoClient = useCallback(async (
    file: File,
    onProgress: (p: number) => void,
    trimOptions?: { start: number; end: number; crop?: { x: number; y: number; width: number; height: number } }
  ): Promise<File> => {
    setStatus('Initializing Compressor...');
    const ffmpeg = await loadFFmpeg();
    setStatus('Compressing Video (Wait)...');

    const inputName = 'input.mp4';
    const outputName = 'output.mp4';
    const startTime = Date.now();

    const { fetchFile } = await import('@ffmpeg/util');
    await ffmpeg.writeFile(inputName, await fetchFile(file));

    ffmpeg.on('progress', ({ progress }: { progress: number }) => {
      const percent = Math.round(progress * 100);
      onProgress(percent);
      if (progress > 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        const estimatedTotal = elapsed / progress;
        const remaining = Math.round(estimatedTotal - elapsed);
        setStatus(`Compressing Video (${percent}%) - ~${remaining}s remaining...`);
      } else {
        setStatus(`Compressing Video (${percent}%)...`);
      }
    });

    const ffmpegArgs: string[] = [];

    // Trim (Fast Seek)
    if (trimOptions) {
      ffmpegArgs.push('-ss', trimOptions.start.toString());
      ffmpegArgs.push('-to', trimOptions.end.toString());
    }

    ffmpegArgs.push('-i', inputName);

    // Filters (Crop + Scale)
    const filters: string[] = [];

    if (trimOptions?.crop) {
      const { width, height, x, y } = trimOptions.crop;
      // Ensure even dimensions
      const w = Math.round(width / 2) * 2;
      const h = Math.round(height / 2) * 2;
      const px = Math.round(x / 2) * 2;
      const py = Math.round(y / 2) * 2;
      filters.push(`crop=${w}:${h}:${px}:${py}`);
    }

    // Scale logic: Scale to 720p (short side) if needed
    // Only scale if not already cropped small
    filters.push("scale='if(gt(iw,ih),-2,720)':'if(gt(iw,ih),720,-2)'");

    ffmpegArgs.push('-vf', filters.join(','));

    ffmpegArgs.push('-c:v', 'libx264');
    ffmpegArgs.push('-crf', '23');
    ffmpegArgs.push('-preset', 'fast');
    ffmpegArgs.push('-an');
    ffmpegArgs.push('-movflags', '+faststart');
    ffmpegArgs.push(outputName);

    await ffmpeg.exec(ffmpegArgs);

    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data as any], { type: 'video/mp4' });
    return new File([blob], file.name, { type: 'video/mp4' });
  }, []); // ffmpegRef is persistent

  const uploadToGitHub = useCallback(async (file: File): Promise<{ url: string; publicPath?: string; warning?: string }> => {
    setStatus('Uploading to GitHub...');
    const formData = new FormData();
    formData.append('file', file);

    // Construct Query Params
    const params = new URLSearchParams();
    if (folder) params.append('folder', folder);
    if (customFilename) params.append('filename', customFilename);

    const response = await fetch(`/api/upload/github?${params.toString()}`, {
      method: 'POST',
      headers: {
        'x-csrf-token': csrfToken
      },
      credentials: 'include',
      body: formData,
    });
    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.error || 'GitHub upload failed');
      } catch {
        throw new Error(errorText || 'GitHub upload failed');
      }
    }
    const data = await response.json();
    return { url: data.url, publicPath: data.publicPath, warning: data.warning };
  }, [folder, customFilename, csrfToken]); // Add folder/filename and csrfToken to dependencies

  const compressImageServer = useCallback(async (filePath: string): Promise<{ success: boolean; stats?: any; newPath?: string }> => {
    try {
      setStatus('Optimizing Image (Server)...');
      const response = await fetch('/api/admin/compress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        credentials: 'include',
        body: JSON.stringify({ filePath }),
      });
      if (!response.ok) {
        return { success: false };
      }
      const data = await response.json();
      return { success: true, stats: data, newPath: data.newPath };
    } catch (e) {
      return { success: false };
    }
  }, [csrfToken]);

  const executeUpload = useCallback(async (files: File[], trimOptions?: { start: number; end: number; crop?: any }) => {
    setStatus('starting');
    setProgress(0);

    try {
      const uploadPromises = files.map(async (file, index) => {
        let fileToUpload = file;

        // VIDEO COMPRESSION / TRIM
        if (file.type.startsWith('video/')) {
          try {
            const originalSize = file.size;
            // setProgress(0); // Optional: reset for individual?
            fileToUpload = await compressVideoClient(file, (p) => setProgress(p), trimOptions);
            const newSize = fileToUpload.size;
            success(`Video Processed! ${(originalSize / 1024 / 1024).toFixed(2)}MB -> ${(newSize / 1024 / 1024).toFixed(2)}MB`);
          } catch (e) {
            console.error('Client compression failed, falling back to original', e);
            showWarning('Compression engine offline. Uploading original file...');
          }
        }

        // DEFERRED UPLOAD MODE
        if (autoUpload === false && onFileSelect) {
          onFileSelect(fileToUpload);
          // We return a fake URL-like string or just empty, 
          // because the parent ProjectForm handles the Blob logic now.
          // Or we can return a Blob URL so it renders in the UI immediately without callback complexity?
          // Actually, validateFile logic expects onUpload to callback with URLs?
          // AdminFileUploadProps calls onUpload(urls).
          // If we are in manual mode, maybe we call onUpload with a Blob URL?
          // Yes, let's create a Blob URL so the parent (ProjectMediaUpload) can display it immediately.
          const blobUrl = URL.createObjectURL(fileToUpload);
          return blobUrl;
        }

        // IMMEDIATE UPLOAD MODE
        const { url, publicPath, warning } = await uploadToGitHub(fileToUpload);
        if (warning) {
          showWarning(warning);
        }
        setProgress(((index + 1) / files.length) * 100);
        let finalUrl = url;

        const isImageFile = file.type.startsWith('image/') || file.name.toLowerCase().endsWith('.icns');

        if (isImageFile && publicPath) {
          const { success: compSuccess, stats, newPath } = await compressImageServer(publicPath);
          if (compSuccess && stats) {
            success(`${file.name} Optimized! (${stats.originalSize} -> ${stats.newSize}). Saved ${stats.saved}`);
            if (newPath && newPath !== publicPath) {
              const extOld = '.' + file.name.split('.').pop()?.toLowerCase();
              if (finalUrl.includes(extOld) && newPath.endsWith('.webp')) {
                finalUrl = finalUrl.replace(extOld, '.webp');
              }
            }
          }
        }
        return finalUrl;
      });

      const results = await Promise.all(uploadPromises);

      // If deferred mode, we might pass the blobUrls so ProjectMediaUpload can show preview
      // But we also called onFileSelect(file) above.
      // onUpload(results) might be confusing if results are blob URLs.
      // But ProjectMediaUpload displays "cover" which is usually a string.
      // So blob URL is fine for preview!
      onUpload(results);

      if (autoUpload !== false) {
        success('All files processed successfully.');
      }

      // UX Improvement: Show Success State
      setStatus('Upload Complete!');
      setProgress(100);

      // Wait 2 seconds before resetting
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (err: any) {
      console.error(err);
      showError(`Process failed: ${err.message || 'Unknown error'}`);
    } finally {
      setStatus('');
      setProgress(0);
    }
  }, [uploadToGitHub, compressImageServer, compressVideoClient, onUpload, success, showError, showWarning, autoUpload, onFileSelect]);

  const handleFiles = useCallback(async (files: FileList) => {
    if (disabled) return;
    const fileArray = Array.from(files);

    if (fileArray.length > maxFiles) {
      showError(`Too many files. Maximum ${maxFiles} files allowed`);
      return;
    }

    const validationErrors: string[] = [];
    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) validationErrors.push(error);
    });

    if (validationErrors.length > 0) {
      showError(`Invalid files: ${validationErrors.join(', ')}`);
      return;
    }

    if (enableCrop && fileArray.length === 1 && fileArray[0].type.startsWith('image/')) {
      const file = fileArray[0];
      const reader = new FileReader();
      reader.onload = () => {
        setActiveCrop({ src: reader.result as string, file });
      };
      reader.readAsDataURL(file);
      return;
    }

    if (enableVideoTrim && fileArray.length === 1 && fileArray[0].type.startsWith('video/')) {
      const file = fileArray[0];
      setActiveTrim({ file });
      return;
    }

    executeUpload(fileArray);

  }, [disabled, maxFiles, validateFile, executeUpload, enableCrop, enableVideoTrim, showError]);

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!activeCrop) return;
    const croppedFile = new File([croppedBlob], activeCrop.file.name, {
      type: activeCrop.file.type,
      lastModified: Date.now(),
    });
    setActiveCrop(null);
    executeUpload([croppedFile]);
  };
  const handleCropCancel = () => { setActiveCrop(null); };

  const handleTrimConfirm = (start: number, end: number, crop?: any) => {
    if (!activeTrim) return;
    const file = activeTrim.file;
    setActiveTrim(null);
    executeUpload([file], { start, end, crop });
  };
  const handleTrimCancel = () => { setActiveTrim(null); };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); if (!disabled) setIsDragOver(true);
  }, [disabled]);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false);
  }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false);
    if (!disabled && e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  }, [disabled, handleFiles]);
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) handleFiles(e.target.files);
  }, [handleFiles]);
  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) fileInputRef.current.click();
  }, [disabled]);

  return (
    <>
      {activeCrop && (
        <ImageCropperWrapper
          src={activeCrop.src}
          onConfirm={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}

      {activeTrim && (
        <VideoTrimmerWrapper
          file={activeTrim.file}
          onConfirm={handleTrimConfirm}
          onCancel={handleTrimCancel}
        />
      )}

      <div className={`w-full ${className}`}>
        <div
          className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragOver
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
            }
          ${disabled
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-gray-50'
            }
        `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); }
          }}
          aria-label="File upload area"
        >
          <input ref={fileInputRef} type="file" accept={accept} multiple={multiple} onChange={handleFileInput} className="hidden" disabled={disabled} />

          {status ? (
            <div className="space-y-4 w-full max-w-md mx-auto" aria-live="polite">
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="relative">
                  {status === 'Upload Complete!' ? (
                    <div className="relative bg-white p-3 rounded-2xl shadow-sm border border-green-100 animate-in zoom-in duration-300">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-violet-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                      <div className="relative bg-white p-3 rounded-2xl shadow-sm border border-violet-100">
                        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-1 text-center">
                  <p className={`text-sm font-semibold ${status === 'Upload Complete!' ? 'text-green-600' : 'text-gray-900'}`}>{status}</p>
                  <p className="text-xs text-gray-500 font-mono">{progress}% Complete</p>
                </div>

                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-full rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(139,92,246,0.3)]"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900">
                  {isDragOver ? 'Drop files here' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-gray-500">
                  {accept.includes('image') && accept.includes('video') ? 'Video (up to 100MB, auto-compressed) / Images' : 'Files up to 10MB'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Wrappers for Lazy Loading
import ImageCropper from '@/components/admin/ImageCropper';
import VideoTrimmer from '@/components/admin/VideoTrimmer';

function ImageCropperWrapper({ src, onConfirm, onCancel }: { src: string, onConfirm: (b: Blob) => void, onCancel: () => void }) {
  return <ImageCropper imageSrc={src} onCropComplete={onConfirm} onCancel={onCancel} />;
}

function VideoTrimmerWrapper({ file, onConfirm, onCancel }: { file: File, onConfirm: (s: number, e: number, c?: any) => void, onCancel: () => void }) {
  return <VideoTrimmer file={file} onConfirm={onConfirm} onCancel={onCancel} />;
}
