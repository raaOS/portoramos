'use client';

import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AboutData, UpdateAboutData } from '@/types/about';
import { RunningTextItem } from '@/types/runningText';
import { Project } from '@/types/projects';
import { Label } from '@/types/labels';
import { useToast } from '@/contexts/ToastContext';
import { getWritableCsrfToken } from '@/lib/security/client-csrf';
import {
  ADMIN_DATA_GC_TIME,
  ADMIN_DATA_STALE_TIME,
  ADMIN_PLACEHOLDER_DATA,
  ADMIN_QUERY_KEYS,
  fetchAdminAbout,
  fetchAdminAboutFresh,
  fetchAdminLabels,
  fetchAdminProjects,
  fetchAdminRunningText,
  fetchAdminRunningTextFresh,
} from '../lib/adminQueries';

export function useAdminAbout(csrfToken: string | null) {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const [error, setError] = useState<string | null>(null);

  const aboutQuery = useQuery({
    queryKey: ADMIN_QUERY_KEYS.about,
    queryFn: fetchAdminAbout,
    staleTime: ADMIN_DATA_STALE_TIME,
    gcTime: ADMIN_DATA_GC_TIME,
    placeholderData: ADMIN_PLACEHOLDER_DATA.about,
    // Selalu refetch saat komponen re-mount (mis. navigasi balik dari
    // tab admin lain). Tanpa ini cache 15-menit bikin user lihat
    // wallpaper lama setelah upload + navigate keluar+masuk lagi.
    // Background refetch tetap pakai cached data sebagai initial render
    // jadi tidak ada flash skeleton untuk user yang punya cache valid.
    refetchOnMount: 'always',
  });

  const labelsQuery = useQuery({
    queryKey: ADMIN_QUERY_KEYS.labels,
    queryFn: fetchAdminLabels,
    staleTime: ADMIN_DATA_STALE_TIME,
    gcTime: ADMIN_DATA_GC_TIME,
    placeholderData: ADMIN_PLACEHOLDER_DATA.labels,
    initialData: [] as Label[],
  });

  const runningTextQuery = useQuery({
    queryKey: ADMIN_QUERY_KEYS.runningText,
    queryFn: fetchAdminRunningText,
    staleTime: ADMIN_DATA_STALE_TIME,
    gcTime: ADMIN_DATA_GC_TIME,
    placeholderData: ADMIN_PLACEHOLDER_DATA.runningText,
  });

  const projectsQuery = useQuery({
    queryKey: ADMIN_QUERY_KEYS.projects,
    queryFn: fetchAdminProjects,
    staleTime: ADMIN_DATA_STALE_TIME,
    gcTime: ADMIN_DATA_GC_TIME,
    placeholderData: ADMIN_PLACEHOLDER_DATA.projects,
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

  const handleUpdateAbout = async (updateData: UpdateAboutData) => {
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
        showSuccess('About content updated successfully.');
      } else {
        const errorData = await response.json().catch(() => ({}));
        const msg = `Failed to update: ${errorData.error || response.statusText} (${response.status})`;
        setError(msg);
        showError(msg);
      }
    } catch (err) {
      const msg = `Failed to update: ${err instanceof Error ? err.message : 'Network error'}`;
      setError(msg);
      showError(msg);
    }
  };

  const handleUpdateLabels = async (newLabels: Label[]) => {
    try {
      const token = getWritableCsrfToken(csrfToken);
      const response = await fetch('/api/about/labels', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': token,
        },
        credentials: 'include',
        body: JSON.stringify(newLabels),
      });

      if (response.ok) {
        queryClient.setQueryData(ADMIN_QUERY_KEYS.labels, newLabels);
        showSuccess('Labels updated successfully.');
        return true;
      }

      showError('Failed to update labels.');
      return false;
    } catch {
      showError('Failed to update labels.');
      return false;
    }
  };

  const handleCreateRunningText = async (payload: {
    text: string;
    order?: number;
    isActive?: boolean;
  }) => {
    try {
      const token = getWritableCsrfToken(csrfToken);
      const response = await fetch('/api/running-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': token,
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        await refreshRunningTexts();
        showSuccess('Running text berhasil ditambahkan.');
      } else {
        showError('Gagal menambahkan running text.');
      }
    } catch {
      showError('Gagal menambahkan running text.');
    }
  };

  const handleUpdateRunningText = async (id: string, payload: Partial<RunningTextItem>) => {
    try {
      const token = getWritableCsrfToken(csrfToken);
      const response = await fetch(`/api/running-text/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': token,
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        await refreshRunningTexts();
        showSuccess('Running text diperbarui.');
      } else {
        showError('Gagal memperbarui running text.');
      }
    } catch {
      showError('Gagal memperbarui running text.');
    }
  };

  const handleDeleteRunningText = async (id: string) => {
    try {
      const token = getWritableCsrfToken(csrfToken);
      const response = await fetch(`/api/running-text/${id}`, {
        method: 'DELETE',
        headers: {
          'x-csrf-token': token,
        },
        credentials: 'include',
      });
      if (response.ok) {
        await refreshRunningTexts();
        showSuccess('Running text dihapus.');
      } else {
        showError('Gagal menghapus running text.');
      }
    } catch {
      showError('Gagal menghapus running text.');
    }
  };

  return {
    aboutData: aboutQuery.data ?? null,
    loading: aboutQuery.isLoading,
    // True while the query result is still the synthetic `placeholderData`
    // (not yet replaced by a real network response). UI sections that
    // need to show "no items uploaded yet" state should branch on this
    // so they don't briefly flash fallback content from `src/data/about.json`
    // that doesn't reflect what's actually in D1.
    isPlaceholderData: aboutQuery.isPlaceholderData,
    // True whenever a network request is in-flight (initial load OR
    // background refresh). Useful for showing a subtle loading hint
    // alongside cached content.
    isFetching: aboutQuery.isFetching,
    error: error || (aboutQuery.error ? 'Failed to load about data' : null),
    projects: (projectsQuery.data?.data?.projects || []) as Project[],
    runningTexts: runningTextQuery.data?.items || [],
    runningTextsLoading: runningTextQuery.isLoading,
    labels: labelsQuery.data || [],
    labelsLoading: labelsQuery.isLoading,
    handleUpdateAbout,
    handleUpdateLabels,
    handleCreateRunningText,
    handleUpdateRunningText,
    handleDeleteRunningText,
    refreshAboutData,
  };
}
