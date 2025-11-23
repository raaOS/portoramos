import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import { displayClassName, serifClassName } from './fonts';
import Footer from '@/components/Footer';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import AppWrapper from '@/components/AppWrapper';
import { generateMetadata, generateStructuredData } from '@/lib/seo';
import { ToastProvider } from '@/contexts/ToastContext';
import { LastUpdatedProvider } from '@/contexts/LastUpdatedContext';
import { NavbarVisibilityProvider } from '@/contexts/NavbarVisibilityContext';
import UnregisterSW from '@/components/UnregisterSW';
import PageTransition from '@/components/PageTransition';
import CustomCursor from '@/components/CustomCursor';


export const metadata: Metadata = generateMetadata({
  title: 'Ramos – Creative Portfolio',
  description: 'Portofolio desain dan proyek kreatif Ramos dengan fokus pada visual yang bersih, tipografi kuat, dan transisi halus.',
  path: '/'
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const websiteStructuredData = generateStructuredData('website');

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData) }}
        />
      </head>
      <body className={`font-serif ${serifClassName} ${displayClassName}`} data-page="default">
        <Providers>
          <ToastProvider>
            <LastUpdatedProvider>
              <NavbarVisibilityProvider>
                <ErrorBoundary>
                  <AppWrapper>
                    <CustomCursor />
                    <Header />
                    <main className="container pb-20">
                      <PageTransition>
                        {children}
                      </PageTransition>
                    </main>
                    <Footer />
                    <BottomNavigation />
                    {/* Track page views and route changes */}
                    {/* Ensure any old service workers are removed */}
                    <UnregisterSW />
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
