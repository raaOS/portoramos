'use client';

import { useMemo } from 'react';

export function useCsrfToken(): string | null {
    const csrfToken = useMemo(() => {
        if (typeof document === 'undefined') return null;
        const cookies = document.cookie.split(';');
        const csrfCookie = cookies.find(c => c.trim().startsWith('csrf_token='));
        if (csrfCookie) {
            return csrfCookie.split('=')[1];
        }
        return null;
    }, []);

    return csrfToken;
}
