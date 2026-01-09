'use client';

import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

interface AdminFileUploadProps {
  onUpload: (urls: string[]) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // in MB
  className?: string;
  disabled?: boolean;
}

export default function AdminFileUpload({
  onUpload,
  accept = 'image/*,video/*',
  multiple = true,
  maxFiles = 10,
  maxSize = 10,
  className = '',
  disabled = false
}: AdminFileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [status, setStatus] = useState<string>(''); // 'idle', 'loading-core', 'compressing', 'uploading'
  const [progress, setProgress] = useState(0); // 0-100
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showSuccess: success, showError, showWarning } = useToast();

  // FFmpeg Ref
  const ffmpegRef = useRef<FFmpeg | null>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Check file size (Pre-compression check)
    // For video, we allow larger input because we will compress it.
    // Let's say we allow up to 100MB input for video, and 10MB for images.
    const isVideo = file.type.startsWith('video/');
    const limit = isVideo ? 100 : maxSize; // 100MB for video input allowed

    if (file.size > limit * 1024 * 1024) {
      return `File ${file.name} is too large. Max size is ${limit}MB.`;
    }

    // Check file type
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

  // Load FFmpeg
  const loadFFmpeg = async () => {
    if (ffmpegRef.current) return ffmpegRef.current;

    setStatus('Loading Compression Core...');
    const ffmpeg = new FFmpeg();

    try {
      const baseURL = window.location.origin + '/ffmpeg';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      console.log('✅ FFmpeg Loaded Successfully');
    } catch (e) {
      console.error('❌ FFmpeg Load Failed:', e);
      throw new Error('Compression engine failed to load.');
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

    // Run compression
    await ffmpeg.exec([
      '-i', inputName,
      '-vf', "scale='if(gt(iw,ih),-2,720)':'if(gt(iw,ih),720,-2)'",
      '-c:v', 'libx264',
      '-crf', '23',
      '-preset', 'fast', // ultrafast might be better if user wants speed over size? 'fast' is good balance.
      '-an',
      '-movflags', '+faststart',
      outputName
    ]);

    // Cleanup listener (optional but good practice if reuse)
    // ffmpeg.off('progress') // API might vary, but for ref usually ok.

    // Read output
    const data = await ffmpeg.readFile(outputName);

    // Create new file
    const blob = new Blob([data as any], { type: 'video/mp4' });
    return new File([blob], file.name, { type: 'video/mp4' });
  };

  // [STICKY NOTE] GITHUB UPLOADER
  // Fungsi ini menggantikan Cloudinary.
  // File akan dikirim ke API `/api/upload/github` yang kemudian akan upload ke Repo.
  // Hasilnya adalah "Raw URL" (sumber asli) yang bisa kita pakai selamanya.
  // KEMBALIAN: { url, publicPath } untuk keperluan kompresi
  const uploadToGitHub = useCallback(async (file: File): Promise<{ url: string; publicPath?: string }> => {
    setStatus('Uploading to GitHub...');
    const formData = new FormData();
    formData.append('file', file);

    // Kirim ke endpoint GitHub kita
    const response = await fetch('/api/upload/github', {
      method: 'POST',
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

    // Kita pakai public path atau url (tergantung kebutuhan, tapi rawUrl safer untuk bypass cache)
    return { url: data.url, publicPath: data.publicPath };
  }, []);

  // Server-side Image Compression (Generic Asset)
  const compressImageServer = useCallback(async (filePath: string): Promise<{ success: boolean; stats?: any; newPath?: string }> => {
    try {
      setStatus('Optimizing Image (Server)...');
      const response = await fetch('/api/admin/compress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath }),
      });

      if (!response.ok) {
        console.warn('Compression failed but file uploaded.');
        return { success: false };
      }

      const data = await response.json();
      console.log('Compression result:', data);
      return { success: true, stats: data, newPath: data.newPath };
    } catch (e) {
      console.error('Compression request failed:', e);
      return { success: false };
    }
  }, []);

  const handleFiles = useCallback(async (files: FileList) => {
    if (disabled) return;

    const fileArray = Array.from(files);

    // Check file count
    if (fileArray.length > maxFiles) {
      showError(`Too many files. Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate files
    const validationErrors: string[] = [];
    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) validationErrors.push(error);
    });

    if (validationErrors.length > 0) {
      showError(`Invalid files: ${validationErrors.join(', ')}`);
      return;
    }

    setStatus('starting');
    setProgress(0);

    try {
      const uploadPromises = fileArray.map(async (file, index) => {
        let fileToUpload = file;
        // 1. VIDEO COMPRESSION (Client Side)
        if (file.type.startsWith('video/')) {
          console.log('Video detected, compressing client-side...');
          try {
            const originalSize = file.size;
            // Reset progress for compression phase
            setProgress(0);
            fileToUpload = await compressVideoClient(file, (p) => setProgress(p));
            const newSize = fileToUpload.size;
            success(`Video Compressed! ${(originalSize / 1024 / 1024).toFixed(2)}MB -> ${(newSize / 1024 / 1024).toFixed(2)}MB`);
          } catch (e) {
            console.error('Client compression failed, falling back to original', e);
            showWarning('Compression engine offline. Uploading original file...');
            // Proceed with original file
          }
        }

        // 2. UPLOAD
        const { url, publicPath } = await uploadToGitHub(fileToUpload);
        setProgress(((index + 1) / fileArray.length) * 100);

        let finalUrl = url;

        // 3. IMAGE COMPRESSION (Server Side)
        if (file.type.startsWith('image/') && publicPath) {
          const { success: compSuccess, stats, newPath } = await compressImageServer(publicPath); // Use publicPath for compression

          if (compSuccess && stats) {
            success(`${file.name} Optimized! (${stats.originalSize} -> ${stats.newSize}). Saved ${stats.saved}`);
            if (newPath && newPath !== publicPath) {
              // Check if newPath is webp
              const extOld = '.' + file.name.split('.').pop()?.toLowerCase();
              if (finalUrl.includes(extOld) && newPath.endsWith('.webp')) {
                finalUrl = finalUrl.replace(extOld, '.webp');
              }
            }
          }
        }

        return finalUrl;
      });

      const urls = await Promise.all(uploadPromises);
      onUpload(urls);
      success('All files processed successfully.');
    } catch (err: any) {
      console.error(err);
      showError(`Process failed: ${err.message || 'Unknown error'}`);
    } finally {
      setStatus('');
      setProgress(0);
    }
  }, [disabled, maxFiles, validateFile, uploadToGitHub, compressImageServer, compressVideoClient, onUpload, success, showError]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [disabled, handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  return (
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
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        aria-label="File upload area"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />

        {status ? (
          <div className="space-y-4" aria-live="polite">
            <div className="flex items-center justify-center">
              <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></span>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">
                {status}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
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
                {accept.includes('image') && accept.includes('video')
                  ? 'Video (up to 100MB, auto-compressed) / Images'
                  : accept.includes('image')
                    ? 'Images up to 10MB'
                    : 'Files up to 10MB'
                }
              </p>
              {multiple && (
                <p className="text-xs text-gray-500">
                  Maximum {maxFiles} files
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
