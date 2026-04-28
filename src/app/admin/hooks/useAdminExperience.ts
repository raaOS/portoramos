'use client';

import { useState, useEffect, useCallback } from 'react';
import { ExperienceData, WorkExperience } from '@/types/experience';
import { useToast } from '@/contexts/ToastContext';
import { getWritableCsrfToken } from '@/lib/security/client-csrf';

export function useAdminExperience(csrfToken: string | null) {
    const [experienceData, setExperienceData] = useState<ExperienceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { showSuccess, showError } = useToast();

    const loadExperienceData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/experience');
            if (!response.ok) throw new Error('Failed to fetch experience data');
            const data: ExperienceData = await response.json();
            setExperienceData(data);
            setError(null);
        } catch (error) {
            console.error('Error loading experience data:', error);
            setError('Failed to load experience data');
            showError('Failed to load experience data.');
        } finally {
            setLoading(false);
        }
    }, [showError]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadExperienceData();
    }, [loadExperienceData]);

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
                await loadExperienceData();
                showSuccess('Experience updated successfully.');
                return true;
            } else {
                const errorData = await response.json().catch(() => ({}));
                showError(`Failed to update experience: ${errorData.error || response.statusText} (${response.status})`);
                return false;
            }
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
        experienceData,
        loading,
        error,
        handleUpdateStats,
        handleUpdateWorkHistory,
        refreshData: loadExperienceData
    };
}
