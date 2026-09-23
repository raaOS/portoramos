import { useState, useCallback } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { formatBytes } from '../utils/formatBytes';
import type { UploadedAsset } from '../types';
import type { UploadResult, UploadOptions } from './useStorageUpload';
import type { VideoCompressionProfile } from './useFFmpeg';

interface TrimOptions {
  start: number;
  end: number;
  crop?: { x: number; y: number; width: number; height: number } | null;
}

interface ExecuteUploadDeps {
  compressVideo: (
    file: File,
    onProgress: (p: number) => void,
    options?: { trimOptions?: TrimOptions; profile?: VideoCompressionProfile }
  ) => Promise<File>;
  upload: (file: File, uploadOptions?: UploadOptions) => Promise<UploadResult>;
  uploadVideoDirectToR2: (
    file: File,
    options?: {
      posterBlob?: Blob | null;
      onUploadProgress?: (p: number) => void;
    }
  ) => Promise<{
    success: boolean;
    url?: string;
    previewUrl?: string;
    posterUrl?: string;
    error?: string;
  }>;
  onUpload: (urls: string[]) => void;
  onUploadResult?: (results: UploadedAsset[]) => void;
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
  onUploadProgress?: (progress: number) => void;
  autoUpload?: boolean;
  onFileSelect?: (file: File) => void;
  folder?: string;
}

