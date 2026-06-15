'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Testimonial, TestimonialData } from '@/types/testimonial';
import { Project } from '@/types/projects';
import { useToast } from '@/contexts/ToastContext';
import { getWritableCsrfToken } from '@/lib/security/client-csrf';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import {
  ADMIN_DATA_GC_TIME,
  ADMIN_DATA_STALE_TIME,
  ADMIN_PLACEHOLDER_DATA,
  ADMIN_QUERY_KEYS,
  fetchAdminProjects,
  fetchAdminTestimonials,
} from '../lib/adminQueries';

export function useAdminTestimonial(csrfToken: string | null) {
  const queryClient = useQueryClient();
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const { showSuccess, showError } = useToast();
  const { confirm } = useConfirm();

  const testimonialQuery = useQuery({
    queryKey: ADMIN_QUERY_KEYS.testimonial,
    queryFn: fetchAdminTestimonials,
    staleTime: ADMIN_DATA_STALE_TIME,
    gcTime: ADMIN_DATA_GC_TIME,
    placeholderData: ADMIN_PLACEHOLDER_DATA.testimonial,
  });

  const projectsQuery = useQuery({
    queryKey: ADMIN_QUERY_KEYS.projects,
    queryFn: fetchAdminProjects,
    staleTime: ADMIN_DATA_STALE_TIME,
    gcTime: ADMIN_DATA_GC_TIME,
    placeholderData: ADMIN_PLACEHOLDER_DATA.projects,
  });

  const currentData = testimonialQuery.data;

  const setTestimonialsCache = (updater: (data: TestimonialData) => TestimonialData) => {
    queryClient.setQueryData<TestimonialData>(ADMIN_QUERY_KEYS.testimonial, (previous) => {
      const base = previous || {
        testimonials: [],
        lastUpdated: new Date().toISOString(),
      };
      return updater(base);
    });
  };

  const refresh = async () => {
    const data = await queryClient.fetchQuery({
      queryKey: ADMIN_QUERY_KEYS.testimonial,
      queryFn: fetchAdminTestimonials,
      staleTime: 0,
      gcTime: ADMIN_DATA_GC_TIME,
    });
    queryClient.setQueryData(ADMIN_QUERY_KEYS.testimonial, data);
    return data;
  };

  const generateAITestimonial = async (topic: string, messageCount: number) => {
    if (!topic) return null;
    setIsAiGenerating(true);
    try {
      const token = getWritableCsrfToken(csrfToken);
      const response = await fetch('/api/ai/generate-testimonial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': token,
        },
        credentials: 'include',
        body: JSON.stringify({ topic, messageCount }),
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
      const token = getWritableCsrfToken(csrfToken);
      const response = await fetch('/api/testimonial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': token,
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        if (result?.testimonial) {
          setTestimonialsCache((data) => ({
            ...data,
            testimonials: [...data.testimonials, result.testimonial as Testimonial],
            lastUpdated: new Date().toISOString(),
          }));
        } else {
          await refresh();
        }
        showSuccess('Testimonial created successfully.');
        return true;
      }

      showError('Failed to create testimonial.');
      return false;
    } catch {
      showError('Failed to create testimonial.');
      return false;
    }
  };

  const updateTestimonial = async (id: string, formData: Partial<Testimonial>) => {
    try {
      const token = getWritableCsrfToken(csrfToken);
      const response = await fetch('/api/testimonial', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': token,
        },
        credentials: 'include',
        body: JSON.stringify({ id, ...formData }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result?.testimonial) {
          setTestimonialsCache((data) => ({
            ...data,
            testimonials: data.testimonials.map((testimonial) =>
              testimonial.id === id ? (result.testimonial as Testimonial) : testimonial
            ),
            lastUpdated: new Date().toISOString(),
          }));
        } else {
          await refresh();
        }
        showSuccess('Testimonial updated successfully.');
        return true;
      }

      showError('Failed to update testimonial.');
      return false;
    } catch {
      showError('Failed to update testimonial.');
      return false;
    }
  };

  const deleteTestimonial = async (id: string) => {
    const ok = await confirm({
      title: 'Hapus testimonial?',
      message: 'Testimonial akan dihapus permanen dan tidak bisa dipulihkan.',
      confirmText: 'Hapus',
      cancelText: 'Batal',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      const token = getWritableCsrfToken(csrfToken);
      const response = await fetch('/api/testimonial', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': token,
        },
        credentials: 'include',
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        setTestimonialsCache((data) => ({
          ...data,
          testimonials: data.testimonials.filter((testimonial) => testimonial.id !== id),
          lastUpdated: new Date().toISOString(),
        }));
        showSuccess('Testimonial deleted successfully.');
      } else {
        showError('Failed to delete testimonial.');
      }
    } catch {
      showError('Failed to delete testimonial.');
    }
  };

  return {
    testimonials: currentData?.testimonials || [],
    projects: (projectsQuery.data?.data?.projects || []) as Project[],
    loading: testimonialQuery.isLoading,
    error: testimonialQuery.error ? 'Failed to load testimonials' : null,
    isAiGenerating,
    lastUpdated: currentData?.lastUpdated ? new Date(currentData.lastUpdated) : null,
    generateAITestimonial,
    createTestimonial,
    updateTestimonial,
    deleteTestimonial,
    refresh,
  };
}
