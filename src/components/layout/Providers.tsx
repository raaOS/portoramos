'use client';

import { ModalProvider } from '@/contexts/ModalContext';
import { OSSystemProvider } from '@/components/os/context/OSSystemContext';

/**
 * Root client providers.
 *
 * QueryClientProvider sengaja DIHAPUS dari sini — react-query hanya dipakai di
 * admin pages dan `/projects` (`IndexClientWithAutoUpdate`). Bungkus sub-tree
 * yang relevan dengan {@link QueryProvider} supaya homepage (OS desktop) dan
 * route public sederhana tidak ikut menanggung chunk `@tanstack/react-query`.
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ModalProvider>
      <OSSystemProvider>{children}</OSSystemProvider>
    </ModalProvider>
  );
}
