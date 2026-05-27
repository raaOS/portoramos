'use client';

import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AboutData, UpdateAboutData } from '@/types/about';
import { RunningTextItem } from '@/types/runningText';
import { useToast } from '@/contexts/ToastContext';
import { getWritableCsrfToken } from '@/lib/security/client-csrf';
import {
  ADMIN_DATA_GC_TIME,
  ADMIN_DATA_STALE_TIME,
  ADMIN_PLACEHOLDER_DATA,
  ADMIN_QUERY_KEYS,
  fetchAdminAbout,
  fetchAdminAboutFresh,
  fetchAdminRunningText,
  fetchAdminRunningTextFresh,
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

  const runningTextQuery = useQuery({
    queryKey: ADMIN_QUERY_KEYS.runningText,
    queryFn: fetchAdminRunningText,
    staleTime: ADMIN_DATA_STALE_TIME,
    gcTime: ADMIN_DATA_GC_TIME,
    placeholderData: ADMIN_PLACEHOLDER_DATA.runningText,
  });

  const refreshAboutData = useCallback(async () => {
    const data = await fetchAdminAboutFresh();
    queryClient.setQueryData(ADMIN_QUERY_KEYS.about, data);
    return data;
  }, [queryClient]);

  const refreshRunningTexts = useCallback(async () => {
    const data = await fetchAdminRunningTextFresh();
    queryClient.setQueryData(ADMIN_QUERY_KEYS.runningText, data);
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

  const handleCreateRunningText = async (payload: { text: string; order?: number; isActive?: boolean }) => {
    try {
      const token = getWritableCsrfToken(csrfToken);
      const response = await fetch('/api/running-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        await refreshRunningTexts();
        showSuccess('Running text created.');
      } else {
        showError('Failed to create running text.');
      }
    } catch {
      showError('Failed to create running text.');
    }
  };

  const handleUpdateRunningText = async (id: string, payload: Partial<RunningTextItem>) => {
    try {
      const token = getWritableCsrfToken(csrfToken);
      const response = await fetch(`/api/running-text/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        await refreshRunningTexts();
        showSuccess('Running text updated.');
      } else {
        showError('Failed to update running text.');
      }
    } catch {
      showError('Failed to update running text.');
    }
  };

  const handleDeleteRunningText = async (id: string) => {
    try {
      const token = getWritableCsrfToken(csrfToken);
      const response = await fetch(`/api/running-text/${id}`, {
        method: 'DELETE',
        headers: { 'x-csrf-token': token },
        credentials: 'include',
      });
      if (response.ok) {
        await refreshRunningTexts();
        showSuccess('Running text deleted.');
      } else {
        showError('Failed to delete running text.');
      }
    } catch {
      showError('Failed to delete running text.');
    }
  };

  return {
    systemData: aboutQuery.data ?? null,
    loading: aboutQuery.isLoading,
    isPlaceholderData: aboutQuery.isPlaceholderData,
    error,
    runningTexts: runningTextQuery.data?.items || [],
    runningTextsLoading: runningTextQuery.isLoading,
    handleUpdateSystem,
    handleCreateRunningText,
    handleUpdateRunningText,
    handleDeleteRunningText,
  };
}
