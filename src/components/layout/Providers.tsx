'use client';

import { OSSystemProvider } from '@/components/os/context/OSSystemContext';
import { LanguageProvider } from '@/contexts/LanguageContext';

/**
 * Root client providers.
 *
 * QueryClientProvider sengaja DIHAPUS dari sini — react-query hanya dipakai di
 * admin pages dan `/projects` (`IndexClientWithAutoUpdate`). Bungkus sub-tree
 * yang relevan dengan {@link QueryProvider} supaya homepage (OS desktop) dan
 * route public sederhana tidak ikut menanggung chunk `@tanstack/react-query`.
 *
 * ModalProvider removed — no consumer uses `useModal()` anywhere.
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <OSSystemProvider>
      <LanguageProvider>{children}</LanguageProvider>
    </OSSystemProvider>
  );
}
