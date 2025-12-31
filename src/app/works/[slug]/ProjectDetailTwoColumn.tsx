'use client';

import type { Project, GalleryItem } from '@/types/projects';
import { useState, useEffect, useRef } from 'react';
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

// Adjusted path for CoverFlowGallery - Assuming it exists here based on previous search
const CoverFlowGallery = dynamic(() => import('@/components/gallery/CoverFlowGallery'), {
    ssr: false,
    loading: () => (
        <div className="h-80 w-full rounded-2xl border border-dashed border-gray-200 bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-500 animate-pulse">
            <span className="text-sm">Loading gallery...</span>
        </div>
    ),
});

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
    const [showComments, setShowComments] = useState<boolean>(true);
    const [isProjectLiked, setIsProjectLiked] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [metrics, setMetrics] = useState({ likes: 0, shares: 0 });

    // Initialize Data
    useEffect(() => {
        const initData = async () => {
            // 1. Load User Preference (Local)
            if (typeof window !== 'undefined') {
                const savedLike = localStorage.getItem(`like-${project.slug}`);
                if (savedLike === 'true') {
                    setIsProjectLiked(true);
                }
            }

            // 2. Load Global Metrics (API)
            try {
                const res = await fetch(`/api/metrics?slug=${project.slug}`);
                if (res.ok) {
                    const data = await res.json();
                    setMetrics(data);
                }
            } catch (error) {
                console.error('Failed to load metrics:', error);
            }

            // 3. Load Comments (API)
            try {
                const res = await fetch(`/api/comments?slug=${project.slug}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.comments && Array.isArray(data.comments)) {
                        setComments(data.comments);
                    } else {
                        setComments([]);
                    }
                }
            } catch (error) {
                console.error('Failed to load comments:', error);
                setComments([]);
            } finally {
                setIsLoaded(true);
            }
        };

        initData();
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

    // Infinite scroll state - optimized like homepage
    const [displayedProjects, setDisplayedProjects] = useState<Project[]>(() => {
        if (otherProjects.length > 0) {
            return [
                ...otherProjects,
                ...otherProjects,
                ...otherProjects
            ];
        }
        return [];
    });
    const [isLoading, setIsLoading] = useState(false);
    const rafRef = useRef<number | null>(null);



    // Optimized infinite scroll with requestAnimationFrame
    useEffect(() => {
        let ticking = false;

        const checkScroll = () => {
            const scrollPosition = window.innerHeight + window.scrollY;
            const bottomPosition = document.documentElement.scrollHeight;
            const distanceFromBottom = bottomPosition - scrollPosition;

            // Trigger at 1500px for smooth experience
            if (distanceFromBottom < 1500 && !isLoading && otherProjects.length > 0) {
                setIsLoading(true);

                // Use RAF for smooth append
                requestAnimationFrame(() => {
                    setDisplayedProjects(prev => [...prev, ...otherProjects]);

                    setTimeout(() => {
                        setIsLoading(false);
                    }, 200);
                });
            }

            ticking = false;
        };

        const handleScroll = () => {
            if (!ticking) {
                rafRef.current = requestAnimationFrame(checkScroll);
                ticking = true;
            }
        };

        // Passive listener for better performance
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [otherProjects, isLoading]);

    const unifiedMedia = [
        {
            id: `hero-${project.slug}`,
            src: cover.src,
            title: project.title,
            alt: project.title,
            type: (cover.kind === 'video' ? 'video' : 'image') as 'image' | 'video',
            poster: cover.poster,
            isHero: true,
            ratio: ratio,
            autoplay: project.autoplay ?? true,
            muted: project.muted ?? true,
            loop: project.loop ?? true,
            playsInline: project.playsInline ?? true
        },
        ...(gallery || []).map((item, index) => ({
            id: `gallery-${index}`,
            src: item.src,
            title: item.alt || project.title,
            type: item.kind as 'image' | 'video', // Map kind to type for CoverFlowGallery
            poster: item.poster,
            alt: item.alt || '',
            aspectRatio: item.width && item.height ? item.width / item.height : 1
        }))
    ];

    // Split projects evenly between columns
    const halfIndex = Math.ceil(displayedProjects.length / 2);
    const columnAProjects = displayedProjects.slice(0, halfIndex);
    const columnBProjects = displayedProjects.slice(halfIndex);

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
                        <div className={`${ratio < 1 ? 'max-w-sm mx-auto' : ratio === 1 ? 'max-w-md mx-auto' : 'w-full'} py-4`}>
                            <CoverFlowGallery
                                items={unifiedMedia}
                                autoPlay={false}
                                showControls={true}
                                autoPlayInterval={4000}
                                onVideoRef={setVideoRef}
                                videoRef={videoRef}
                                coverKind={cover.kind}
                                aspectRatio={ratio}
                            />
                        </div>

                        {/* Content - Mobile optimized */}
                        <div className="p-4 sm:p-6">
                            {/* Title Row */}
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-gray-900 dark:text-white transition-colors duration-300 mb-3">
                                {project.title}
                            </h1>

                            {/* Actions & Metadata Row */}
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
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
                                            setShowComments(true);
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
                                    {project.year && (
                                        <span className="inline-flex items-center h-5 px-3 bg-gray-100 dark:bg-gray-800 rounded-full text-xs leading-none text-gray-600 dark:text-gray-400 transition-colors duration-300">
                                            {project.year}
                                        </span>
                                    )}
                                    {project.client && (
                                        <span className="inline-flex items-center h-5 px-3 bg-gray-100 dark:bg-gray-800 rounded-full text-xs leading-none text-gray-600 dark:text-gray-400 transition-colors duration-300">
                                            {project.client}
                                        </span>
                                    )}
                                    {project.tags && project.tags.length > 0 && (
                                        <>
                                            {project.tags.map((tag: string, index: number) => (
                                                <span key={index} className="inline-flex items-center h-5 px-3 bg-gray-100 dark:bg-gray-800 rounded-full text-xs leading-none text-gray-600 dark:text-gray-400 transition-colors duration-300">
                                                    {tag}
                                                </span>
                                            ))}
                                        </>
                                    )}
                                </div>
                            </div>

                            {project.description && (
                                <div className="mb-3 sm:mb-4">
                                    <ReadMoreDescription
                                        text={project.description}
                                        maxLines={4}
                                        className="text-xs sm:text-sm leading-relaxed text-gray-700 dark:text-gray-300 transition-colors duration-300"
                                    />
                                </div>
                            )}

                            {/* Comment Section */}
                            {project.allowComments !== false && (
                                <div className="pt-3 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300" id="comments-section">
                                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mb-3">
                                        {/* Header - Clickable */}
                                        <button
                                            onClick={() => setShowComments(!showComments)}
                                            className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                                        >
                                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {comments.length} Komentar
                                            </span>
                                            <svg
                                                className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform duration-200 ${showComments ? 'rotate-180' : ''}`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>

                                        {/* Comments List & Input */}
                                        {showComments && (
                                            <div className="p-4 bg-white dark:bg-gray-900">
                                                <CommentSection
                                                    slug={project.slug}
                                                    comments={comments}
                                                    setComments={setComments}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>

                    {/* Masonry grid below the big box (Column A) */}
                    <MasonryGrid columns="sidebar">
                        {columnAProjects.map((p, index) => (
                            <motion.div
                                key={`col-a-${index}-${p.slug}`}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "100px" }}
                                transition={{
                                    duration: 0.4,
                                    ease: "easeOut",
                                    delay: 0
                                }}
                            >
                                <ProjectCardPinterest project={p} priority={index < 6} />
                            </motion.div>
                        ))}
                    </MasonryGrid>
                </div>

                {/* COLUMN B: Masonry beside the big box */}
                <div className="lg:w-1/2">
                    <MasonryGrid columns="sidebar">
                        {columnBProjects.map((p, index) => (
                            <motion.div
                                key={`col-b-${index}-${p.slug}`}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "100px" }}
                                transition={{
                                    duration: 0.4,
                                    ease: "easeOut",
                                    delay: 0
                                }}
                            >
                                <ProjectCardPinterest project={p} priority={index < 6} />
                            </motion.div>
                        ))}
                    </MasonryGrid>
                </div>
            </div>

            {/* Subtle loading indicator */}
            {isLoading && (
                <div className="text-center py-6 sm:py-8 opacity-50">
                    <div className="inline-block animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-gray-400"></div>
                </div>
            )}
        </motion.div>
    );
}
