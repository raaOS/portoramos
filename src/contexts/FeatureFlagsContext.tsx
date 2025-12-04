'use client';

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';

/**
 * Feature Flags Context
 * Enables A/B testing and gradual feature rollout
 */

interface FeatureFlags {
    enableAnimations: boolean;
    enableCustomCursor: boolean;
    enableBlurText: boolean;
    enableScrollProgress: boolean;
    enableWebVitals: boolean;
    enableAnalytics: boolean;
}

const defaultFlags: FeatureFlags = {
    enableAnimations: true,
    enableCustomCursor: true,
    enableBlurText: true,
    enableScrollProgress: true,
    enableWebVitals: false,
    enableAnalytics: false,
};

const FeatureFlagsContext = createContext<FeatureFlags>(defaultFlags);

export function useFeatureFlags() {
    return useContext(FeatureFlagsContext);
}

interface FeatureFlagsProviderProps {
    children: ReactNode;
    initialFlags?: Partial<FeatureFlags>;
}

export function FeatureFlagsProvider({ children, initialFlags = {} }: FeatureFlagsProviderProps) {
    const [flags, setFlags] = useState<FeatureFlags>({
        ...defaultFlags,
        ...initialFlags,
    });

    useEffect(() => {
        // Load flags from localStorage
        const savedFlags = localStorage.getItem('featureFlags');
        if (savedFlags) {
            try {
                const parsed = JSON.parse(savedFlags);
                setFlags((prev) => ({ ...prev, ...parsed }));
            } catch (error) {
                console.error('Failed to parse feature flags:', error);
            }
        }

        // Load flags from URL query params (for testing)
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const urlFlags: Partial<FeatureFlags> = {};

            params.forEach((value, key) => {
                if (key.startsWith('ff_')) {
                    const flagName = key.replace('ff_', '') as keyof FeatureFlags;
                    if (flagName in defaultFlags) {
                        urlFlags[flagName] = value === 'true';
                    }
                }
            });

            if (Object.keys(urlFlags).length > 0) {
                setFlags((prev) => ({ ...prev, ...urlFlags }));
            }
        }
    }, []);

    // Save flags to localStorage when they change
    useEffect(() => {
        localStorage.setItem('featureFlags', JSON.stringify(flags));
    }, [flags]);

    // Memoize value to prevent unnecessary re-renders when flags haven't changed
    const value = useMemo(() => flags, [flags]);

    return (
        <FeatureFlagsContext.Provider value={value}>
            {children}
        </FeatureFlagsContext.Provider>
    );
}

/**
 * Feature Flag Hook
 * Usage: const isEnabled = useFeatureFlag('enableAnimations');
 */
export function useFeatureFlag(flagName: keyof FeatureFlags): boolean {
    const flags = useFeatureFlags();
    return flags[flagName];
}
