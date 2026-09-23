'use client';

import React from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { Play, Pause, ZoomIn } from 'lucide-react';
import { formatVideoTime } from '../utils/videoTrimmerUtils';

interface VideoTimelineControlsProps {
  isPlaying: boolean;
  range: [number, number];
  duration: number;
  zoom: number;
  onTogglePlay: () => void;
  onSliderChange: (value: number | number[]) => void;
  onZoomChange: (zoom: number) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export function VideoTimelineControls({
  isPlaying,
  range,
  duration,
  zoom,
  onTogglePlay,
  onSliderChange,
  onZoomChange,
  onCancel,
  onConfirm,
}: VideoTimelineControlsProps) {
  return (
    <div className="shrink-0 space-y-4 border-t bg-gray-50 p-4">
      <div className="flex items-end gap-4">
        {/* Play Button */}
        <button
          onClick={onTogglePlay}
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
              {formatVideoTime(range[0])} - {formatVideoTime(range[1])} / {formatVideoTime(duration)}
            </span>
          </div>
          <div className="px-1">
            <Slider
              range
              min={0}
              max={duration || 10}
              step={0.1}
              value={range}
              onChange={onSliderChange as (value: number | number[]) => void}
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
            onChange={(e) => onZoomChange(Number(e.target.value))}
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
            onClick={onConfirm}
            className="rounded-md bg-violet-600 px-6 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            Process Video
          </button>
        </div>
      </div>
    </div>
  );
}
