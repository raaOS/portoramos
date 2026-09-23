'use client';

import { useCallback } from 'react';
import { postFormDataWithProgress, putFileWithProgress } from '../utils/xhrUpload';
import type { UploadOptions, UploadResult } from './useStorageUpload';

export function useDirectR2Upload(folder?: string, csrfToken?: string) {
  const uploadVideoDirectToR2 = useCallback(
    async (
      file: File,
      videoOptions: UploadOptions & { posterBlob?: Blob | null } = {}
    ): Promise<UploadResult> => {
      try {
        if (!file.type.startsWith('video/')) {
          throw new Error('uploadVideoDirectToR2 hanya untuk video');
        }

        // 1) Ask the server for a signed URL.
        const presignRes = await fetch('/api/admin/upload/presign', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
          },
          body: JSON.stringify({
            folder: folder || 'wallpapers',
            filename: file.name,
            contentType: file.type,
            size: file.size,
          }),
        });
        if (!presignRes.ok) {
          const err = await presignRes.json().catch(() => ({}) as { error?: string });
          throw new Error(err.error || `Failed to issue presigned URL (${presignRes.status})`);
        }
        const presigned = (await presignRes.json()) as {
          uploadUrl: string;
          publicUrl: string;
          key: string;
          contentType: string;
          cacheControl: string;
        };

        // 2) PUT the file straight to R2 with progress reporting.
        await putFileWithProgress(
          presigned.uploadUrl,
          file,
          presigned.contentType,
          presigned.cacheControl,
          (percent) => {
            videoOptions.onUploadProgress?.(Math.min(95, Math.round(percent * 0.95)));
          }
        );

        // 3) Optional poster upload via the regular /api/upload route.
        let posterUrl: string | undefined;
        if (videoOptions.posterBlob) {
          try {
            const baseName =
              presigned.key
                .split('/')
                .pop()
                ?.replace(/\.(mp4|webm|mov)$/i, '') || 'poster';
            const posterFile = new File([videoOptions.posterBlob], `${baseName}.jpg`, {
              type: 'image/jpeg',
            });
            const posterForm = new FormData();
            posterForm.append('file', posterFile);

            const posterParams = new URLSearchParams();
            posterParams.append('folder', folder || 'wallpapers');
            posterParams.append('filename', baseName);
            posterParams.append('skipImageOptimization', '1');

            const posterData = await postFormDataWithProgress(
              `/api/admin/upload?${posterParams.toString()}`,
              posterForm,
              csrfToken ? { 'x-csrf-token': csrfToken } : {}
            );
            posterUrl = posterData.url;
          } catch (posterErr) {
            console.warn('[useDirectR2Upload] poster upload failed:', posterErr);
          }
        }

        videoOptions.onUploadProgress?.(100);

        return {
          url: presigned.publicUrl,
          posterUrl,
          videoStats: {
            originalSize: file.size,
            optimizedSize: file.size,
            previewSize: 0,
            posterSize: videoOptions.posterBlob?.size ?? 0,
          },
          storageProvider: 'r2',
          success: true,
        };
      } catch (error) {
        console.error('[useDirectR2Upload] Direct R2 error:', error);
        return {
          url: '',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    [folder, csrfToken]
  );

  return { uploadVideoDirectToR2 };
}
