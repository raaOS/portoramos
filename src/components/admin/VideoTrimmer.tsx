import React, { useState, useRef, useEffect, useCallback } from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import Cropper, { Area } from 'react-easy-crop';
import { Play, Pause, ZoomIn, Maximize2 } from 'lucide-react';

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
  }, [range]); // Run when range changes to check if we need to expand it to full duration

  const onMediaLoaded = (mediaSize: MediaSize) => {
    // Ensure ref is captured
    if (!videoRef.current && containerRef.current) {
      videoRef.current = containerRef.current.querySelector('video');
    }

    // Initialize duration
    if (videoRef.current) {
      const vidDur = videoRef.current.duration;
      if (!Number.isNaN(vidDur)) {
        setDuration(vidDur);
        if (range[1] === 10) setRange([0, vidDur]);
      }
    }

    // Initialize Aspect Ratio
    if (mediaSize.naturalWidth && mediaSize.naturalHeight) {
      const natAspect = mediaSize.naturalWidth / mediaSize.naturalHeight;
      setNaturalAspect(natAspect);

      // Set initial aspect to Natural (Original) if not set
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

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Aspect Ratio Options
  // We define this inside render to access 'naturalAspect'
  const aspectOptions = [
    { label: 'Free', value: undefined },
    { label: 'Original', value: naturalAspect },
    { label: '16:9', value: 16 / 9 },
    { label: '9:16', value: 9 / 16 },
    { label: '4:5', value: 4 / 5 },
    { label: '1:1', value: 1 / 1 },
  ];

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

          {/* Controls Overlay (Top Right) */}
          <div className="absolute right-4 top-4 z-10 flex flex-col gap-2 rounded bg-white p-2 text-xs">
            <span className="flex items-center gap-1 font-bold uppercase text-gray-500">
              <Maximize2 size={12} /> Ratio
            </span>
            <div className="flex flex-col gap-1">
              {aspectOptions.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setAspect(opt.value)}
                  className={`rounded border px-2 py-1 transition-colors ${
                    // Complex check for 'Free' vs 'Original' when naturalAspect might match others
                    aspect === opt.value && (opt.value !== undefined || aspect === undefined)
                      ? 'border-violet-600 bg-violet-600 text-white'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

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
        <div className="shrink-0 space-y-4 border-t bg-gray-50 p-4">
          <div className="flex items-end gap-4">
            {/* Play Button */}
            <button
              onClick={togglePlay}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600 transition-colors hover:bg-violet-200"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause size={24} fill="currentColor" />
              ) : (
                <Play size={24} fill="currentColor" className="ml-1" />
              )}
            </button>

            {/* Slider & Info */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-500">
                <span>Timeline</span>
                <span>
                  {formatTime(range[0])} - {formatTime(range[1])} / {formatTime(duration)}
                </span>
              </div>
              <div className="px-1">
                <Slider
                  range
                  min={0}
                  max={duration || 10}
                  step={0.1}
                  value={range}
                  onChange={handleSliderChange as (value: number | number[]) => void}
                  trackStyle={[{ backgroundColor: '#7c3aed', height: 6 }]}
                  handleStyle={[
                    {
                      borderColor: '#7c3aed',
                      backgroundColor: '#fff',
                      opacity: 1,
                      height: 18,
                      width: 18,
                      marginTop: -6,
                      cursor: 'ew-resize',
                    },
                    {
                      borderColor: '#7c3aed',
                      backgroundColor: '#fff',
                      opacity: 1,
                      height: 18,
                      width: 18,
                      marginTop: -6,
                      cursor: 'ew-resize',
                    },
                  ]}
                  railStyle={{ backgroundColor: '#d1d5db', height: 6 }}
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-2">
            <div className="flex items-center gap-2">
              <ZoomIn size={16} className="text-gray-400" />
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="h-1.5 w-32 cursor-pointer appearance-none rounded-lg bg-gray-300"
                title="Zoom"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => onConfirm(range[0], range[1], croppedAreaPixels)}
                className="rounded-md bg-violet-600 px-6 py-2 text-sm font-medium text-white hover:bg-violet-700"
              >
                Process Video
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
