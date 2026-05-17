'use client';

import { useCallback } from 'react';

interface UseStorageUploadOptions {
    folder?: string;
    customFilename?: string;
    csrfToken?: string;
}

interface UploadResult {
    url: string;
    previewUrl?: string;
    posterUrl?: string;
    videoStats?: {
        originalSize: number;
        optimizedSize: number;
        previewSize: number;
        posterSize: number;
    } | null;
    storageProvider?: 'r2';
    success: boolean;
    error?: string;
}

interface UploadOptions {
    skipMainVideoOptimization?: boolean;
}

export function useStorageUpload(options: UseStorageUploadOptions = {}) {
    const { folder, customFilename, csrfToken } = options;

    const upload = useCallback(async (file: File, uploadOptions: UploadOptions = {}): Promise<UploadResult> => {
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
            const response = await fetch(`/api/upload${query ? `?${query}` : ''}`, {
                method: 'POST',
                headers: {
                    ...(csrfToken && { 'x-csrf-token': csrfToken })
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Upload failed');
            }

            const data = await response.json();
            return {
                url: data.url,
                previewUrl: data.previewUrl,
                posterUrl: data.posterUrl,
                videoStats: data.videoStats,
                storageProvider: data.storageProvider,
                success: true
            };
        } catch (error) {
            console.error('[useStorageUpload] Error:', error);
            return {
                url: '',
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }, [folder, customFilename, csrfToken]);

    return { upload };
}
