'use client';

import Script from 'next/script';

/**
 * Analytics Component
 * Wrapper for Google Analytics or Vercel Analytics
 */
export default function Analytics() {
    const gaId = process.env.NEXT_PUBLIC_GA_ID;
    const isProduction = process.env.NODE_ENV === 'production';

    // Only load analytics in production
    if (!isProduction || !gaId) {
        return null;
    }

    return (
        <>
            {/* Google Analytics */}
            <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
                strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
                {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', {
            page_path: window.location.pathname,
          });
        `}
            </Script>
        </>
    );
}

/**
 * Track custom events
 * Usage: trackEvent('button_click', { button_name: 'cta' })
 */
export function trackEvent(eventName: string, eventParams?: Record<string, any>) {
    if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', eventName, eventParams);
    }
}

/**
 * Track page views
 * Usage: trackPageView('/about')
 */
export function trackPageView(url: string) {
    if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
            page_path: url,
        });
    }
}
