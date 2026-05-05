'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ExperienceData, WorkExperience } from '@/types/experience';
import { useToast } from '@/contexts/ToastContext';
import { getWritableCsrfToken } from '@/lib/security/client-csrf';
import {
    ADMIN_DATA_GC_TIME,
    ADMIN_DATA_STALE_TIME,
    ADMIN_PLACEHOLDER_DATA,
    ADMIN_QUERY_KEYS,
    fetchAdminExperience,
} from '../lib/adminQueries';

export function useAdminExperience(csrfToken: string | null) {
    const queryClient = useQueryClient();
    const { showSuccess, showError } = useToast();

    const experienceQuery = useQuery({
        queryKey: ADMIN_QUERY_KEYS.experience,
        queryFn: fetchAdminExperience,
        staleTime: ADMIN_DATA_STALE_TIME,
        gcTime: ADMIN_DATA_GC_TIME,
        placeholderData: ADMIN_PLACEHOLDER_DATA.experience,
    });

    useEffect(() => {
        if (experienceQuery.error) {
            console.error('Error loading experience data:', experienceQuery.error);
            showError('Failed to load experience data.');
        }
    }, [experienceQuery.error, showError]);

    const refreshData = async () => {
        const data = await queryClient.fetchQuery({
            queryKey: ADMIN_QUERY_KEYS.experience,
            queryFn: fetchAdminExperience,
            staleTime: 0,
            gcTime: ADMIN_DATA_GC_TIME,
        });
        queryClient.setQueryData(ADMIN_QUERY_KEYS.experience, data);
        return data;
    };

    const updateExperience = async (updateData: Partial<ExperienceData>) => {
        try {
            const token = getWritableCsrfToken(csrfToken);
            const response = await fetch('/api/experience', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': token
                },
                credentials: 'include',
                body: JSON.stringify(updateData)
            });

            if (response.ok) {
                const result = await response.json();
                if (result?.data) {
                    queryClient.setQueryData(ADMIN_QUERY_KEYS.experience, result.data as ExperienceData);
                } else {
                    await refreshData();
                }
                showSuccess('Experience updated successfully.');
                return true;
            }

            const errorData = await response.json().catch(() => ({}));
            showError(`Failed to update experience: ${errorData.error || response.statusText} (${response.status})`);
            return false;
        } catch (error) {
            showError(`Failed to update experience: ${error instanceof Error ? error.message : 'Network error'}`);
            return false;
        }
    };

    const handleUpdateStats = async (stats: ExperienceData['statistics']) => {
        return await updateExperience({ statistics: stats });
    };

    const handleUpdateWorkHistory = async (workHistory: WorkExperience[]) => {
        return await updateExperience({ workExperience: workHistory });
    };

    return {
        experienceData: experienceQuery.data ?? null,
        loading: experienceQuery.isLoading,
        error: experienceQuery.error ? 'Failed to load experience data' : null,
        handleUpdateStats,
        handleUpdateWorkHistory,
        refreshData
    };
}
