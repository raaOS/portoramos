'use client';

/**
 * Video Trimmer — Komponen trim dan crop video di sisi client.
 *
 * Menyediakan UI untuk memotong durasi video dan crop aspect ratio
 * sebelum diupload ke R2, menggunakan rc-slider dan react-easy-crop.
 *
 * @module components/admin/VideoTrimmer
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Play } from 'lucide-react';
import { AspectRatioSelector } from './video-trimmer/components/AspectRatioSelector';
import { VideoTimelineControls } from './video-trimmer/components/VideoTimelineControls';

interface VideoTrimmerProps {
  file: File;
  onConfirm: (start: number, end: number, crop: Area | null) => void;
  onCancel: () => void;
}

interface MediaSize {
  width: number;
  height: number;
  naturalWidth: number;
  naturalHeight: number;
}

export default function VideoTrimmer({ file, onConfirm, onCancel }: VideoTrimmerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Playback State
  const [duration, setDuration] = useState(0);
  const [range, setRange] = useState<[number, number]>([0, 10]);
  const [isPlaying, setIsPlaying] = useState(false);

  // Crop State
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [naturalAspect, setNaturalAspect] = useState<number | undefined>(undefined);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // Internal Video Source
  const [videoSrc, setVideoSrc] = useState<string>('');

  // Blob URL Lifecycle
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    requestAnimationFrame(() => setVideoSrc(url));

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  // Safety check for video element ref
  useEffect(() => {
    if (containerRef.current) {
      const videoEl = containerRef.current.querySelector('video');
      if (videoEl) {
        videoRef.current = videoEl;
        if (!Number.isNaN(videoEl.duration)) {
          const dur = videoEl.duration;
          requestAnimationFrame(() => {
            setDuration(dur);
            if (range[1] === 10 && dur > 0) setRange([0, dur]);
          });
        }
      }
    }
  }, [range]);

  const onMediaLoaded = (mediaSize: MediaSize) => {
    if (!videoRef.current && containerRef.current) {
      videoRef.current = containerRef.current.querySelector('video');
    }

    if (videoRef.current) {
      const vidDur = videoRef.current.duration;
      if (!Number.isNaN(vidDur)) {
        setDuration(vidDur);
        if (range[1] === 10) setRange([0, vidDur]);
      }
    }

    if (mediaSize.naturalWidth && mediaSize.naturalHeight) {
      const natAspect = mediaSize.naturalWidth / mediaSize.naturalHeight;
      setNaturalAspect(natAspect);

      if (aspect === undefined) {
        setAspect(natAspect);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      if (currentTime >= range[1]) {
        videoRef.current.currentTime = range[0];
        if (isPlaying) {
          videoRef.current.play();
        }
      }
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        if (videoRef.current.currentTime < range[0] || videoRef.current.currentTime >= range[1]) {
          videoRef.current.currentTime = range[0];
        }
        videoRef.current.play().catch((e) => console.error('Play failed', e));
        setIsPlaying(true);
      }
    }
  };

  const handleSliderChange = (value: number | number[]) => {
    if (Array.isArray(value)) {
      const [start, end] = value;
      setRange([start, end]);
      if (videoRef.current) {
        const tolerance = 0.1;
        if (!isPlaying) {
          if (Math.abs(range[0] - start) > tolerance) {
            videoRef.current.currentTime = start;
          } else if (Math.abs(range[1] - end) > tolerance) {
            videoRef.current.currentTime = end;
          }
        }
      }
    }
  };

  const onCropCompleteEvent = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4 duration-200">
      <div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-white">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b p-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Edit Video</h3>
            <p className="text-xs text-gray-500">Trim duration and Crop area</p>
          </div>

          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        {/* Main Area: Cropper */}
        <div ref={containerRef} className="group relative flex-1 overflow-hidden bg-black">
          <Cropper
            video={videoSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onCropComplete={onCropCompleteEvent}
            onZoomChange={setZoom}
            onMediaLoaded={onMediaLoaded}
            mediaProps={
              {
                playsInline: true,
                crossOrigin: 'anonymous',
                onTimeUpdate: handleTimeUpdate,
                onEnded: () => setIsPlaying(false),
                onClick: togglePlay,
              } as React.VideoHTMLAttributes<HTMLVideoElement>
            }
          />

          <AspectRatioSelector
            aspect={aspect}
            naturalAspect={naturalAspect}
            onSelectAspect={setAspect}
          />

          {/* Centered Play Control */}
          {!isPlaying && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/40">
                <Play className="ml-1 h-8 w-8 text-white" fill="currentColor" />
              </div>
            </div>
          )}
        </div>

        {/* Bottom Panel */}
        <VideoTimelineControls
          isPlaying={isPlaying}
          range={range}
          duration={duration}
          zoom={zoom}
          onTogglePlay={togglePlay}
          onSliderChange={handleSliderChange}
          onZoomChange={setZoom}
          onCancel={onCancel}
          onConfirm={() => onConfirm(range[0], range[1], croppedAreaPixels)}
        />
      </div>
    </div>
  );
}
