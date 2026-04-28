'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Project, GalleryGroup } from '@/types/projects';
import type { Comment } from '@/lib/magic';

interface UseProjectDetailProps {
    project: Project;
}

interface UseProjectDetailReturn {
    // States
    comments: Comment[];
    setComments: (comments: Comment[]) => void;
    isProjectLiked: boolean;
    setIsProjectLiked: (liked: boolean) => void;
    metrics: { likes: number; shares: number };
    setMetrics: React.Dispatch<React.SetStateAction<{ likes: number; shares: number }>>;
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
    const [, setIsLoaded] = useState(false);
    const [translations, setTranslations] = useState<Record<string, string> | null>(null);
    const [translateLoading, setTranslateLoading] = useState(false);
    const CACHE_KEY = `gemini_proj_${project.slug}`;

    const [activeGalleryGroup, setActiveGalleryGroup] = useState<GalleryGroup | null>(null);
    const [activeNarrativeTab, setActiveNarrativeTab] = useState<'description' | 'challenge' | 'solution' | 'impact'>('description');
    
    const observerTarget = useRef<HTMLDivElement>(null);

    // Restore cached translations on mount
    useEffect(() => {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                React.startTransition(() => {
                    setTranslations(JSON.parse(cached));
                });
            }
        } catch { /* ignore */ }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [project.slug]);

    const translateAll = useCallback(async () => {
        if (translations) { setTranslations(null); return; } // toggle off (cache stays)

        // Check localStorage cache first
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) { setTranslations(JSON.parse(cached)); return; }
        } catch { /* ignore */ }

        setTranslateLoading(true);
        try {
            const fields: Record<string, string> = {};
            if (project.title) fields.title = project.title;
            if (project.description) fields.description = project.description;
            if (project.role) fields.role = project.role;
            if (project.timeline) fields.timeline = project.timeline;
            if (project.team) fields.team = project.team;
            if (project.narrative?.context) fields.context = project.narrative.context;
            const challenge = project.narrative?.challenge || project.narrative?.concept;
            if (challenge) fields.challenge = challenge;
            const solution = project.narrative?.solution || project.narrative?.process;
            if (solution) fields.solution = solution;
            const impact = project.narrative?.impact || project.narrative?.result || project.narrative?.detail;
            if (impact) fields.impact = impact;

            const res = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fields }),
            });
            const data = await res.json();
            if (res.ok) {
                setTranslations(data.translations);
                // Cache to localStorage
                try { localStorage.setItem(CACHE_KEY, JSON.stringify(data.translations)); } catch { /* ignore */ }
            }
        } catch { /* silent */ } finally {
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
        const timer = setTimeout(async () => {
            try {
                const [metricsRes, commentsRes] = await Promise.all([
                    fetch(`/api/metrics?slug=${project.slug}`),
                    fetch(`/api/comments?slug=${project.slug}`)
                ]);

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
                console.error('Failed to load project data:', error);
            }
        }, 1500); // Defer 1.5s to prioritize first paint

        return () => clearTimeout(timer);
    }, [project.slug]);

    const handleProjectLike = async () => {
        const newIsLiked = !isProjectLiked;
        setIsProjectLiked(newIsLiked);
        setMetrics(prev => ({
            ...prev,
            likes: newIsLiked ? prev.likes + 1 : Math.max(0, prev.likes - 1)
        }));
        // BUG FIX #6: try-catch untuk localStorage
        try {
            localStorage.setItem(`like-${project.slug}`, String(newIsLiked));
        } catch (e) {
            console.warn('[useProjectDetail] Failed to save like status:', e);
        }
        try {
            await fetch('/api/metrics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slug: project.slug,
                    action: newIsLiked ? 'like' : 'unlike'
                })
            });
        } catch {
            console.error('Failed to update like metric');
        }
    };

    const handleProjectShare = async () => {
        setMetrics(prev => ({ ...prev, shares: prev.shares + 1 }));
        try {
            fetch('/api/metrics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug: project.slug, action: 'share' })
            });
        } catch { }

        if (navigator.share) {
            navigator.share({
                title: project.title,
                text: project.description,
                url: window.location.href,
            }).catch(() => { });
        } else {
            navigator.clipboard.writeText(window.location.href);
        }
    };

    return {
        comments,
        setComments,
        isProjectLiked,
        setIsProjectLiked,
        metrics,
        setMetrics,
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
