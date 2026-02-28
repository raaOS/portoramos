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

  // Monitor Long Tasks
  useEffect(() => {
    if (!('PerformanceObserver' in window)) return;

    let observer: PerformanceObserver | null = null;
    
    try {
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // Log tasks longer than 50ms (potential INP issues)
          if (entry.duration > 50) {
            console.warn('[Performance] Long Task detected:', {
              duration: entry.duration,
              startTime: entry.startTime,
            });
          }
        }
      });
      
      observer.observe({ entryTypes: ['longtask'] });
    } catch {
      // Long tasks not supported
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, []);

  // Monitor Layout Shifts
  useEffect(() => {
    if (!('PerformanceObserver' in window)) return;

    let observer: PerformanceObserver | null = null;
    let clsValue = 0;
    
    try {
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        
        // Log significant layout shifts
        if (clsValue > 0.1) {
          console.warn('[Performance] High CLS detected:', clsValue);
        }
      });
      
      observer.observe({ entryTypes: ['layout-shift'] });
    } catch {
      // Layout shifts not supported
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, []);

  return null;
}


