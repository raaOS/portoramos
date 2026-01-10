'use client';

import type { Project, GalleryItem } from '@/types/projects';
import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import MasonryGrid from '@/components/MasonryGrid';
import ProjectCardPinterest from '@/components/projects/ProjectCardPinterest';
import ReadMoreDescription from '@/components/ReadMoreDescription';
import ShareButtons from '@/components/features/ShareButtons';
import AITranslator from '@/components/features/AITranslator';
import CommentSection from '@/components/features/CommentSection';
import type { Comment } from '@/lib/magic';
import ComparisonSlider from './components/ComparisonSlider';
import ProjectCTA from './components/ProjectCTA';
import Media from '@/components/shared/Media';

// Adjusted path for CoverFlowGallery - Assuming it exists here based on previous search
// CoverFlowGallery removed - replaced by ComparisonSlider (Pro Player)

interface ProjectDetailTwoColumnProps {
    project: Project;
    cover: GalleryItem;
    gallery: GalleryItem[];
    ratio: number;
    otherProjects: Project[];
}

export default function ProjectDetailTwoColumn({
    project,
    cover,
    gallery,
    ratio,
    otherProjects
}: ProjectDetailTwoColumnProps) {
    const [videoRef, setVideoRef] = useState<React.RefObject<HTMLVideoElement> | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);

    const [isProjectLiked, setIsProjectLiked] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [metrics, setMetrics] = useState({ likes: 0, shares: 0 });

    // [STICKY NOTE] CLIENT-SIDE HYDRATION
    // Halaman ini awalnya Static (dari Server).
    // Tapi kita perlu data Live seperti Likes & Comments.
    // useEffect ini berjalan di browser untuk mengambil data terbaru itu tanpa melambatkan loading awal.
    useEffect(() => {
        const initData = async () => {
            // 1. Load User Preference (Local) - Sync
            if (typeof window !== 'undefined') {
                const savedLike = localStorage.getItem(`like-${project.slug}`);
                if (savedLike === 'true') {
                    setIsProjectLiked(true);
                }
            }

            // 2. Load Global Metrics & Comments (API) - Parallel
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
                    } else {
                        setComments([]);
                    }
                }
            } catch (error) {
                console.error('Failed to load project data:', error);
                // Fail gracefully, content is already hydrated from props
            } finally {
                setIsLoaded(true);
            }
        };

        // requestIdleCallback to defer heavy JS execution if supported
        if ('requestIdleCallback' in window) {
            (window as any).requestIdleCallback(initData);
        } else {
            setTimeout(initData, 0);
        }
    }, [project.slug]);



    // Handle Like Project Toggle
    const handleProjectLike = async () => {
        const newIsLiked = !isProjectLiked;
        setIsProjectLiked(newIsLiked);

        // Optimistic UI update
        setMetrics(prev => ({
            ...prev,
            likes: newIsLiked ? prev.likes + 1 : Math.max(0, prev.likes - 1)
        }));

        // Persist User Pref
        localStorage.setItem(`like-${project.slug}`, String(newIsLiked));

        // Call API
        try {
            await fetch('/api/metrics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slug: project.slug,
                    action: newIsLiked ? 'like' : 'unlike'
                })
            });
        } catch (error) {
            console.error('Failed to update like metric:', error);
        }
    };

    // Handle Share Project
    const handleProjectShare = async () => {
        // Optimistic UI update
        setMetrics(prev => ({ ...prev, shares: prev.shares + 1 }));

        // Call API
        try {
            fetch('/api/metrics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug: project.slug, action: 'share' })
            });
        } catch (e) { }

        // Native Share
        if (navigator.share) {
            navigator.share({
                title: project.title,
                text: project.description,
                url: window.location.href,
            }).catch(() => { });
        } else {
            navigator.clipboard.writeText(window.location.href);
            // Optional: Toast "Link copied!"
        }
    };

    // Infinite scroll state - optimized for performance
    const INITIAL_COUNT = 12;
    const [displayedProjects, setDisplayedProjects] = useState<Project[]>(() => {
        return otherProjects.slice(0, INITIAL_COUNT);
    });
    const [isLoading, setIsLoading] = useState(false);
    const rafRef = useRef<number | null>(null);


    // Optimized infinite scroll with IntersectionObserver
    const observerTarget = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isLoading && otherProjects.length > 0) {
                    setIsLoading(true);

                    // No RAF nesting needed, IntersectionObserver is already async-healthy
                    // Append in batches of 24 for better performance during fast scrolling
                    const currentCount = displayedProjects.length;
                    const nextBatch: Project[] = [];
                    const BATCH_SIZE = 24;

                    for (let i = 0; i < BATCH_SIZE; i++) {
                        nextBatch.push(otherProjects[(currentCount + i) % otherProjects.length]);
                    }

                    setDisplayedProjects(prev => [...prev, ...nextBatch]);

                    // Small delay to prevent double-triggering before state propagates
                    setTimeout(() => {
                        setIsLoading(false);
                    }, 50);
                }
            },
            {
                rootMargin: '1500px 0px', // Pre-fetch content early
                threshold: 0.1
            }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [otherProjects, isLoading, displayedProjects.length]);

    // Gallery logic removed

    // Split projects evenly between columns with memoization
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
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} // Custom easing for premium feel
            className="min-h-screen bg-white dark:bg-black p-3 sm:p-4 lg:p-6 transition-colors duration-300"
        >
            {/* Back Button */}
            <Link
                href="/"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white mb-4 sm:mb-6 transition-colors duration-200 touch-manipulation"
            >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">Back to Projects</span>
            </Link>

            {/* Two Column Layout - Responsive */}
            <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">

                {/* COLUMN A: Big Box + Masonry Below */}
                <div className="lg:w-1/2 space-y-3 sm:space-y-4">
                    {/* Big Box - Optimized for mobile */}
                    <div className="bg-white dark:bg-black rounded-lg sm:rounded-xl shadow-none border border-black/10 dark:border-white/10 transition-all duration-300 relative">


                        {/* Gallery / Cover Media */}

                        {/* Hero Media: Comparison or Single Cover */}
                        <div className={`${ratio < 1 ? 'max-w-sm mx-auto' : ratio === 1 ? 'max-w-md mx-auto' : 'w-full'} py-4`}>
                            {project.comparison && project.comparison.beforeImage ? (
                                <ComparisonSlider
                                    beforeImage={project.comparison.beforeImage}
                                    beforeType={project.comparison.beforeType}
                                    afterImage={project.comparison.afterImage || cover.src}
                                    afterType={project.comparison.afterImage ? project.comparison.afterType : (cover.kind === 'video' ? 'video' : 'image')}
                                    labelBefore="Original"
                                    labelAfter="Retouched"
                                    aspectRatio={ratio}
                                />
                            ) : (
                                <div className="rounded-xl overflow-hidden shadow-lg border border-black/5 dark:border-white/5 bg-gray-100 dark:bg-gray-800">
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
                                </div>
                            )}
                        </div>


                        {/* Content - Mobile optimized */}
                        <div className="p-4 sm:p-6">
                            {/* Title Row */}
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-gray-900 dark:text-white transition-colors duration-300 mb-3">
                                {project.title}
                            </h1>

                            {/* Actions & Metadata Row */}
                            <div className="flex flex-col gap-6 mb-8">
                                {/* NEW: Metadata Grid (Role, Timeline, Team) */}
                                {(project.role || project.timeline || project.team) && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4 border-y border-gray-100 dark:border-gray-800">
                                        {project.role && (
                                            <div>
                                                <h3 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Role</h3>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{project.role}</p>
                                            </div>
                                        )}
                                        {project.timeline && (
                                            <div>
                                                <h3 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Timeline</h3>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{project.timeline}</p>
                                            </div>
                                        )}
                                        {project.team && (
                                            <div>
                                                <h3 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Team</h3>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{project.team}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    {/* Left: Actions (Like, Comment, Share) */}
                                    <div className="flex items-center gap-2">
                                        {/* LIKE BUTTON - Red if liked or has likes */}
                                        <button
                                            className={`p-1.5 flex items-center gap-1 rounded-full transition-all duration-200 ${isProjectLiked || metrics.likes > 0
                                                ? 'text-red-500' // Red if functionality active
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

                                        {/* COMMENT BUTTON - WhatsApp Green if has comments */}
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

                                        {/* SHARE BUTTON - Blue if has shares */}
                                        <button
                                            className={`p-1.5 flex items-center gap-1 rounded-full transition-all duration-200 ${metrics.shares > 0
                                                ? 'text-blue-500'
                                                : 'text-gray-400 hover:text-blue-500'
                                                }`}
                                            onClick={handleProjectShare}
                                            aria-label="Share project"
                                        >
                                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                            </svg>
                                            {metrics.shares > 0 && <span className="text-sm font-medium pr-1">{metrics.shares}</span>}
                                        </button>

                                        {/* AI TRANSLATOR */}
                                        {project.description && (
                                            <AITranslator text={project.description} context={`Project: ${project.title || ''}`} />
                                        )}
                                    </div>

                                    {/* Right: Metadata (Year, Client, Tags) */}
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




                            {/* Creative Breakdown / Narrative - ADAPTIVE LAYOUT */}
                            {project.narrative && (
                                <div className="mb-8 font-sans border-b border-gray-100 dark:border-gray-800 pb-8">
                                    {/* COMMERCIAL LAYOUT (Strategy & Results) */}
                                    {project.type === 'commercial' && (
                                        <div className="space-y-8">
                                            {project.narrative.context && (
                                                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-800">
                                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Context</h3>
                                                    <p className="text-sm text-gray-600 dark:text-gray-300 italic">"{project.narrative.context}"</p>
                                                </div>
                                            )}

                                            <div className="grid gap-6">
                                                <div>
                                                    <h3 className="text-xs font-bold uppercase tracking-wider text-red-500 mb-2">The Challenge</h3>
                                                    <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200 leading-relaxed">
                                                        {project.narrative.challenge}
                                                    </p>
                                                </div>
                                                <div>
                                                    <h3 className="text-xs font-bold uppercase tracking-wider text-blue-500 mb-2">The Solution</h3>
                                                    <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200 leading-relaxed">
                                                        {project.narrative.solution}
                                                    </p>
                                                </div>
                                            </div>

                                            {project.narrative.impact && (
                                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/10 p-5 rounded-xl border border-green-100 dark:border-green-900/30">
                                                    <h3 className="text-xs font-bold uppercase tracking-wider text-green-600 dark:text-green-400 mb-2">The Impact</h3>
                                                    <p className="text-base sm:text-lg font-medium text-gray-900 dark:text-white leading-relaxed">
                                                        {project.narrative.impact}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* VISUAL ART LAYOUT (Concept & Craft) - Placeholder for next step or fallback */}
                                    {(!project.type || project.type === 'visual_art') && (
                                        <div className="space-y-6">
                                            {(project.narrative.challenge || project.narrative.concept) && (
                                                <div>
                                                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                                                        {project.narrative.concept ? 'The Concept' : 'The Challenge'}
                                                    </h3>
                                                    <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200 leading-relaxed">
                                                        {project.narrative.concept || project.narrative.challenge}
                                                    </p>
                                                </div>
                                            )}
                                            {(project.narrative.solution || project.narrative.process) && (
                                                <div>
                                                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                                                        {project.narrative.process ? 'The Process' : 'The Solution'}
                                                    </h3>
                                                    <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200 leading-relaxed">
                                                        {project.narrative.process || project.narrative.solution}
                                                    </p>
                                                </div>
                                            )}
                                            {project.narrative.result && (
                                                <div>
                                                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">The Result</h3>
                                                    <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200 leading-relaxed">
                                                        {project.narrative.result}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {project.description && (
                                <div className="mb-3 sm:mb-4">
                                    <ReadMoreDescription
                                        text={project.description}
                                        maxLines={4}
                                        className="text-xs sm:text-sm leading-relaxed text-gray-700 dark:text-gray-300 transition-colors duration-300"
                                    />
                                </div>
                            )}

                            {/* Comment Section (Self-Managed Accordion) */}
                            {project.allowComments !== false && (
                                <div className="pt-3 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300" id="comments-section">
                                    <div className="bg-white dark:bg-gray-900 rounded-lg">
                                        <CommentSection
                                            slug={project.slug}
                                            comments={comments}
                                            setComments={setComments}
                                        />
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>

                    {/* Masonry grid below the big box (Column A) */}
                    <MasonryGrid columns="sidebar">
                        {columnAProjects.map((p: Project, index: number) => (
                            <motion.div
                                key={`col-a-${index}-${p.slug}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={index < 2 ? { opacity: 1, y: 0 } : undefined}
                                whileInView={index >= 2 ? { opacity: 1, y: 0 } : undefined}
                                viewport={{ once: true, margin: "50px" }}
                                transition={{
                                    duration: 0.4,
                                    ease: "easeOut",
                                    delay: index < 2 ? 0 : 0.1 // Tiny delay for subsequent items
                                }}
                            >
                                <ProjectCardPinterest project={p} priority={index < 4} />
                            </motion.div>
                        ))}
                    </MasonryGrid>
                </div>

                {/* COLUMN B: Masonry beside the big box */}
                <div className="lg:w-1/2">
                    <MasonryGrid columns="sidebar">
                        {columnBProjects.map((p: Project, index: number) => (
                            <motion.div
                                key={`col-b-${index}-${p.slug}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={index < 2 ? { opacity: 1, y: 0 } : undefined}
                                whileInView={index >= 2 ? { opacity: 1, y: 0 } : undefined}
                                viewport={{ once: true, margin: "50px" }}
                                transition={{
                                    duration: 0.4,
                                    ease: "easeOut",
                                    delay: index < 2 ? 0 : 0.1
                                }}
                            >
                                <ProjectCardPinterest project={p} priority={index < 4} />
                            </motion.div>
                        ))}
                    </MasonryGrid>
                </div>
            </div>

            {/* Infinite Scroll Sentinel */}
            <div ref={observerTarget} className="h-10 w-full pointer-events-none" aria-hidden="true" />

            {/* Subtle loading indicator */}
            {isLoading && (
                <div className="text-center py-6 sm:py-8 opacity-50">
                    <div className="inline-block animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-gray-400"></div>
                    <p className="text-xs mt-2 text-gray-500">Loading more projects...</p>
                </div>
            )}

            {/* Aggressive Call to Action */}
            <ProjectCTA />
        </motion.div>
    );
}
