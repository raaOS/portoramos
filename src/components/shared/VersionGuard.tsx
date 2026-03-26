'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { APP_VERSION } from '@/lib/constants';

/**
 * VersionGuard Component
 * Monitors the application version on the server and notifies the user
 * when a new update is available, allowing for a fresh reload without
 * manual cache clearing.
 */
export default function VersionGuard() {
    const { showInfo } = useToast();
    const [hasUpdate, setHasUpdate] = useState(false);
    const toastIdRef = useRef<string | null>(null);
    const isCheckingRef = useRef(false);

    const checkVersion = useCallback(async () => {
        if (isCheckingRef.current) return;

        try {
            isCheckingRef.current = true;
            const response = await fetch('/api/os/version', {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache' }
            });

            if (!response.ok) return;

            const data = await response.json();
            const serverVersion = data.version;

            if (serverVersion && serverVersion !== APP_VERSION && !hasUpdate) {
                console.log(`[VersionGuard] New version detected: ${serverVersion} (Current: ${APP_VERSION})`);
                setHasUpdate(true);

                const id = showInfo(
                    "🛡️ Pembaruan Sistem Tersedia! Klik di sini untuk memuat ulang dan menerapkan fitur terbaru.",
                    0 // Persistent
                );

                toastIdRef.current = id;
            }
        } catch (error) {
            // Silently ignore network errors (e.g. server restarting) to prevent console spam
            if (error instanceof TypeError && error.message === 'Failed to fetch') {
                return;
            }
            console.error('[VersionGuard] Failed to check version:', error);
        } finally {
            isCheckingRef.current = false;
        }
    }, [showInfo, hasUpdate]);

    useEffect(() => {
        // Initial check after some delay to allow hydration to settle
        const timer = setTimeout(checkVersion, 5000);

        // Check every 5 minutes
        const interval = setInterval(checkVersion, 5 * 60 * 1000);

        // Check when window regains focus (user returns to tab)
        const handleFocus = () => {
            // Small delay to ensure network is ready
            setTimeout(checkVersion, 1000);
        };

        window.addEventListener('focus', handleFocus);

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
            window.removeEventListener('focus', handleFocus);
        };
    }, [checkVersion]);

    // Handle Toast click for reload
    useEffect(() => {
        if (!hasUpdate) return;

        const handleGlobalClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // If user clicks anywhere in the toast area (or similar enough)
            if (target.closest('.toast-info') || target.innerText?.includes("Pembaruan Sistem")) {
                handleUpdate();
            }
        };

        window.addEventListener('click', handleGlobalClick);
        return () => window.removeEventListener('click', handleGlobalClick);
    }, [hasUpdate]);

    const handleUpdate = () => {
        // Perform a hard-ish reload by adding a timestamp to bypass standard browser cache for the HTML
        const url = new URL(window.location.href);
        url.searchParams.set('reload', Date.now().toString());
        window.location.href = url.toString();
    };

    return null; // Invisible component
}
