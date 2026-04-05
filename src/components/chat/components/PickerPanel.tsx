"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { POPULAR_EMOJIS, CATEGORIES } from '../data/EmojiData';
import AnimatedEmojiPreview from './AnimatedEmojiPreview';

interface PickerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onEmojiSelect: (emoji: string) => void;
  triggerRect: DOMRect | null;
}

export default function PickerPanel({ isOpen, onClose, onEmojiSelect, triggerRect }: PickerPanelProps) {
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
  
  const filteredEmojis = POPULAR_EMOJIS.filter(
    (emoji) => emoji.category === activeCategory
  );
  
  const handleEmojiClick = useCallback((emojiChar: string) => {
    onEmojiSelect(emojiChar);
    onClose();
  }, [onEmojiSelect, onClose]);
  
  if (!triggerRect || typeof window === 'undefined') return null;
  
  const pickerWidth = 320;
  const windowWidth = window.innerWidth;
  let left = triggerRect.left + (triggerRect.width / 2) - (pickerWidth / 2);
  
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
            className="fixed inset-0 bg-black/20 z-[9998]"
            onClick={onClose}
          />
          
          <m.div
            data-emoji-picker
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className="fixed bg-white dark:bg-[#202c33] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-[9999]"
            style={{ 
              width: `${pickerWidth}px`, 
              maxHeight: '400px',
              left: `${left}px`,
              bottom: `${bottom}px`,
            }}
          >
            {/* Category Tabs */}
            <div className="flex items-center justify-between px-2 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1f2c34]">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`p-2 rounded-lg text-lg transition-all ${
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
            <div className="p-3 overflow-y-auto scrollbar-hide" style={{ maxHeight: '280px' }}>
              <div className="grid grid-cols-6 gap-2">
                {filteredEmojis.map((emoji) => (
                  <button
                    key={emoji.unicode}
                    type="button"
                    onClick={() => handleEmojiClick(emoji.char)}
                    onMouseEnter={() => setHoveredEmoji(emoji.unicode)}
                    onMouseLeave={() => setHoveredEmoji(null)}
                    className="relative flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a3942] transition-all transform hover:scale-110"
                    title={emoji.name}
                  >
                    <span className="text-2xl">{emoji.char}</span>
                    {hoveredEmoji === emoji.unicode && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-[#202c33] rounded-lg z-10">
                        <AnimatedEmojiPreview unicode={emoji.unicode} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="px-3 py-2 bg-gray-50 dark:bg-[#1f2c34] border-t border-gray-200 dark:border-gray-700 text-center">
              <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500 dark:text-gray-400 opacity-60">
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
