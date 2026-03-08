"use client"

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ModalProvider } from '@/contexts/ModalContext';

import { POLLING } from '@/lib/constants';

export default function Providers({ children }: { children: React.ReactNode }){
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: POLLING.CLIENT_STALE_TIME, // 5 menit - hemat bandwidth
        gcTime: 10 * 60 * 1000, // Garbage collect after 10 menit
        refetchOnWindowFocus: false,
        retry: 1,
      }
    }
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <ModalProvider>
        {children}
      </ModalProvider>
    </QueryClientProvider>
  )
}
