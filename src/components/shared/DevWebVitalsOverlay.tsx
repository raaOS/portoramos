'use client';

import { useEffect, useState, useCallback } from 'react';

/**
 * Dev-only Web Vitals overlay.
 *
 * Renders a tiny floating badge in the bottom-right corner that shows live
 * Core Web Vitals while developing. It is intentionally NOT included in
 * production bundles: the parent gate in layout.tsx checks NODE_ENV.
 *
 * Activation:
 *   - NODE_ENV must be 'development' (handled at the import site).
 *   - NEXT_PUBLIC_DEV_VITALS must be 'true' to opt in (default: off, so it
 *     never gets in your way unless you explicitly want it).
 */

type Rating = 'good' | 'needs-improvement' | 'poor' | 'pending';

interface VitalEntry {
  name: string;
  value: number;
  rating: Rating;
  unit: 'ms' | 'score';
  /** Lower is better for all current Core Web Vitals. */
  thresholds: { good: number; poor: number };
}

const INITIAL_VITALS: Record<string, VitalEntry> = {
  LCP: {
    name: 'LCP',
    value: 0,
    rating: 'pending',
    unit: 'ms',
    thresholds: { good: 2500, poor: 4000 },
  },
  INP: {
    name: 'INP',
    value: 0,
    rating: 'pending',
    unit: 'ms',
    thresholds: { good: 200, poor: 500 },
  },
  CLS: {
    name: 'CLS',
    value: 0,
    rating: 'pending',
    unit: 'score',
    thresholds: { good: 0.1, poor: 0.25 },
  },
  FCP: {
    name: 'FCP',
    value: 0,
    rating: 'pending',
    unit: 'ms',
    thresholds: { good: 1800, poor: 3000 },
  },
  TTFB: {
    name: 'TTFB',
    value: 0,
    rating: 'pending',
    unit: 'ms',
    thresholds: { good: 800, poor: 1800 },
  },
};

const ratingColor: Record<Rating, string> = {
  good: 'text-emerald-400',
  'needs-improvement': 'text-amber-400',
  poor: 'text-rose-400',
  pending: 'text-zinc-500',
};

const ratingDot: Record<Rating, string> = {
  good: 'bg-emerald-400',
  'needs-improvement': 'bg-amber-400',
  poor: 'bg-rose-400',
  pending: 'bg-zinc-600',
};

function formatValue(entry: VitalEntry): string {
  if (entry.rating === 'pending') return '—';
  if (entry.unit === 'ms') {
    return entry.value >= 1000
      ? `${(entry.value / 1000).toFixed(2)}s`
      : `${Math.round(entry.value)}ms`;
  }
  return entry.value.toFixed(3);
}

export default function DevWebVitalsOverlay() {
  const [vitals, setVitals] = useState<Record<string, VitalEntry>>(INITIAL_VITALS);
  const [collapsed, setCollapsed] = useState(false);

  const update = useCallback((name: string, value: number) => {
    setVitals((prev) => {
      const base = prev[name];
      if (!base) return prev;
      const rating: Rating =
        value <= base.thresholds.good
          ? 'good'
          : value <= base.thresholds.poor
            ? 'needs-improvement'
            : 'poor';
      return { ...prev, [name]: { ...base, value, rating } };
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    import('web-vitals')
      .then(({ onCLS, onFCP, onINP, onLCP, onTTFB }) => {
        if (cancelled) return;
        onLCP((m) => update('LCP', m.value));
        onINP((m) => update('INP', m.value));
        onCLS((m) => update('CLS', m.value));
        onFCP((m) => update('FCP', m.value));
        onTTFB((m) => update('TTFB', m.value));
      })
      .catch(() => {
        // web-vitals failed to load — overlay just stays in pending state.
      });

    return () => {
      cancelled = true;
    };
  }, [update]);

  const order = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'];

  return (
    <div
      data-dev-overlay="web-vitals"
      className="fixed bottom-24 right-3 md:bottom-3 md:right-3 z-[2147483646] select-none font-mono text-[11px]"
      aria-hidden="true"
    >
      {collapsed ? (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="flex items-center gap-1.5 rounded-full bg-zinc-900/85 px-2.5 py-1.5 text-zinc-100 ring-1 ring-white/10 backdrop-blur-md transition-colors hover:bg-zinc-800"
          title="Show Web Vitals"
        >
          <span className="font-bold tracking-wide">WV</span>
          {order.map((key) => (
            <span
              key={key}
              className={`h-1.5 w-1.5 rounded-full ${ratingDot[vitals[key].rating]}`}
            />
          ))}
        </button>
      ) : (
        <div className="min-w-[170px] overflow-hidden rounded-md bg-zinc-900/85 text-zinc-100 shadow-lg ring-1 ring-white/10 backdrop-blur-md">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 px-2.5 py-1.5">
            <span className="text-[10px] font-bold tracking-[0.18em] text-zinc-300">
              WEB VITALS · DEV
            </span>
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="text-[10px] text-zinc-400 hover:text-white"
              title="Collapse"
            >
              ×
            </button>
          </div>
          <ul className="space-y-1 px-2.5 py-1.5">
            {order.map((key) => {
              const entry = vitals[key];
              return (
                <li key={key} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${ratingDot[entry.rating]}`} />
                    <span className="text-zinc-400">{entry.name}</span>
                  </span>
                  <span className={`tabular-nums ${ratingColor[entry.rating]}`}>
                    {formatValue(entry)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
