'use client';

import { useCallback } from 'react';

interface CompressionStats {
    originalSize?: string;
    newSize?: string;
    saved?: string;
}

interface CompressionResult {
    success: boolean;
    stats?: CompressionStats;
    newPath?: string;
}

export function useImageCompression(csrfToken: string) {
    const compressImageServer = useCallback(async (filePath: string): Promise<CompressionResult> => {
        try {
            const response = await fetch('/api/admin/compress', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken
                },
                credentials: 'include',
                body: JSON.stringify({ filePath }),
            });

            if (!response.ok) {
                return { success: false };
            }

            const data = await response.json();
            return { success: true, stats: data, newPath: data.newPath };
        } catch {
            return { success: false };
        }
    }, [csrfToken]);

    return { compressImageServer };
}
