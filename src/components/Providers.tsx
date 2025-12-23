"use client"

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ModalProvider } from '@/contexts/ModalContext';

export default function Providers({ children }: { children: React.ReactNode }){
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000, // 1 menit
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
