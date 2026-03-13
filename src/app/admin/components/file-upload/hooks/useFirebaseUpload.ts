'use client';

import { useCallback } from 'react';

interface UseFirebaseUploadOptions {
    folder?: string;
    customFilename?: string;
    csrfToken?: string;
}

interface UploadResult {
    url: string;
    success: boolean;
    error?: string;
}

export function useFirebaseUpload(options: UseFirebaseUploadOptions = {}) {
    const { folder, customFilename, csrfToken } = options;

    const upload = useCallback(async (file: File): Promise<UploadResult> => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const params = new URLSearchParams();
            if (folder) params.append('folder', folder);
            if (customFilename) params.append('filename', customFilename);

            const response = await fetch(`/api/upload?${params.toString()}`, {
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
                success: true
            };
        } catch (error) {
            console.error('[useFirebaseUpload] Error:', error);
            return {
                url: '',
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }, [folder, customFilename, csrfToken]);

    return { upload };
}
