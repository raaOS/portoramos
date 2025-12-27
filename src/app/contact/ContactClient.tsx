'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Project } from '@/types/projects';
import { resolveCover } from '@/lib/images';
import Media from '@/components/shared/Media';

const CONTACT_LINKS = [
    { label: "Email", href: "mailto:hello@ramos.com", color: "bg-blue-500" },
    { label: "Instagram", href: "https://instagram.com", color: "bg-purple-500" },
    { label: "Twitter", href: "https://twitter.com", color: "bg-sky-500" },
    { label: "LinkedIn", href: "https://linkedin.com", color: "bg-indigo-500" }
];

// Lightweight Card Component (No interaction logic, just visuals)
const BackgroundCard = React.memo(({ project }: { project: Project }) => {
    const cover = resolveCover(project);
    const width = project.coverWidth || 800;
    const height = project.coverHeight || 600;
    const ratio = width / height;

    return (
        <div className="mb-4 sm:mb-6 break-inside-avoid">
            <div
                className="relative overflow-hidden rounded-md bg-gray-900/50 w-full"
                style={{
                    aspectRatio: ratio,
                }}
            >
                <Media
                    kind={cover.kind}
                    src={cover.src}
                    poster={cover.poster}
                    alt="" // Decorative only
                    width={400} // Smaller resolution for background
                    height={Math.round(400 / ratio)}
                    className="w-full h-full object-cover opacity-80" // Brighter opacity
                    autoplay={true}
                    loop={true}
                    muted={true}
                    playsInline={true}
                    controls={false}
                    lazy={false} // Force load for background
                    priority={false}
                />
            </div>
        </div>
    );
});

BackgroundCard.displayName = 'BackgroundCard';

interface ContactClientProps {
    projects: Project[];
    contactInfo?: any;
}

export default function ContactClient({ projects, contactInfo }: ContactClientProps) {
    // Ensure we have enough items for the loop
    const filledProjects = React.useMemo(() => {
        if (projects.length === 0) return [];
        // Duplicate list until we have enough items for a dense 7-column grid
        // With 7 columns, we need MANY items to create vertical height
        let list = [...projects];
        while (list.length < 50) {
            list = [...list, ...projects];
        }
        return list;
    }, [projects]);

    // Social Links processing
    const socialLinks = React.useMemo(() => {
        if (!contactInfo?.socialMedia) return CONTACT_LINKS;
        const s = contactInfo.socialMedia;
        return [
            { label: "Email", href: contactInfo.email ? `mailto:${contactInfo.email}` : undefined, color: "bg-blue-500" },
            { label: "Instagram", href: s.instagram, color: "bg-purple-500" },
            { label: "WhatsApp", href: s.whatsapp, color: "bg-green-500" },
            { label: "Twitter", href: s.twitter, color: "bg-sky-500" },
            { label: "LinkedIn", href: s.linkedin, color: "bg-indigo-500" },
            { label: "GitHub", href: s.github, color: "bg-gray-800" },
            { label: "Behance", href: s.behance, color: "bg-blue-700" }
        ].filter(l => l.href);
    }, [contactInfo]);

    const displayHeadline = contactInfo?.headline || "Bikin Project \nBareng?";
    const displaySubtext = contactInfo?.subtext || "Kita rancang pengalaman digital yang unik, detail, dan 'hidup'. \nSiap wujudin ide kamu?";

    return (
        <div className="fixed inset-0 z-40 h-[100dvh] w-full bg-[#0a0a0a] overflow-hidden flex flex-col items-center justify-center selection:bg-white/20">



            {/* Background Layer with CSS Animation */}
            <div className="absolute inset-0 z-0 opacity-50 pointer-events-none select-none overflow-hidden">
                {/* Double loop container for smooth scrolling */}
                <div className="w-full animate-scroll-vertical">
                    {/* First Set */}
                    <div className="css-masonry px-4">
                        {filledProjects.map((p, i) => (
                            <BackgroundCard key={`p1-${i}`} project={p} />
                        ))}
                    </div>
                    {/* Duplicate Set for Loop */}
                    <div className="css-masonry px-4">
                        {filledProjects.map((p, i) => (
                            <BackgroundCard key={`p2-${i}`} project={p} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Gradient Overlay - Lighter now */}
            <div className="absolute inset-0 z-1 bg-gradient-to-b from-[#0a0a0a] via-transparent to-[#0a0a0a] pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-5xl mx-auto">
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-5xl md:text-7xl lg:text-9xl font-sans text-[#e5e5e5] tracking-tight leading-[1] text-center mb-8 drop-shadow-2xl whitespace-pre-line"
                >
                    {displayHeadline}
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="text-white/70 text-lg md:text-xl max-w-2xl mb-12 font-light drop-shadow-lg whitespace-pre-line"
                >
                    {displaySubtext}
                </motion.p>

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                    className="flex flex-wrap justify-center gap-4"
                >
                    {socialLinks.map((link, i) => (
                        <Link
                            key={i}
                            href={link.href!}
                            target={link.href!.startsWith('http') ? "_blank" : undefined}
                            className="group relative px-6 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur-md overflow-hidden"
                        >
                            <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${link.color} blur-xl`} />
                            <span className="relative text-white/90 group-hover:text-white font-medium">{link.label}</span>
                        </Link>
                    ))}
                </motion.div>
            </div>

            <style jsx global>{`
                footer { display: none !important; }
                html, body { overflow: hidden !important; height: 100%; }
            `}</style>
        </div>
    );
}
