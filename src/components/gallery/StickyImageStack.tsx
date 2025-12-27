'use client';

import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, useScroll, useTransform, useSpring, MotionValue, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Project } from '@/types/projects';
import { Comment } from '@/lib/magic';
import AITranslator from '@/components/features/AITranslator';
import ReadMoreDescription from '@/components/ReadMoreDescription';
import ShareButtons from '@/components/features/ShareButtons';

export type MediaItem = {
    id: string;
    type: 'image' | 'video';
    src: string;
    alt?: string;
    project: Project; // Added full project data
};

interface StickyImageStackProps {
    items: MediaItem[];
}

function Card({
    item,
    progress,
    range,
    targetScale,
    index,
    total,
    onClick,
    isMobile
}: {
    item: MediaItem;
    progress: MotionValue<number>;
    range: [number, number];
    targetScale: number;
    index: number;
    total: number;
    onClick: (item: MediaItem) => void;
    isMobile: boolean;
}) {
    // Transform vertical scroll progress to horizontal movement (enter from right)

    // Calculate horizontal offset for "fanning out"
    // Center the stack: Shift entire group left by half the total spread

    // Mobile: 0 overlap (single pile). Desktop: 80px overlap (fanned out)
    const overlap = isMobile ? 0 : 80;
    const finalX = (index * overlap) - ((total - 1) * overlap / 2);

    // 1. Initial State:
    // Item 0 is always at its finalX.
    // Items 1..N start far off-screen (100vw).

    // 2. Animation:
    // As progress goes from range[0] to range[1], move from 100vw to finalX.
    // FIX: Anchor the range start at 0 to explicitly force '100vw' (2000px) and opacity 0
    // until the scroll reaches this item's specific start time.
    const startX = 2000;

    const x = useTransform(
        progress,
        [0, range[0], range[1]],
        index === 0
            ? [`${finalX}px`, `${finalX}px`, `${finalX}px`]
            : [`${startX}px`, `${startX}px`, `${finalX}px`]
    );

    // SAFETY: Also animate opacity to ensure items are invisible until they start moving
    // Sync opacity with movement: Fade in as it arrives, Fade out as it leaves
    const opacity = useTransform(
        progress,
        [0, range[0], range[1]],
        index === 0 ? [1, 1, 1] : [0, 0, 1]
    );

    const initialX = index === 0 ? `${finalX}px` : `${startX}px`;
    const initialOpacity = index === 0 ? 1 : 0;

    // Add slight rotation for "messy stack" feel on mobile only
    const randomRotate = isMobile ? (index % 2 === 0 ? 2 : -2) : 0;

    return (
        <div
            className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none"
            style={{
                zIndex: index,
            }}
        >
            <motion.div
                initial={false}
                style={{ x, opacity, rotate: index === 0 ? 0 : randomRotate }}
                whileHover={{ scale: 1.02 }}
                onClick={() => onClick(item)}
                className="relative w-[80vw] max-w-[300px] md:max-w-none md:w-[400px] lg:w-[500px] aspect-[4/5] overflow-hidden origin-center bg-gray-900 cursor-pointer pointer-events-auto"
            >
                {item.type === 'video' ? (
                    <video
                        key={item.src} // Force re-render on src change
                        src={item.src}
                        autoPlay={true}
                        muted={true}
                        loop={true}
                        playsInline={true}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <img
                        src={item.src}
                        alt={item.alt || ''}
                        className="w-full h-full object-cover"
                    />
                )}

                {/* Overlay for index/decoration */}
                <div className="absolute top-4 left-4 bg-black/50 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-mono border border-white/20">
                    {String(index + 1).padStart(2, '0')}/{String(total).padStart(2, '0')}
                </div>
            </motion.div>
        </div>
    );
}

