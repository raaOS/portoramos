'use client';

import { PerformanceMonitor } from '@react-three/drei';
import { useState } from 'react';

interface PerfMonitorProps {
    onIncline?: () => void;
    onDecline?: () => void;
    onChange?: (factor: number) => void;
}

export function usePerfMonitor() {
    const [dpr, setDpr] = useState(1.5); // Default start conservative (1.5)
    const [performanceLevel, setPerformanceLevel] = useState<'high' | 'low'>('high');

    const onIncline = () => {
        setDpr(2);
        setPerformanceLevel('high');
    };

    const onDecline = () => {
        setDpr(1); // Drop to 1 on low perf
        setPerformanceLevel('low');
    };

    return {
        dpr,
        performanceLevel,
        PerfMonitorComponent: () => (
            <PerformanceMonitor
                onIncline={onIncline}
                onDecline={onDecline}
                flipflops={3}
                onFallback={() => {
                    setDpr(0.8); // Fallback to very low if unstable
                    setPerformanceLevel('low');
                }}
            />
        )
    };
}
