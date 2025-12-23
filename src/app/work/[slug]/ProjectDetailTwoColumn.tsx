'use client';

import type { Project } from '@/types/projects';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import MasonryGrid from '@/components/MasonryGrid';
import ProjectCardPinterest from '@/components/projects/ProjectCardPinterest';
import ReadMoreDescription from '@/components/ReadMoreDescription';
import ShareButtons from '@/components/ShareButtons';
import AITranslator from '@/components/AITranslator';

const CoverFlowGallery = dynamic(() => import('@/components/CoverFlowGallery'), {
    ssr: false,
    loading: () => (
        <div className="h-80 w-full rounded-2xl border border-dashed border-gray-200 bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-500 animate-pulse">
            <span className="text-sm">Loading gallery...</span>
        </div>
    ),
});

interface ProjectDetailTwoColumnProps {
    project: Project;
    cover: any;
    gallery: any;
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
    const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
    const [commentText, setCommentText] = useState<string>('');
    const [comments, setComments] = useState<Array<{ id: string, text: string, author: string, time: string, likes: number, likedByMe?: boolean, replies?: Array<{ id: string, text: string, author: string, time: string, likes: number, likedByMe?: boolean }> }>>([]);
    const [showComments, setShowComments] = useState<boolean>(true);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
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

    // Save Comments to API whenever they change (Debounced)
    useEffect(() => {
        if (!isLoaded) return; // Don't save before initial load

        const timer = setTimeout(async () => {
            try {
                await fetch('/api/comments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        slug: project.slug,
                        comments: comments
                    })
                });
            } catch (error) {
                console.error('Failed to save comments:', error);
            }
        }, 1000); // Wait 1s after last change before saving

        return () => clearTimeout(timer);
    }, [comments, project.slug, isLoaded]);

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
    const [displayedProjects, setDisplayedProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const rafRef = useRef<number | null>(null);

    // Initialize with 3x duplication for smooth infinite scroll
    useEffect(() => {
        if (otherProjects.length > 0) {
            const initialProjects = [
                ...otherProjects,
                ...otherProjects,
                ...otherProjects
            ];
            setDisplayedProjects(initialProjects);
        }
    }, [otherProjects]);

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
            type: cover.kind === 'video' ? 'video' : 'image',
            poster: cover.poster,
            isHero: true,
            ratio: ratio,
            autoplay: project.autoplay ?? true,
            muted: project.muted ?? true,
            loop: project.loop ?? true,
            playsInline: project.playsInline ?? true
        },
        ...(gallery || [])
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
            className="min-h-screen bg-gray-50 dark:bg-gray-950 p-3 sm:p-4 lg:p-6 transition-colors duration-300"
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
                    <div className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-xl overflow-hidden transition-all duration-300 relative">
                        {/* AI Translate - Top Right Corner */}
                        {project.description && (
                            <div className="absolute top-3 right-3 z-10">
                                <AITranslator text={project.description} context={`Project: ${project.title || ''}`} />
                            </div>
                        )}

                        {/* Gallery / Cover Media */}
                        <div className="">
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
                            {/* Title and Badges Row */}
                            <div className="flex flex-wrap items-start justify-between gap-3 mb-3 sm:mb-4">
                                {/* Title - Left */}
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-gray-900 dark:text-white transition-colors duration-300">
                                        {project.title}
                                    </h1>
                                    <div className="flex items-center gap-2 pt-1">
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
                                    </div>
                                </div>

                                {/* All badges - Right */}
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
                            <div className="pt-3 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
                                {/* Comments List - Accordion */}
                                {comments.length > 0 && (
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

                                        {/* Comments List */}
                                        {showComments && (
                                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                                {comments.map((comment) => (
                                                    <div key={comment.id} className="p-3 bg-white dark:bg-gray-900">
                                                        <div className="flex gap-2 items-start">
                                                            {/* Avatar */}
                                                            <div className="flex-shrink-0">
                                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                                                                    {comment.author[0]}
                                                                </div>
                                                            </div>

                                                            {/* Content */}
                                                            <div className="flex-1 min-w-0">
                                                                {/* Name and comment on same line */}
                                                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-tight pt-1">
                                                                    <span className="font-medium text-gray-900 dark:text-gray-100 mr-2">
                                                                        {comment.author}
                                                                    </span>
                                                                    {comment.text}
                                                                </p>

                                                                {/* Actions with timestamp */}
                                                                <div className="flex items-center gap-1">
                                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                        {comment.time}
                                                                    </span>
                                                                    <button
                                                                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                                                        className="text-xs text-gray-600 dark:text-gray-400 hover:text-blue-500 transition-colors duration-200 font-medium"
                                                                    >
                                                                        Balas
                                                                    </button>
                                                                    <button
                                                                        className={`flex items-center gap-1 text-xs transition-colors duration-200 ${comment.likedByMe ? 'text-red-500' : 'text-gray-600 dark:text-gray-400 hover:text-red-500'}`}
                                                                        onClick={() => {
                                                                            setComments(comments.map(c =>
                                                                                c.id === comment.id
                                                                                    ? { ...c, likes: c.likedByMe ? c.likes - 1 : c.likes + 1, likedByMe: !c.likedByMe }
                                                                                    : c
                                                                            ));
                                                                        }}
                                                                    >
                                                                        <svg className="w-4 h-4" fill={comment.likedByMe ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                                        </svg>
                                                                        {comment.likes > 0 && <span>{comment.likes}</span>}
                                                                    </button>
                                                                    <button className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                                                                        •••
                                                                    </button>
                                                                </div>

                                                                {/* Reply Input */}
                                                                {replyingTo === comment.id && (
                                                                    <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                                                                        {/* Input with emoji */}
                                                                        <div className="relative mb-2">
                                                                            <input
                                                                                type="text"
                                                                                placeholder="Tulis balasan..."
                                                                                className="w-full px-3 py-2 pr-10 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                onKeyPress={(e) => {
                                                                                    if (e.key === 'Enter') {
                                                                                        const input = e.target as HTMLInputElement;
                                                                                        if (input.value.trim()) {
                                                                                            setComments(comments.map(c =>
                                                                                                c.id === comment.id
                                                                                                    ? {
                                                                                                        ...c, replies: [...(c.replies || []), {
                                                                                                            id: Date.now().toString(),
                                                                                                            text: input.value,
                                                                                                            author: 'You',
                                                                                                            time: 'Baru saja',
                                                                                                            likes: 0
                                                                                                        }]
                                                                                                    }
                                                                                                    : c
                                                                                            ));
                                                                                            input.value = '';
                                                                                            setReplyingTo(null);
                                                                                            setExpandedReplies(new Set(expandedReplies).add(comment.id));
                                                                                        }
                                                                                    }
                                                                                }}
                                                                            />
                                                                            {/* Emoji button */}
                                                                            <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200">
                                                                                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                                </svg>
                                                                            </button>
                                                                        </div>

                                                                        {/* Action buttons */}
                                                                        <div className="flex justify-end gap-2">
                                                                            <button
                                                                                onClick={() => setReplyingTo(null)}
                                                                                className="px-4 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200"
                                                                            >
                                                                                Batal
                                                                            </button>
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    const container = e.currentTarget.closest('.mt-2');
                                                                                    const input = container?.querySelector('input') as HTMLInputElement;
                                                                                    if (input?.value.trim()) {
                                                                                        setComments(comments.map(c =>
                                                                                            c.id === comment.id
                                                                                                ? {
                                                                                                    ...c, replies: [...(c.replies || []), {
                                                                                                        id: Date.now().toString(),
                                                                                                        text: input.value,
                                                                                                        author: 'You',
                                                                                                        time: 'Baru saja',
                                                                                                        likes: 0
                                                                                                    }]
                                                                                                }
                                                                                                : c
                                                                                        ));
                                                                                        input.value = '';
                                                                                        setReplyingTo(null);
                                                                                        setExpandedReplies(new Set(expandedReplies).add(comment.id));
                                                                                    }
                                                                                }}
                                                                                className="px-4 py-1.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors duration-200"
                                                                            >
                                                                                Balas
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Show/Hide Replies Toggle */}
                                                                {comment.replies && comment.replies.length > 0 && (
                                                                    <button
                                                                        onClick={() => {
                                                                            const newExpanded = new Set(expandedReplies);
                                                                            if (newExpanded.has(comment.id)) {
                                                                                newExpanded.delete(comment.id);
                                                                            } else {
                                                                                newExpanded.add(comment.id);
                                                                            }
                                                                            setExpandedReplies(newExpanded);
                                                                        }}
                                                                        className="-mt-5 text-xs text-gray-600 dark:text-gray-400 hover:text-blue-500 transition-colors duration-200 font-medium"
                                                                    >
                                                                        {expandedReplies.has(comment.id)
                                                                            ? 'Sembunyikan balasan'
                                                                            : `Lihat ${comment.replies.length} balasan`
                                                                        }
                                                                    </button>
                                                                )}

                                                                {/* Nested Replies */}
                                                                {comment.replies && expandedReplies.has(comment.id) && (
                                                                    <div className="mt-2 ml-8 border-l-2 border-gray-200 dark:border-gray-700 pl-3 space-y-3">
                                                                        {comment.replies.map((reply) => (
                                                                            <div key={reply.id} className="flex gap-2 items-start">
                                                                                <div className="flex-shrink-0">
                                                                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white text-xs font-medium">
                                                                                        {reply.author[0]}
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex-1 min-w-0">
                                                                                    {/* Name and reply on same line */}
                                                                                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-tight pt-0.5">
                                                                                        <span className="font-medium text-gray-900 dark:text-gray-100 mr-2">
                                                                                            {reply.author}
                                                                                        </span>
                                                                                        {reply.text}
                                                                                    </p>

                                                                                    {/* Actions with timestamp */}
                                                                                    <div className="flex items-center gap-1">
                                                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                                            {reply.time}
                                                                                        </span>
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                setReplyingTo(comment.id);
                                                                                                setTimeout(() => {
                                                                                                    const input = document.querySelector(`input[placeholder="Tulis balasan..."]`) as HTMLInputElement;
                                                                                                    if (input) {
                                                                                                        input.value = `@${reply.author} `;
                                                                                                        input.focus();
                                                                                                    }
                                                                                                }, 100);
                                                                                            }}
                                                                                            className="text-xs text-gray-600 dark:text-gray-400 hover:text-blue-500 transition-colors duration-200 font-medium"
                                                                                        >
                                                                                            Balas
                                                                                        </button>
                                                                                        <button
                                                                                            className={`flex items-center gap-1 text-xs transition-colors duration-200 ${reply.likedByMe ? 'text-red-500' : 'text-gray-600 dark:text-gray-400 hover:text-red-500'}`}
                                                                                            onClick={() => {
                                                                                                setComments(comments.map(c =>
                                                                                                    c.id === comment.id
                                                                                                        ? {
                                                                                                            ...c,
                                                                                                            replies: c.replies?.map(r =>
                                                                                                                r.id === reply.id
                                                                                                                    ? { ...r, likes: r.likedByMe ? r.likes - 1 : r.likes + 1, likedByMe: !r.likedByMe }
                                                                                                                    : r
                                                                                                            )
                                                                                                        }
                                                                                                        : c
                                                                                                ));
                                                                                            }}
                                                                                        >
                                                                                            <svg className="w-3 h-3" fill={reply.likedByMe ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                                                            </svg>
                                                                                            {reply.likes > 0 && <span>{reply.likes}</span>}
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Comment Input - Now at bottom */}
                                <div className="relative overflow-visible rounded-lg">
                                    <input
                                        type="text"
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && commentText.trim()) {
                                                setComments([...comments, {
                                                    id: Date.now().toString(),
                                                    text: commentText,
                                                    author: 'You',
                                                    time: 'Baru saja',
                                                    likes: 0
                                                }]);
                                                setCommentText('');
                                            }
                                        }}
                                        placeholder="Tambahkan komentar untuk memulai percakapan"
                                        className="w-full px-4 py-2.5 pr-24 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    />
                                    {/* Action Buttons */}
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0">
                                        {/* Emoji Button */}
                                        <button
                                            type="button"
                                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                            className="p-1.5 rounded-md"
                                            aria-label="Add emoji"
                                        >
                                            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </button>

                                        {/* Send Button - No blue background */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (commentText.trim()) {
                                                    setComments([...comments, {
                                                        id: Date.now().toString(),
                                                        text: commentText,
                                                        author: 'You',
                                                        time: 'Baru saja',
                                                        likes: 0
                                                    }]);
                                                    setCommentText('');
                                                }
                                            }}
                                            disabled={!commentText.trim()}
                                            className="p-1.5 rounded-md disabled:opacity-30"
                                            aria-label="Send comment"
                                        >
                                            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" transform="rotate(90 12 12)" />
                                            </svg>
                                        </button>

                                        {/* Emoji Picker */}
                                        {showEmojiPicker && (
                                            <div className="absolute right-0 bottom-full mb-2 w-64 max-h-48 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-2 grid grid-cols-8 gap-1 z-50">
                                                {['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕'].map((emoji) => (
                                                    <button
                                                        key={emoji}
                                                        type="button"
                                                        onClick={() => {
                                                            setCommentText(commentText + emoji);
                                                            setShowEmojiPicker(false);
                                                        }}
                                                        className="text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1 transition-colors duration-200"
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Masonry grid below the big box (Column A) */}
                    <MasonryGrid columns="sidebar">
                        {columnAProjects.map((p, index) => (
                            <motion.div
                                key={`col-a-${index}-${p.slug}`}
                                initial={{ opacity: 0, y: 100 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.1 }}
                                transition={{
                                    duration: 0.8,
                                    ease: [0.25, 0.46, 0.45, 0.94],
                                    delay: index < 4 ? index * 0.1 : 0
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
                                initial={{ opacity: 0, y: 100 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.1 }}
                                transition={{
                                    duration: 0.8,
                                    ease: [0.25, 0.46, 0.45, 0.94],
                                    delay: index < 4 ? index * 0.1 : 0
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
