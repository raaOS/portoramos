"use client"
import { useState, useCallback, useEffect } from 'react';
import { HardSkill } from '@/types/hardSkill';

export function useHardSkills(csrfToken: string | undefined) {
  const [skills, setSkills] = useState<HardSkill[]>([]);
  const [loading, setLoading] = useState(true);
  
  const fetchSkills = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hard-skills');
      if (res.ok) {
        const data = await res.json();
        setSkills(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);
  
  const saveOrder = useCallback(async (newSkills: HardSkill[]) => {
    setSkills(newSkills);
    try {
      await fetch('/api/hard-skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken || ''
        },
        credentials: 'include',
        body: JSON.stringify(newSkills),
      });
    } catch (err) {
      console.error('Error saving skills order:', err);
    }
  }, [csrfToken]);
  
  const moveUp = useCallback((index: number) => {
    if (index === 0) return;
    const newSkills = [...skills];
    [newSkills[index - 1], newSkills[index]] = [newSkills[index], newSkills[index - 1]];
    saveOrder(newSkills);
  }, [skills, saveOrder]);
  
  const moveDown = useCallback((index: number) => {
    if (index === skills.length - 1) return;
    const newSkills = [...skills];
    [newSkills[index + 1], newSkills[index]] = [newSkills[index], newSkills[index + 1]];
    saveOrder(newSkills);
  }, [skills, saveOrder]);
  
  const deleteSkill = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this skill?')) return;
    const newSkills = skills.filter(s => s.id !== id);
    saveOrder(newSkills);
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
    refresh: fetchSkills
  };
}
