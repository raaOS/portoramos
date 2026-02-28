'use client';

import React, { useState, useRef, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Smile } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamic import Lottie untuk mengurangi bundle size
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

// Interface untuk emoji item
interface EmojiItem {
  unicode: string;
  char: string;
  name: string;
  category: string;
}

// Interface untuk props
interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

// Data emoji populer yang tersedia di Google Noto Animation
// Format: https://fonts.gstatic.com/s/e/notoemoji/latest/{unicode}/lottie.json
const POPULAR_EMOJIS: EmojiItem[] = [
  // Wajah & Emosi
  { unicode: '1f602', char: '😂', name: 'joy', category: 'emosi' },
  { unicode: '2764', char: '❤️', name: 'heart', category: 'emosi' },
  { unicode: '1f525', char: '🔥', name: 'fire', category: 'emosi' },
  { unicode: '1f44d', char: '👍', name: 'thumbs up', category: 'emosi' },
  { unicode: '1f60d', char: '😍', name: 'heart eyes', category: 'emosi' },
  { unicode: '1f64f', char: '🙏', name: 'pray', category: 'emosi' },
  { unicode: '1f44f', char: '👏', name: 'clap', category: 'emosi' },
  { unicode: '1f62d', char: '😭', name: 'cry', category: 'emosi' },
  { unicode: '1f618', char: '😘', name: 'kiss', category: 'emosi' },
  { unicode: '1f914', char: '🤔', name: 'thinking', category: 'emosi' },
  { unicode: '1f928', char: '🤨', name: 'raised eyebrow', category: 'emosi' },
  { unicode: '1f60e', char: '😎', name: 'cool', category: 'emosi' },
  { unicode: '1f921', char: '🤡', name: 'clown', category: 'emosi' },
  { unicode: '1f47b', char: '👻', name: 'ghost', category: 'emosi' },
  { unicode: '1f4a9', char: '💩', name: 'poop', category: 'emosi' },
  
  // Hewan
  { unicode: '1f436', char: '🐶', name: 'dog', category: 'hewan' },
  { unicode: '1f431', char: '🐱', name: 'cat', category: 'hewan' },
  { unicode: '1f43b', char: '🐻', name: 'bear', category: 'hewan' },
  { unicode: '1f98a', char: '🦊', name: 'fox', category: 'hewan' },
  { unicode: '1f42f', char: '🐯', name: 'tiger', category: 'hewan' },
  { unicode: '1f43c', char: '🐼', name: 'panda', category: 'hewan' },
  
  // Makanan
  { unicode: '1f389', char: '🎉', name: 'party', category: 'makanan' },
  { unicode: '1f382', char: '🎂', name: 'cake', category: 'makanan' },
  { unicode: '1f355', char: '🍕', name: 'pizza', category: 'makanan' },
  { unicode: '1f354', char: '🍔', name: 'burger', category: 'makanan' },
  { unicode: '2615', char: '☕', name: 'coffee', category: 'makanan' },
  { unicode: '1f37a', char: '🍺', name: 'beer', category: 'makanan' },
  
  // Aktivitas & Objek
  { unicode: '1f3b5', char: '🎵', name: 'music', category: 'objek' },
  { unicode: '1f4a1', char: '💡', name: 'lightbulb', category: 'objek' },
  { unicode: '1f381', char: '🎁', name: 'gift', category: 'objek' },
  { unicode: '1f4af', char: '💯', name: '100', category: 'objek' },
  { unicode: '1f680', char: '🚀', name: 'rocket', category: 'objek' },
  { unicode: '1f4e2', char: '📢', name: 'loudspeaker', category: 'objek' },
  
  // Tangan
  { unicode: '1f44b', char: '👋', name: 'wave', category: 'tangan' },
  { unicode: '270c', char: '✌️', name: 'victory', category: 'tangan' },
  { unicode: '1f44c', char: '👌', name: 'ok', category: 'tangan' },
  { unicode: '1f44f', char: '👏', name: 'clap', category: 'tangan' },
  { unicode: '1f450', char: '👐', name: 'open hands', category: 'tangan' },
  { unicode: '1f64c', char: '🙌', name: 'raised hands', category: 'tangan' },
  
  // Alam
  { unicode: '2600', char: '☀️', name: 'sun', category: 'alam' },
  { unicode: '1f319', char: '🌙', name: 'moon', category: 'alam' },
  { unicode: '2b50', char: '⭐', name: 'star', category: 'alam' },
  { unicode: '1f327', char: '🌧️', name: 'rain', category: 'alam' },
  { unicode: '26a1', char: '⚡', name: 'lightning', category: 'alam' },
  { unicode: '1f308', char: '🌈', name: 'rainbow', category: 'alam' },
];

// Kategori yang tersedia
const CATEGORIES = [
  { id: 'emosi', label: '😀', name: 'Emosi' },
  { id: 'hewan', label: '🐶', name: 'Hewan' },
  { id: 'makanan', label: '🍔', name: 'Makanan' },
  { id: 'tangan', label: '👋', name: 'Tangan' },
  { id: 'objek', label: '💡', name: 'Objek' },
  { id: 'alam', label: '☀️', name: 'Alam' },
];

// Komponen untuk animated emoji preview
const AnimatedEmojiPreview = ({ unicode }: { unicode: string }) => {
  const [animationData, setAnimationData] = useState<unknown>(null);
  
  useEffect(() => {
    const loadAnimation = async () => {
      try {
        const response = await fetch(
          `https://fonts.gstatic.com/s/e/notoemoji/latest/${unicode}/lottie.json`
        );
        const data = await response.json();
        setAnimationData(data);
      } catch {
        // Jika gagal load, biarkan null (akan fallback ke static emoji)
      }
    };
    loadAnimation();
  }, [unicode]);
  
  if (!animationData) {
    return null;
  }
  
  return (
    <Lottie
      animationData={animationData}
      loop={true}
      autoplay={true}
      style={{ width: 40, height: 40 }}
    />
  );
};

export default function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('emosi');
  const [hoveredEmoji, setHoveredEmoji] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Filter emoji berdasarkan kategori
  const filteredEmojis = POPULAR_EMOJIS.filter(
    (emoji) => emoji.category === activeCategory
  );
  
  // Handle click outside untuk close picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  const handleEmojiClick = (emojiChar: string) => {
    onEmojiSelect(emojiChar);
    setIsOpen(false);
  };
  
  return (
    <div ref={containerRef} className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-[#00a884]/10 transition-colors focus:outline-none"
        aria-label="Open emoji picker"
      >
        <Smile className="w-6 h-6 text-[#8696a0] hover:text-[#00a884] transition-colors" />
      </button>
      
      {/* Emoji Picker Panel */}
      <AnimatePresence>
        {isOpen && (
          <m.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full right-0 mb-2 bg-white dark:bg-[#202c33] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
            style={{ width: '320px', maxHeight: '400px' }}
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
            <div className="p-3 overflow-y-auto" style={{ maxHeight: '280px' }}>
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
                    {/* Static Emoji (fallback) */}
                    <span className="text-2xl">{emoji.char}</span>
                    
                    {/* Animated Preview on Hover */}
                    {hoveredEmoji === emoji.unicode && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-[#202c33] rounded-lg z-10">
                        <AnimatedEmojiPreview unicode={emoji.unicode} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-3 py-2 bg-gray-50 dark:bg-[#1f2c34] border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                Animated by Google Noto
              </p>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
