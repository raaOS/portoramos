'use client';

import { useCallback } from 'react';
import { postFormDataWithProgress } from '../utils/xhrUpload';
import { useDirectR2Upload } from './useDirectR2Upload';

export interface UseStorageUploadOptions {
  folder?: string;
  customFilename?: string;
  csrfToken?: string;
}

export interface UploadResult {
  url: string;
  previewUrl?: string;
  posterUrl?: string;
  videoStats?: {
    originalSize: number;
    optimizedSize: number;
    previewSize: number;
    posterSize: number;
  } | null;
  imageStats?: {
    originalSize: number;
    optimizedSize: number;
    width?: number;
    height?: number;
  } | null;
  audioStats?: {
    originalSize: number;
    optimizedSize: number;
  } | null;
  storageProvider?: 'r2';
  success: boolean;
  error?: string;
}

export interface UploadOptions {
  skipMainVideoOptimization?: boolean;
  onUploadProgress?: (progress: number) => void;
}

export function useStorageUpload(options: UseStorageUploadOptions = {}) {
  const { folder, customFilename, csrfToken } = options;
  const { uploadVideoDirectToR2 } = useDirectR2Upload(folder, csrfToken);

  const upload = useCallback(
    async (file: File, uploadOptions: UploadOptions = {}): Promise<UploadResult> => {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const params = new URLSearchParams();
        if (folder) params.append('folder', folder);
        if (customFilename) params.append('filename', customFilename);
        if (uploadOptions.skipMainVideoOptimization) {
          params.append('skipMainVideoOptimization', '1');
        }

        const query = params.toString();
        const data = await postFormDataWithProgress(
          `/api/admin/upload${query ? `?${query}` : ''}`,
          formData,
          csrfToken ? { 'x-csrf-token': csrfToken } : {},
          uploadOptions.onUploadProgress
        );

        if (!data.url) {
          throw new Error(data.error || 'Upload response did not include a URL');
        }

        return {
          url: data.url,
          previewUrl: data.previewUrl,
          posterUrl: data.posterUrl,
          videoStats: data.videoStats,
          imageStats: data.imageStats,
          audioStats: data.audioStats,
          storageProvider: data.storageProvider,
          success: true,
        };
      } catch (error) {
        console.error('[useStorageUpload] Error:', error);
        return {
          url: '',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    [folder, customFilename, csrfToken]
  );

  return { upload, uploadVideoDirectToR2 };
}
