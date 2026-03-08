"use client";

import { useState, useCallback, useEffect } from "react";
import { soundManager } from "../utils/SoundManager";

interface BootSequenceConfig {
    totalDuration: number;
    allowSkip: boolean;
}

const DEFAULT_CONFIG: BootSequenceConfig = {
    totalDuration: 3500,
    allowSkip: true
};

const BOOT_SESSION_KEY = 'ramos_os_booted';

/**
 * Check if we should skip the boot animation
 * Solution 1: sessionStorage - persist during tab session
 * Solution 2: query params - skip if coming from dock/app launch (?app=xxx)
 * Solution 3: referrer check - skip if coming from internal navigation
 */
function checkShouldSkipBoot(): boolean {
    // SSR safety
    if (typeof window === 'undefined') return false;

    try {
        // 1. Check sessionStorage - already booted in this session?
        const hasBooted = sessionStorage.getItem(BOOT_SESSION_KEY);
        if (hasBooted === 'true') {
            console.log('[BootSequence] SKIP: Already booted in this session (sessionStorage)');
            return true;
        }

        // 2. Check query params - launched from dock/app navigation?
        const urlParams = new URLSearchParams(window.location.search);
        const appParam = urlParams.get('app');
        if (appParam) {
            console.log('[BootSequence] SKIP: Launched from dock with app param', { app: appParam });
            // Mark as booted
            sessionStorage.setItem(BOOT_SESSION_KEY, 'true');
            return true;
        }

        // 3. Check referrer - navigating from internal page?
        const referrer = document.referrer;
        const currentHost = window.location.host;
        
        // Parse referrer to get host
        let referrerHost = '';
        try {
            if (referrer) {
                referrerHost = new URL(referrer).host;
            }
        } catch {
            // Invalid referrer URL
        }
        
        // If coming from same host (internal navigation)
        if (referrerHost && referrerHost === currentHost) {
            console.log('[BootSequence] SKIP: Navigation from internal page (referrer check)', {
                from: referrerHost,
                to: currentHost
            });
            // Mark as booted so refresh also skips
            sessionStorage.setItem(BOOT_SESSION_KEY, 'true');
            return true;
        }

        console.log('[BootSequence] SHOW BOOT: Fresh session or external source', {
            hasBooted,
            referrerHost,
            currentHost,
            appParam
        });
        return false;
    } catch (error) {
        console.error('[BootSequence] Error checking boot status:', error);
        return false;
    }
}

export function useBootSequence(config: Partial<BootSequenceConfig> = {}) {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    
    // Use lazy initialization for state - ensures check runs once on mount
    const [needsPowerOn, setNeedsPowerOn] = useState(() => {
        const shouldSkip = checkShouldSkipBoot();
        return !shouldSkip;
    });
    
    const [isBooting, setIsBooting] = useState(false);

    // Mark as booted when actual boot happens
    const markAsBooted = useCallback(() => {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem(BOOT_SESSION_KEY, 'true');
        }
    }, []);

    const powerOn = useCallback(() => {
        console.log('[useBootSequence] Powering on...');
        soundManager.unlock();
        soundManager.clearCache('startup');
        setNeedsPowerOn(false);
        setIsBooting(true);
        markAsBooted();
    }, [markAsBooted]);

    const finishBooting = useCallback(() => {
        setNeedsPowerOn(false);
        setIsBooting(false);
    }, []);

    const skipBoot = useCallback(() => {
        if (!finalConfig.allowSkip) return;
        console.log('[useBootSequence] Manually skipping boot sequence');
        setNeedsPowerOn(false);
        setIsBooting(false);
        markAsBooted();
    }, [finalConfig.allowSkip, markAsBooted]);

    // Debug log
    useEffect(() => {
        console.log('[useBootSequence] State:', { needsPowerOn, isBooting });
    }, [needsPowerOn, isBooting]);

    return {
        needsPowerOn,
        isBooting,
        powerOn,
        finishBooting,
        skipBoot,
        config: finalConfig
    };
}
