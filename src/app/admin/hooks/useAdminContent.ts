'use client';

import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AboutData, UpdateAboutData } from '@/types/about';
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
} from '../lib/adminQueries';

export function useAdminContent(csrfToken: string | null) {
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

  const labelsQuery = useQuery({
    queryKey: ADMIN_QUERY_KEYS.labels,
    queryFn: fetchAdminLabels,
    staleTime: ADMIN_DATA_STALE_TIME,
    gcTime: ADMIN_DATA_GC_TIME,
    placeholderData: ADMIN_PLACEHOLDER_DATA.labels,
    initialData: [] as Label[],
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

  const handleUpdateContent = async (updateData: UpdateAboutData) => {
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
        showSuccess('Content updated successfully.');
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

  return {
    contentData: aboutQuery.data ?? null,
    loading: aboutQuery.isLoading,
    isPlaceholderData: aboutQuery.isPlaceholderData,
    error,
    projects: (projectsQuery.data?.data?.projects || []) as Project[],
    labels: labelsQuery.data || [],
    labelsLoading: labelsQuery.isLoading,
    handleUpdateContent,
    handleUpdateLabels,
  };
}
