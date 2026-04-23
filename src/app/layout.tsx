import type { Metadata, Viewport } from 'next';
import { displayClassName, sansClassName } from '@/app/fonts';
import { baseSEO } from '@/lib/seo';
import Providers from '@/components/layout/Providers';
import { ToastProvider } from '@/contexts/ToastContext';
import { LastUpdatedProvider } from '@/contexts/LastUpdatedContext';
import { NavbarVisibilityProvider } from '@/contexts/NavbarVisibilityContext';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

import LayoutClient from '@/components/layout/LayoutClient';
import UnregisterSW from '@/components/shared/UnregisterSW';
import { SpeedInsights } from '@vercel/speed-insights/next';
import PerformanceMonitor from '@/components/shared/PerformanceMonitor';
import VersionGuard from '@/components/shared/VersionGuard';
import SmoothScroll from '@/components/layout/SmoothScroll';
import { loadAboutData } from '@/lib/about';
import SoundConfigLoader from '@/components/layout/SoundConfigLoader';
import { APP_VERSION } from '@/lib/constants';
import './globals.css';

// ISR: Revalidate layout every 60 seconds
export const revalidate = 60;

// Separate viewport export for Next.js 14+
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0b0b' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(baseSEO.siteUrl),
  title: {
    default: baseSEO.title,
    template: `%s | ${baseSEO.title}`,
  },
  description: 'Portofolio kreatif Ramos berisi project desain digital, UI/UX, dan visual yang berfokus pada storytelling, detail, dan pengalaman pengguna yang halus.',
  keywords: baseSEO.keywords,
  authors: [{ name: baseSEO.author }],
  creator: baseSEO.author,
  publisher: baseSEO.author,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'OUkbKUBgDSUy_uGFSC_hVI_QdgNTZzv1WldX2YWEjIY',
  },
  openGraph: {
    type: 'website',
    locale: baseSEO.locale,
    url: baseSEO.siteUrl,
    title: baseSEO.title,
    description: baseSEO.description,
    siteName: baseSEO.title,
    images: [
      {
        url: baseSEO.image,
        width: 1200,
        height: 630,
        alt: baseSEO.title,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: baseSEO.title,
    description: baseSEO.description,
    images: [baseSEO.image],
  },
  alternates: {
    canonical: baseSEO.siteUrl,
  },
};

export default async function RootLayout({
  children,
  modal
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  const aboutData = await loadAboutData();

  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* Preconnect to critical domains */}
        {/* Google Fonts - Fallback for next/font to satisfy Babel/SWC conflict */}
        <link 
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Six+Caps&display=swap" 
          rel="stylesheet" 
        />



        {/* Structured Data */}
        <meta name="application-version" content={APP_VERSION} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  if (sessionStorage.getItem('ramos_os_booted') === 'true') {
                    document.documentElement.setAttribute('data-os-booted', 'true');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      {/* suppressHydrationWarning: required because browser extensions (e.g. dark mode, 
           translators) inject attributes on <body> during SSRâ†’hydration, causing false mismatches.
           This is the standard Next.js pattern â€” see: https://nextjs.org/docs/messages/react-hydration-error */}
      <body className={`font-sans ${sansClassName} ${displayClassName}`} data-page="default" suppressHydrationWarning>
        {/* Skip to content - Accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100000] focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-black"
          aria-label="Skip to main content"
        >
          Skip to main content
        </a>

        <SmoothScroll />
        <Providers>
          <ToastProvider>
            <LastUpdatedProvider>
              <NavbarVisibilityProvider>
                <ErrorBoundary>
                  <SoundConfigLoader soundConfig={aboutData?.soundConfig} />
                  <LayoutClient modal={modal} dockConfig={aboutData?.dockConfig}>
                    {children}
                  </LayoutClient>
                  <UnregisterSW />
                  <SpeedInsights />
                  <PerformanceMonitor />
                  <VersionGuard />
                </ErrorBoundary>
              </NavbarVisibilityProvider>
            </LastUpdatedProvider>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
