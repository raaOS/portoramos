'use client';

import { useCallback } from 'react';

interface UseGitHubUploadOptions {
    folder?: string;
    customFilename?: string;
    csrfToken: string;
}

interface UploadResult {
    url: string;
    publicPath?: string;
    warning?: string;
}

export function useGitHubUpload({ folder, customFilename, csrfToken }: UseGitHubUploadOptions) {
    const uploadToGitHub = useCallback(async (file: File): Promise<UploadResult> => {
        const formData = new FormData();
        formData.append('file', file);

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
    }, [folder, customFilename, csrfToken]);

    return { uploadToGitHub };
}
