'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Project, CreateProjectData, UpdateProjectData } from '@/types/projects';
import { useToast } from '@/contexts/ToastContext';
import { useAdminAuth } from '@/hooks/useAdminAuth';

export function useAdminProjects() {
    const queryClient = useQueryClient();
    const { showSuccess, showError } = useToast();
    const { csrfToken } = useAdminAuth();

    const [orderedProjects, setOrderedProjects] = useState<Project[]>([]);
    const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());
    const [isBulkUpdating, setIsBulkUpdating] = useState(false);

    // 1. Fetch Projects
    const { data: projectsData, isLoading, error } = useQuery({
        queryKey: ['projects', 'admin'],
        queryFn: async () => {
            const res = await fetch('/api/projects?fresh=true');
            if (!res.ok) throw new Error('Failed to fetch projects');
            return res.json();
        }
    });

    const projects = (projectsData?.projects || []) as Project[];

    // Sync orderedProjects when data changes
    useEffect(() => {
        if (projectsData?.projects) {
            setOrderedProjects(projectsData.projects as Project[]);
        }
    }, [projectsData]);

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
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken || ''
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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            showSuccess('Project berhasil dibuat');
        },
        onError: (err: Error) => showError(err.message || 'Failed to create project')
    });

    const updateMutation = useMutation({
        mutationFn: async (data: UpdateProjectData) => {
            const response = await fetch(`/api/projects/${data.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken || ''
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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            showSuccess('Project berhasil diperbarui');
        },
        onError: (err: Error) => showError(err.message || 'Failed to update project')
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`/api/projects/${id}`, {
                method: 'DELETE',
                headers: {
                    'x-csrf-token': csrfToken || ''
                },
                credentials: 'include',
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`${errorData.error || response.statusText} (${response.status})`);
            }
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            showSuccess('Project dihapus');
        },
        onError: (err: Error) => showError(err.message || 'Failed to delete project')
    });

    const handleReorder = useCallback(async (newItems: Project[]) => {
        setOrderedProjects(newItems);
        try {
            const res = await fetch('/api/projects/bulk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken || ''
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
            // Rollback if needed or refetch
            queryClient.invalidateQueries({ queryKey: ['projects', 'admin'] });
        }
    }, [csrfToken, queryClient, showError]);

    const handleBulkUpdate = async (action: 'publish' | 'draft' | 'delete') => {
        if (selectedProjectIds.size === 0) return;
        setIsBulkUpdating(true);
        try {
            const res = await fetch('/api/projects/bulk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken || ''
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
            await queryClient.invalidateQueries({ queryKey: ['projects'] });
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
        csrfToken
    };
}
