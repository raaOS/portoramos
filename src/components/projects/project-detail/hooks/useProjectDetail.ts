'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { Project, GalleryGroup } from '@/types/projects';
import type { Comment } from '@/lib/magic';
import { useProjectTranslations } from './useProjectTranslations';
import { useProjectMetrics, type ProjectMetrics } from './useProjectMetrics';

interface UseProjectDetailProps {
  project: Project;
}

interface UseProjectDetailReturn {
  comments: Comment[];
  setComments: (comments: Comment[]) => void;
  isProjectLiked: boolean;
  setIsProjectLiked: (liked: boolean) => void;
  metrics: ProjectMetrics;
  setMetrics: React.Dispatch<React.SetStateAction<ProjectMetrics>>;
  isLikePending: boolean;
  translations: Record<string, string> | null;
  setTranslations: (translations: Record<string, string> | null) => void;
  translateLoading: boolean;
  activeGalleryGroup: GalleryGroup | null;
  setActiveGalleryGroup: (group: GalleryGroup | null) => void;
  activeNarrativeTab: 'challenge' | 'solution' | 'impact';
  setActiveNarrativeTab: (tab: 'challenge' | 'solution' | 'impact') => void;
  observerTarget: React.RefObject<HTMLDivElement | null>;
  handleProjectLike: () => Promise<void>;
  handleProjectShare: () => Promise<void>;
  translateAll: () => Promise<void>;
}

function isInterruptedFetch(error: unknown) {
  if (!(error instanceof Error)) return false;
  return error.name === 'AbortError' || /failed to fetch/i.test(error.message);
}

export function useProjectDetail({ project }: UseProjectDetailProps): UseProjectDetailReturn {
  const [comments, setComments] = useState<Comment[]>([]);
  const [activeGalleryGroup, setActiveGalleryGroup] = useState<GalleryGroup | null>(null);
  const [activeNarrativeTab, setActiveNarrativeTab] = useState<'challenge' | 'solution' | 'impact'>(
    'challenge'
  );
  const observerTarget = useRef<HTMLDivElement>(null);

  const { translations, setTranslations, translateLoading, translateAll } =
    useProjectTranslations(project);

  const {
    isProjectLiked,
    setIsProjectLiked,
    metrics,
    setMetrics,
    isLikePending,
    handleProjectLike,
    handleProjectShare,
  } = useProjectMetrics(project);

  // Defer non-critical API calls to improve initial load time
  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const timer = setTimeout(async () => {
      try {
        const [metricsRes, commentsRes] = await Promise.all([
          fetch(`/api/metrics?slug=${project.slug}`, { signal: controller.signal }),
          fetch(`/api/comments?slug=${project.slug}`, { signal: controller.signal }),
        ]);

        if (!isActive) return;

        if (metricsRes.ok) {
          const metricsData = await metricsRes.json();
          setMetrics(metricsData);
        }

        if (commentsRes.ok) {
          const commentsData = await commentsRes.json();
          const loadedComments = commentsData?.data?.comments ?? commentsData?.comments;
          if (Array.isArray(loadedComments)) {
            setComments(loadedComments);
          }
        }
      } catch (error) {
        if (!isActive || controller.signal.aborted || isInterruptedFetch(error)) return;
        console.warn('[useProjectDetail] Failed to load non-critical project data:', error);
      }
    }, 1500);

    return () => {
      isActive = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [project.slug, setMetrics]);

  return {
    comments,
    setComments,
    isProjectLiked,
    setIsProjectLiked,
    metrics,
    setMetrics,
    isLikePending,
    translations,
    setTranslations,
    translateLoading,
    activeGalleryGroup,
    setActiveGalleryGroup,
    activeNarrativeTab,
    setActiveNarrativeTab,
    observerTarget,
    handleProjectLike,
    handleProjectShare,
    translateAll,
  };
}

export type { ProjectMetrics };
