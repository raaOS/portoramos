'use client';

import dynamic from 'next/dynamic';

/**
 * Client-side gate for the dev Web Vitals overlay.
 *
 * Why a separate file:
 *   - `ssr: false` is only allowed inside Client Components in the App Router.
 *   - Wrapping the dynamic import in this client component keeps the heavy
 *     overlay out of the server bundle while still being mountable from the
 *     server-rendered root layout.
 *
 * Activation:
 *   - NODE_ENV must be 'development' (NODE_ENV is inlined at build time, so
 *     production tree-shakes everything below the early return).
 *   - NEXT_PUBLIC_DEV_VITALS must be 'true' to render anything.
 */

const DevWebVitalsOverlay =
  process.env.NODE_ENV === 'development'
    ? dynamic(() => import('@/components/shared/DevWebVitalsOverlay'), { ssr: false })
    : null;

export default function DevWebVitalsGate() {
  if (process.env.NODE_ENV !== 'development') return null;
  if (process.env.NEXT_PUBLIC_DEV_VITALS !== 'true') return null;
  if (!DevWebVitalsOverlay) return null;
  return <DevWebVitalsOverlay />;
}
