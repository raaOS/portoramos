'use client';

import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/contexts/ToastContext';

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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showSuccess: success, showError, showWarning } = useToast();

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `File ${file.name} is too large. Maximum size is ${maxSize}MB.`;
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

  // [STICKY NOTE] GITHUB UPLOADER
  // Fungsi ini menggantikan Cloudinary.
  // File akan dikirim ke API `/api/upload/github` yang kemudian akan upload ke Repo.
  // Hasilnya adalah "Raw URL" (sumber asli) yang bisa kita pakai selamanya.
  const uploadToGitHub = useCallback(async (file: File): Promise<string> => {
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
    return data.url;
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

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadPromises = fileArray.map(async (file, index) => {
        // CALL GITHUB UPLOADER
        const url = await uploadToGitHub(file);
        setUploadProgress(((index + 1) / fileArray.length) * 100);
        return url;
      });

      const urls = await Promise.all(uploadPromises);
      onUpload(urls);
      success(`Files uploaded successfully to GitHub. ${urls.length} file(s) uploaded`);
    } catch (err: any) {
      console.error(err);
      showError(`Upload failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [disabled, maxFiles, validateFile, uploadToGitHub, onUpload, success, showError]);

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

        {isUploading ? (
          <div className="space-y-4" aria-live="polite">
            <div className="flex items-center justify-center">
              <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></span>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">Uploading files...</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">{Math.round(uploadProgress)}% complete</p>
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
                  ? 'Images and videos up to 10MB'
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
