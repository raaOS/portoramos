'use client';

import type { Project, GalleryItem } from '@/types/projects';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Languages, Loader2, RotateCcw, X } from 'lucide-react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import MasonryGrid from '@/components/layout/MasonryGrid';
import ProjectCardPinterest from '@/components/projects/ProjectCardPinterest';
import ReadMoreDescription from '@/components/ui/ReadMoreDescription';
import type { Comment } from '@/lib/magic';
import ProjectCTA from './ProjectCTA';
import Media from '@/components/shared/Media';
import { Compare } from '@/components/ui/Compare';
import { useImageProtection } from '@/hooks/useImageProtection';
import { getIconMap } from '@/constants/skillIcons'; // Added import

// Lazy load heavy components to reduce initial bundle
const CommentSection = dynamic(() => import('@/components/features/CommentSection'), {
    loading: () => <div className="animate-pulse h-32 bg-gray-100 dark:bg-gray-800 rounded-lg" />,
    ssr: false
});

// AITranslator is available for future use but not currently used
void dynamic(() => import('@/components/features/AITranslator'), {
    loading: () => <div className="w-6 h-6" />,
    ssr: false
});

interface ProjectDetailTwoColumnProps {
    project: Project;
    cover: GalleryItem;
    gallery: GalleryItem[];
    ratio: number;
    otherProjects: Project[];
    isWindowMode?: boolean; // New prop for OS integration
}

