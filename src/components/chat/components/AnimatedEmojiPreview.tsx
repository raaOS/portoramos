'use client';
import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useReducedMotion } from 'motion/react';
import type { LottieRefCurrentProps } from 'lottie-react';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

interface AnimatedEmojiPreviewProps {
  unicode: string;
}

export default function AnimatedEmojiPreview({ unicode }: AnimatedEmojiPreviewProps) {
  const [animationData, setAnimationData] = useState<unknown>(null);
  const prefersReducedMotion = useReducedMotion();
  const lottieRef = useRef<LottieRefCurrentProps | null>(null);

  useEffect(() => {
    const instance = lottieRef.current;
    return () => {
      instance?.destroy?.();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadAnimation = async () => {
      try {
        const response = await fetch(
          `https://fonts.gstatic.com/s/e/notoemoji/latest/${unicode}/lottie.json`,
          { signal: controller.signal }
        );
        if (!response.ok) return;
        const data = await response.json();
        setAnimationData(data);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    };
    loadAnimation();

    return () => controller.abort();
  }, [unicode]);

  if (!animationData) return null;

  return (
    <Lottie
      lottieRef={lottieRef}
      animationData={animationData}
      loop={!prefersReducedMotion}
      autoplay={!prefersReducedMotion}
      style={{ width: 40, height: 40 }}
    />
  );
}
