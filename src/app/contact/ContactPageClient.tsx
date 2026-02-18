'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { Project } from '@/types/projects';
import { resolveCover } from '@/lib/images';
import Media from '@/components/shared/Media';
import SystemNavFrame from '@/components/layout/SystemNavFrame';
import { Power, Radio, ExternalLink } from 'lucide-react';

// No fallback links - only show what user has configured
const CONTACT_LINKS: { label: string; href: string; color: string }[] = [];

// Lightweight Card Component (No interaction logic, just visuals)
const BackgroundCard = React.memo(({ project, index }: { project: Project, index: number }) => {
    const cover = resolveCover(project);
    const width = project.coverWidth || 800;
    const height = project.coverHeight || 600;
    const ratio = width / height;

    // PERFORMANCE OPTIMIZATION (HEMAT RAM & KUOTA):
    // User meminta agar video tidak terlalu banyak (50-75%).
    // Logika: index % 3 !== 0 berarti item ke-1, 2, 4, 5... (bukan kelipatan 3).
    // Hasilnya: 2 dari 3 item akan berupa video (66%), sisanya gambar statis.
    const allowVideoPreference = index % 3 !== 0; // Renamed to preference

    // CRITICAL FIX: If we want to show an Image but the source is a Video with NO POSTER,
    // we MUST fallback to showing the video (muted/autoplay) because <Image> cannot render a video file.
    const mustShowVideo = cover.kind === 'video' && !cover.poster;

    // Final logic: Allow video if preferred OR if we have no choice (missing poster)
    const allowVideo = allowVideoPreference || mustShowVideo;

    const effectiveKind = allowVideo ? cover.kind : 'image';

    // If we are forcing image mode (allowVideo is false), use poster.
    // Note: If we reached here with effectiveKind='image' and cover.kind='video', we guaranteed have a poster due to logic above.
    const effectiveSrc = (effectiveKind === 'image' && cover.kind === 'video')
        ? (cover.poster || cover.src) // Fallback to src shouldn't happen but keeps TS happy
        : cover.src;

    return (
        <div className="mb-4 sm:mb-6 break-inside-avoid">
            <div
                className="relative overflow-hidden rounded-md bg-gray-900/50 w-full"
                style={{
                    aspectRatio: ratio,
                }}
            >
                <Media
                    kind={effectiveKind}
                    src={effectiveSrc}
                    poster={cover.poster}
                    alt=""
                    width={400}
                    height={Math.round(400 / ratio)}
                    className="w-full h-full object-cover opacity-80"
                    autoplay={allowVideo}
                    loop={true}
                    muted={true}
                    playsInline={true}
                    controls={false}
                    lazy={true}
                    priority={false}
                />
            </div>
        </div>
    );
});

BackgroundCard.displayName = 'BackgroundCard';

interface ContactPageClientProps {
    projects: Project[];
    contactInfo?: any;
}

