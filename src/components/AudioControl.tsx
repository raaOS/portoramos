'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface AudioControlProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  className?: string;
}

export default function AudioControl({ videoRef, className = '' }: AudioControlProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const node = videoRef?.current;
    if (!node) return;

    setIsMuted(node.muted);
    
    // Listen for volume/mute changes from external sources
    const handleVolumeChange = () => {
      setIsMuted(node.muted);
    };
    
    // Add event listeners for volume changes
    node.addEventListener('volumechange', handleVolumeChange);
    node.addEventListener('loadedmetadata', handleVolumeChange);
    node.addEventListener('play', handleVolumeChange);
    node.addEventListener('ended', handleVolumeChange);
    
    return () => {
      node.removeEventListener('volumechange', handleVolumeChange);
      node.removeEventListener('loadedmetadata', handleVolumeChange);
      node.removeEventListener('play', handleVolumeChange);
      node.removeEventListener('ended', handleVolumeChange);
    };
  }, [videoRef]);

  const toggleMute = () => {
    if (videoRef?.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  return (
    <motion.button
      onClick={toggleMute}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        ${className.includes('!relative') ? 'relative' : 'fixed top-4 right-4 z-50'}
        ${className.includes('!relative') ? 'bg-transparent' : 'bg-black/80 backdrop-blur-sm'}
        text-gray-700 rounded-full p-2
        transition-all duration-200
        hover:bg-gray-100 hover:scale-110
        focus:outline-none focus:ring-2 focus:ring-blue-500
        ${className}
      `}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      aria-label={isMuted ? 'Unmute video' : 'Mute video'}
    >
      <motion.div
        className="relative w-6 h-6 flex items-center justify-center"
        animate={{ rotate: isHovered ? 5 : 0 }}
        transition={{ duration: 0.2 }}
      >
        {isMuted ? (
          // Muted icon
          <svg
            className="w-6 h-6"
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
          </svg>
        ) : (
          // Unmuted icon
          <svg
            className="w-6 h-6"
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
        )}
      </motion.div>
      
      {/* Tooltip */}
      <motion.div
        className={`absolute top-full right-0 mt-2 px-2 py-1 text-xs rounded whitespace-nowrap ${
          className.includes('!relative') 
            ? 'bg-gray-800 text-white' 
            : 'bg-black/90 text-white'
        }`}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : -5 }}
        transition={{ duration: 0.2 }}
      >
        {isMuted ? 'Click to unmute' : 'Click to mute'}
      </motion.div>
    </motion.button>
  );
}
