'use client';

import { useCallback } from 'react';

interface UseFileValidationOptions {
    accept: string;
    maxSize: number; // in MB
}

const MAX_VIDEO_UPLOAD_SIZE_MB = 200;

export function useFileValidation({ accept, maxSize }: UseFileValidationOptions) {
    const validateFile = useCallback((file: File): string | null => {
        const isVideo = file.type.startsWith('video/');
        const limit = isVideo ? Math.max(maxSize, MAX_VIDEO_UPLOAD_SIZE_MB) : maxSize;

        if (file.size > limit * 1024 * 1024) {
            return `File ${file.name} is too large. Max size is ${limit}MB.`;
        }

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

    const validateFiles = useCallback((files: File[]): string[] => {
        const errors: string[] = [];
        files.forEach(file => {
            const error = validateFile(file);
            if (error) errors.push(error);
        });
        return errors;
    }, [validateFile]);

    return { validateFile, validateFiles };
}
