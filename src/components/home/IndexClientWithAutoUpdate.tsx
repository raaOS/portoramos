'use client';

import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Project } from '@/types/projects';
import { useSearchParams } from 'next/navigation';
import { useLastUpdated } from '@/contexts/LastUpdatedContext';
import { POLLING } from '@/lib/constants';
import IndexClientInner from './IndexClientInner';

type Props = {
  initialProjects?: Project[];
  // searchParams removed, using hook
  windowWidth?: number;
}

interface ProjectsResponse {
  projects: Project[];
  lastUpdated: string;
}

const fetchProjects = async (): Promise<ProjectsResponse> => {
  // Use cached data for instant load. Revalidation is handled by Admin actions.
  const response = await fetch(`/api/projects?status=published`);
  if (!response.ok) {
    throw new Error('Failed to fetch projects');
  }
  return response.json();
};

export default function IndexClientWithAutoUpdate({ initialProjects: serverProjects = [], windowWidth }: Props) {
  const { setLastUpdated } = useLastUpdated();
  const searchParams = useSearchParams();
  const tag = searchParams?.get('tag') || '';
  const searchQuery = searchParams?.get('q') || '';

  const { data } = useQuery({
    queryKey: ['projects', 'published'],
    queryFn: fetchProjects,
    refetchInterval: POLLING.UPDATE_INTERVAL,
    structuralSharing: true, // Prevent new references when data unchanged
    staleTime: 2000, // Prevent immediate refetch on mount
    initialData: serverProjects.length > 0
      ? { projects: serverProjects, lastUpdated: '' }
      : undefined,
  });

  const projects = data?.projects ?? serverProjects;
  const lastUpdatedStr = data?.lastUpdated;

  // Sync lastUpdated context — guarded to prevent cascade re-renders
  const prevLastUpdated = useRef<string>('');
  useEffect(() => {
    if (lastUpdatedStr && lastUpdatedStr !== prevLastUpdated.current) {
      prevLastUpdated.current = lastUpdatedStr;
      setLastUpdated(new Date(lastUpdatedStr));
    }
  }, [lastUpdatedStr, setLastUpdated]);

  return (
    <div>
      <IndexClientInner projects={projects} tag={tag} searchQuery={searchQuery} lastUpdated={lastUpdatedStr} windowWidth={windowWidth} />
    </div>
  );
}
