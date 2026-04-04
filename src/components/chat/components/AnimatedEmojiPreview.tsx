"use client"
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

interface AnimatedEmojiPreviewProps {
  unicode: string;
}

export default function AnimatedEmojiPreview({ unicode }: AnimatedEmojiPreviewProps) {
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
        // Silent fail
      }
    };
    loadAnimation();
  }, [unicode]);
  
  if (!animationData) return null;
  
  return (
    <Lottie
      animationData={animationData}
      loop={true}
      autoplay={true}
      style={{ width: 40, height: 40 }}
    />
  );
}
