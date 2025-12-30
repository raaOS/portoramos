'use client';

import { useState, useEffect, useRef } from 'react';

import { TestimonialData } from '@/types/testimonial';
import { useQuery } from '@tanstack/react-query';

export default function HorizontalTestimonial() {
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const positionRef = useRef(0);

  const {
    data,
    isLoading,
    isError,
    refetch,
    error,
  } = useQuery<TestimonialData>({
    queryKey: ['testimonials'],
    queryFn: async () => {
      const response = await fetch('/api/testimonial');
      if (!response.ok) {
        throw new Error('Gagal memuat testimoni');
      }
      return response.json();
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const testimonials = (data?.testimonials ?? []).filter(t => t.isActive !== false);

  // JavaScript animation loop
  useEffect(() => {
    if (!isAutoScroll || isPaused || !scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollWidth = container.scrollWidth / 4; // Divide by 4 because we have 4 sets
    const speed = 0.5; // pixels per frame (adjust for speed)

    const animate = () => {
      positionRef.current -= speed;

      // Reset position when we've scrolled back to 0 (start of loop from right end)
      if (positionRef.current <= 0) {
        positionRef.current = scrollWidth;
      }

      container.style.transform = `translateX(-${positionRef.current}px)`;
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAutoScroll, isPaused, testimonials.length]);



  if (isLoading) {
    return (
      <div className="w-full rounded-2xl border border-dashed border-gray-200 p-6 text-center text-gray-500">
        Memuat testimoni klien...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
        <p className="mb-3">{error instanceof Error ? error.message : 'Gagal memuat testimoni.'}</p>
        <button
          onClick={() => refetch()}
          className="rounded-full border border-red-400 px-4 py-2 text-sm font-medium hover:bg-red-100"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  if (testimonials.length === 0) {
    return (
      <div className="w-full rounded-2xl border border-gray-200 p-6 text-center text-gray-500">
        Belum ada testimoni yang dapat ditampilkan.
      </div>
    );
  }

  // Create duplicated items for seamless loop (4 sets)
  const repeatedTestimonials = [...testimonials, ...testimonials, ...testimonials, ...testimonials];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Testimoni</p>
          <h3 className="text-xl font-sans font-semibold text-gray-900">Cerita dari klien</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAutoScroll(!isAutoScroll)}
            className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            {isAutoScroll ? 'Hentikan animasi' : 'Putar animasi'}
          </button>
          <button
            onClick={() => refetch()}
            className="rounded-full border border-gray-200 px-3 py-2 text-sm text-gray-500 hover:border-gray-400"
            aria-label="Muat ulang testimoni"
          >
            ↻
          </button>
        </div>
      </div>

      <div className="w-full overflow-hidden pb-2 relative">
        <div
          ref={scrollContainerRef}
          className="flex gap-4"
          style={{
            width: 'max-content',
            willChange: 'transform',
          }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {repeatedTestimonials.map((testimonial, index) => (
            <div key={`${testimonial.id}-${index}`} className="flex-shrink-0 w-[280px]">
              <div className="h-full rounded-2xl border border-gray-100 bg-white p-5 transition-colors hover:border-black select-none cursor-pointer">
                <div className="mb-3 flex items-center gap-3">
                  {/* Avatar with Initials */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">
                      {testimonial.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-xs text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
                <blockquote className="text-sm text-gray-700">
                  &ldquo;{testimonial.content}&rdquo;
                </blockquote>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
