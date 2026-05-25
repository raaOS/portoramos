import React from 'react';
import { X, Minus, Plus, Pin, Lock } from 'lucide-react';
import { m } from 'motion/react';
import { soundManager } from '../../utils/SoundManager';

interface WindowTitleBarProps {
  title: string;
  isMaximized: boolean;
  isPinned: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onTogglePin?: () => void;
  onDragStart: (e: React.PointerEvent<HTMLDivElement>) => void;
  onFocus?: () => void;
}

export function WindowTitleBar({
  title,
  isMaximized,
  isPinned,
  isAdmin,
  onClose,
  onMinimize,
  onMaximize,
  onTogglePin,
  onDragStart,
  onFocus,
}: WindowTitleBarProps) {
  const buttonTransition = {
    type: 'spring' as const,
    stiffness: 500,
    damping: 15,
    mass: 0.5,
  };

  const handleActionFocus = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (onFocus) onFocus();
  };

  return (
    <div
      onPointerDown={(e) => {
        if (!isMaximized && (!isPinned || isAdmin)) {
          onDragStart(e);
        }
      }}
      onDoubleClick={() => {
        if (isPinned && !isAdmin) return;
        onMaximize?.();
      }}
      data-testid="window-title-bar"
      className="relative z-50 flex h-8 shrink-0 cursor-default select-none items-center justify-between border-b border-[#D1D1D1] bg-[#EFEFEF] px-3 sm:h-7"
    >
      {/* Traffic Lights */}
      <div className="group mr-3 flex items-center gap-[8px]">
        {/* Close Button (Red) */}
        <m.button
          whileTap={{ scale: 0.85 }}
          transition={buttonTransition}
          onClick={(e) => {
            e.stopPropagation();
            soundManager.play('window-close');
            onClose();
          }}
          onPointerDown={handleActionFocus}
          onDoubleClick={(e) => e.stopPropagation()}
          className="relative flex h-6 min-h-[24px] w-6 min-w-[24px] items-center justify-center rounded-full p-0 outline-none transition-colors focus:outline-none focus:ring-0 active:outline-none"
          aria-label="Close window"
        >
          <div className="relative flex h-3 w-3 items-center justify-center rounded-full border border-[#E0443E] bg-[#FF5F57] transition-all hover:brightness-95 active:brightness-90">
            <X
              size={8}
              className="text-black/60 opacity-0 transition-opacity group-hover:opacity-100"
              strokeWidth={4}
            />
          </div>
        </m.button>

        {/* Minimize Button (Yellow) */}
        <m.button
          whileTap={{ scale: 0.85 }}
          transition={buttonTransition}
          onClick={(e) => {
            e.stopPropagation();
            if (onMinimize) onMinimize();
          }}
          onPointerDown={handleActionFocus}
          onDoubleClick={(e) => e.stopPropagation()}
          className="relative flex h-6 min-h-[24px] w-6 min-w-[24px] items-center justify-center rounded-full p-0 outline-none transition-colors focus:outline-none focus:ring-0 active:outline-none"
          aria-label="Minimize window"
        >
          <div className="relative flex h-3 w-3 items-center justify-center rounded-full border border-[#DDA335] bg-[#FEBC2E] transition-all hover:brightness-95 active:brightness-90">
            <Minus
              size={8}
              className="text-black/60 opacity-0 transition-opacity group-hover:opacity-100"
              strokeWidth={4}
            />
          </div>
        </m.button>

        {/* Maximize Button (Green) */}
        <m.button
          whileTap={{ scale: 0.85 }}
          transition={buttonTransition}
          onClick={(e) => {
            e.stopPropagation();
            if (onMaximize) onMaximize();
          }}
          onPointerDown={handleActionFocus}
          onDoubleClick={(e) => e.stopPropagation()}
          className="relative flex h-6 min-h-[24px] w-6 min-w-[24px] items-center justify-center rounded-full p-0 outline-none transition-colors focus:outline-none focus:ring-0 active:outline-none"
          aria-label="Maximize window"
        >
          <div className="relative flex h-3 w-3 items-center justify-center rounded-full border border-[#22AA32] bg-[#28C840] transition-all hover:brightness-95 active:brightness-90">
            <Plus
              size={8}
              className="text-black/60 opacity-0 transition-opacity group-hover:opacity-100"
              strokeWidth={4}
            />
          </div>
        </m.button>
      </div>

      {/* Title Indicator */}
      <div className="pointer-events-none absolute left-1/2 flex w-[60%] -translate-x-1/2 items-center justify-center gap-1.5 opacity-80">
        <span className="block w-full truncate text-center text-xs font-semibold tracking-wide text-gray-700">
          {title}
        </span>
      </div>

      {/* Top Right Pin/Lock Button - Admin Only */}
      {isAdmin && onTogglePin && (
        <div className="flex items-center gap-2">
          <m.button
            whileTap={{ scale: 0.85 }}
            transition={buttonTransition}
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin();
            }}
            onPointerDown={handleActionFocus}
            onDoubleClick={(e) => e.stopPropagation()}
            className={`rounded p-1 outline-none transition-colors focus:outline-none focus:ring-0 ${isPinned ? 'text-orange-600' : 'text-gray-400'}`}
            title={isPinned ? 'Unlock Position' : 'Pin/Lock Position'}
          >
            {isPinned ? <Lock size={12} /> : <Pin size={12} />}
          </m.button>
        </div>
      )}
    </div>
  );
}
