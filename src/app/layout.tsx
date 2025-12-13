import './globals.css';
import { serifClassName, displayClassName } from '@/app/fonts';
import { generateStructuredData } from '@/lib/seo';
import Providers from '@/components/Providers';
import { ToastProvider } from '@/contexts/ToastContext';
import { LastUpdatedProvider } from '@/contexts/LastUpdatedContext';
import { NavbarVisibilityProvider } from '@/contexts/NavbarVisibilityContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import AppWrapper from '@/components/AppWrapper';
import Header from '@/components/Header';
import PageTransition from '@/components/PageTransition';
import Footer from '@/components/Footer';
import BottomNavigation from '@/components/BottomNavigation';
import UnregisterSW from '@/components/UnregisterSW';
import { SpeedInsights } from '@vercel/speed-insights/next';

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
                    <Header />
                    <main className="pb-20">
                      <PageTransition>
                        {children}
                      </PageTransition>
                    </main>
                    {modal}
                    <Footer />
                    <BottomNavigation />
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