export default function StickyImageStack({ items }: StickyImageStackProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1280); // xl breakpoint (match xl:grid-cols-12 logic in AboutClient)
        };

        // Initial check
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Length of scroll interaction.
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end end']
    });

    // Add spring physics to make the scroll feel "natural" and "weighted"
    // instead of strictly linear/robotic
    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 120, // Tuned for balanced response
        damping: 20,
        restDelta: 0.001
    });

    const [mounted, setMounted] = useState(false);

    // Ensure portal only renders on client
    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <>
            {/* Height controls how long we scroll. Reduced extra buffer from 100vh to 50vh to minimize negative space */}
            <div ref={containerRef} style={{ height: `${items.length * 90 + 50}vh` }} className="relative bg-[#0a0a0a]">
                <div className="sticky top-0 h-screen overflow-hidden flex items-center justify-center">

                    <div className="relative w-full h-full max-w-[1400px] mx-auto z-10">
                        {items.map((item, i) => {
                            // Calculate range for this card's entry.
                            // We divide the total scroll progress (0 to 1) into chunks.
                            // Buffer at the end (0.9) to ensure completion.

                            const animationEnd = 0.85;
                            const step = animationEnd / items.length;

                            // Overlap Ranges slightly?
                            // No, let's keep them distinct for clean "1 then 2 then 3" feel.

                            const start = i * step;
                            // Clamp end to max 1.0
                            const end = start + step;

                            return (
                                <Card
                                    key={item.id}
                                    item={item}
                                    index={i}
                                    progress={smoothProgress} // Use the smoothed progress
                                    range={[start, end]}
                                    targetScale={1}
                                    total={items.length}
                                    onClick={setSelectedItem}
                                    isMobile={isMobile}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Lightbox Modal via Portal */}
            {mounted && createPortal(
                <AnimatePresence>
                    {selectedItem && (
                        <ModalContent
                            item={selectedItem}
                            onClose={() => setSelectedItem(null)}
                        />
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}

// Sub-component for the rich modal content to handle its own state/fetching
// Helper for real-world relative time
function formatRelativeTime(dateString: string) {
    if (!dateString) return 'Baru saja';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Baru saja';

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} jam yang lalu`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} hari yang lalu`;

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks} minggu yang lalu`;

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths} bulan yang lalu`;

    return `${Math.floor(diffInDays / 365)} tahun yang lalu`;
}

// Sub-component for the rich modal content to handle its own state/fetching
function ModalContent({ item, onClose }: { item: MediaItem, onClose: () => void }) {
    const project = item.project;
    const [isProjectLiked, setIsProjectLiked] = useState(false);
    const [metrics, setMetrics] = useState({ likes: 0, shares: 0 });
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentText, setCommentText] = useState('');
    const [showShareOptions, setShowShareOptions] = useState(false);
    const [isCommentsOpen, setIsCommentsOpen] = useState(true);
    const [isLoaded, setIsLoaded] = useState(false);

    // Guest Identity
    const [guestName, setGuestName] = useState<string>('');
    const [tempGuestName, setTempGuestName] = useState('');
    const [isSettingName, setIsSettingName] = useState(false);

    // Load Data
    useEffect(() => {
        const initData = async () => {
            if (typeof window !== 'undefined') {
                const savedLike = localStorage.getItem(`like-${project.slug}`);
                if (savedLike === 'true') setIsProjectLiked(true);

                const savedName = localStorage.getItem('guest-name');
                if (savedName) setGuestName(savedName);
            }

            try {
                // Fetch Metrics
                const mRes = await fetch(`/api/metrics?slug=${project.slug}`);
                if (mRes.ok) setMetrics(await mRes.json());

                // Fetch Comments
                const cRes = await fetch(`/api/comments?slug=${project.slug}`);
                if (cRes.ok) {
                    const data = await cRes.json();
                    setComments(data.comments || []);
                }
            } catch (e) {
                console.error('Failed to load modal data:', e);
            } finally {
                setIsLoaded(true);
            }
        };
        initData();
    }, [project.slug]);

    // Save comments logic
    useEffect(() => {
        if (!isLoaded) return;
        const timer = setTimeout(async () => {
            try {
                await fetch('/api/comments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ slug: project.slug, comments })
                });
            } catch (e) { }
        }, 1000);
        return () => clearTimeout(timer);
    }, [comments, project.slug, isLoaded]);

    const handleLike = async () => {
        const newLike = !isProjectLiked;
        setIsProjectLiked(newLike);
        setMetrics(prev => ({ ...prev, likes: newLike ? prev.likes + 1 : Math.max(0, prev.likes - 1) }));
        localStorage.setItem(`like-${project.slug}`, String(newLike));
        try {
            await fetch('/api/metrics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug: project.slug, action: newLike ? 'like' : 'unlike' })
            });
        } catch (e) { }
    };

    const handleShare = (e: React.MouseEvent) => {
        e.stopPropagation(); // Don't close modal
        setShowShareOptions(!showShareOptions);

        if (!showShareOptions) {
            try {
                fetch('/api/metrics', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ slug: project.slug, action: 'share' })
                });
                setMetrics(prev => ({ ...prev, shares: prev.shares + 1 }));
            } catch (e) { }
        }
    };

    const handlePostComment = () => {
        if (!commentText.trim() || !guestName) return;

        const newComment: Comment = {
            id: Date.now().toString(),
            text: commentText,
            author: guestName,
            time: new Date().toISOString(), // Consistent with interface
            likes: 0,
            replies: []
        };

        setComments([newComment, ...comments]);
        setCommentText('');
    };

    const handleSaveName = () => {
        if (tempGuestName.trim()) {
            setGuestName(tempGuestName.trim());
            localStorage.setItem('guest-name', tempGuestName.trim());
            setIsSettingName(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-2 sm:p-4 md:p-10"
            onClick={onClose}
        >
            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>

            <button
                className="absolute top-4 right-4 sm:top-8 sm:right-8 text-white/50 hover:text-white transition-colors z-[10001]"
                onClick={onClose}
            >
                <X className="w-8 h-8 sm:w-12 sm:h-12" />
            </button>

            <motion.div
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.98, opacity: 0 }}
                className="relative w-full max-w-7xl h-full max-h-[90vh] bg-white dark:bg-gray-950 overflow-hidden shadow-2xl flex flex-col md:flex-row border-none"
                onClick={(e) => e.stopPropagation()}
            >
                {/* LEFT: Media Section */}
                <div className="w-full md:w-[60%] h-[45%] md:h-full bg-gray-50 dark:bg-gray-950 flex items-center justify-center relative">
                    {item.type === 'video' ? (
                        <video
                            src={item.src}
                            autoPlay
                            controls
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <img
                            src={item.src}
                            alt={item.alt || ''}
                            className="w-full h-full object-contain"
                        />
                    )}
                </div>

                {/* RIGHT: Content Section */}
                <div className="w-full md:w-[40%] h-[55%] md:h-full bg-white dark:bg-gray-900 flex flex-col">
                    {/* Fixed Top Section (Title & Metrics) */}
                    <div className="p-6 sm:p-10 pb-6 border-b border-gray-100 dark:border-gray-800">
                        <div className="mb-6">
                            <h2 className="text-2xl font-sans font-bold text-gray-900 dark:text-white leading-tight">
                                {project.title}
                            </h2>
                        </div>

                        <div className="flex items-center justify-between text-gray-500 relative">
                            <div className="flex items-center gap-6">
                                <button
                                    onClick={handleLike}
                                    className={`flex items-center gap-2 transition-colors ${isProjectLiked ? 'text-red-500' : 'hover:text-red-500'}`}
                                >
                                    <svg className="w-4 h-4" fill={isProjectLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                    <span className="text-sm font-semibold">{metrics.likes || 0}</span>
                                </button>

                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <span className="text-sm font-semibold">{comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)}</span>
                                </div>

                                <div className="relative">
                                    <button
                                        onClick={handleShare}
                                        className={`flex items-center gap-2 transition-colors ${showShareOptions ? 'text-blue-500' : 'hover:text-blue-500'}`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                        </svg>
                                        <span className="text-sm font-semibold">{metrics.shares || 0}</span>
                                    </button>

                                    <AnimatePresence>
                                        {showShareOptions && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="absolute left-[-20px] top-full mt-4 z-[10002] bg-white dark:bg-gray-800 p-4 rounded-xl shadow-none border border-black dark:border-white w-80"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <ShareButtons
                                                    url={typeof window !== 'undefined' ? `${window.location.origin}/works/${project.slug}` : ''}
                                                    title={project.title}
                                                    description={project.description}
                                                    showTitle={false}
                                                    className="p-0 space-y-2"
                                                />
                                                {/* Arrow also needs to match border */}
                                                <div className="absolute top-[-6px] left-8 w-3 h-3 bg-white dark:bg-gray-800 rotate-45 border-l border-t border-black dark:border-white"></div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                            <div className="flex-shrink-0">
                                <AITranslator text={project.description || ''} context={`Project: ${project.title}`} />
                            </div>
                        </div>
                    </div>

                    {/* Middle Section: Scrollable Description (Always visible area) */}
                    <div className="flex-1 overflow-y-auto no-scrollbar p-6 sm:p-10 pt-8">
                        {project.description && (
                            <div className="mb-4">
                                <ReadMoreDescription
                                    text={project.description}
                                    maxLines={3}
                                    className="text-sm leading-relaxed text-gray-600 dark:text-gray-400 font-sans"
                                />
                            </div>
                        )}
                    </div>

                    {/* Bottom Section: Accordion Comments (Tray Style) */}
                    <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/50 flex flex-col overflow-hidden">
                        <button
                            onClick={() => setIsCommentsOpen(!isCommentsOpen)}
                            className="w-full flex items-center justify-between p-6 sm:p-10 py-5 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
                        >
                            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-white">
                                Komentar ({comments.length})
                            </h3>
                            <motion.svg
                                animate={{ rotate: isCommentsOpen ? 180 : 0 }}
                                className="w-5 h-5 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </motion.svg>
                        </button>

                        <AnimatePresence>
                            {isCommentsOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden flex flex-col max-h-[35vh] sm:max-h-[40vh]"
                                >
                                    <div className="flex-1 overflow-y-auto no-scrollbar p-6 sm:p-10 pt-0 space-y-8 pb-10">
                                        {comments.length === 0 ? (
                                            <p className="text-center text-xs text-gray-400 py-4 italic">Belum ada komentar.</p>
                                        ) : (
                                            comments.map((comment) => (
                                                <div key={comment.id} className="group">
                                                    <div className="flex gap-4">
                                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0 flex items-center justify-center text-white text-[13px] font-bold uppercase shadow-lg">
                                                            {comment.author[0]}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-baseline gap-2 mb-1">
                                                                <span className="text-sm font-bold text-gray-900 dark:text-white">{comment.author}</span>
                                                                <span className="text-[10px] text-gray-400">
                                                                    {formatRelativeTime(comment.createdAt || comment.time)}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                                                {comment.text}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {comment.replies && comment.replies.length > 0 && (
                                                        <div className="ml-13 mt-4 space-y-4 border-l-2 border-gray-100 dark:border-gray-800 pl-4">
                                                            {comment.replies.map((reply) => (
                                                                <div key={reply.id} className="flex gap-3">
                                                                    <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-800 flex-shrink-0 flex items-center justify-center text-gray-600 dark:text-gray-400 text-[10px] font-bold uppercase ring-1 ring-gray-200 dark:ring-gray-700">
                                                                        {reply.author[0]}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <div className="flex items-baseline gap-2 mb-1">
                                                                            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{reply.author}</span>
                                                                            <span className="text-[9px] text-gray-400">
                                                                                {formatRelativeTime(reply.createdAt || reply.time)}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-xs text-gray-700 dark:text-gray-400">
                                                                            {reply.text}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Fixed Bottom Section: Identity & Comment Input */}
                    <div className="p-6 sm:p-10 pt-4 border-t border-black/10 dark:border-white/10 bg-white dark:bg-gray-900 pb-10">
                        {!guestName || isSettingName ? (
                            <div className="space-y-4">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    Isi namamu dulu untuk mulai berkomentar 😊
                                </p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        autoFocus
                                        value={tempGuestName}
                                        onChange={(e) => setTempGuestName(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSaveName()}
                                        placeholder="Ketik namamu..."
                                        className="flex-1 bg-transparent border-none border-b border-black/10 dark:border-white/10 px-0 py-2.5 text-sm focus:border-red-500 dark:text-white transition-all outline-none focus:outline-none focus:ring-0"
                                    />
                                    <button
                                        onClick={handleSaveName}
                                        disabled={!tempGuestName.trim()}
                                        className="bg-[#E60023] hover:bg-[#ad001b] text-white px-6 py-2.5 rounded-full text-sm font-bold transition-colors disabled:opacity-50 border-none outline-none shadow-sm"
                                    >
                                        Simpan
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="relative">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                                        Komentar sebagai <span className="text-red-500">{guestName}</span>
                                    </p>
                                    <button
                                        onClick={() => {
                                            setTempGuestName(guestName);
                                            setIsSettingName(true);
                                        }}
                                        className="text-[11px] text-gray-300 hover:text-red-500 transition-colors underline decoration-dotted underline-offset-4"
                                    >
                                        Ganti nama
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handlePostComment()}
                                        placeholder="Tulis komentar..."
                                        className="w-full bg-transparent border-none border-b border-black/10 dark:border-white/10 px-0 py-3 text-sm focus:border-red-500 dark:text-white transition-all outline-none focus:outline-none focus:ring-0 pr-12"
                                    />
                                    <button
                                        className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-red-500 hover:text-red-600 transition-colors disabled:opacity-30"
                                        disabled={!commentText.trim()}
                                        onClick={handlePostComment}
                                    >
                                        <svg className="w-5 h-5 rotate-90" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
