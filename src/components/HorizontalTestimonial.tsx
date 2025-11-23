'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { Testimonial, TestimonialData } from '@/types/testimonial';
import { useQuery } from '@tanstack/react-query';

export default function HorizontalTestimonial() {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
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

  const testimonials = data?.testimonials ?? [];

  // Auto-scroll animation with seamless looping (left to right)
  useEffect(() => {
    if (!isAutoScroll || testimonials.length === 0) return;

    const itemWidth = 280 + 16; // width + margin
    const totalWidth = testimonials.length * itemWidth;
    let animationId: number;
    let startTime: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;

      // Calculate position based on time for consistent speed
      const elapsed = currentTime - startTime;
      const speed = 0.08; // pixels per millisecond (right to left movement) - SMOOTHER
      const position = totalWidth - (elapsed * speed) % totalWidth; // Reverse direction

      setScrollPosition(position);
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isAutoScroll, testimonials.length]);

  useEffect(() => {
    if (!isAutoScroll) {
      setScrollPosition(0);
    }
  }, [isAutoScroll]);

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

  const repeatedTestimonials = isAutoScroll
    ? [...testimonials, ...testimonials, ...testimonials]
    : testimonials;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Testimoni</p>
          <h3 className="text-xl font-serif font-semibold text-gray-900">Cerita dari klien</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAutoScroll(prev => !prev)}
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

      <div className={`w-full ${isAutoScroll ? 'overflow-hidden' : 'overflow-x-auto'} pb-2`}>
        <div
          ref={scrollRef}
          className={`flex gap-4 ${isAutoScroll ? '' : 'pr-4'}`}
          style={isAutoScroll ? {
            transform: `translateX(-${scrollPosition}px)`,
            willChange: 'transform',
            backfaceVisibility: 'hidden',
            transformStyle: 'preserve-3d'
          } : undefined}
        >
          {repeatedTestimonials.map((testimonial, index) => (
            <div key={`${testimonial.id}-${index}`} className="flex-shrink-0 w-[280px]">
              <div className="h-full rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <div className="mb-3 flex items-center">
                  <div className="relative mr-3 h-10 w-10">
                    <Image
                      src={testimonial.avatar || 'https://via.placeholder.com/80'}
                      alt={testimonial.name}
                      fill
                      className="rounded-full object-cover"
                      sizes="40px"
                      unoptimized
                    />
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