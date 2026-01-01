'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
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

const fetchProjects = async (): Promise<ProjectsResponse> => {
  // Always fetch fresh data client-side to ensure draft/publish status is reflected immediately
  const response = await fetch('/api/projects?status=published&fresh=true');
  if (!response.ok) {
    throw new Error('Failed to fetch projects');
  }
  return response.json();
};

export default function IndexClientWithAutoUpdate({ initialProjects: serverProjects = [], searchParams }: Props) {
  const { setLastUpdated } = useLastUpdated();

  const { data } = useQuery({
    queryKey: ['projects', 'published'],
    queryFn: fetchProjects,
    refetchInterval: POLLING.UPDATE_INTERVAL,
    // We don't stick strictly to initialData because the shape matches purely ProjectsResponse
    // preventing a precise type match if we just threw serverProjects in.
    // Instead we fallback to serverProjects in the render.
  });

  const projects = data?.projects || serverProjects;
  const lastUpdatedStr = data?.lastUpdated;

  // Sync lastUpdated context
  useEffect(() => {
    if (lastUpdatedStr) {
      setLastUpdated(new Date(lastUpdatedStr));
    } else if (projects.length > 0 && !lastUpdatedStr) {
      // Estimate from projects if API hasn't returned yet (SSR state)
      const latest = projects.reduce((acc, proj) => {
        const updated = proj.updatedAt ? new Date(proj.updatedAt).getTime() : 0;
        const created = proj.createdAt ? new Date(proj.createdAt).getTime() : 0;
        return Math.max(acc, updated || created);
      }, 0);
      if (latest) {
        setLastUpdated(new Date(latest));
      }
    }
  }, [lastUpdatedStr, projects, setLastUpdated]);

  const tag = searchParams?.tag || '';

  return (
    <div>
      <IndexClientInner projects={projects} tag={tag} lastUpdated={lastUpdatedStr} />
    </div>
  );
}
