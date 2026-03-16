'use client';

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Project } from '@/types/projects';
import { useSearchParams } from 'next/navigation';
import { useLastUpdated } from '@/contexts/LastUpdatedContext';
import { POLLING } from '@/lib/constants';
import IndexClientInner from './IndexClientInner';

type Props = {
  initialProjects?: Project[];
  windowWidth?: number;
}

interface ProjectsResponse {
  projects: Project[];
  lastUpdated: string;
}

export default function IndexClientWithAutoUpdate({ initialProjects: serverProjects = [], windowWidth }: Props) {
  // Safe context access
  const context = useLastUpdated();
  const contextLastUpdated = context?.lastUpdated;
  // Use useMemo to avoid recreating function on every render
  const setLastUpdated = useMemo(() => context?.setLastUpdated || (() => {}), [context?.setLastUpdated]);
  const searchParams = useSearchParams();
  const tag = searchParams?.get('tag') || '';
  const searchQuery = searchParams?.get('q') || '';
  const view = (searchParams?.get('view') as 'grid' | 'list') || 'grid';

  // BUG FIX #4: Sync ref with context value on mount to prevent unnecessary updates
  const prevLastUpdated = useRef<string>(
    contextLastUpdated ? contextLastUpdated.toISOString() : ''
  );

  // BUG FIX #2: useCallback untuk mencegah stale closure dan restart interval
  // BUG FIX #8: Gunakan base URL dari environment atau relative path
  const fetchProjects = useCallback(async (): Promise<ProjectsResponse> => {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
    const response = await fetch(`${baseUrl}/api/projects?status=published`);
    if (!response.ok) {
      throw new Error('Failed to fetch projects');
    }
    const json = await response.json();
    // API wraps response in { success, data: { projects, lastUpdated } }
    // Extract the inner data object
    return json.data ?? json;
  }, [])

  // BUG FIX #5: Valid timestamp untuk initialData
  const initialData = serverProjects.length > 0
    ? { 
        projects: serverProjects, 
        lastUpdated: new Date().toISOString() // Gunakan timestamp sekarang, bukan string kosong
      }
    : undefined;

  const { 
    data, 
    isError, 
    error,
    isLoading 
  } = useQuery({
    queryKey: ['projects', 'published'],
    queryFn: fetchProjects,
    refetchInterval: POLLING.UPDATE_INTERVAL,
    structuralSharing: true,
    staleTime: 2000,
    initialData,
  });

  const projects = data?.projects ?? serverProjects;
  const lastUpdatedStr = data?.lastUpdated;

  // BUG FIX #4 & #5: Sync lastUpdated context dengan guard yang lebih baik
  useEffect(() => {
    if (lastUpdatedStr) {
      // Parse dan validasi date
      const newDate = new Date(lastUpdatedStr);
      if (isNaN(newDate.getTime())) {
        console.warn('[IndexClientWithAutoUpdate] Invalid date received:', lastUpdatedStr);
        return;
      }
      
      // Hanya update kalau benar-benar berbeda dari ref
      if (lastUpdatedStr !== prevLastUpdated.current) {
        prevLastUpdated.current = lastUpdatedStr;
        setLastUpdated(newDate);
      }
    }
  }, [lastUpdatedStr, setLastUpdated]);

  // BUG FIX #5: Log error untuk debugging
  useEffect(() => {
    if (isError && error) {
      console.error('[IndexClientWithAutoUpdate] Failed to fetch projects:', error);
    }
  }, [isError, error]);

  return (
    <div>
      {/* BUG FIX #5: Error state indicator */}
      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm text-center">
          Gagal memuat data terbaru. Menampilkan data cache.
        </div>
      )}
      
      <IndexClientInner 
        projects={projects} 
        tag={tag} 
        searchQuery={searchQuery} 
        lastUpdated={lastUpdatedStr} 
        windowWidth={windowWidth} 
        isLoading={isLoading}
        view={view}
      />
    </div>
  );
}
