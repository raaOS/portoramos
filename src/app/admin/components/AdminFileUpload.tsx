'use client';

import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import {
    useFileValidation,
    useFFmpeg,
    useFirebaseUpload
} from './file-upload/hooks';
import {
    UploadProgress,
    UploadDropzone
} from './file-upload/components';
import type { AdminFileUploadProps } from './file-upload/types';

// Import wrappers for lazy loading
import ImageCropper from '@/components/admin/ImageCropper';
import VideoTrimmer from '@/components/admin/VideoTrimmer';

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
    customFilename,
    onUploadStart,
    onUploadEnd
}: AdminFileUploadProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [status, setStatus] = useState<string>('');
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showSuccess: showSuccessToast, showError, showWarning } = useToast();
    const { csrfToken: _csrfToken } = useAdminAuth();

    // Cropping & Trimming State
    const [activeCrop, setActiveCrop] = useState<{ src: string; file: File } | null>(null);
    const [activeTrim, setActiveTrim] = useState<{ file: File } | null>(null);

    // Hooks
    const { validateFiles } = useFileValidation({ accept, maxSize });
    const { compressVideo } = useFFmpeg(setStatus);
    const { upload } = useFirebaseUpload();

    const executeUpload = useCallback(async (
        files: File[],
        trimOptions?: { start: number; end: number; crop?: { x: number; y: number; width: number; height: number } | null }
    ) => {
        setStatus('starting');
        setProgress(0);
        onUploadStart?.();

        try {
            const uploadPromises = files.map(async (file, index) => {
                let fileToUpload = file;

                // VIDEO COMPRESSION / TRIM
                if (file.type.startsWith('video/')) {
                    try {
                        const originalSize = file.size;
                        fileToUpload = await compressVideo(file, (p) => setProgress(p), trimOptions);
                        const newSize = fileToUpload.size;
                        showSuccessToast(`Video Processed! ${(originalSize / 1024 / 1024).toFixed(2)}MB -> ${(newSize / 1024 / 1024).toFixed(2)}MB`);
                    } catch (e) {
                        console.error('Client compression failed, falling back to original', e);
                        showWarning('Compression engine offline. Uploading original file...');
                    }
                }

                // DEFERRED UPLOAD MODE
                if (autoUpload === false && onFileSelect) {
                    onFileSelect(fileToUpload);
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
                        showSuccessToast(`${file.name} Optimized! (${stats.originalSize} -> ${stats.newSize}). Saved ${stats.saved}`);
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
            onUpload(results);

            if (autoUpload !== false) {
                showSuccessToast('All files processed successfully.');
            }

            setStatus('Upload Complete!');
            setProgress(100);

            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (err: unknown) {
            console.error(err);
            showError(`Process failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setStatus('');
            setProgress(0);
            onUploadEnd?.();
        }
    }, [compressVideo, upload, onUpload, onUploadStart, onUploadEnd, showSuccessToast, showError, showWarning, autoUpload, onFileSelect, customFilename, folder]);

    const handleFiles = useCallback(async (files: FileList) => {
        if (disabled) return;
        const fileArray = Array.from(files);

        if (fileArray.length > maxFiles) {
            showError(`Too many files. Maximum ${maxFiles} files allowed`);
            return;
        }

        const validationErrors = validateFiles(fileArray);
        if (validationErrors.length > 0) {
            showError(`Invalid files: ${validationErrors.join(', ')}`);
            return;
        }

        // Handle crop for single image
        if (enableCrop && fileArray.length === 1 && fileArray[0].type.startsWith('image/')) {
            const file = fileArray[0];
            const reader = new FileReader();
            reader.onload = () => {
                setActiveCrop({ src: reader.result as string, file });
            };
            reader.readAsDataURL(file);
            return;
        }

        // Handle trim for single video
        if (enableVideoTrim && fileArray.length === 1 && fileArray[0].type.startsWith('video/')) {
            setActiveTrim({ file: fileArray[0] });
            return;
        }

        executeUpload(fileArray);
    }, [disabled, maxFiles, validateFiles, executeUpload, enableCrop, enableVideoTrim, showError]);

    // Crop handlers
    const handleCropComplete = async (croppedBlob: Blob) => {
        if (!activeCrop) return;
        const croppedFile = new File([croppedBlob], activeCrop.file.name, {
            type: activeCrop.file.type,
            lastModified: Date.now(),
        });
        setActiveCrop(null);
        executeUpload([croppedFile]);
    };

    const handleCropCancel = () => setActiveCrop(null);

    // Trim handlers
    const handleTrimConfirm = (
        start: number,
        end: number,
        crop?: { x: number; y: number; width: number; height: number } | null
    ) => {
        if (!activeTrim) return;
        const file = activeTrim.file;
        setActiveTrim(null);
        executeUpload([file], { start, end, crop });
    };

    const handleTrimCancel = () => setActiveTrim(null);

    // Drag & drop handlers
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (!disabled) setIsDragOver(true);
    }, [disabled]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (!disabled && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    }, [disabled, handleFiles]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    }, [handleFiles]);

    const handleClick = useCallback(() => {
        if (!disabled && fileInputRef.current) {
            fileInputRef.current.click();
        }
    }, [disabled]);

    return (
        <>
            {/* Modals */}
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

            {/* Upload Area */}
            <div className={`w-full ${className}`}>
                {status ? (
                    <UploadProgress status={status} progress={progress} />
                ) : (
                    <UploadDropzone
                        isDragOver={isDragOver}
                        disabled={disabled}
                        accept={accept}
                        multiple={multiple}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={handleClick}
                        onFileInput={handleFileInput}
                        fileInputRef={fileInputRef}
                    />
                )}
            </div>
        </>
    );
}

// Wrappers for Lazy Loading
function ImageCropperWrapper({
    src,
    onConfirm,
    onCancel
}: {
    src: string;
    onConfirm: (b: Blob) => void;
    onCancel: () => void;
}) {
    return <ImageCropper imageSrc={src} onCropComplete={onConfirm} onCancel={onCancel} />;
}

function VideoTrimmerWrapper({
    file,
    onConfirm,
    onCancel
}: {
    file: File;
    onConfirm: (s: number, e: number, c?: { x: number; y: number; width: number; height: number } | null) => void;
    onCancel: () => void;
}) {
    return <VideoTrimmer file={file} onConfirm={onConfirm} onCancel={onCancel} />;
}

// Re-export hooks and components
export * from './file-upload/hooks';
export * from './file-upload/components';
