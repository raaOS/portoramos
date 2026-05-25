'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { POLLING } from '@/lib/constants';

/**
 * Provider lokal untuk @tanstack/react-query.
 *
 * Sengaja TIDAK dipasang di root `Providers.tsx` supaya homepage (OS desktop)
 * dan route public yang tidak pakai react-query (mis. `/contact`) tidak ikut
 * bawa chunk `@tanstack/react-query` (~5 KB gz + dep). Pasang hanya di:
 *   - Admin layout (`src/app/admin/layout.tsx` via wrapper).
 *   - Halaman/komponen yang memang panggil `useQuery`/`useMutation`
 *     (mis. `IndexClientWithAutoUpdate` di `/projects`).
 */
export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: POLLING.CLIENT_STALE_TIME,
            gcTime: 10 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
