'use client';

import { useState, useEffect, useCallback } from 'react';
import { AboutData, UpdateAboutData } from '@/types/about';
import { RunningTextItem } from '@/types/runningText';
import { Project } from '@/types/projects';
import { useToast } from '@/contexts/ToastContext';
import { getWritableCsrfToken } from '@/lib/security/client-csrf';

export function useAdminAbout(csrfToken: string | null) {
    const [aboutData, setAboutData] = useState<AboutData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [runningTexts, setRunningTexts] = useState<RunningTextItem[]>([]);
    const [runningTextsLoading, setRunningTextsLoading] = useState(true);
    const { showSuccess, showError } = useToast();

    const loadAboutData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/about');
            const data = await response.json();
            setAboutData(data);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to load about data');
            showError('Failed to load about content.');
        } finally {
            setLoading(false);
        }
    }, [showError]);

    const loadRunningTexts = useCallback(async () => {
        try {
            setRunningTextsLoading(true);
            const response = await fetch('/api/running-text?fresh=true');
            const data = await response.json();
            setRunningTexts(data.items || []);
        } catch {
            showError('Failed to load running text.');
        } finally {
            setRunningTextsLoading(false);
        }
    }, [showError]);

    const loadProjects = useCallback(async () => {
        try {
            const response = await fetch('/api/projects');
            const data = await response.json();
            setProjects(data?.data?.projects || []);
        } catch (_err) {
            console.error('Failed to load projects for selector', _err);
        }
    }, []);

    useEffect(() => {
        loadAboutData();
        loadRunningTexts();
        loadProjects();
    }, [loadAboutData, loadRunningTexts, loadProjects]);

    const handleUpdateAbout = async (updateData: UpdateAboutData) => {
        try {
            const token = getWritableCsrfToken(csrfToken);
            const response = await fetch('/api/about', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': token
                },
                credentials: 'include',
                body: JSON.stringify(updateData)
            });

            if (response.ok) {
                await loadAboutData();
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

    const handleCreateRunningText = async (payload: { text: string; order?: number; isActive?: boolean }) => {
        try {
            const token = getWritableCsrfToken(csrfToken);
            const response = await fetch('/api/running-text', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': token
                },
                credentials: 'include',
                body: JSON.stringify(payload),
            });
            if (response.ok) {
                await loadRunningTexts();
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
                    'x-csrf-token': token
                },
                credentials: 'include',
                body: JSON.stringify(payload),
            });
            if (response.ok) {
                await loadRunningTexts();
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
                    'x-csrf-token': token
                },
                credentials: 'include'
            });
            if (response.ok) {
                await loadRunningTexts();
                showSuccess('Running text dihapus.');
            } else {
                showError('Gagal menghapus running text.');
            }
        } catch {
            showError('Gagal menghapus running text.');
        }
    };

    return {
        aboutData,
        loading,
        error,
        projects,
        runningTexts,
        runningTextsLoading,
        handleUpdateAbout,
        handleCreateRunningText,
        handleUpdateRunningText,
        handleDeleteRunningText,
        refreshAboutData: loadAboutData
    };
}
