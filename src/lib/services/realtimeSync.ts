import { useEffect, useRef } from 'react';

const POLL_INTERVAL_MS = 5000;

async function fetchDataVersion(): Promise<string | null> {
    const response = await fetch('/api/data/version', { cache: 'no-store' });
    if (!response.ok) return null;
    const data = await response.json().catch(() => null) as { lastUpdated?: string | null } | null;
    return data?.lastUpdated || null;
}

interface UseRealtimeSyncOptions {
    onUpdate: () => void;
    onUnavailable?: () => void;
    enabled?: boolean;
}

export function useRealtimeSync({ onUpdate, onUnavailable, enabled = true }: UseRealtimeSyncOptions) {
    const lastTimestampRef = useRef<string | null>(null);
    const isInitializedRef = useRef(false);
    const isActiveRef = useRef(true);
    const mountedRef = useRef(true);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const onUpdateRef = useRef(onUpdate);
    const onUnavailableRef = useRef(onUnavailable);

    useEffect(() => { onUpdateRef.current = onUpdate; }, [onUpdate]);
    useEffect(() => { onUnavailableRef.current = onUnavailable; }, [onUnavailable]);

    useEffect(() => {
        if (!enabled || typeof window === 'undefined') return;

        isActiveRef.current = true;
        mountedRef.current = true;

        const poll = async () => {
            if (!mountedRef.current || !isActiveRef.current) return;

            try {
                const newTimestamp = await fetchDataVersion();
                if (!newTimestamp) {
                    onUnavailableRef.current?.();
                    return;
                }

                if (!isInitializedRef.current) {
                    lastTimestampRef.current = newTimestamp;
                    isInitializedRef.current = true;
                    return;
                }

                if (newTimestamp !== lastTimestampRef.current) {
                    lastTimestampRef.current = newTimestamp;
                    onUpdateRef.current();
                }
            } catch {
                if (mountedRef.current && isActiveRef.current) {
                    onUnavailableRef.current?.();
                }
            }
        };

        void poll();
        intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

        return () => {
            isActiveRef.current = false;
            mountedRef.current = false;

            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }

            isInitializedRef.current = false;
            lastTimestampRef.current = null;
        };
    }, [enabled]);
}

export async function checkForUpdates(lastKnownTimestamp: string | null): Promise<{
    hasUpdate: boolean;
    newTimestamp: string | null;
}> {
    try {
        const newTimestamp = await fetchDataVersion();
        return {
            hasUpdate: Boolean(newTimestamp && newTimestamp !== lastKnownTimestamp),
            newTimestamp: newTimestamp || lastKnownTimestamp,
        };
    } catch (error) {
        console.error('[RealtimeSync] Check for updates failed:', error);
        return { hasUpdate: false, newTimestamp: lastKnownTimestamp };
    }
}
