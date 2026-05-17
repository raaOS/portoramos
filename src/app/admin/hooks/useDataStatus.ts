import { useState, useEffect, useCallback } from 'react';

interface DataStatus {
    isLoading: boolean;
    status: 'connected' | 'error' | 'checking' | 'disconnected';
}

export function useDataStatus() {
    const [dataStatus, setDataStatus] = useState<DataStatus>({
        isLoading: false,
        status: 'checking'
    });

    const checkStatus = useCallback(async () => {
        try {
            setDataStatus(prev => ({ ...prev, status: 'checking' }));
            const response = await fetch('/api/health');
            const data = await response.json();

            if (data.database === 'connected' && data.databaseBackend === 'cloudflare-d1') {
                setDataStatus({ isLoading: false, status: 'connected' });
            } else {
                setDataStatus({ isLoading: false, status: 'disconnected' });
            }
        } catch {
            setDataStatus({ isLoading: false, status: 'error' });
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

    const triggerSync = async () => {
        return Promise.resolve();
    };

    const saveSettings = async () => {
        console.log('[useDataStatus] Settings managed via environment variables');
        return Promise.resolve({ success: true });
    };

    return {
        isLoading: dataStatus.isLoading,
        connectionStatus: dataStatus.status,
        deployStatus: 'idle' as const,
        checkStatus,
        triggerSync,
        saveSettings
    };
}
