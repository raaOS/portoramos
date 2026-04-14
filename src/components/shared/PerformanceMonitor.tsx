'use client';

import { useEffect, useRef } from 'react';
import { useReportWebVitals } from 'next/web-vitals';

interface Metric {
  id: string;
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  entries: PerformanceEntry[];
  navigationType: string;
}

/**
 * Performance Monitor Component
 * Tracks Core Web Vitals and sends to analytics
 * Target: LCP < 2.5s, FID < 100ms, CLS < 0.1, FCP < 1.8s, TTFB < 600ms
 */
export default function PerformanceMonitor() {
  const metricsRef = useRef<Map<string, Metric>>(new Map());
  const longTaskWarningThreshold = process.env.NODE_ENV === 'development' ? 500 : 50;

  useReportWebVitals((metric: Metric) => {
    // Store metric for debugging
    metricsRef.current.set(metric.name, metric);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Web Vitals] ${metric.name}:`, {
        value: metric.value,
        rating: metric.rating,
        id: metric.id,
      });
    }

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production' && window.gtag) {
      window.gtag('event', metric.name, {
        value: Math.round(metric.value),
        event_category: 'Web Vitals',
        event_label: metric.id,
        non_interaction: true,
        transport: 'beacon',
      });
    }

    // Report to Vercel Speed Insights
    if (window.performance && 'measure' in window.performance) {
      try {
        window.performance.measure(metric.name, {
          start: 0,
          end: metric.value,
        });
      } catch {
        // Silent fail
      }
    }
  });

  // Monitor Long Tasks & Layout Shifts
  useEffect(() => {
    if (!('PerformanceObserver' in window)) return;

    const observers: PerformanceObserver[] = [];

    // Long Tasks
    try {
      const ltObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > longTaskWarningThreshold) {
            console.warn('[Performance] Long Task detected:', {
              duration: entry.duration,
              startTime: entry.startTime,
            });
          }
        }
      });
      ltObserver.observe({ entryTypes: ['longtask'] });
      observers.push(ltObserver);
    } catch {
      // Long tasks not supported
    }

    // Layout Shifts
    try {
      let clsValue = 0;
      const lsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShiftEntry = entry as unknown as { hadRecentInput?: boolean; value: number };
          if (!layoutShiftEntry.hadRecentInput) {
            clsValue += layoutShiftEntry.value;
          }
        }
        
        // Log significant layout shifts
        if (clsValue > 0.1) {
          console.warn('[Performance] High CLS detected:', clsValue);
        }
      });
      lsObserver.observe({ entryTypes: ['layout-shift'] });
      observers.push(lsObserver);
    } catch {
      // Layout shifts not supported
    }

    return () => observers.forEach(o => o.disconnect());
  }, [longTaskWarningThreshold]);

  return null;
}
