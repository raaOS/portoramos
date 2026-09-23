'use client';

import { useAdminAuth } from '@/hooks/useAdminAuth';
import {
  useFileValidation,
  useFFmpeg,
  useStorageUpload,
  useExecuteUpload,
  useFileHandlers,
} from './file-upload/hooks';
import {
  UploadProgress,
  UploadDropzone,
  UploadModalPortal,
  ImageCropperWrapper,
  VideoTrimmerWrapper,
  UploadCompactVariant,
  UploadButtonVariant,
} from './file-upload/components';
import type { AdminFileUploadProps } from './file-upload/types';

export default function AdminFileUpload({
  onUpload,
  onUploadResult,
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
  onUploadEnd,
  onUploadProgress,
  customValidator,
  variant = 'default',
}: AdminFileUploadProps) {
  const { csrfToken: _csrfToken } = useAdminAuth();

  // Core hooks
  const { validateFiles } = useFileValidation({ accept, maxSize });
  const { compressVideo } = useFFmpeg();
  const { upload, uploadVideoDirectToR2 } = useStorageUpload({
    folder,
    customFilename,
    csrfToken: _csrfToken || '',
  });

  // Upload execution
  const { executeUpload, status, progress } = useExecuteUpload({
    compressVideo,
    upload,
    uploadVideoDirectToR2,
    onUpload,
    onUploadResult,
    onUploadStart,
    onUploadEnd,
    onUploadProgress,
    autoUpload,
    onFileSelect,
    folder,
  });

  // File handling, drag-drop, crop, trim
  const {
    isDragOver,
    activeCrop,
    activeTrim,
    fileInputRef,
    handleCropComplete,
    handleCropCancel,
    handleTrimConfirm,
    handleTrimCancel,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInput,
    handleClick,
  } = useFileHandlers({
    disabled,
    maxFiles,
    accept,
    maxSize,
    enableCrop,
    enableVideoTrim,
    customValidator,
    validateFiles,
    executeUpload,
  });

  return (
    <>
      {/* Modals */}
      {activeCrop && (
        <UploadModalPortal>
          <ImageCropperWrapper
            src={activeCrop.src}
            onConfirm={handleCropComplete}
            onCancel={handleCropCancel}
          />
        </UploadModalPortal>
      )}

      {activeTrim && (
        <UploadModalPortal>
          <VideoTrimmerWrapper
            file={activeTrim.file}
            onConfirm={handleTrimConfirm}
            onCancel={handleTrimCancel}
          />
        </UploadModalPortal>
      )}

      {/* Upload Area */}
      <div
        className={
          variant === 'button' ? `w-auto flex-shrink-0 ${className}` : `w-full ${className}`
        }
      >
        {status ? (
          <UploadProgress status={status} progress={progress} />
        ) : variant === 'compact' ? (
          <UploadCompactVariant
            disabled={disabled}
            isDragOver={isDragOver}
            accept={accept}
            multiple={multiple}
            fileInputRef={fileInputRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
            onFileInput={handleFileInput}
          />
        ) : variant === 'button' ? (
          <UploadButtonVariant
            disabled={disabled}
            accept={accept}
            multiple={multiple}
            fileInputRef={fileInputRef}
            onClick={handleClick}
            onFileInput={handleFileInput}
          />
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

// Re-export hooks and components
export * from './file-upload/hooks';
export * from './file-upload/components';
