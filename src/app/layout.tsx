import './globals.css';
import type { Metadata } from 'next';
import { displayClassName, sansClassName } from '@/app/fonts';
import { generateStructuredData, baseSEO } from '@/lib/seo';
import Providers from '@/components/layout/Providers';
import { ToastProvider } from '@/contexts/ToastContext';
import { LastUpdatedProvider } from '@/contexts/LastUpdatedContext';
import { NavbarVisibilityProvider } from '@/contexts/NavbarVisibilityContext';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import AppWrapper from '@/components/layout/AppWrapper';
import LayoutClient from '@/components/layout/LayoutClient';
import UnregisterSW from '@/components/shared/UnregisterSW';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { loadAboutData } from '@/lib/about';

// Disable caching for the entire layout to ensure dock configuration (aboutData) 
// updates propagate immediately across all pages.
// Refresh trace: standardized dock IDs
export const revalidate = 0;

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
};

import SmoothScroll from '@/components/layout/SmoothScroll';

export default async function RootLayout({
  children,
  modal
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  const websiteStructuredData = generateStructuredData('website');

  // Fetch generic data for global layout elements
  const aboutData = await loadAboutData();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />

        {/* Preconnect to external domains for faster resource loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.github.com" />
        <link rel="dns-prefetch" href="https://api.github.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData) }}
        />
      </head>
      <body className={`font-sans ${sansClassName} ${displayClassName}`} data-page="default" suppressHydrationWarning>
        <SmoothScroll />
        <Providers>
          <ToastProvider>
            <LastUpdatedProvider>
              <NavbarVisibilityProvider>
                <ErrorBoundary>
                  <AppWrapper>
                    <LayoutClient modal={modal} dockConfig={aboutData?.dockConfig}>
                      {children}
                    </LayoutClient>
                    {/* Track page views and route changes */}
                    {/* Ensure any old service workers are removed */}
                    <UnregisterSW />
                    <SpeedInsights />
                  </AppWrapper>
                </ErrorBoundary>
              </NavbarVisibilityProvider>
            </LastUpdatedProvider>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
