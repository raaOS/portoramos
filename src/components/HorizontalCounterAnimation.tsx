'use client';

import { useEffect, useState } from 'react';

interface CounterItem {
  id: number;
  number: number;
  label: string;
  prefix?: string;
  suffix?: string;
}

export default function HorizontalCounterAnimation() {
  const [scrollPosition, setScrollPosition] = useState(0);

  // Counter data
  const counterItems: CounterItem[] = [
    { id: 1, number: 12, label: 'YEARS', prefix: '', suffix: '+' },
    { id: 2, number: 46, label: 'PROJECTS', prefix: '', suffix: '+' },
    { id: 3, number: 5, label: 'TOOLS', prefix: '', suffix: '+' },
    { id: 4, number: 95, label: 'SATISFACTION', prefix: '', suffix: '%' }
  ];

  // Auto-scroll animation (left to right) with seamless looping
  useEffect(() => {
    const itemWidth = 160 + 16; // width + margin
    const totalWidth = counterItems.length * itemWidth;
    let animationId: number;
    let startTime: number;
    
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      
      // Calculate position based on time for consistent speed
      const elapsed = currentTime - startTime;
      const speed = 0.05; // pixels per millisecond (left to right movement) - SMOOTHER
      const position = (elapsed * speed) % totalWidth;
      
      setScrollPosition(position);
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [counterItems.length]);

  return (
    <div className="w-full overflow-hidden">
      <div 
        className="flex"
        style={{ 
          transform: `translateX(-${scrollPosition}px)`,
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Multiple duplicates for seamless infinite loop */}
        {[...counterItems, ...counterItems, ...counterItems].map((item, index) => (
          <div key={`${item.id}-${index}`} className="flex-shrink-0 w-[160px] mr-4">
            <div className="bg-white rounded-lg p-4 shadow-sm h-[100px] border border-gray-200 hover:border-black hover:bg-gray-100 transition-all duration-300 cursor-pointer flex flex-col justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-black mb-1">
                  {item.prefix}{item.number}{item.suffix}
                </div>
                <div className="text-xs text-gray-600 font-medium">
                  {item.label}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
