'use client';

import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AboutData, UpdateAboutData } from '@/types/about';
import { useToast } from '@/contexts/ToastContext';
import { getWritableCsrfToken } from '@/lib/security/client-csrf';
import {
  ADMIN_DATA_GC_TIME,
  ADMIN_DATA_STALE_TIME,
  ADMIN_PLACEHOLDER_DATA,
  ADMIN_QUERY_KEYS,
  fetchAdminAbout,
  fetchAdminAboutFresh,
} from '../lib/adminQueries';

export function useAdminSystem(csrfToken: string | null) {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const [error, setError] = useState<string | null>(null);

  const aboutQuery = useQuery({
    queryKey: ADMIN_QUERY_KEYS.about,
    queryFn: fetchAdminAbout,
    staleTime: ADMIN_DATA_STALE_TIME,
    gcTime: ADMIN_DATA_GC_TIME,
    placeholderData: ADMIN_PLACEHOLDER_DATA.about,
    refetchOnMount: 'always',
  });

  const refreshAboutData = useCallback(async () => {
    const data = await fetchAdminAboutFresh();
    queryClient.setQueryData(ADMIN_QUERY_KEYS.about, data);
    return data;
  }, [queryClient]);

  const handleUpdateSystem = async (updateData: UpdateAboutData) => {
    try {
      const token = getWritableCsrfToken(csrfToken);
      const response = await fetch('/api/about', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': token,
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const result = await response.json();
        if (result?.data) {
          queryClient.setQueryData(ADMIN_QUERY_KEYS.about, result.data as AboutData);
        } else {
          await refreshAboutData();
        }
        setError(null);
        showSuccess('System configuration updated successfully.');
      } else {
        const errorData = await response.json().catch(() => ({}));
        const msg = `Failed to update: ${errorData.error || response.statusText}`;
        setError(msg);
        showError(msg);
      }
    } catch (err) {
      const msg = `Failed to update: ${err instanceof Error ? err.message : 'Network error'}`;
      setError(msg);
      showError(msg);
    }
  };

  return {
    systemData: aboutQuery.data ?? null,
    loading: aboutQuery.isLoading,
    isPlaceholderData: aboutQuery.isPlaceholderData,
    error,
    handleUpdateSystem,
  };
}