export default function ContactPageClient({ projects, contactInfo }: ContactPageClientProps) {
    // Ensure we have enough items for the loop
    const filledProjects = React.useMemo(() => {
        if (projects.length === 0) return [];
        // Duplicate list until we have enough items for a dense grid.
        // Reduced from 50 to 24 to prevent memory/CPU overload while still allowing smooth loop.
        let list = [...projects];
        while (list.length < 24) {
            list = [...list, ...projects];
        }

        // Shuffle the list to prevent column alignment issues (identical side-by-side images)
        // especially on mobile where column-count is 2.
        return list.map(value => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value);
    }, [projects]);

    // Social Links processing
    const socialLinks = React.useMemo(() => {
        if (!contactInfo?.socialMedia) return CONTACT_LINKS;
        const s = contactInfo.socialMedia;
        return [
            { label: "Email", href: s.email ? `mailto:${s.email}` : undefined, color: "bg-blue-500" },
            { label: "Instagram", href: s.instagram, color: "bg-purple-500" },
            { label: "WhatsApp", href: s.whatsapp, color: "bg-green-500" },
            { label: "Twitter", href: s.twitter, color: "bg-sky-500" },
            { label: "LinkedIn", href: s.linkedin, color: "bg-indigo-500" },
            { label: "GitHub", href: s.github, color: "bg-gray-800" },
            { label: "Behance", href: s.behance, color: "bg-blue-700" }
        ].filter(l => l.href);
    }, [contactInfo]);

    const displayHeadline = contactInfo?.headline || "Start a Project?";
    const displaySubtext = contactInfo?.subtext || "Kita rancang pengalaman digital yang unik, detail, dan 'hidup'. \nSiap wujudin ide kamu?";

    // [STICKY NOTE] PERFORMANCE LCP (Largest Contentful Paint)
    // Grid background sangat berat (banyak gambar/video).
    // Agar loading awal cepat, kita "tunda" (defer) rendering grid ini.
    // Grid baru muncul setelah 0.8 detik (setelah animasi teks selesai).
    const [isGridMounted, setIsGridMounted] = React.useState(false);

    React.useEffect(() => {
        // Mount grid after main content is likely painted (0.8s delay aligns with entrance animation duration)
        const timer = setTimeout(() => setIsGridMounted(true), 800);
        return () => clearTimeout(timer);
    }, []);

    React.useEffect(() => {
        // Prevent scrolling on the body when this component is mounted
        const originalOverflow = document.body.style.overflow;
        const originalHeight = document.body.style.height;

        document.body.style.overflow = 'hidden';
        document.body.style.height = '100%';

        return () => {
            document.body.style.overflow = originalOverflow;
            document.body.style.height = originalHeight;
        };
    }, []);

    return (
        <SystemNavFrame>
            <div className="relative flex-1 bg-[#0a0a0a] overflow-hidden flex flex-col items-center justify-center selection:bg-white/20 py-20">
                {/* Status Bar Backdrop (OS Style) */}
                <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 no-print">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-[10px] font-black text-green-500 uppercase tracking-[0.2em]">Ramos is Online</span>
                    </div>
                    <div className="w-[1px] h-3 bg-white/20" />
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Available for hire</div>
                </div>



                {/* Background Layer with CSS Animation - DEFERRED RENDER for Performance */}
                <div className="absolute inset-0 z-0 opacity-50 pointer-events-none select-none overflow-hidden transition-opacity duration-1000 ease-in-out"
                    style={{ opacity: isGridMounted ? 0.5 : 0 }}
                >
                    {/* Double loop container for smooth scrolling */}
                    {isGridMounted && (
                        <div className="w-full animate-scroll-vertical">
                            {/* First Set */}
                            <div className="css-masonry px-4">
                                {filledProjects.map((p, i) => (
                                    <BackgroundCard key={`p1-${i}`} project={p} index={i} />
                                ))}
                            </div>
                            {/* Duplicate Set for Loop */}
                            <div className="css-masonry px-4">
                                {filledProjects.map((p, i) => (
                                    <BackgroundCard key={`p2-${i}`} project={p} index={i + filledProjects.length} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Gradient Overlay - Lighter now */}
                <div className="absolute inset-0 z-1 bg-gradient-to-b from-[#0a0a0a] via-transparent to-[#0a0a0a] pointer-events-none" />

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-5xl mx-auto">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="text-5xl md:text-8xl lg:text-9xl font-black font-sans text-white tracking-tighter leading-[0.9] text-center mb-8 drop-shadow-2xl whitespace-pre-line overflow-visible"
                    >
                        {displayHeadline}
                    </motion.h1>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.15, duration: 0.4 }}
                        className="mb-8"
                    >
                        <button
                            onClick={() => window.dispatchEvent(new CustomEvent('open-chat'))}
                            className="group relative flex items-center gap-3 px-8 py-4 rounded-full bg-white/10 border border-white/5 hover:bg-white/15 hover:border-white/20 transition-all duration-300 overflow-hidden shadow-xl"
                        >
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-blue-500 blur-xl" />
                            <span className="relative text-white/90 group-hover:text-white font-bold">{contactInfo?.labels?.chatButtonText || "Let's Chat"}</span>
                        </button>
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="text-white/70 text-lg md:text-xl max-w-2xl mb-12 font-light drop-shadow-lg whitespace-pre-line"
                    >
                        {displaySubtext}
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="flex flex-wrap justify-center gap-4"
                    >
                        {socialLinks.map((link, i) => (
                            <Link
                                key={i}
                                href={link.href!}
                                target={link.href!.startsWith('http') ? "_blank" : undefined}
                                className="group relative px-6 py-3 rounded-full bg-white/10 border border-white/5 hover:bg-white/15 hover:border-white/20 transition-all duration-300 overflow-hidden"
                            >
                                <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${link.color} blur-xl`} />
                                <span className="relative text-white/90 group-hover:text-white font-medium">{link.label}</span>
                            </Link>
                        ))}
                    </motion.div>
                </div>


            </div>
        </SystemNavFrame>
    );
}
