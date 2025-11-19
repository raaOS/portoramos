'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useNavbarVisibility } from '@/contexts/NavbarVisibilityContext'

interface SwayingGalleryProps {
  images: Array<{
    src: string
    alt: string
    title?: string
    description?: string
    duration?: string
    jobDetails?: string[]
  }>
  className?: string
}

export default function SwayingGallery({ 
  images, 
  className = ''
}: SwayingGalleryProps) {
  const galleryRef = useRef<HTMLDivElement>(null)
  const [isActive, setIsActive] = useState(false)
  const [selectedJob, setSelectedJob] = useState<{
    year: string
    duration: string
    company: string
    position: string
    description: string[]
  } | null>(null)
  const { hideNavbar, showNavbar } = useNavbarVisibility()

  useEffect(() => {
    const gallery = galleryRef.current
    if (!gallery) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsActive(entry.isIntersecting)
        })
      },
      {
        threshold: 0.2,
      }
    )

    observer.observe(gallery)

    return () => {
      observer.disconnect()
    }
  }, [])

  const handlePhotoClick = (image: any) => {
    if (image.jobDetails) {
      hideNavbar()
      setSelectedJob({
        year: image.title || '',
        duration: image.duration || '',
        company: image.description?.split(' - ')[0] || '',
        position: image.description?.split(' - ')[1] || '',
        description: image.jobDetails
      })
    }
  }


  const closeModal = () => {
    showNavbar()
    setSelectedJob(null)
  }

  return (
    <div className={`swaying-gallery-wrapper ${className}`}>
      <div
        ref={galleryRef}
        className={`gallery-container ${isActive ? 'active' : ''}`}
      >
        {images.map((image, index) => (
          <div 
            key={index} 
            className="gallery-item clickable"
            onClick={() => handlePhotoClick(image)}
          >
            <Image 
              src={image.src} 
              alt={image.alt}
              width={200}
              height={200}
              className="gallery-image"
            />
            <div className="gallery-pin" />
                {(image.title || image.description) && (
                  <div className="gallery-caption">
                    {image.title && <h3 className="gallery-title">{image.title}</h3>}
                    {image.description && <p className="gallery-description">{image.description}</p>}
                    <p className="gallery-click-hint">klik untuk lihat detail jobdesk</p>
                  </div>
                )}
          </div>
        ))}
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="job-modal-overlay" onClick={closeModal}>
          <div className="job-modal" onClick={(e) => e.stopPropagation()}>
            <div className="job-modal-header">
              <div>
                <h2 className="job-modal-title">{selectedJob.year}</h2>
                <p className="job-modal-duration">{selectedJob.duration}</p>
              </div>
              <button className="job-modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="job-modal-content">
              <h3 className="job-company">{selectedJob.company}</h3>
              <h4 className="job-position">{selectedJob.position}</h4>
              <ul className="job-description">
                {selectedJob.description.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .gallery-container {
          display: grid !important;
          grid-template-columns: repeat(3, 1fr) !important;
          grid-template-rows: repeat(2, 1fr) !important;
          gap: 10px !important;
          padding: 0px !important;
          max-width: 100% !important;
          margin: 0 auto !important;
          width: 100% !important;
          height: 500px !important;
        }
        
        .gallery-item {
          position: relative !important;
          background: white !important;
          border-radius: 4px !important;
          padding: 0px !important;
          box-shadow: none !important;
          border: 1px solid #000 !important;
          transform-origin: center 0.18rem !important;
          will-change: transform !important;
          overflow: hidden !important;
          width: 100% !important;
          height: 100% !important;
          aspect-ratio: 1 / 1 !important;
          display: flex !important;
          flex-direction: column !important;
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
          animation: swing-left 0.8s cubic-bezier(0.4, 0, 0.6, 1) infinite alternate !important;
          animation-delay: 0s !important;
        }
        .gallery-container.active .gallery-item:nth-child(2) {
          animation: swing-right 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite alternate !important;
          animation-delay: 0.1s !important;
        }
        .gallery-container.active .gallery-item:nth-child(3) {
          animation: swing-left 0.9s cubic-bezier(0.4, 0, 0.6, 1) infinite alternate !important;
          animation-delay: 0.2s !important;
        }
        .gallery-container.active .gallery-item:nth-child(4) {
          animation: swing-right 1.1s cubic-bezier(0.4, 0, 0.6, 1) infinite alternate !important;
          animation-delay: 0.3s !important;
        }
        .gallery-container.active .gallery-item:nth-child(5) {
          animation: swing-left 0.7s cubic-bezier(0.4, 0, 0.6, 1) infinite alternate !important;
          animation-delay: 0.4s !important;
        }
        .gallery-container.active .gallery-item:nth-child(6) {
          animation: swing-right 1.3s cubic-bezier(0.4, 0, 0.6, 1) infinite alternate !important;
          animation-delay: 0.5s !important;
        }
        
        .gallery-image {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          border-radius: 1px !important;
          transition: transform 0.2s ease !important;
          flex: 1 !important;
        }
        
        .gallery-item:hover .gallery-image {
          transform: scale(1.05);
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
        }
        
        .gallery-caption {
          position: absolute !important;
          bottom: 0 !important;
          left: 0 !important;
          right: 0 !important;
          text-align: center !important;
          padding: 2px 4px 10px 4px !important;
          background: rgba(255, 255, 255, 0.95) !important;
          border-radius: 0 0 4px 4px !important;
          margin: 0 !important;
          z-index: 10 !important;
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
          margin: 0 0 15px 0;
          text-transform: none;
          line-height: 1.1;
        }
        
        .gallery-click-hint {
          color: #999;
          font-size: 7px;
          margin: 0;
          text-transform: none;
          line-height: 1.1;
          font-style: italic;
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
            max-width: 100%;
            gap: 10px;
            padding: 0px;
            width: 100%;
            height: 500px;
            margin: 0 auto;
          }
          
          .gallery-item {
            aspect-ratio: 1 / 1 !important;
            padding: 0px;
            border-radius: 4px;
            box-shadow: none !important;
            border: 1px solid #000 !important;
          }
        }
        
        @media (max-width: 768px) {
          .gallery-container {
            max-width: 400px;
            gap: 10px;
            padding: 0px;
            width: 400px;
            height: 480px;
            margin: 0;
          }
          
          .gallery-item {
            aspect-ratio: 1 / 1 !important;
            padding: 0px;
            border-radius: 4px;
            box-shadow: none !important;
            border: 1px solid #000 !important;
          }
        }
        
        @media (max-width: 480px) {
          .gallery-container {
            max-width: 300px;
            gap: 8px;
            padding: 0px;
            width: 300px;
            height: 360px;
            margin: 0;
          }
          
          .gallery-item {
            aspect-ratio: 1 / 1 !important;
            padding: 0px;
            border-radius: 4px;
            box-shadow: none !important;
            border: 1px solid #000 !important;
          }
        }

        /* Modal Styles */
        .job-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .job-modal {
          background: white;
          border-radius: 12px;
          max-width: 500px;
          width: 100%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        .job-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .job-modal-title {
          font-size: 24px;
          font-weight: bold;
          color: #1f2937;
          margin: 0;
        }

        .job-modal-duration {
          font-size: 14px;
          color: #6b7280;
          margin: 4px 0 0 0;
          font-style: italic;
        }

        .job-modal-close {
          background: none;
          border: none;
          font-size: 28px;
          color: #6b7280;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .job-modal-close:hover {
          color: #374151;
        }

        .job-modal-content {
          padding: 24px;
        }

        .job-company {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 8px 0;
        }

        .job-position {
          font-size: 16px;
          font-weight: 500;
          color: #6b7280;
          margin: 0 0 20px 0;
        }

        .job-description {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .job-description li {
          padding: 8px 0;
          border-bottom: 1px solid #f3f4f6;
          color: #374151;
          font-size: 14px;
          line-height: 1.5;
        }

        .job-description li:last-child {
          border-bottom: none;
        }

        .job-description li:before {
          content: "•";
          color: #3b82f6;
          font-weight: bold;
          margin-right: 8px;
        }

      `}</style>
    </div>
  )
}
