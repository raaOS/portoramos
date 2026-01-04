'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Media from '@/components/shared/Media';
import { useNavbarVisibility } from '@/contexts/NavbarVisibilityContext';
import AITranslator from '@/components/features/AITranslator';

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

interface SelectedJob {
  year: string;
  duration: string;
  company: string;
  position: string;
  description: string[];
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  content: string;
}

export default function SwayingGallery({
  images,
  className = '',
}: SwayingGalleryProps) {
  const galleryRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [selectedJob, setSelectedJob] = useState<SelectedJob | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    content: '',
  });
  const { hideNavbar, showNavbar } = useNavbarVisibility();

  useEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsActive(entry.isIntersecting);
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(gallery);

    return () => {
      observer.disconnect();
    };
  }, []);

  const handlePhotoClick = (image: GalleryImage) => {
    if (!image.jobDetails) return;

    hideNavbar();
    setSelectedJob({
      year: image.title || '',
      duration: image.duration || '',
      company: image.description?.split(' - ')[0] || '',
      position: image.description?.split(' - ')[1] || '',
      description: image.jobDetails,
    });
  };

  const closeModal = () => {
    showNavbar();
    setSelectedJob(null);
  };

  return (
    <div className={`swaying-gallery-wrapper ${className}`}>
      <div
        ref={galleryRef}
        className={`gallery-container ${isActive ? 'active' : ''}`}
      >
        {images.map((image, index) => {
          const isVideo = image.src.toLowerCase().match(/\.(mp4|webm|mov)$/);
          return (
            <div
              key={index}
              className={`gallery-item ${image.jobDetails ? 'clickable' : ''}`}
              onClick={() => handlePhotoClick(image)}
              onMouseEnter={(event) => {
                if (image.jobDetails) {
                  setTooltip((prev) => ({
                    ...prev,
                    visible: true,
                    content: image.duration || '',
                    x: event.clientX + 20,
                    y: event.clientY + 30,
                  }));
                }
              }}
              onMouseLeave={() =>
                setTooltip((prev) => ({ ...prev, visible: false }))
              }
              onMouseMove={(event) => {
                if (!image.jobDetails) return;
                setTooltip((prev) => ({
                  ...prev,
                  visible: true,
                  x: event.clientX + 20,
                  y: event.clientY + 30,
                }));
              }}
            >
              <Media
                kind={isVideo ? 'video' : 'image'}
                src={image.src}
                alt={image.alt}
                width={400}
                height={400}
                className="gallery-image w-full h-full"
                autoplay={true}
                muted={true}
                loop={true}
                playsInline={true}
                objectFit="cover"
                priority={index < 2}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              />
              <div className="gallery-pin" />
              {(image.title || image.description) && (
                <div className="gallery-caption">
                  {image.title && <h3 className="gallery-title">{image.title}</h3>}
                  {image.description && (
                    <div className="gallery-description flex flex-col gap-0.5">
                      {image.description.includes(' - ') ? (
                        <>
                          <span className="font-semibold text-gray-900 leading-tight">
                            {image.description.split(' - ')[1]}
                          </span>
                          <span className="text-gray-600 font-normal leading-tight">
                            {image.description.split(' - ')[0]}
                          </span>
                        </>
                      ) : (
                        image.description
                      )}
                    </div>
                  )}
                  {image.jobDetails && (
                    <p className="gallery-click-hint">Klik detail jobdesk</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tooltip - Blue rounded background */}
      {tooltip.visible && (
        <div
          className="gallery-tooltip"
          style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}
        >
          {tooltip.content}
        </div>
      )}

      {selectedJob && (
        <div className="job-modal-overlay" onClick={closeModal}>
          <div className="job-modal" onClick={(e) => e.stopPropagation()}>
            <div className="job-modal-header">
              <div>
                <h2 className="job-modal-title">Detail Pekerjaan</h2>
              </div>
              <button className="job-modal-close" onClick={closeModal}>
                x
              </button>
            </div>
            <div className="job-modal-content">
              <h3 className="job-company">{selectedJob.company}</h3>
              <h4 className="job-position">{selectedJob.position}</h4>
              <div className="job-meta">
                <div className="job-meta-row">
                  <span className="job-meta-label">Periode</span>
                  <span className="job-meta-value">
                    {selectedJob.duration || '-'}
                  </span>
                </div>
                <div className="job-meta-row">
                  <span className="job-meta-label">Tahun</span>
                  <span className="job-meta-value">
                    {selectedJob.year || '-'}
                  </span>
                </div>
              </div>
              <ul className="job-description">
                {selectedJob.description.map((item, itemIndex) => (
                  <li key={itemIndex}>{item}</li>
                ))}
              </ul>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <AITranslator
                  text={selectedJob.description.join('\n• ')}
                  context={`${selectedJob.company} - ${selectedJob.position}`}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .swaying-gallery-wrapper {
          overflow: visible !important;
          width: 100%;
          padding: 0;
          margin: 0;
          position: relative;
          z-index: 10;
          min-height: 100%;
        }

        .gallery-container {
          position: relative;
          z-index: 15;
          display: grid !important;
          grid-template-columns: repeat(3, 1fr) !important;
          grid-template-rows: repeat(2, 1fr) !important;
          gap: 10px !important;
          padding: 60px 40px 100px !important;
          max-width: none !important;
          margin: 0 auto !important;
          width: 100% !important;
          height: 640px !important;
          overflow: visible !important;
        }

        .gallery-item {
          position: relative !important;
          z-index: 20;
          background: white !important;
          border-radius: 4px !important;
          box-shadow: none !important;
          border: 1px solid #000 !important;
          transform-origin: center 0.18rem !important;
          will-change: transform !important;
          overflow: hidden !important;
          width: 100% !important;
          height: 100% !important;
          aspect-ratio: 3 / 4 !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: flex-start !important;
          padding: 6px 6px 0 6px !important;
        }

        /* Target the specific Media wrapper div which is the first child */
        .gallery-item > :global(div:first-of-type) {
           width: 100% !important;
           aspect-ratio: 1 / 1 !important;
           height: auto !important;
           flex: 0 0 auto !important;
           position: relative !important;
           overflow: hidden !important;
           border-radius: 2px !important;
        }

        .gallery-item.clickable {
          cursor: pointer !important;
          transition: transform 0.2s ease, box-shadow 0.2s ease !important;
          min-height: 44px !important;
          min-width: 44px !important;
        }

        .gallery-item.clickable:hover {
          transform: scale(1.02) !important;
          box-shadow: none !important;
        }

        .gallery-item.clickable:active {
          transform: scale(0.98) !important;
        }

        .gallery-container.active .gallery-item:nth-child(1) {
          animation: swing-left 0.8s cubic-bezier(0.4, 0, 0.6, 1) infinite
            alternate !important;
          animation-delay: 0s !important;
        }
        .gallery-container.active .gallery-item:nth-child(2) {
          animation: swing-right 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite
            alternate !important;
          animation-delay: 0.1s !important;
        }
        .gallery-container.active .gallery-item:nth-child(3) {
          animation: swing-left 0.9s cubic-bezier(0.4, 0, 0.6, 1) infinite
            alternate !important;
          animation-delay: 0.2s !important;
        }
        .gallery-container.active .gallery-item:nth-child(4) {
          animation: swing-right 1.1s cubic-bezier(0.4, 0, 0.6, 1) infinite
            alternate !important;
          animation-delay: 0.3s !important;
        }
        .gallery-container.active .gallery-item:nth-child(5) {
          animation: swing-left 0.7s cubic-bezier(0.4, 0, 0.6, 1) infinite
            alternate !important;
          animation-delay: 0.4s !important;
        }
        .gallery-container.active .gallery-item:nth-child(6) {
          animation: swing-right 1.3s cubic-bezier(0.4, 0, 0.6, 1) infinite
            alternate !important;
          animation-delay: 0.5s !important;
        }

        .gallery-image {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          border-radius: 0 !important;
          transition: transform 0.2s ease !important;
          transform: scale(1) !important;
          background: #eee;
          padding: 0 !important;
        }

        .gallery-item:hover .gallery-image {
          transform: scale(1.05) !important;
        }

        .gallery-pin {
          position: absolute;
          top: 0.18rem;
          left: 50%;
          width: 8px;
          height: 8px;
          background: crimson;
          border-radius: 50%;
          transform: translateX(-50%);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
          z-index: 30;
        }

        .gallery-caption {
          position: relative !important;
          width: 100% !important;
          flex: 1 !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: center !important;
          align-items: center !important;
          text-align: center !important;
          padding: 4px 2px !important;
          background: transparent !important;
          border-radius: 0 !important;
          margin: 0 !important;
          z-index: 25 !important;
        }

        .gallery-title {
          color: #333;
          font-size: 10px;
          font-weight: 600;
          margin: 0 0 4px 0;
          text-transform: none;
          line-height: 1.1;
        }

        .gallery-description {
          color: #666;
          font-size: 8px;
          margin: 0 0 4px 0;
          text-transform: none;
          line-height: 1.1;
        }

        .gallery-click-hint {
          color: #2563eb;
          font-size: 9px;
          margin: 12px 0 0 0;
          font-weight: 500;
          text-transform: none;
          line-height: 1.1;
          font-style: italic;
        }

        .gallery-tooltip {
          position: fixed;
          z-index: 1100;
          background: #2563eb;
          color: #fff;
          padding: 6px 10px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 600;
          pointer-events: none;
          box-shadow: 0 6px 14px rgba(0, 0, 0, 0.2);
          transform: translate(-50%, 0);
        }

        @keyframes swing-left {
          0% {
            transform: rotate3d(0, 0, 1, -8deg);
          }
          100% {
            transform: rotate3d(0, 0, 1, 2deg);
          }
        }

        @keyframes swing-right {
          0% {
            transform: rotate3d(0, 0, 1, 8deg);
          }
          100% {
            transform: rotate3d(0, 0, 1, -2deg);
          }
        }

        /* Desktop specific improvements */
        @media (min-width: 1024px) {
          .gallery-container {
            max-width: none;
            gap: 10px;
            padding: 60px 40px 100px;
            width: 100%;
            height: 640px;
            margin: 0 auto;
            overflow: visible;
          }

          .gallery-item {
            aspect-ratio: 3 / 4 !important;
            padding: 0px;
            border-radius: 4px;
            box-shadow: none !important;
            border: 1px solid #000 !important;
          }
        }

        @media (max-width: 900px) {
          .gallery-container {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            grid-template-rows: none !important;
            grid-auto-flow: row;
            grid-auto-rows: auto !important;
            gap: 14px !important;
            padding: 32px 14px 28px 14px !important;
            width: min(100%, 540px) !important;
            max-width: 540px !important;
            height: auto !important;
            min-height: 420px;
            margin: 0 auto !important;
            overflow: visible !important;
          }

          .gallery-item {
            width: 100% !important;
            aspect-ratio: 3 / 4 !important;
            padding: 0px;
            border-radius: 4px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.08) !important;
            border: 1px solid #000 !important;
            height: 100% !important;
          }

          .gallery-image {
            object-fit: contain !important;
          }
        }

        .job-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: #ffffff; /* Putih Solid */
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          animation: fadeIn 0.15s ease-out;
          /* backdrop-filter removed because background is solid */
        }

        .job-modal {
          background: white;
          width: 90%;
          max-width: 480px;
          border-radius: 16px;
          box-shadow: none; /* Shadow Removed */
          border: 1px solid #000000; /* Black Thin Border */
          overflow: hidden;
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          max-height: 85vh;
          overflow-y: auto;
        }

        .job-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 20px 26px 16px;
          border-bottom: 1px solid #f3f4f6;
        }

        .job-modal-title {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
          margin: 0;
          letter-spacing: -0.01em;
        }

        .job-modal-close {
          background: none;
          border: none;
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
          cursor: pointer;
          padding: 4px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          transition: background 0.15s ease, color 0.15s ease;
        }

        .job-modal-close:hover {
          color: #0f172a;
          background: #e5e7eb;
        }

        .job-modal-content {
          padding: 24px 26px 28px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .job-company {
          font-size: 20px;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }

        .job-position {
          font-size: 15px;
          font-weight: 600;
          color: #2563eb;
          margin: 0 0 6px 0;
        }

        .job-meta {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px 14px;
          padding: 14px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          background: #f9fafb;
        }

        .job-meta-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .job-meta-label {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          letter-spacing: 0.01em;
          text-transform: uppercase;
        }

        .job-meta-value {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
        }

        .job-description {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
          border-top: 1px dashed #e5e7eb;
          padding-top: 12px;
        }

        .job-description li {
          padding: 0;
          color: #1f2937;
          font-size: 14px;
          line-height: 1.6;
          position: relative;
          padding-left: 18px;
        }

        .job-description li:before {
          content: '';
          position: absolute;
          left: 0;
          top: 8px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #2563eb;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
