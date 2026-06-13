'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useOptimistic,
  useTransition,
  startTransition,
} from 'react';
import type { Project, GalleryGroup } from '@/types/projects';
import type { Comment } from '@/lib/magic';
import { collectProjectTranslationFields } from '../utils/translations';

interface UseProjectDetailProps {
  project: Project;
}

interface ProjectMetrics {
  likes: number;
  shares: number;
}

interface MetricsMutationResponse {
  success?: boolean;
  metrics?: ProjectMetrics;
  error?: string;
}

interface OptimisticLikeState {
  isLiked: boolean;
  likes: number;
}

interface UseProjectDetailReturn {
  // States
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
  activeNarrativeTab: 'description' | 'challenge' | 'solution' | 'impact';
  setActiveNarrativeTab: (tab: 'description' | 'challenge' | 'solution' | 'impact') => void;
  observerTarget: React.RefObject<HTMLDivElement | null>;

  // Actions
  handleProjectLike: () => Promise<void>;
  handleProjectShare: () => Promise<void>;
  translateAll: () => Promise<void>;
}

export function useProjectDetail({ project }: UseProjectDetailProps): UseProjectDetailReturn {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isProjectLiked, setIsProjectLiked] = useState(false);
  const [metrics, setMetrics] = useState({ likes: 0, shares: 0 });
  const [isLikePending, startLikeTransition] = useTransition();
  const likeRequestInFlightRef = useRef(false);
  const committedLikeState = useMemo(
    () => ({ isLiked: isProjectLiked, likes: metrics.likes }),
    [isProjectLiked, metrics.likes]
  );
  const [optimisticLikeState, updateOptimisticLike] = useOptimistic<
    OptimisticLikeState,
    boolean
  >(
    committedLikeState,
    (current, nextIsLiked) => ({
      isLiked: nextIsLiked,
      likes:
        nextIsLiked === current.isLiked
          ? current.likes
          : nextIsLiked
            ? current.likes + 1
            : Math.max(0, current.likes - 1),
    })
  );
  const [, setIsLoaded] = useState(false);
  const [translations, setTranslations] = useState<Record<string, string> | null>(null);
  const [translateLoading, setTranslateLoading] = useState(false);
  const CACHE_KEY = `gemini_proj_v2_${project.slug}`;

  const [activeGalleryGroup, setActiveGalleryGroup] = useState<GalleryGroup | null>(null);
  const [activeNarrativeTab, setActiveNarrativeTab] = useState<
    'description' | 'challenge' | 'solution' | 'impact'
  >('description');

  const observerTarget = useRef<HTMLDivElement>(null);

  // Restore cached translations on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        startTransition(() => {
          setTranslations(JSON.parse(cached));
        });
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.slug]);

  const translateAll = useCallback(async () => {
    if (translations) {
      setTranslations(null);
      return;
    } // toggle off (cache stays)

    // Check localStorage cache first
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        setTranslations(JSON.parse(cached));
        return;
      }
    } catch {
      /* ignore */
    }

    setTranslateLoading(true);
    try {
      const fields = collectProjectTranslationFields(project);
      if (Object.keys(fields).length === 0) return;

      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields }),
      });
      const data = await res.json();
      if (res.ok && data.translations) {
        setTranslations(data.translations);
        // Cache to localStorage
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(data.translations));
        } catch {
          /* ignore */
        }
      } else {
        console.warn('[useProjectDetail] Translation failed:', data.error || res.statusText);
      }
    } catch (error) {
      console.warn('[useProjectDetail] Translation failed:', error);
    } finally {
      setTranslateLoading(false);
    }
  }, [project, translations, CACHE_KEY]);

  // Load like status immediately (local storage only)
  useEffect(() => {
    // BUG FIX #6: try-catch untuk localStorage
    if (typeof window !== 'undefined') {
      try {
        const savedLike = localStorage.getItem(`like-${project.slug}`);
        if (savedLike === 'true') {
          requestAnimationFrame(() => setIsProjectLiked(true));
        }
      } catch (e) {
        console.warn('[useProjectDetail] Failed to load like status:', e);
      }
    }
    requestAnimationFrame(() => setIsLoaded(true));
  }, [project.slug]);

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
          if (commentsData.comments && Array.isArray(commentsData.comments)) {
            setComments(commentsData.comments);
          }
        }
      } catch (error) {
        if (!isActive || controller.signal.aborted) return;
        console.error('Failed to load project data:', error);
      }
    }, 1500); // Defer 1.5s to prioritize first paint

    return () => {
      isActive = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [project.slug]);

  const handleProjectLike = useCallback(async () => {
    if (likeRequestInFlightRef.current) return;

    likeRequestInFlightRef.current = true;
    const nextIsLiked = !optimisticLikeState.isLiked;

    await new Promise<void>((resolve) => {
      startLikeTransition(async () => {
        updateOptimisticLike(nextIsLiked);

        try {
          const response = await fetch('/api/metrics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              slug: project.slug,
              action: nextIsLiked ? 'like' : 'unlike',
            }),
          });
          const data = (await response.json().catch(() => null)) as MetricsMutationResponse | null;
          const serverMetrics = data?.metrics;

          if (
            !response.ok ||
            data?.success !== true ||
            !serverMetrics ||
            !Number.isFinite(serverMetrics.likes) ||
            !Number.isFinite(serverMetrics.shares)
          ) {
            throw new Error(data?.error || `Metrics request failed (${response.status})`);
          }

          startTransition(() => {
            setIsProjectLiked(nextIsLiked);
            setMetrics(serverMetrics);
          });

          try {
            localStorage.setItem(`like-${project.slug}`, String(nextIsLiked));
          } catch (error) {
            console.warn('[useProjectDetail] Failed to save like status:', error);
          }
        } catch (error) {
          console.error('[useProjectDetail] Failed to update like metric:', error);
        } finally {
          likeRequestInFlightRef.current = false;
          resolve();
        }
      });
    });
  }, [optimisticLikeState.isLiked, project.slug, startLikeTransition, updateOptimisticLike]);

  const handleProjectShare = async () => {
    setMetrics((prev) => ({ ...prev, shares: prev.shares + 1 }));
    try {
      fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: project.slug, action: 'share' }),
      });
    } catch {}

    if (navigator.share) {
      navigator
        .share({
          title: project.title,
          text: project.description,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return {
    comments,
    setComments,
    isProjectLiked: optimisticLikeState.isLiked,
    setIsProjectLiked,
    metrics: { ...metrics, likes: optimisticLikeState.likes },
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
