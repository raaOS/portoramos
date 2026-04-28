'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Project, CreateProjectData, UpdateProjectData } from '@/types/projects';
import { useToast } from '@/contexts/ToastContext';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { POLLING } from '@/lib/constants';
import { useRealtimeSync } from '@/lib/services/realtimeSync';
import { getWritableCsrfToken } from '@/lib/security/client-csrf';
import { Label } from '@/types/labels';

export function useAdminProjects() {
    const queryClient = useQueryClient();
    const { showSuccess, showError } = useToast();
    const { csrfToken } = useAdminAuth();

    const [orderedProjects, setOrderedProjects] = useState<Project[]>([]);
    const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());
    const [isBulkUpdating, setIsBulkUpdating] = useState(false);

    const { data: projectsData, isLoading, error } = useQuery({
        queryKey: ['projects', 'admin'],
        queryFn: async () => {
            const res = await fetch('/api/projects?fresh=true');
            if (!res.ok) throw new Error('Failed to fetch projects');
            return res.json();
        },
        staleTime: POLLING.CLIENT_STALE_TIME,
        gcTime: 10 * 60 * 1000,
    });

    // 1.5 Fetch Labels
    const { data: labels } = useQuery({
        queryKey: ['labels'],
        queryFn: async () => {
            const res = await fetch('/api/about/labels');
            if (!res.ok) return [];
            return res.json();
        },
        initialData: [] as Label[]
    });

    const projects = (projectsData?.data?.projects || []) as Project[];

    // Sync orderedProjects when data changes (Render phase sync for purity)
    const [prevProjectsData, setPrevProjectsData] = useState(projectsData);
    if (projectsData !== prevProjectsData) {
        setPrevProjectsData(projectsData);
        if (projectsData?.data?.projects) {
            setOrderedProjects(projectsData.data.projects as Project[]);
        }
    }

    // 2. Fetch Comment Counts
    const { data: commentCounts } = useQuery({
        queryKey: ['comments', 'counts'],
        queryFn: async () => {
            const res = await fetch('/api/comments');
            if (!res.ok) throw new Error('Failed to fetch comments');
            const data = await res.json();
            const counts: Record<string, number> = {};
            if (data.comments) {
                Object.entries(data.comments).forEach(([slug, commentsList]: [string, unknown]) => {
                    const commentsArr = Array.isArray(commentsList) ? commentsList : [];
                    const total = commentsArr.reduce((acc, c) => acc + 1 + ((c as { replies?: unknown[] }).replies?.length || 0), 0);
                    counts[slug] = total;
                });
            }
            return counts;
        },
        initialData: {}
    });

    // 3. Mutations
    const createMutation = useMutation({
        mutationFn: async (data: CreateProjectData | UpdateProjectData) => {
            const token = getWritableCsrfToken(csrfToken);
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': token
                },
                credentials: 'include',
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`${errorData.error || response.statusText} (${response.status})`);
            }
            return response.json();
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['projects'], refetchType: 'all' });
            await queryClient.refetchQueries({ queryKey: ['projects', 'admin'], exact: true, type: 'active' });
            showSuccess('Project berhasil dibuat');
        },
        onError: (err: Error) => showError(err.message || 'Failed to create project')
    });

    const updateMutation = useMutation({
        mutationFn: async (data: UpdateProjectData) => {
            const token = getWritableCsrfToken(csrfToken);
            const response = await fetch(`/api/projects/${data.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': token
                },
                credentials: 'include',
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`${errorData.error || response.statusText} (${response.status})`);
            }
            return response.json();
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['projects'], refetchType: 'all' });
            await queryClient.refetchQueries({ queryKey: ['projects', 'admin'], exact: true, type: 'active' });
            showSuccess('Project berhasil diperbarui');
        },
        onError: (err: Error) => showError(err.message || 'Failed to update project')
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const token = getWritableCsrfToken(csrfToken);
            const response = await fetch(`/api/projects/${id}`, {
                method: 'DELETE',
                headers: {
                    'x-csrf-token': token
                },
                credentials: 'include',
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`${errorData.error || response.statusText} (${response.status})`);
            }
            return id;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['projects'], refetchType: 'all' });
            await queryClient.refetchQueries({ queryKey: ['projects', 'admin'], exact: true, type: 'active' });
            showSuccess('Project dihapus');
        },
        onError: (err: Error) => showError(err.message || 'Failed to delete project')
    });

    const handleReorder = useCallback(async (newItems: Project[]) => {
        setOrderedProjects(newItems);
        try {
            const token = getWritableCsrfToken(csrfToken);
            const res = await fetch('/api/projects/bulk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': token
                },
                credentials: 'include',
                body: JSON.stringify({ action: 'reorder', ids: newItems.map(p => p.id) })
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to reorder');
            }
        } catch (e: unknown) {
            const errorMsg = e instanceof Error ? e.message : 'Unknown error';
            showError(`Gagal memperbarui urutan: ${errorMsg}`);
            queryClient.invalidateQueries({ queryKey: ['projects', 'admin'] });
        }
    }, [csrfToken, queryClient, showError]);

    const handleBulkUpdate = async (action: 'publish' | 'draft' | 'delete') => {
        if (selectedProjectIds.size === 0) return;
        setIsBulkUpdating(true);
        try {
            const token = getWritableCsrfToken(csrfToken);
            const res = await fetch('/api/projects/bulk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': token
                },
                credentials: 'include',
                body: JSON.stringify({
                    action,
                    ids: Array.from(selectedProjectIds)
                })
            });

            if (!res.ok) throw new Error('Bulk update failed');

            setSelectedProjectIds(new Set());
            showSuccess(`Bulk ${action} complete`);
            await queryClient.invalidateQueries({ queryKey: ['projects'], refetchType: 'all' });
            await queryClient.refetchQueries({ queryKey: ['projects', 'admin'], exact: true, type: 'active' });
        } catch {
            showError(`Bulk ${action} failed`);
        } finally {
            setIsBulkUpdating(false);
        }
    };

    const toggleProjectSelection = (id: string) => {
        const newSelected = new Set(selectedProjectIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedProjectIds(newSelected);
    };

    const selectAllProjects = (allIds: string[]) => {
        if (selectedProjectIds.size === allIds.length) {
            setSelectedProjectIds(new Set());
        } else {
            setSelectedProjectIds(new Set(allIds));
        }
    };

    const refreshProjects = async () => {
        await queryClient.invalidateQueries({ queryKey: ['projects'], refetchType: 'all' });
        await queryClient.refetchQueries({ queryKey: ['projects', 'admin'], exact: true });
    };

    useRealtimeSync({
        onUpdate: () => {
            console.log('[AdminProjects] Real-time update detected, refreshing...');
            refreshProjects();
        },
        onUnavailable: () => {
            console.log('[AdminProjects] Real-time sync unavailable, using manual refresh');
        },
        enabled: typeof window !== 'undefined'
    });

    return {
        projects,
        orderedProjects,
        setOrderedProjects,
        isLoading,
        error,
        commentCounts,
        createMutation,
        updateMutation,
        deleteMutation,
        handleReorder,
        handleBulkUpdate,
        isBulkUpdating,
        selectedProjectIds,
        toggleProjectSelection,
        selectAllProjects,
        labels,
        csrfToken,
        refreshProjects
    };
}
