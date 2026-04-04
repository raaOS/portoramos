"use client"
import { useState, useEffect, useMemo, useRef } from 'react';
import type { Project } from '@/types/projects';

interface FuseResult<T> {
  item: T;
  refIndex: number;
  score?: number;
}

interface FuseInstance<T> {
  search: (query: string) => FuseResult<T>[];
  setCollection: (collection: T[]) => void;
}

export function useProjectFiltering(projects: Project[], tag: string, searchQuery: string) {
  const [fuseInstance, setFuseInstance] = useState<FuseInstance<Project> | null>(null);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isMountedRef.current) setDebouncedSearchQuery(searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Lazy load Fuse.js
  useEffect(() => {
    if (debouncedSearchQuery) {
      const timeoutId = setTimeout(() => {
        import('fuse.js').then((FuseModule) => {
          if (!isMountedRef.current) return;
          const Fuse = FuseModule.default || FuseModule;
          setFuseInstance(prev => {
            if (!prev) {
              return new Fuse(projects, {
                keys: ['title', 'description', 'client', 'tags'],
                threshold: 0.3,
                includeScore: true,
              }) as unknown as FuseInstance<Project>;
            } else {
              prev.setCollection(projects);
              return prev;
            }
          });
        }).catch(err => console.error('[useProjectFiltering] Fuse.js load failed:', err));
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [debouncedSearchQuery, projects]);

  const filteredProjects = useMemo(() => {
    let result = projects;
    if (tag) {
      const lowerTag = tag.toLowerCase();
      result = result.filter((p) =>
        (p.tags || []).some((t) => t.toLowerCase() === lowerTag) ||
        (p.type && p.type.toLowerCase() === lowerTag)
      );
    }
    if (debouncedSearchQuery && fuseInstance) {
      const searchResults = fuseInstance.search(debouncedSearchQuery);
      const searchedProjectIds = new Set(searchResults.map((r) => r.item.id));
      if (tag) {
        result = result.filter(p => searchedProjectIds.has(p.id));
      } else {
        result = searchResults.map(r => projects.find(p => p.id === r.item.id) || r.item);
      }
    }
    return result;
  }, [projects, tag, debouncedSearchQuery, fuseInstance]);

  return { filteredProjects, debouncedSearchQuery };
}
