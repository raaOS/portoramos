import { useState, useEffect, useCallback } from 'react';

interface FirebaseStatus {
    isLoading: boolean;
    status: 'connected' | 'error' | 'checking' | 'disconnected';
}

/**
 * Hook to check Firebase connection status
 * Replaces deprecated useGitHubSync
 */
export function useFirebaseStatus() {
    const [firebaseStatus, setFirebaseStatus] = useState<FirebaseStatus>({
        isLoading: false,
        status: 'checking'
    });

    const checkStatus = useCallback(async () => {
        try {
            setFirebaseStatus(prev => ({ ...prev, status: 'checking' }));
            const response = await fetch('/api/health');
            const data = await response.json();

            if (data.firebase === 'connected') {
                setFirebaseStatus({ isLoading: false, status: 'connected' });
            } else {
                setFirebaseStatus({ isLoading: false, status: 'disconnected' });
            }
        } catch {
            setFirebaseStatus({ isLoading: false, status: 'error' });
        }
    }, []);

    useEffect(() => {
        // Check every 30 seconds
        const interval = setInterval(checkStatus, 30000);
        
        // Initial check - using setTimeout to avoid synchronous setState in effect
        const timeout = setTimeout(checkStatus, 0);
        
        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [checkStatus]);

    // No-op for backward compatibility
    const triggerSync = async () => {
        console.log('[useFirebaseStatus] Sync is automatic with Firebase');
        return Promise.resolve();
    };

    const saveSettings = async () => {
        console.log('[useFirebaseStatus] Settings managed via environment variables');
        return Promise.resolve({ success: true });
    };

    return {
        isLoading: firebaseStatus.isLoading,
        connectionStatus: firebaseStatus.status,
        deployStatus: 'idle' as const, // Always idle for Firebase
        checkStatus,
        triggerSync,
        saveSettings
    };
}
