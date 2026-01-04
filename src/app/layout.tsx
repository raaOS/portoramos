import './globals.css';
import type { Metadata } from 'next';
import { displayClassName, sansClassName } from '@/app/fonts';
import { generateStructuredData, baseSEO } from '@/lib/seo';
import Providers from '@/components/layout/Providers';
import { ToastProvider } from '@/contexts/ToastContext';
import { LastUpdatedProvider } from '@/contexts/LastUpdatedContext';
import { NavbarVisibilityProvider } from '@/contexts/NavbarVisibilityContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import AppWrapper from '@/components/layout/AppWrapper';
import ClientLayout from '@/components/layout/ClientLayout';
import UnregisterSW from '@/components/UnregisterSW';
import { SpeedInsights } from '@vercel/speed-insights/next';

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

export default function RootLayout({
  children,
  modal
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  const websiteStructuredData = generateStructuredData('website');

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {/* Preconnect to Cloudinary for faster resource loading */}
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData) }}
        />
      </head>
      <body className={`font-sans ${sansClassName} ${displayClassName}`} data-page="default" suppressHydrationWarning>
        <Providers>
          <ToastProvider>
            <LastUpdatedProvider>
              <NavbarVisibilityProvider>
                <ErrorBoundary>
                  <AppWrapper>
                    <ClientLayout modal={modal}>
                      {children}
                    </ClientLayout>
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