export function useExecuteUpload(deps: ExecuteUploadDeps) {
  const [status, setStatus] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const { showSuccess: showSuccessToast, showError, showWarning } = useToast();

  const executeUpload = useCallback(
    async (files: File[], trimOptions?: TrimOptions) => {
      const fileProgress = new Array(files.length).fill(0);
      const reportProgress = (value: number) => {
        const next = Math.min(100, Math.max(0, Math.round(value)));
        setProgress(next);
        deps.onUploadProgress?.(next);
      };
      const reportFileProgress = (index: number, value: number) => {
        fileProgress[index] = Math.min(100, Math.max(0, Math.round(value)));
        const total = fileProgress.reduce((sum, item) => sum + item, 0);
        reportProgress(total / files.length);
      };

      setStatus('starting');
      reportProgress(0);
      deps.onUploadStart?.();

      try {
        const uploadPromises = files.map(async (file, index) => {
          let fileToUpload = file;
          let videoWasClientProcessed = false;

          const isVideo = file.type.startsWith('video/');
          const isWallpaperVideo = isVideo && deps.folder === 'wallpapers';

          // ---------- WALLPAPER VIDEO: direct-to-R2 path ----------
          if (isWallpaperVideo && !trimOptions) {
            setStatus('Capturing poster frame...');
            reportFileProgress(index, 2);
            let posterBlob: Blob | null = null;
            try {
              const { captureVideoPoster } = await import('@/lib/videoPoster');
              const captured = await captureVideoPoster(file);
              posterBlob = captured.blob;
            } catch (e) {
              console.warn('Poster capture failed (will skip):', e);
            }

            setStatus('Uploading Video...');
            reportFileProgress(index, 5);
            const result = await deps.uploadVideoDirectToR2(file, {
              posterBlob,
              onUploadProgress: (networkProgress) => {
                reportFileProgress(index, 5 + (networkProgress / 100) * 90);
              },
            });
            if (!result.success) {
              throw new Error(result.error || 'Direct R2 upload failed');
            }
            setStatus('Finalizing...');
            reportFileProgress(index, 100);
            return {
              url: result.url,
              previewUrl: result.previewUrl,
              posterUrl: result.posterUrl,
            } as UploadedAsset;
          }

          // VIDEO COMPRESSION / TRIM (non-wallpaper or trim flow)
          if (isVideo) {
            const SKIP_CLIENT_THRESHOLD = 50 * 1024 * 1024; // 50MB
            const hasTrim = !!trimOptions;
            const shouldClientCompress = hasTrim || file.size > SKIP_CLIENT_THRESHOLD;

            if (shouldClientCompress) {
              try {
                const originalSize = file.size;
                const profile: VideoCompressionProfile =
                  deps.folder === 'wallpapers' ? 'high' : 'standard';
                fileToUpload = await deps.compressVideo(
                  file,
                  (p) => reportFileProgress(index, Math.min(70, p * 0.7)),
                  { trimOptions, profile }
                );
                reportFileProgress(index, 72);
                videoWasClientProcessed = true;
                const newSize = fileToUpload.size;
                showSuccessToast(
                  `Video Processed! ${(originalSize / 1024 / 1024).toFixed(2)}MB -> ${(newSize / 1024 / 1024).toFixed(2)}MB`
                );
              } catch (e) {
                console.error('Client compression failed, falling back to original', e);
                showWarning('Compression engine offline. Uploading original file...');
              }
            }
          }

          // DEFERRED UPLOAD MODE
          if (deps.autoUpload === false && deps.onFileSelect) {
            deps.onFileSelect(fileToUpload);
            const blobUrl = URL.createObjectURL(fileToUpload);
            reportFileProgress(index, 100);
            return { url: blobUrl } as UploadedAsset;
          }

          // IMMEDIATE UPLOAD MODE
          const isUploadingVideo = fileToUpload.type.startsWith('video/');
          const uploadStart = videoWasClientProcessed ? 72 : 0;
          const uploadSpan = videoWasClientProcessed ? 18 : 90;

          setStatus(isUploadingVideo ? 'Uploading Video...' : 'Uploading to Storage...');
          reportFileProgress(index, uploadStart);
          const uploadResult = await deps.upload(fileToUpload, {
            skipMainVideoOptimization: videoWasClientProcessed,
            onUploadProgress: (networkProgress) => {
              reportFileProgress(index, uploadStart + (networkProgress / 100) * uploadSpan);
              if (networkProgress >= 100) {
                setStatus(
                  isUploadingVideo ? 'Processing Video on Server...' : 'Processing Upload...'
                );
              }
            },
          });
          if (!uploadResult.success) {
            throw new Error(uploadResult.error || 'Upload failed');
          }
          setStatus('Finalizing...');
          reportFileProgress(index, 95);

          if (uploadResult.videoStats) {
            showSuccessToast(
              `Storage video ready: ${formatBytes(uploadResult.videoStats.optimizedSize)} + preview ${formatBytes(uploadResult.videoStats.previewSize)}`
            );
          }

          if (
            uploadResult.imageStats &&
            uploadResult.imageStats.optimizedSize < uploadResult.imageStats.originalSize
          ) {
            const ratio = Math.max(
              0,
              Math.round(
                (1 - uploadResult.imageStats.optimizedSize / uploadResult.imageStats.originalSize) *
                  100
              )
            );
            showSuccessToast(
              `Image compressed: ${formatBytes(uploadResult.imageStats.originalSize)} -> ${formatBytes(uploadResult.imageStats.optimizedSize)} (-${ratio}%)`
            );
          }

          if (
            uploadResult.audioStats &&
            uploadResult.audioStats.optimizedSize < uploadResult.audioStats.originalSize
          ) {
            const ratio = Math.max(
              0,
              Math.round(
                (1 - uploadResult.audioStats.optimizedSize / uploadResult.audioStats.originalSize) *
                  100
              )
            );
            showSuccessToast(
              `Audio compressed: ${formatBytes(uploadResult.audioStats.originalSize)} -> ${formatBytes(uploadResult.audioStats.optimizedSize)} (-${ratio}%)`
            );
          }

          reportFileProgress(index, 100);

          return {
            url: uploadResult.url,
            previewUrl: uploadResult.previewUrl,
            posterUrl: uploadResult.posterUrl,
          } as UploadedAsset;
        });

        const results = await Promise.all(uploadPromises);
        const urlResults = results.map((r) => r.url);
        deps.onUpload(urlResults);
        if (deps.onUploadResult) {
          deps.onUploadResult(results);
        }

        if (deps.autoUpload !== false) {
          showSuccessToast('All files processed successfully.');
        }

        setStatus('Upload Complete!');
        reportProgress(100);

        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (err: unknown) {
        console.error(err);
        showError(`Process failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setStatus('');
        setProgress(0);
        deps.onUploadEnd?.();
      }
    },
    [deps, showSuccessToast, showError, showWarning]
  );

  return { executeUpload, status, progress };
}
