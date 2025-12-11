'use client';

import type { Project, GalleryItem } from '@/types/projects';
import { useMemo, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import HeroShared from '@/components/HeroShared';
import ReadMoreDescription from '@/components/ReadMoreDescription';
import ShareButtons from '@/components/ShareButtons';
import CommentSection from '@/components/CommentSection';
import DetailMeta from './DetailMeta';
import AITranslator from '@/components/AITranslator';

const CoverFlowGallery = dynamic(() => import('@/components/CoverFlowGallery'), {
  ssr: false,
  loading: () => (
    <div className="h-80 w-full rounded-2xl border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-gray-500">
      Galeri sedang disiapkan...
    </div>
  ),
});

interface ProjectDetailClientProps {
  p: any;
  cover: any;
  gallery: any;
  ratio: number;
  layoutStrategy: any;
}

export default function ProjectDetailClient({
  p,
  cover,
  gallery,
  ratio,
  layoutStrategy
}: ProjectDetailClientProps) {
  const [videoRef, setVideoRef] = useState<React.RefObject<HTMLVideoElement> | null>(null);
  const [initialLikes, setInitialLikes] = useState(0);

  useEffect(() => {
    setInitialLikes(Math.floor(Math.random() * 50) + 10);
  }, []);

  // Create unified media array with hero as first item
  const unifiedMedia = [
    {
      id: `hero-${p.slug}`,
      src: cover.src,
      title: p.title,
      type: cover.kind === 'video' ? 'video' : 'image',
      poster: cover.poster,
      isHero: true,
      ratio: ratio,
      autoplay: p.autoplay ?? true,
      muted: p.muted ?? true,
      loop: p.loop ?? true,
      playsInline: p.playsInline ?? true
    },
    ...(gallery || [])
  ];

  return (
    <article
      className="max-w-7xl mx-auto px-4 md:px-6 py-12 project-detail-container min-h-screen bg-white text-gray-900"
      style={{ paddingTop: '20px' }}
    >
      {/* Grid Layout - 2 kolom sejajar horizontal */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-start">

        {/* Kolom Kiri - Gallery (3/5 ruang) */}
        <div className="order-1 lg:order-1 lg:col-span-3 w-full pb-16">
          <div className="w-full max-w-full">
            <CoverFlowGallery
              items={unifiedMedia}
              autoPlay={false}
              showControls={true}
              autoPlayInterval={4000}
              onVideoRef={setVideoRef}
              videoRef={videoRef}
              coverKind={cover.kind}
            />
          </div>
        </div>

        {/* Kolom Kanan - Deskripsi dan Konten (2/5 ruang) */}
        <div className="order-2 lg:order-2 lg:col-span-2 space-y-6 w-full pl-0 lg:pl-4">
          {/* Judul dan Meta */}
          <div>
            <h1 className="h1 font-display text-gray-900 mb-4">{p.title}</h1>
            <DetailMeta p={p} />
          </div>

          {/* Deskripsi */}
          {p.description && (
            <>
              <ReadMoreDescription
                text={p.description}
                maxLines={2}
                className="text-lg leading-relaxed text-gray-700"
              />

              <div className="mt-2 text-left">
                <AITranslator text={p.description} context={`Project: ${p.title || ''}`} />
              </div>
            </>
          )}

          {/* Share, Love, and Comment Section */}
          <div className="space-y-8">
            {/* Share and Love Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-gray-50 rounded-lg">
              <ShareButtons
                url={typeof window !== 'undefined' ? window.location.href : ''}
                title={p.title}
                description={p.description}
              />
            </div>

            {/* Comment Section */}
            <CommentSection
              projectId={p.id}
              initialLikes={initialLikes} // Random initial likes (stable per mount)
            />
          </div>
        </div>
      </div>
    </article>
  );
}
