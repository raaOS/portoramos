'use client';

import Media from '@/components/shared/Media';
import { motion } from 'motion/react';

interface GalleryImage {
  src: string;
  alt: string;
  title?: string;
  description?: string;
  duration?: string;
  jobDetails?: string[];
}

interface SwayingGalleryProps {
  images: GalleryImage[];
  className?: string;
}

export default function SwayingGallery({
  images,
  className = '',
}: SwayingGalleryProps) {

  return (
    <div className={`swaying-gallery-wrapper ${className} w-full`}>
      <div className="gallery-layout-grid p-4 md:p-10 w-full max-w-7xl mx-auto">
        {images.map((image, index) => {
          const isVideo = image.src.toLowerCase().match(/\.(mp4|webm|mov)$/);

          return (
            <motion.div
              layout
              key={index}
              className="gallery-card-wrapper relative col-span-1 h-[400px] aspect-[4/5] z-0"
              transition={{ duration: 0.4 }}
            >
              <div
                className="h-full bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 group hover:shadow-lg transition-shadow duration-300 flex flex-col w-full"
              >
                {/* MEDIA SECTION - FULL SIZE */}
                <div className="relative w-full h-full">
                  <Media
                    kind={isVideo ? 'video' : 'image'}
                    src={image.src}
                    alt={image.alt}
                    width={600}
                    height={600}
                    className="w-full h-full object-cover"
                    autoplay={true}
                    muted={true}
                    loop={true}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-6 flex flex-col justify-end">
                    <h3 className="text-white font-bold text-lg translate-y-4 group-hover:translate-y-0 transition-transform duration-300">{image.title}</h3>
                    <p className="text-white/80 text-sm translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">{image.description}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <style jsx>{`
        .gallery-layout-grid {
            display: grid;
            grid-template-columns: repeat(1, 1fr);
            gap: 20px;
        }
        @media (min-width: 640px) {
             .gallery-layout-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }
        @media (min-width: 1024px) {
             .gallery-layout-grid {
                grid-template-columns: repeat(3, 1fr);
            }
        }
      `}</style>
    </div>
  );
}
