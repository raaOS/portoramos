'use client';

import React, { useState, useEffect } from 'react';

interface FastMarqueeProps {
  children: React.ReactNode;
  direction?: 'left' | 'right';
  speed?: number; // Duration in seconds
  className?: string;
  pauseOnHover?: boolean;
}

export default function FastMarquee({
  children,
  direction = 'left',
  speed = 40,
  className = '',
  pauseOnHover = false,
}: FastMarqueeProps) {
  // Use state to ensure client-side rendering for animation start
  // This avoids hydration mismatch where server has no animation state
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  const animationClass = direction === 'left' ? 'animate-fast-marquee' : 'animate-fast-marquee-reverse';

  return (
    <div
      className={`flex overflow-hidden select-none w-full ${className} ${pauseOnHover ? 'group' : ''}`}
    >
      <div
        className={`flex min-w-full shrink-0 items-center justify-around gap-0 ${ready ? animationClass : ''} ${pauseOnHover ? 'group-hover:[animation-play-state:paused]' : ''}`}
        style={{ animationDuration: `${speed}s` }}
      >
        {children}
      </div>
      <div
        className={`flex min-w-full shrink-0 items-center justify-around gap-0 ${ready ? animationClass : ''} ${pauseOnHover ? 'group-hover:[animation-play-state:paused]' : ''}`}
        style={{ animationDuration: `${speed}s` }}
      >
        {children}
      </div>
    </div>
  );
}
