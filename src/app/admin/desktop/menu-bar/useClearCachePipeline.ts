'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/contexts/ToastContext';
import { useCsrfToken } from '@/hooks/useCsrfToken';
import type { ClearCacheProgressStep } from '../../components/ClearCacheProgressModal';
import {
  createInitialCacheSteps,
  pause,
  mapServerStatus,
  summarizeServerSteps,
  type ClearCacheResponse,
} from '../helpers/clearCacheUtils';

export function useClearCachePipeline() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showError } = useToast();
  const csrfToken = useCsrfToken();

  const [showClearCacheProgress, setShowClearCacheProgress] = useState(false);
  const [cacheSteps, setCacheSteps] = useState<ClearCacheProgressStep[]>(createInitialCacheSteps);
  const [canCloseCacheProgress, setCanCloseCacheProgress] = useState(true);
  const [isClearingCache, setIsClearingCache] = useState(false);

  const updateCacheStep = useCallback(
    (id: string, patch: Partial<ClearCacheProgressStep>) => {
      setCacheSteps((current) =>
        current.map((step) => (step.id === id ? { ...step, ...patch } : step))
      );
    },
    []
  );

  const markPendingCacheStepsAsSkipped = useCallback((detail: string) => {
    setCacheSteps((current) =>
      current.map((step) =>
        step.status === 'pending' ? { ...step, status: 'skipped', detail } : step
      )
    );
  }, []);

  const handleClearCache = async () => {
    if (isClearingCache) return;

    setIsClearingCache(true);
    setShowClearCacheProgress(true);
    setCanCloseCacheProgress(false);
    setCacheSteps(createInitialCacheSteps());

    try {
      updateCacheStep('serverRequest', {
        status: 'running',
        detail: 'Mengirim request ke /api/admin/clear-cache...',
      });

      const res = await fetch('/api/admin/clear-cache', {
        method: 'POST',
        headers: {
          'x-csrf-token': csrfToken || '',
        },
      });

      const data = (await res.json().catch(() => null)) as ClearCacheResponse | null;
      if (res.ok) {
        updateCacheStep('serverRequest', {
          status: 'done',
          detail: data?.message || 'Server menerima request clear cache.',
        });

        await pause(120);
        updateCacheStep('nextRevalidate', {
          status: 'done',
          detail: 'Route utama direvalidate dari server.',
        });

        await pause(120);
        const serverMemory = summarizeServerSteps(data?.details?.serverMemory);
        updateCacheStep('serverMemory', serverMemory);

        await pause(120);
        const nextFilesystem = summarizeServerSteps(data?.details?.nextFilesystem);
        updateCacheStep('nextFilesystem', nextFilesystem);

        await pause(120);
        const cdnStep = data?.details?.cloudflareCdn;
        updateCacheStep('cloudflareCdn', {
          status: mapServerStatus(cdnStep?.status),
          detail: cdnStep?.detail || 'Cloudflare CDN purge tidak tersedia.',
        });

        await pause(120);
        updateCacheStep('reactQuery', {
          status: 'running',
          detail: 'Menghapus cache TanStack Query di browser...',
        });
        queryClient.clear();
        updateCacheStep('reactQuery', {
          status: 'done',
          detail: 'React Query cache dikosongkan.',
        });

        await pause(120);
        updateCacheStep('browserCache', {
          status: 'running',
          detail: 'Menghapus Cache Storage browser...',
        });
        if ('caches' in window) {
          const cacheNames = await window.caches.keys();
          await Promise.all(cacheNames.map((cacheName) => window.caches.delete(cacheName)));
          updateCacheStep('browserCache', {
            status: 'done',
            detail: `${cacheNames.length} browser cache storage dihapus.`,
          });
        } else {
          updateCacheStep('browserCache', {
            status: 'skipped',
            detail: 'Browser tidak mendukung Cache Storage API.',
          });
        }

        await pause(120);
        updateCacheStep('serviceWorker', {
          status: 'running',
          detail: 'Meminta service worker refresh...',
        });
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          const results = await Promise.allSettled(
            registrations.map((registration) => registration.update())
          );
          const failed = results.filter((result) => result.status === 'rejected').length;
          updateCacheStep('serviceWorker', {
            status: failed > 0 ? 'error' : 'done',
            detail:
              failed > 0
                ? `${failed} service worker gagal di-refresh.`
                : `${registrations.length} service worker di-refresh.`,
          });
        } else {
          updateCacheStep('serviceWorker', {
            status: 'skipped',
            detail: 'Browser tidak memiliki service worker aktif.',
          });
        }

        await pause(120);
        updateCacheStep('uiRefresh', {
          status: 'running',
          detail: 'Memuat ulang data admin dari server...',
        });
        router.refresh();
        updateCacheStep('uiRefresh', {
          status: 'done',
          detail: 'Admin UI sudah diminta refresh.',
        });
      } else {
        updateCacheStep('serverRequest', {
          status: 'error',
          detail: data?.message || `Server menolak request (${res.status}).`,
        });
        markPendingCacheStepsAsSkipped('Dibatalkan karena request server gagal.');
        showError('Gagal membersihkan cache');
      }
    } catch (err) {
      console.error(err);
      updateCacheStep('serverRequest', {
        status: 'error',
        detail: err instanceof Error ? err.message : 'Terjadi kesalahan internal',
      });
      markPendingCacheStepsAsSkipped('Dibatalkan karena proses sebelumnya gagal.');
      showError('Terjadi kesalahan internal');
    } finally {
      setIsClearingCache(false);
      setCanCloseCacheProgress(true);
    }
  };

  return {
    showClearCacheProgress,
    setShowClearCacheProgress,
    cacheSteps,
    canCloseCacheProgress,
    isClearingCache,
    handleClearCache,
  };
}
