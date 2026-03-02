'use client';

import { useState, useEffect, useCallback } from 'react';
import { Testimonial, TestimonialData } from '@/types/testimonial';
import { Project } from '@/types/projects';
import { useToast } from '@/contexts/ToastContext';
import { useAutoUpdate } from '@/hooks/useAutoUpdate';

export function useAdminTestimonial(csrfToken: string | null) {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAiGenerating, setIsAiGenerating] = useState(false);
    const { showSuccess, showError } = useToast();

    const loadTestimonials = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/testimonial');
            if (!response.ok) throw new Error('Failed to fetch testimonials');
            const data: TestimonialData = await response.json();
            setTestimonials(data.testimonials);
            setError(null);
        } catch (_error) {
            console.error('Error loading testimonials:', _error);
            setError('Failed to load testimonials');
            showError('Failed to load testimonials.');
        } finally {
            setLoading(false);
        }
    }, [showError]);

    const loadProjects = useCallback(async () => {
        try {
            const response = await fetch('/api/projects');
            if (!response.ok) throw new Error('Failed to fetch projects');
            const data = await response.json();
            setProjects(data?.data?.projects || []);
        } catch (_err) {
            console.error('Error loading projects:', _err);
        }
    }, []);

    useEffect(() => {
        loadTestimonials();
        loadProjects();
    }, [loadTestimonials, loadProjects]);

    const { lastUpdated, refresh } = useAutoUpdate(loadTestimonials);

    const generateAITestimonial = async (topic: string, messageCount: number) => {
        if (!topic) return null;
        setIsAiGenerating(true);
        try {
            const response = await fetch('/api/ai/generate-testimonial', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken || ''
                },
                credentials: 'include',
                body: JSON.stringify({ topic, messageCount })
            });

            if (!response.ok) throw new Error('AI Generation failed');
            const data = await response.json();
            showSuccess('Konten berhasil dibuat oleh AI!');
            return data;
        } catch {
            showError('Gagal generate AI. Coba lagi.');
            return null;
        } finally {
            setIsAiGenerating(false);
        }
    };

    const createTestimonial = async (formData: Partial<Testimonial>) => {
        try {
            const response = await fetch('/api/testimonial', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken || ''
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                refresh();
                showSuccess('Testimonial created successfully.');
                return true;
            } else {
                showError('Failed to create testimonial.');
                return false;
            }
        } catch {
            showError('Failed to create testimonial.');
            return false;
        }
    };

    const updateTestimonial = async (id: number, formData: Partial<Testimonial>) => {
        try {
            const response = await fetch('/api/testimonial', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken || ''
                },
                credentials: 'include',
                body: JSON.stringify({ id, ...formData })
            });

            if (response.ok) {
                refresh();
                showSuccess('Testimonial updated successfully.');
                return true;
            } else {
                showError('Failed to update testimonial.');
                return false;
            }
        } catch {
            showError('Failed to update testimonial.');
            return false;
        }
    };

    const deleteTestimonial = async (id: number) => {
        if (!confirm('Are you sure you want to delete this testimonial?')) return;
        try {
            const response = await fetch('/api/testimonial', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken || ''
                },
                credentials: 'include',
                body: JSON.stringify({ id })
            });

            if (response.ok) {
                refresh();
                showSuccess('Testimonial deleted successfully.');
            } else {
                showError('Failed to delete testimonial.');
            }
        } catch {
            showError('Failed to delete testimonial.');
        }
    };

    return {
        testimonials,
        projects,
        loading,
        error,
        isAiGenerating,
        lastUpdated,
        generateAITestimonial,
        createTestimonial,
        updateTestimonial,
        deleteTestimonial,
        refresh
    };
}
