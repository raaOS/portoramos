"use client"

import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { HardSkill } from '@/types/hardSkill';
import {
  ADMIN_DATA_GC_TIME,
  ADMIN_DATA_STALE_TIME,
  ADMIN_PLACEHOLDER_DATA,
  ADMIN_QUERY_KEYS,
  fetchAdminHardSkills,
} from '../../lib/adminQueries';

export function useHardSkills(csrfToken: string | undefined) {
  const queryClient = useQueryClient();

  const { data: skills = [], isLoading: loading } = useQuery({
    queryKey: ADMIN_QUERY_KEYS.hardSkills,
    queryFn: fetchAdminHardSkills,
    staleTime: ADMIN_DATA_STALE_TIME,
    gcTime: ADMIN_DATA_GC_TIME,
    placeholderData: ADMIN_PLACEHOLDER_DATA.hardSkills,
  });

  const refresh = useCallback(async () => {
    const data = await queryClient.fetchQuery({
      queryKey: ADMIN_QUERY_KEYS.hardSkills,
      queryFn: fetchAdminHardSkills,
      staleTime: 0,
      gcTime: ADMIN_DATA_GC_TIME,
    });
    queryClient.setQueryData(ADMIN_QUERY_KEYS.hardSkills, data);
    return data;
  }, [queryClient]);

  const saveOrder = useCallback(async (newSkills: HardSkill[]) => {
    queryClient.setQueryData(ADMIN_QUERY_KEYS.hardSkills, newSkills);
    try {
      const response = await fetch('/api/hard-skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken || ''
        },
        credentials: 'include',
        body: JSON.stringify(newSkills),
      });

      if (!response.ok) {
        await refresh();
      }
    } catch (err) {
      console.error('Error saving skills order:', err);
      await refresh();
    }
  }, [csrfToken, queryClient, refresh]);

  const moveUp = useCallback((index: number) => {
    if (index === 0) return;
    const newSkills = [...skills];
    [newSkills[index - 1], newSkills[index]] = [newSkills[index], newSkills[index - 1]];
    void saveOrder(newSkills);
  }, [skills, saveOrder]);

  const moveDown = useCallback((index: number) => {
    if (index === skills.length - 1) return;
    const newSkills = [...skills];
    [newSkills[index + 1], newSkills[index]] = [newSkills[index], newSkills[index + 1]];
    void saveOrder(newSkills);
  }, [skills, saveOrder]);

  const deleteSkill = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this skill?')) return;
    const newSkills = skills.filter(s => s.id !== id);
    await saveOrder(newSkills);
  }, [skills, saveOrder]);

  const addOrUpdateSkill = useCallback(async (skill: HardSkill, isAdding: boolean) => {
    let newSkills = [...skills];
    if (isAdding) {
      newSkills.push(skill);
    } else {
      newSkills = newSkills.map(s => s.id === skill.id ? skill : s);
    }
    await saveOrder(newSkills);
  }, [skills, saveOrder]);

  return {
    skills,
    loading,
    moveUp,
    moveDown,
    deleteSkill,
    addOrUpdateSkill,
    refresh
  };
}