export default function ProjectDetailTwoColumn({
    project,
    cover,
    gallery,
    ratio,
    otherProjects,
    isWindowMode = false
}: ProjectDetailTwoColumnProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [isProjectLiked, setIsProjectLiked] = useState(false);
    const [metrics, setMetrics] = useState({ likes: 0, shares: 0 });
    const [_isLoaded, setIsLoaded] = useState(false);
    const [translations, setTranslations] = useState<Record<string, string> | null>(null);
    const [translateLoading, setTranslateLoading] = useState(false);
    const CACHE_KEY = `gemini_proj_${project.slug}`;
    const { toast, handleContextMenu } = useImageProtection();

    // Restore cached translations on mount
    useEffect(() => {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) setTranslations(JSON.parse(cached));
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
        if (typeof window !== 'undefined') {
            const savedLike = localStorage.getItem(`like-${project.slug}`);
            if (savedLike === 'true') {
                requestAnimationFrame(() => setIsProjectLiked(true));
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
        localStorage.setItem(`like-${project.slug}`, String(newIsLiked));
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

    const INITIAL_COUNT = 6; // Reduced from 12 for faster initial load
    const [displayedProjects, setDisplayedProjects] = useState<Project[]>(() => {
        return otherProjects.slice(0, INITIAL_COUNT);
    });
    const [isLoading, setIsLoading] = useState(false);
    const observerTarget = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isLoading && otherProjects.length > 0) {
                    setIsLoading(true);
                    const currentCount = displayedProjects.length;
                    const nextBatch: Project[] = [];
                    const BATCH_SIZE = 24;
                    for (let i = 0; i < BATCH_SIZE; i++) {
                        nextBatch.push(otherProjects[(currentCount + i) % otherProjects.length]);
                    }
                    setDisplayedProjects(prev => [...prev, ...nextBatch]);
                    setTimeout(() => {
                        setIsLoading(false);
                    }, 50);
                }
            },
            {
                rootMargin: '1500px 0px',
                threshold: 0.1
            }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [otherProjects, isLoading, displayedProjects.length]);

    const { columnAProjects, columnBProjects } = useMemo(() => {
        const halfIndex = Math.ceil(displayedProjects.length / 2);
        return {
            columnAProjects: displayedProjects.slice(0, halfIndex),
            columnBProjects: displayedProjects.slice(halfIndex)
        };
    }, [displayedProjects]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={`${isWindowMode ? 'h-full overflow-y-auto p-3 sm:p-4 lg:p-6' : 'min-h-screen pt-10 sm:pt-12 px-3 sm:px-4 lg:px-6 pb-8'} bg-white dark:bg-black transition-colors duration-300`}
        >
            {/* Floating Back to Desktop Button */}
            {!isWindowMode && (
                <Link
                    href="/about"
                    className="fixed top-6 left-6 z-[100] flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/50 dark:bg-black/50 backdrop-blur-xl border border-black/10 dark:border-white/10 text-gray-800 dark:text-gray-200 hover:scale-110 hover:bg-white dark:hover:bg-black active:scale-95 transition-all shadow-2xl group"
                    title="Back to Desktop"
                >
                    <X className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-90 transition-transform duration-300" />
                </Link>
            )}

            {!isWindowMode && (
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white mb-4 sm:mb-6 transition-colors duration-200 touch-manipulation"
                >
                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-sm sm:text-base">Back to Projects</span>
                </Link>
            )}

            <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
                <div className={`${isWindowMode ? 'w-full' : 'lg:w-1/2 space-y-3 sm:space-y-4'}`}>
                    <div className="bg-white dark:bg-black rounded-lg sm:rounded-xl shadow-none border border-black/10 dark:border-white/10 transition-all duration-300 relative overflow-hidden">
                        <div className="flex flex-col lg:flex-row h-full">
                            <div className="w-full lg:w-[45%] border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-gray-900/20">
                                <div className={`${ratio < 1 ? 'max-w-sm mx-auto' : ratio === 1 ? 'max-w-md mx-auto' : 'w-full'} p-4 lg:p-6`}>
                                    {project.comparison && project.comparison.beforeImage ? (
                                        <div className="w-full h-full relative rounded-xl overflow-hidden shadow-lg border border-black/5 dark:border-white/5 bg-gray-100 dark:bg-gray-800" style={{ aspectRatio: ratio }}>
                                            <Compare
                                                firstImage={project.comparison.beforeImage}
                                                secondImage={project.comparison.afterImage || cover.src}
                                                firstImageClassName="object-cover object-left-top"
                                                secondImageClassname="object-cover object-left-top"
                                                className="w-full h-full"
                                                slideMode="hover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="relative rounded-xl overflow-hidden shadow-lg border border-black/5 dark:border-white/5 bg-gray-100 dark:bg-gray-800" style={{ aspectRatio: ratio }} onContextMenu={handleContextMenu}>
                                            <Media
                                                kind={cover.kind}
                                                src={cover.src}
                                                poster={cover.poster}
                                                alt={project.title}
                                                width={1600}
                                                height={Math.round(1600 / ratio)}
                                                priority={true}
                                                className="w-full h-auto object-cover"
                                                autoplay={project.autoplay ?? true}
                                                muted={project.muted ?? true}
                                                loop={project.loop ?? true}
                                                playsInline={project.playsInline ?? true}
                                            />
                                            {/* Overlay hitam solid saat right-click */}
                                            {toast && (
                                                <div className="absolute inset-0 bg-black flex flex-col items-center justify-center gap-3">
                                                    <span className="text-5xl">{toast.emoji}</span>
                                                    <p className="text-white text-sm font-bold text-center px-6 leading-relaxed">{toast.text}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Description & Comments in Left Column */}
                                    <div className="mt-6 sm:mt-8 space-y-6 sm:space-y-8">
                                        {project.description && (
                                            <div>
                                                <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-gray-500">{translations ? 'About This Project' : 'Tentang Project Ini'}</h3>
                                                <ReadMoreDescription
                                                    text={translations?.description || project.description}
                                                    maxLines={6}
                                                    className="text-sm leading-relaxed text-gray-700 dark:text-gray-300"
                                                />
                                            </div>
                                        )}

                                        {project.allowComments !== false && (
                                            <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                                                <CommentSection
                                                    slug={project.slug}
                                                    comments={comments}
                                                    setComments={setComments}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="w-full lg:w-[55%] flex flex-col">
                                <div className="p-4 sm:p-6 lg:p-8">
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-gray-900 dark:text-white transition-colors duration-300">
                                            {translations?.title || project.title}
                                        </h1>
                                        {isWindowMode && (
                                            <a
                                                href={`/projects/${project.slug}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 hover:opacity-100 opacity-60 text-gray-400 hover:text-black dark:text-gray-500 dark:hover:text-white transition-all text-xs font-semibold tracking-wide group whitespace-nowrap shrink-0"
                                                title="Open Full Page"
                                            >
                                                <span>Open Page</span>
                                                <ExternalLink size={14} className="opacity-70 group-hover:opacity-100 transition-opacity" />
                                            </a>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-6 mb-8">
                                        {(project.role || project.timeline || project.team || (project.software && project.software.length > 0)) && (
                                            <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:gap-x-12 gap-y-6 py-5 border-y border-gray-100 dark:border-gray-800">
                                                {project.role && (
                                                    <div>
                                                        <h3 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">{translations ? 'Role' : 'Peran'}</h3>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{translations?.role || project.role}</p>
                                                    </div>
                                                )}
                                                {/* Software Icons */}
                                                {project.software && project.software.length > 0 && (
                                                    <div className="flex flex-col gap-1">
                                                        <h3 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Software</h3>
                                                        <div className="flex items-center gap-2">
                                                            {project.software.map(s => (
                                                                <div key={s} title={s.replace('_', ' ')}>
                                                                    {getIconMap("w-5 h-5")[s.toLowerCase()] || (
                                                                        <div className="w-5 h-5 bg-gray-200 rounded flex items-center justify-center text-[8px] font-bold text-gray-500 uppercase">
                                                                            {s.slice(0, 2)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {project.timeline && (
                                                    <div>
                                                        <h3 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">{translations ? 'Timeline' : 'Waktu'}</h3>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{translations?.timeline || project.timeline}</p>
                                                    </div>
                                                )}
                                                {project.team && (
                                                    <div>
                                                        <h3 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">{translations ? 'Team' : 'Tim'}</h3>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{translations?.team || project.team}</p>
                                                    </div>
                                                )}
                                                <div>
                                                    <h3 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">{translations ? 'Type' : 'Tipe'}</h3>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {translations ? (project.type === 'commercial' ? 'Commercial Project' : 'Visual Art') : (project.type === 'commercial' ? 'Project Komersial' : 'Karya Visual')}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex flex-wrap items-center justify-between gap-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    className={`p-1.5 flex items-center gap-1 rounded-full transition-all duration-200 ${isProjectLiked || metrics.likes > 0
                                                        ? 'text-red-500'
                                                        : 'text-gray-400 hover:text-red-500'
                                                        }`}
                                                    onClick={handleProjectLike}
                                                    aria-label={isProjectLiked ? "Unlike project" : "Like project"}
                                                >
                                                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill={isProjectLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                    </svg>
                                                    {metrics.likes > 0 && <span className="text-sm font-medium pr-1">{metrics.likes}</span>}
                                                </button>

                                                <button
                                                    className={`p-1.5 flex items-center gap-1 rounded-full transition-all duration-200 ${comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0) > 0
                                                        ? 'text-green-600 dark:text-green-500'
                                                        : 'text-gray-400 hover:text-green-600 dark:hover:text-green-500'
                                                        }`}
                                                    onClick={() => {
                                                        setTimeout(() => {
                                                            document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth' });
                                                        }, 100);
                                                    }}
                                                    aria-label="View comments"
                                                >
                                                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                    </svg>
                                                    {comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0) > 0 && (
                                                        <span className="text-sm font-medium pr-1">
                                                            {comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)}
                                                        </span>
                                                    )}
                                                </button>

                                                <button
                                                    className={`p-1.5 flex items-center gap-1 rounded-full transition-all duration-200 ${metrics.shares > 0
                                                        ? 'text-blue-500'
                                                        : 'text-gray-400 hover:text-blue-500'
                                                        }`}
                                                    onClick={handleProjectShare}
                                                    aria-label="Share project"
                                                >
                                                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                                    </svg>
                                                    {metrics.shares > 0 && <span className="text-sm font-medium pr-1">{metrics.shares}</span>}
                                                </button>

                                                <button
                                                    onClick={translateAll}
                                                    disabled={translateLoading}
                                                    className={`p-1.5 flex items-center gap-1 rounded-full transition-all duration-200 disabled:opacity-50 ${translations
                                                        ? 'text-purple-600 hover:text-gray-400'
                                                        : 'text-gray-400 hover:text-purple-600'
                                                        }`}
                                                    title={translations ? 'Restore original' : 'Translate with Gemini AI'}
                                                >
                                                    {translateLoading
                                                        ? <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                                                        : translations
                                                            ? <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
                                                            : <Languages className="w-5 h-5 sm:w-6 sm:h-6" />}
                                                </button>
                                            </div>

                                            <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-end">
                                                {project.client && (
                                                    <span className="inline-flex items-center h-5 px-3 bg-gray-100 dark:bg-gray-800 rounded-full text-xs leading-none text-gray-600 dark:text-gray-400 transition-colors duration-300">
                                                        {project.client}
                                                    </span>
                                                )}
                                                {project.year && (
                                                    <span className="inline-flex items-center h-5 px-3 bg-gray-100 dark:bg-gray-800 rounded-full text-xs leading-none text-gray-600 dark:text-gray-400 transition-colors duration-300">
                                                        {project.year}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* NARRATIVE SECTION - ROBUST CONTENT-BASED RENDERING */}
                                    {project.narrative && (
                                        <div className="mb-8 font-sans border-b border-gray-100 dark:border-gray-800 pb-8">

                                            {/* Context (Commercial/General) */}
                                            {project.narrative.context && (
                                                <div className="mb-8 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-800">
                                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">{translations ? 'Context' : 'Konteks'}</h3>
                                                    <p className="text-sm text-gray-600 dark:text-gray-300 italic">&quot;{translations?.context || project.narrative.context}&quot;</p>
                                                </div>
                                            )}

                                            <div className="space-y-8">
                                                {/* Challenge (Commercial) OR Concept (Visual Art) */}
                                                {(project.narrative.challenge || project.narrative.concept) && (
                                                    <div>
                                                        <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-red-500">
                                                            {translations ? (project.narrative.concept ? 'Concept' : 'Challenge') : (project.narrative.concept ? 'Konsep' : 'Tantangan')}
                                                        </h3>
                                                        <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200 leading-relaxed">
                                                            {translations?.challenge || project.narrative.challenge || project.narrative.concept}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Solution (Commercial) OR Process (Visual Art) */}
                                                {(project.narrative.solution || project.narrative.process) && (
                                                    <div>
                                                        <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-blue-500">
                                                            {translations ? (project.narrative.process ? 'Process' : 'Solution') : (project.narrative.process ? 'Proses' : 'Solusi')}
                                                        </h3>
                                                        <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200 leading-relaxed">
                                                            {translations?.solution || project.narrative.solution || project.narrative.process}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Impact (Commercial) OR Result/Detail (Visual Art) */}
                                                {(project.narrative.impact || project.narrative.result || project.narrative.detail) && (
                                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/10 p-5 rounded-xl border border-green-100 dark:border-green-900/30">
                                                        <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-green-600 dark:text-green-400">
                                                            {translations ? (project.narrative.impact ? 'Impact' : (project.narrative.detail ? 'Detail' : 'Result')) : (project.narrative.impact ? 'Dampak' : (project.narrative.detail ? 'Detail' : 'Hasil'))}
                                                        </h3>
                                                        <p className={`leading-relaxed ${project.narrative.impact ? 'text-base sm:text-lg font-medium text-gray-900 dark:text-white' : 'text-sm sm:text-base text-gray-800 dark:text-gray-200'}`}>
                                                            {translations?.impact || project.narrative.impact || project.narrative.result || project.narrative.detail}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}


                                    {/* GALLERY SECTION */}
                                    {gallery && gallery.length > 0 && (
                                        <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800">
                                            <h3 className="text-xs font-bold uppercase tracking-wider mb-6 text-gray-500">Project Gallery</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {gallery.map((item, idx) => (
                                                    <div
                                                        key={`gallery-item-${idx}`}
                                                        className={`relative rounded-xl overflow-hidden shadow-md border border-black/5 dark:border-white/5 bg-gray-50 dark:bg-gray-900/40 group ${item.width && item.height && item.width < item.height ? 'row-span-2' : ''
                                                            }`}
                                                        style={{
                                                            aspectRatio: item.width && item.height ? `${item.width}/${item.height}` : undefined,
                                                            minHeight: (!item.width || !item.height) ? '300px' : 'auto'
                                                        }}
                                                        onContextMenu={handleContextMenu}
                                                    >
                                                        <Media
                                                            kind={item.kind}
                                                            src={item.src}
                                                            poster={item.poster}
                                                            alt={`${project.title} gallery ${idx + 1}`}
                                                            width={1200}
                                                            height={item.height && item.width ? Math.round(1200 / (item.width / item.height)) : 800}
                                                            lazy={true}
                                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                            autoplay={true}
                                                            muted={true}
                                                            loop={true}
                                                            playsInline={true}
                                                        />
                                                        {/* Overlay hitam solid saat right-click */}
                                                        {toast && (
                                                            <div className="absolute inset-0 bg-black flex flex-col items-center justify-center gap-2">
                                                                <span className="text-4xl">{toast.emoji}</span>
                                                                <p className="text-white text-xs font-bold text-center px-4 leading-snug">{toast.text}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {!isWindowMode && (
                        <MasonryGrid columns="sidebar">
                            {columnAProjects.map((p: Project, index: number) => {
                                const isPriority = index < 2;
                                // Animation Logic: No opacity change to prevent flicker. Slide up only.
                                const animationProps = isPriority ? {} : {
                                    initial: { y: 30 },
                                    whileInView: { y: 0 },
                                    viewport: { once: true, margin: "100px" },
                                    transition: { duration: 0.4, ease: "easeOut" }
                                };
                                return (
                                    <motion.div
                                        key={`col-a-${index}-${p.slug}`}
                                        {...animationProps}
                                        style={{
                                            willChange: 'transform',
                                            // contentVisibility removed to prevent layout shifting/empty columns
                                        }}
                                    >
                                        <ProjectCardPinterest project={p} priority={isPriority} />
                                    </motion.div>
                                );
                            })}
                        </MasonryGrid>
                    )}
                </div>

                {!isWindowMode && (
                    <div className="lg:w-1/2">
                        <MasonryGrid columns="sidebar">
                            {columnBProjects.map((p: Project, index: number) => {
                                const isPriority = index < 2;
                                const animationProps = isPriority ? {} : {
                                    initial: { y: 30 },
                                    whileInView: { y: 0 },
                                    viewport: { once: true, margin: "100px" },
                                    transition: { duration: 0.4, ease: "easeOut" }
                                };
                                return (
                                    <motion.div
                                        key={`col-b-${index}-${p.slug}`}
                                        {...animationProps}
                                        style={{
                                            willChange: 'transform',
                                            // contentVisibility removed to prevent layout shifting/empty columns
                                        }}
                                    >
                                        <ProjectCardPinterest project={p} priority={isPriority} />
                                    </motion.div>
                                );
                            })}
                        </MasonryGrid>
                    </div>
                )}
            </div>

            {/* Infinite loading trigger - Only for non-window mode */}
            {
                !isWindowMode && (
                    <>
                        <div ref={observerTarget} className="h-10 w-full pointer-events-none" aria-hidden="true" />
                        {isLoading && (
                            <div className="text-center py-6 sm:py-8 opacity-50">
                                <div className="inline-block animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-gray-400"></div>
                                <p className="text-xs mt-2 text-gray-500">Memuat lebih banyak project...</p>
                            </div>
                        )}
                    </>
                )
            }

            {!isWindowMode && <ProjectCTA />}
        </motion.div >
    );
}
