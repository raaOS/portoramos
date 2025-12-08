'use client';

import { useState, useEffect } from 'react';
import { useAutoUpdate } from '@/hooks/useAutoUpdate';
import { Project } from '@/types/projects';
import { useLastUpdated } from '@/contexts/LastUpdatedContext';
import { POLLING } from '@/lib/constants';
import IndexClientInner from './IndexClientInner';

type Props = {
  initialProjects?: Project[];
  searchParams?: { tag?: string }
}

interface ProjectsResponse {
  projects: Project[];
  lastUpdated: string;
}

export default function IndexClientWithAutoUpdate({ initialProjects: serverProjects = [], searchParams }: Props) {
  const [initialProjects, setInitialProjects] = useState<Project[]>(serverProjects);
  const [loading, setLoading] = useState(serverProjects.length === 0);
  const [initialError, setInitialError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const { setLastUpdated } = useLastUpdated();

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load initial data only if we don't have server data
  useEffect(() => {
    if (!mounted || serverProjects.length > 0) return;

    const loadInitialData = async () => {
      try {
        setLoading(true);
        setInitialError(null);
        const response = await fetch('/api/projects?status=published');

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: ProjectsResponse = await response.json();
        setInitialProjects(data.projects);
        setLastUpdated(new Date(data.lastUpdated));
      } catch (error) {
        console.error('Failed to load initial projects:', error);
        setInitialError('Failed to load projects. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [mounted, serverProjects.length, setLastUpdated]);

  // Set lastUpdated based on initial projects (SSR data)
  useEffect(() => {
    if (!initialProjects.length) return;
    const latest = initialProjects.reduce((acc, proj) => {
      const updated = proj.updatedAt ? new Date(proj.updatedAt).getTime() : 0;
      const created = proj.createdAt ? new Date(proj.createdAt).getTime() : 0;
      return Math.max(acc, updated || created);
    }, 0);
    if (latest) {
      setLastUpdated(new Date(latest));
    }
  }, [initialProjects, setLastUpdated]);

  // Auto-update data
  const { data: updatedData, lastUpdated } = useAutoUpdate<ProjectsResponse>(
    async () => {
      const response = await fetch('/api/projects?status=published');
      if (!response.ok) throw new Error('Failed to fetch projects');
      return response.json();
    },
    { interval: POLLING.UPDATE_INTERVAL, enabled: !loading && (initialProjects.length > 0 || serverProjects.length > 0) } // Update every 30 seconds, only after initial load
  );

  // Update context when lastUpdated changes
  useEffect(() => {
    if (lastUpdated) {
      setLastUpdated(lastUpdated);
    }
  }, [lastUpdated, setLastUpdated]);

  const projects = updatedData?.projects || initialProjects;
  const tag = searchParams?.tag || '';

  // Show loading or error only if we have no data at all
  if (initialProjects.length === 0 && loading) {
    return (
      <div className="p-8 text-center">
        <div className="text-lg">Loading projects...</div>
        <div className="text-sm text-gray-600 mt-2">
          Initial projects: {initialProjects.length}
        </div>
      </div>
    );
  }

  if (initialProjects.length === 0 && initialError) {
    return (
      <div className="p-8 text-center">
        <div className="text-lg text-red-600">Failed to load projects</div>
        <div className="text-sm text-gray-600 mt-2">
          {initialError}
        </div>
      </div>
    );
  }

  return (
    <div>
      <IndexClientInner projects={projects} tag={tag} lastUpdated={lastUpdated} />
    </div>
  );
}
