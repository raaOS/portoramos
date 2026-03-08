"use client";

import React, { createContext, useContext, useRef, useCallback } from 'react';

interface LayoutPersistenceContextValue {
    registerFlush: (name: string, flushFn: () => Promise<void>) => void;
    unregisterFlush: (name: string) => void;
    flushAll: () => Promise<void>;
}

const LayoutPersistenceContext = createContext<LayoutPersistenceContextValue | null>(null);

export function LayoutPersistenceProvider({ children }: { children: React.ReactNode }) {
    const flushersRef = useRef<Map<string, () => Promise<void>>>(new Map());

    const registerFlush = useCallback((name: string, flushFn: () => Promise<void>) => {
        flushersRef.current.set(name, flushFn);
    }, []);

    const unregisterFlush = useCallback((name: string) => {
        flushersRef.current.delete(name);
    }, []);

    const flushAll = useCallback(async () => {
        console.log('[LayoutPersistence] Flushing all pending saves...');
        const promises = Array.from(flushersRef.current.values()).map(flush => flush());
        await Promise.all(promises);
        console.log('[LayoutPersistence] All pending saves flushed');
    }, []);

    return (
        <LayoutPersistenceContext.Provider value={{ registerFlush, unregisterFlush, flushAll }}>
            {children}
        </LayoutPersistenceContext.Provider>
    );
}

export function useLayoutPersistence() {
    const context = useContext(LayoutPersistenceContext);
    if (!context) {
        throw new Error('useLayoutPersistence must be used within LayoutPersistenceProvider');
    }
    return context;
}

export function useRegisterFlush(name: string, flushFn: () => Promise<void>) {
    const { registerFlush, unregisterFlush } = useLayoutPersistence();
    
    React.useEffect(() => {
        registerFlush(name, flushFn);
        return () => unregisterFlush(name);
    }, [name, flushFn, registerFlush, unregisterFlush]);
}
