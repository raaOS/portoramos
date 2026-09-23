'use client';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useOptimistic,
  useTransition,
  startTransition,
} from 'react';
import type { Project } from '@/types/projects';

export interface ProjectMetrics {
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

export function useProjectMetrics(project: Project) {
  const [isProjectLiked, setIsProjectLiked] = useState(false);
  const [metrics, setMetrics] = useState<ProjectMetrics>({ likes: 0, shares: 0 });
  const [isLikePending, startLikeTransition] = useTransition();
  const likeRequestInFlightRef = useRef(false);

  const committedLikeState = useMemo(
    () => ({ isLiked: isProjectLiked, likes: metrics.likes }),
    [isProjectLiked, metrics.likes]
  );

  const [optimisticLikeState, updateOptimisticLike] = useOptimistic<OptimisticLikeState, boolean>(
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedLike = localStorage.getItem(`like-${project.slug}`);
        if (savedLike === 'true') {
          requestAnimationFrame(() => setIsProjectLiked(true));
        }
      } catch (e) {
        console.warn('[useProjectMetrics] Failed to load like status:', e);
      }
    }
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
            console.warn('[useProjectMetrics] Failed to save like status:', error);
          }
        } catch (error) {
          console.error('[useProjectMetrics] Failed to update like metric:', error);
        } finally {
          likeRequestInFlightRef.current = false;
          resolve();
        }
      });
    });
  }, [optimisticLikeState.isLiked, project.slug, startLikeTransition, updateOptimisticLike]);

  const handleProjectShare = async () => {
    setMetrics((prev) => ({ ...prev, shares: prev.shares + 1 }));

    fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: project.slug, action: 'share' }),
      keepalive: true,
    }).catch((error) => {
      console.error('[useProjectMetrics] Failed to record share metric:', error);
    });

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
    isProjectLiked: optimisticLikeState.isLiked,
    setIsProjectLiked,
    metrics: { ...metrics, likes: optimisticLikeState.likes },
    setMetrics,
    isLikePending,
    handleProjectLike,
    handleProjectShare,
  };
}
