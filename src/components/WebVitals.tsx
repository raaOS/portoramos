'use client';

import { useEffect } from 'react';

// Type declarations for web-vitals (optional dependency)
type Metric = {
    name: string;
    value: number;
    id: string;
    rating: 'good' | 'needs-improvement' | 'poor';
};

type ReportHandler = (metric: Metric) => void;

/**
 * Web Vitals Monitoring Component
 * Tracks Core Web Vitals (LCP, FID, CLS) for performance monitoring
 *
 * Note: Requires 'web-vitals' package to be installed
 * Install with: npm install web-vitals
 */
export default function WebVitals() {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Only load in production or when explicitly enabled
        const isEnabled = process.env.NEXT_PUBLIC_ENABLE_WEB_VITALS === 'true' || process.env.NODE_ENV === 'production';

        if (!isEnabled) return;

        // Dynamically import web-vitals library (optional dependency)
        import('web-vitals' as any).then((webVitals: any) => {
            const { getCLS, getFID, getFCP, getLCP, getTTFB } = webVitals;
            // Report to console in development, could send to analytics in production
            const reportWebVital: ReportHandler = (metric) => {
                if (process.env.NODE_ENV === 'development') {
                    console.log('[Web Vitals]', metric);
                }

                // Send to analytics endpoint (optional)
                if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
                    fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'web-vital',
                            metric: metric.name,
                            value: metric.value,
                            id: metric.id,
                            rating: metric.rating,
                            timestamp: Date.now(),
                        }),
                    }).catch(console.error);
                }
            };

            // Track all Core Web Vitals
            getCLS(reportWebVital);
            getFID(reportWebVital);
            getFCP(reportWebVital);
            getLCP(reportWebVital);
            getTTFB(reportWebVital);
        }).catch(() => {
            // Silently fail if web-vitals is not installed
            if (process.env.NODE_ENV === 'development') {
                console.warn('[Web Vitals] Package not installed. Run: npm install web-vitals');
            }
        });
    }, []);

    return null; // This component doesn't render anything
}
