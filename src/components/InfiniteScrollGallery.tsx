'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import OptimizedCard from '@/components/OptimizedCard';
import type { Project } from '@/types/projects';
import { Loader2 } from 'lucide-react';

interface InfiniteScrollGalleryProps {
  initialProjects: Project[];
  category?: string;
  searchQuery?: string;
  itemsPerPage?: number;
  className?: string;
}

interface LoadMoreResponse {
  projects: Project[];
  hasMore: boolean;
  nextCursor?: string;
}

export default function InfiniteScrollGallery({
  initialProjects,
  category,
  searchQuery,
  itemsPerPage = 6,
  className = '',
}: InfiniteScrollGalleryProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Intersection Observer for infinite scroll trigger
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    rootMargin: '100px',
  });

  // Reset when filters change
  useEffect(() => {
    setProjects(initialProjects);
    setPage(1);
    setHasMore(true);
    setError(null);
  }, [initialProjects, category, searchQuery]);

  // Load more projects
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: itemsPerPage.toString(),
        ...(category && { category }),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/projects?${params}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load projects: ${response.statusText}`);
      }

      const data: LoadMoreResponse = await response.json();

      if (controller.signal.aborted) return;

      if (data.projects.length === 0) {
        setHasMore(false);
      } else {
        setProjects(prev => {
          // Remove duplicates based on slug
          const existingSlugs = new Set(prev.map(p => p.slug));
          const newProjects = data.projects.filter(p => !existingSlugs.has(p.slug));
          return [...prev, ...newProjects];
        });
        setPage(prev => prev + 1);
        setHasMore(data.hasMore);
      }
    } catch (error) {
      if (controller.signal.aborted) return;

      const errorMessage = error instanceof Error ? error.message : 'Failed to load more projects';
      setError(errorMessage);
      console.error('Error loading more projects:', error);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
      abortControllerRef.current = null;
    }
  }, [loading, hasMore, page, itemsPerPage, category, searchQuery]);

  // Trigger load more when in view
  useEffect(() => {
    if (inView && hasMore && !loading) {
      loadMore();
    }
  }, [inView, hasMore, loading, loadMore]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project, index) => (
          <OptimizedCard
            key={`${project.slug}-${index}`}
            project={project}
            index={index}
          />
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></span>
            <span className="text-sm">Loading more projects...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center text-destructive">
            <p className="text-sm font-medium">Error loading projects</p>
            <p className="text-xs mt-1">{error}</p>
            <button
              onClick={() => {
                setError(null);
                loadMore();
              }}
              className="mt-2 px-3 py-1 text-xs bg-destructive/10 hover:bg-destructive/20 rounded transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Load More Trigger */}
      {hasMore && !loading && !error && (
        <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
          <div className="text-xs text-muted-foreground">Scroll for more...</div>
        </div>
      )}

      {/* End of Results */}
      {!hasMore && projects.length > 0 && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">You have reached the end!</p>
            <p className="text-xs mt-1">
              Showing {projects.length} project{projects.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {projects.length === 0 && !loading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium">No projects found</p>
            <p className="text-sm mt-1">
              {searchQuery || category
                ? 'Try adjusting your search or filter criteria'
                : 'No projects available at the moment'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Custom hook for infinite scroll functionality
export function useInfiniteScroll<T>({
  fetchMore,
  hasMore,
  threshold = 0.1,
  rootMargin = '100px',
}: {
  fetchMore: () => Promise<void>;
  hasMore: boolean;
  threshold?: number;
  rootMargin?: string;
}) {
  const { ref, inView } = useInView({
    threshold,
    rootMargin,
  });

  useEffect(() => {
    if (inView && hasMore) {
      fetchMore();
    }
  }, [inView, hasMore, fetchMore]);

  return { ref, inView };
}