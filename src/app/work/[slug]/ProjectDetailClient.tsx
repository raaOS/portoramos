'use client';

import type { Project, GalleryItem } from '@/types/projects';
import { useMemo, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import HeroShared from '@/components/home/HeroShared';
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
      className="w-full py-8 px-6 md:px-12"
    >
      {/* Single Column Layout - Pinterest Style */}
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Gallery Section */}
        <div className="w-full">
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

        {/* Content Section */}
        <div className="space-y-6">
          {/* Title and Meta */}
          <div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">{p.title}</h1>
            <DetailMeta p={p} />
          </div>

          {/* Description */}
          {p.description && (
            <>
              <ReadMoreDescription
                text={p.description}
                maxLines={4}
                className="text-lg leading-relaxed text-gray-700"
              />

              <div className="text-left">
                <AITranslator text={p.description} context={`Project: ${p.title || ''}`} />
              </div>
            </>
          )}

          {/* Share and Comment Section */}
          <div className="space-y-6 pt-4 border-t border-gray-200">
            {/* Share Buttons */}
            <div className="flex items-center justify-between">
              <ShareButtons
                url={typeof window !== 'undefined' ? window.location.href : ''}
                title={p.title}
                description={p.description}
              />
            </div>

            {/* Comment Section */}
            <CommentSection
              projectId={p.id}
              initialLikes={initialLikes}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
