'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface LoveButtonProps {
  projectId: string;
  initialLikes?: number;
  initialLoved?: boolean;
  className?: string;
}

export default function LoveButton({ 
  projectId, 
  initialLikes = 0, 
  initialLoved = false,
  className = '' 
}: LoveButtonProps) {
  const [isLoved, setIsLoved] = useState(initialLoved);
  const [likes, setLikes] = useState(initialLikes);
  const [isAnimating, setIsAnimating] = useState(false);

  // Load saved state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(`love-${projectId}`);
    if (savedState) {
      const { isLoved: savedLoved, likes: savedLikes } = JSON.parse(savedState);
      setIsLoved(savedLoved);
      setLikes(savedLikes);
    }
  }, [projectId]);

  const handleLove = async () => {
    if (isAnimating) return;

    setIsAnimating(true);
    
    const newLoved = !isLoved;
    const newLikes = newLoved ? likes + 1 : Math.max(0, likes - 1);
    
    // Optimistic update
    setIsLoved(newLoved);
    setLikes(newLikes);
    
    // Save to localStorage
    localStorage.setItem(`love-${projectId}`, JSON.stringify({
      isLoved: newLoved,
      likes: newLikes
    }));

    // Here you could also send to your API
    try {
      // await fetch(`/api/projects/${projectId}/like`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ loved: newLoved })
      // });
    } catch (error) {
      console.error('Failed to update like:', error);
      // Revert on error
      setIsLoved(!newLoved);
      setLikes(likes);
    }

    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <motion.button
      onClick={handleLove}
      disabled={isAnimating}
      className={`
        flex items-center space-x-2 px-4 py-2 rounded-full border transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${isLoved 
          ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100 focus:ring-red-500' 
          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 focus:ring-gray-500'
        }
        ${isAnimating ? 'cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={isLoved ? 'Unlike this project' : 'Like this project'}
    >
      <motion.div
        animate={isLoved ? { scale: [1, 1.3, 1] } : {}}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        <svg 
          className={`w-5 h-5 transition-colors duration-200 ${
            isLoved ? 'text-red-500' : 'text-gray-400'
          }`}
          fill={isLoved ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
          />
        </svg>
        
        {/* Floating hearts animation */}
        {isLoved && isAnimating && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 1, 0], 
              scale: [0, 1, 1.5],
              y: [0, -20, -40]
            }}
            transition={{ duration: 0.6 }}
          >
            <svg className="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </motion.div>
        )}
      </motion.div>
      
      <span className="text-sm font-medium">
        {likes > 0 ? likes : 'Like'}
      </span>
    </motion.button>
  );
}
