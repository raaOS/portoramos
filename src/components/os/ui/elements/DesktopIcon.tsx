'use client';

import React, { useState, useEffect } from 'react';
import { m, useMotionValue, type PanInfo, type Transition } from 'motion/react';
import { soundManager } from '../../utils/SoundManager';
import type { DesktopIconSize } from '@/types/about';
import { useDesktopIconHover } from './desktop-icon/useDesktopIconHover';
import { DesktopIconMedia } from './desktop-icon/DesktopIconMedia';
import { DesktopIconLabel } from './desktop-icon/DesktopIconLabel';

interface DesktopIconProps {
  id: string;
  label: string;
  icon?: React.ReactNode;
  imageUrl?: string;
  videoUrl?: string;
  onClick: () => void;
  x?: number;
  y?: number;
  size?: DesktopIconSize;
  aspectRatio?: number;
  children?: React.ReactNode;
  priority?: boolean;
  isMobile?: boolean;
  onPositionChange?: (id: string, x: number, y: number) => void;
  onFocus?: () => void;
  onSizeChange?: (size: DesktopIconSize) => void;

  isSelected?: boolean;
  onDoubleClick?: (e: React.MouseEvent) => void;
  activeScale?: number;
  activeTransition?: Transition;
}

export default function DesktopIcon({
  id,
  label,
  icon,
  imageUrl,
  videoUrl,
  onClick,
  x = 0,
  y = 0,
  size = 'medium',
  aspectRatio = 1,
  children,
  priority = false,
  isMobile = false,
  onPositionChange,
  onFocus,
  onSizeChange,

  isSelected = false,
  onDoubleClick,
  activeScale = 1,
  activeTransition,
}: DesktopIconProps) {
  const { hovering, previewActive, videoRef, handleMouseEnter, handleMouseLeave } =
    useDesktopIconHover({
      isMobile,
      videoUrl,
    });

  const iconX = useMotionValue(x);
  const iconY = useMotionValue(y);
  const [isDragging, setIsDragging] = useState(false);

  const requestSizeStep = (direction: 1 | -1) => {
    if (!onSizeChange) return;
    const sizes: DesktopIconSize[] = ['small', 'medium', 'large'];
    const currentIndex = sizes.indexOf(size);
    const nextIndex = Math.max(0, Math.min(sizes.length - 1, currentIndex + direction));
    const nextSize = sizes[nextIndex];
    if (nextSize !== size) onSizeChange(nextSize);
  };

  useEffect(() => {
    if (isDragging) return;
    iconX.set(x);
    iconY.set(y);
  }, [x, y, iconX, iconY, isDragging]);

  const baseHeight = {
    small: isMobile ? 58 : 64,
    medium: isMobile ? 72 : 80,
    large: isMobile ? 86 : 96,
  }[size];

  const handleDragStart = () => {
    setIsDragging(true);
    soundManager.play('drag');
  };

  const handleDragEnd = (info: PanInfo) => {
    setTimeout(() => setIsDragging(false), 50);

    if (onPositionChange) {
      onPositionChange(id, info.offset.x, info.offset.y);
      iconX.set(x);
      iconY.set(y);
    }
  };

  return (
    <m.div
      drag
      dragMomentum={false}
      dragElastic={isMobile ? 0 : 0.05}
      onDragStart={handleDragStart}
      onDragEnd={(_e, info) => {
        handleDragEnd(info);
      }}
      data-lenis-prevent
      onClick={(_e) => {
        if (!isDragging) {
          soundManager.play('click');
          onClick();
        }
      }}
      onDoubleClick={(e) => {
        if (!isDragging && onDoubleClick) {
          onDoubleClick(e);
        }
      }}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        x: iconX,
        y: iconY,
      }}
      layout={false}
      className={`group pointer-events-auto flex w-auto cursor-pointer touch-manipulation flex-col items-center gap-1 rounded-none outline-none will-change-transform ${isSelected ? 'z-50' : 'z-auto'}`}
      role="button"
      aria-label={label}
      tabIndex={0}
      onPointerDown={() => {
        onFocus?.();
      }}
      onFocus={() => {
        onFocus?.();
      }}
      onKeyDown={(e) => {
        if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
          e.preventDefault();
          onFocus?.();
          requestSizeStep(1);
          return;
        }

        if ((e.ctrlKey || e.metaKey) && (e.key === '-' || e.key === '_')) {
          e.preventDefault();
          onFocus?.();
          requestSizeStep(-1);
          return;
        }

        if ((e.key === 'Enter' || e.key === ' ') && !isDragging) {
          e.preventDefault();
          soundManager.play('click');
          onClick();
        }
      }}
      onMouseEnter={() => {
        handleMouseEnter();
      }}
      onMouseLeave={() => {
        handleMouseLeave();
      }}
    >
      {/* Icon Media Wrapper */}
      <m.div
        animate={{ scale: activeScale }}
        transition={activeTransition}
        style={{ transformOrigin: 'center center' }}
        className="relative"
      >
        <DesktopIconMedia
          label={label}
          icon={icon}
          imageUrl={imageUrl}
          videoUrl={videoUrl}
          baseHeight={baseHeight}
          aspectRatio={aspectRatio}
          isSelected={isSelected}
          priority={priority}
          isMobile={isMobile}
          hovering={hovering}
          previewActive={previewActive}
          videoRef={videoRef}
        >
          {children}
        </DesktopIconMedia>
      </m.div>

      {/* Label */}
      <DesktopIconLabel label={label} isSelected={isSelected} />
    </m.div>
  );
}
