'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { POPULAR_EMOJIS, CATEGORIES } from '../data/EmojiData';
import AnimatedEmojiPreview from './AnimatedEmojiPreview';

interface PickerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onEmojiSelect: (emoji: string) => void;
  triggerRect: DOMRect | null;
}

export default function PickerPanel({
  isOpen,
  onClose,
  onEmojiSelect,
  triggerRect,
}: PickerPanelProps) {
  const [activeCategory, setActiveCategory] = useState('emosi');
  const [hoveredEmoji, setHoveredEmoji] = useState<string | null>(null);

  // Handle click outside and Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-emoji-picker]')) onClose();
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const filteredEmojis = POPULAR_EMOJIS.filter((emoji) => emoji.category === activeCategory);

  const handleEmojiClick = useCallback(
    (emojiChar: string) => {
      onEmojiSelect(emojiChar);
      onClose();
    },
    [onEmojiSelect, onClose]
  );

  if (!triggerRect || typeof window === 'undefined') return null;

  const pickerWidth = 320;
  const windowWidth = window.innerWidth;
  let left = triggerRect.left + triggerRect.width / 2 - pickerWidth / 2;

  if (left < 8) left = 8;
  if (left + pickerWidth > windowWidth - 8) {
    left = windowWidth - pickerWidth - 8;
  }
  const bottom = window.innerHeight - triggerRect.top + 8;

  const panel = (
    <AnimatePresence>
      {isOpen && (
        <>
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/20"
            onClick={onClose}
          />

          <m.div
            data-emoji-picker
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[9999] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-[#202c33]"
            style={{
              width: `${pickerWidth}px`,
              maxHeight: '400px',
              left: `${left}px`,
              bottom: `${bottom}px`,
            }}
          >
            {/* Category Tabs */}
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-2 py-2 dark:border-gray-700 dark:bg-[#1f2c34]">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`rounded-lg p-2 text-lg transition-all ${
                    activeCategory === cat.id
                      ? 'bg-[#00a884] text-white shadow-sm'
                      : 'hover:bg-gray-200 dark:hover:bg-[#2a3942]'
                  }`}
                  title={cat.name}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Emoji Grid */}
            <div className="scrollbar-hide overflow-y-auto p-3" style={{ maxHeight: '280px' }}>
              <div className="grid grid-cols-6 gap-2">
                {filteredEmojis.map((emoji) => (
                  <button
                    key={emoji.unicode}
                    type="button"
                    onClick={() => handleEmojiClick(emoji.char)}
                    onMouseEnter={() => setHoveredEmoji(emoji.unicode)}
                    onMouseLeave={() => setHoveredEmoji(null)}
                    className="relative flex transform items-center justify-center rounded-lg p-2 transition-all hover:scale-110 hover:bg-gray-100 dark:hover:bg-[#2a3942]"
                    title={emoji.name}
                  >
                    <span className="text-2xl">{emoji.char}</span>
                    {hoveredEmoji === emoji.unicode && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white dark:bg-[#202c33]">
                        <AnimatedEmojiPreview unicode={emoji.unicode} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 bg-gray-50 px-3 py-2 text-center dark:border-gray-700 dark:bg-[#1f2c34]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 opacity-60 dark:text-gray-400">
                Animated by Google Noto
              </p>
            </div>
          </m.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(panel, document.body);
}
