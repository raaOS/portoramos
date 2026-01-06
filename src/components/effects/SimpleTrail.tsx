'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';
import NextImage from 'next/image';

import { TrailItem } from '@/types/about';

interface SimpleTrailProps {
  backgroundTrail?: (string | TrailItem)[];
}

// Helper functions - exactly like demo4.js
const MathUtils = {
  lerp: (a: number, b: number, n: number) => (1 - n) * a + n * b,
  distance: (x1: number, y1: number, x2: number, y2: number) => Math.hypot(x2 - x1, y2 - y1),
  getRandomFloat: (min: number, max: number) => (Math.random() * (max - min) + min).toFixed(2)
};

// Calculate viewport size - exactly like demo4.js
let winsize: { width: number; height: number };
const calcWinsize = () => {
  winsize = { width: window.innerWidth, height: window.innerHeight };
};

export default function SimpleTrail({ backgroundTrail = [] }: SimpleTrailProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Determine which images to use for trail effect with robust fallback
  const trailImages = useMemo(() => {
    if (backgroundTrail && Array.isArray(backgroundTrail) && backgroundTrail.length > 0) {
      // Normalize and filter
      const validImages = backgroundTrail
        .map(item => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object' && item.isActive !== false) return item.src;
          return null;
        })
        .filter((url): url is string => typeof url === 'string' && url.trim() !== '');

      return validImages;
    }

    return [];
  }, [backgroundTrail]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('SimpleTrail mounted with backgroundTrail:', backgroundTrail);
      console.log('Trail images to use:', trailImages);
    }

    // Ensure trail effect initializes even if images are still loading
    if (trailImages.length > 0) {
      setIsLoaded(true);
    }
  }, [backgroundTrail, trailImages]);

  // Get mouse position - exactly like demo4.js
  const getMousePos = (ev: MouseEvent) => {
    let posx = 0;
    let posy = 0;
    if (!ev) ev = window.event as MouseEvent;
    if (ev.pageX || ev.pageY) {
      posx = ev.pageX;
      posy = ev.pageY;
    }
    else if (ev.clientX || ev.clientY) {
      posx = ev.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
      posy = ev.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }
    return { x: posx, y: posy };
  };

  // Mouse tracking variables - exactly like demo4.js
  const mousePos = useRef({ x: 0, y: 0 });
  const lastMousePos = useRef({ x: 0, y: 0 });
  const cacheMousePos = useRef({ x: 0, y: 0 });

  // Get mouse distance - exactly like demo4.js
  const getMouseDistance = () => {
    return MathUtils.distance(mousePos.current.x, mousePos.current.y, lastMousePos.current.x, lastMousePos.current.y);
  };

  // Image class - exactly like demo4.js
  class Image {
    DOM: { el: HTMLElement };
    defaultStyle: { rotation: number; x: number; y: number; opacity: number };
    rect!: DOMRect;

    constructor(el: HTMLElement) {
      this.DOM = { el: el };
      this.defaultStyle = {
        rotation: 0,
        x: 0,
        y: 0,
        opacity: 0
      };
      this.getRect();
      this.initEvents();
    }

    initEvents() {
      window.addEventListener('resize', () => this.resize());
    }

    resize() {
      gsap.set(this.DOM.el, this.defaultStyle);
      this.getRect();
    }

    getRect() {
      this.rect = this.DOM.el.getBoundingClientRect();
    }

    isActive() {
      return gsap.isTweening(this.DOM.el) || this.DOM.el.style.opacity !== '0';
    }

    setRatio() {
      // Use trailSize from context with variation between 100-200px
      const minSize = 100;
      const maxSize = 200;
      const randomSize = MathUtils.getRandomFloat(minSize, maxSize);
      this.DOM.el.style.setProperty('--img-maxwidth', `${randomSize}px`);
      this.DOM.el.style.maxWidth = `${randomSize}px`;
      this.getRect();
    }
  }

  // ImageTrail class - exactly like demo4.js
  class ImageTrail {
    mousePos: React.MutableRefObject<{ x: number; y: number }>;
    cacheMousePos: React.MutableRefObject<{ x: number; y: number }>;
    lastMousePos: React.MutableRefObject<{ x: number; y: number }>;
    getMouseDistance: () => number;
    DOM: { content: HTMLElement };
    images: Image[];
    imagesTotal: number;
    imgPosition: number;
    zIndexVal: number;
    threshold: number;

    constructor(
      container: HTMLElement,
      mousePos: React.MutableRefObject<{ x: number; y: number }>,
      cacheMousePos: React.MutableRefObject<{ x: number; y: number }>,
      lastMousePos: React.MutableRefObject<{ x: number; y: number }>,
      getMouseDistance: () => number
    ) {
      this.DOM = { content: container };
      this.mousePos = mousePos;
      this.cacheMousePos = cacheMousePos;
      this.lastMousePos = lastMousePos;
      this.getMouseDistance = getMouseDistance;
      this.images = [];
      [...this.DOM.content.querySelectorAll('img')].forEach(img => this.images.push(new Image(img as HTMLElement)));
      this.imagesTotal = this.images.length;
      this.imgPosition = 0;
      this.zIndexVal = 100; // Start with high z-index to appear above text
      this.threshold = 80;
      requestAnimationFrame(() => this.render());
    }

    render() {
      let distance = this.getMouseDistance();
      this.cacheMousePos.current.x = MathUtils.lerp(this.cacheMousePos.current.x || this.mousePos.current.x, this.mousePos.current.x, 0.1);
      this.cacheMousePos.current.y = MathUtils.lerp(this.cacheMousePos.current.y || this.mousePos.current.y, this.mousePos.current.y, 0.1);

      if (distance > this.threshold) {
        this.showNextImage();
        ++this.zIndexVal;
        this.imgPosition = this.imgPosition < this.imagesTotal - 1 ? this.imgPosition + 1 : 0;
        this.lastMousePos.current = this.mousePos.current;
      }

      let isIdle = true;
      for (let img of this.images) {
        if (img.isActive()) {
          isIdle = false;
          break;
        }
      }
      if (isIdle && this.zIndexVal !== 100) {
        this.zIndexVal = 100; // Reset to high z-index value
      }

      requestAnimationFrame(() => this.render());
    }

    showNextImage() {
      const img = this.images[this.imgPosition];
      img.setRatio();
      gsap.killTweensOf(img.DOM.el);

      const timeline = gsap.timeline();
      timeline
        .set(img.DOM.el, {
          startAt: { opacity: 0 },
          opacity: 1,
          rotation: 0,
          zIndex: this.zIndexVal,
          x: this.cacheMousePos.current.x - img.rect.width / 2,
          y: this.cacheMousePos.current.y - img.rect.height / 2
        }, 0)
        .to(img.DOM.el, {
          duration: 1.6,
          ease: "expo.out",
          x: this.mousePos.current.x - img.rect.width / 2,
          y: this.mousePos.current.y - img.rect.height / 2
        }, 0)
        .to(img.DOM.el, {
          duration: 0.8,
          ease: "power1.out",
          opacity: 0
        }, 0.6)
        .to(img.DOM.el, {
          duration: 1,
          ease: "quint.out",
          x: `+=${MathUtils.getRandomFloat(-1 * (winsize.width + img.rect.width / 2), winsize.width + img.rect.width / 2)}`,
          y: `+=${MathUtils.getRandomFloat(-1 * (winsize.height + img.rect.height / 2), winsize.height + img.rect.height / 2)}`,
          rotation: MathUtils.getRandomFloat(-40, 40)
        }, 0.6);
    }
  }

  useEffect(() => {
    if (!containerRef.current || !isLoaded) return;

    calcWinsize();

    const handleMouseMove = (ev: MouseEvent) => {
      mousePos.current = getMousePos(ev);
    };

    const handleTouchMove = (ev: TouchEvent) => {
      const touch = ev.touches[0];
      if (!touch) return;
      mousePos.current = {
        x: touch.clientX,
        y: touch.clientY
      };
    };

    const handleResize = () => {
      calcWinsize();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', handleTouchMove);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('resize', handleResize);

    const trail = new ImageTrail(
      containerRef.current,
      mousePos,
      cacheMousePos,
      lastMousePos,
      getMouseDistance
    );

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouchMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Preload images
    const preloadImages = () => {
      return new Promise<void>((resolve) => {
        const imgElements = containerRef.current?.querySelectorAll('img');
        if (!imgElements || imgElements.length === 0) {
          resolve();
          return;
        }

        let loadedCount = 0;
        const totalImages = imgElements.length;

        const checkLoaded = () => {
          loadedCount++;
          if (loadedCount === totalImages) {
            resolve();
          }
        };

        imgElements.forEach((img) => {
          if (img.complete) {
            checkLoaded();
          } else {
            img.addEventListener('load', checkLoaded);
            img.addEventListener('error', checkLoaded);
          }
        });
      });
    };

    preloadImages().then(() => {
      setIsLoaded(true);
    });
  }, []);

  // Use the trailImages from useMemo above

  // Use createPortal to render directly into body to escape main container constraints
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  // Render to body using Portal
  // Absolute position at top:0 left:0 ensures it starts at the top of the page
  // w-full ensures it spans the entire width (no container limits)
  // h-[120vh] gives enough height for the hero section + some buffer
  // z-0 ensures it's behind the hero text (which should be z-relative)
  // pointer-events-none ensures clicks pass through
  return createPortal(
    <div
      className="absolute top-0 left-0 w-full h-[120vh] z-0 pointer-events-none overflow-hidden"
    >
      <div ref={containerRef} className="w-full h-full">
        {/* Trail images - using Next.js Image for optimization */}
        {trailImages.map((imageSrc, index) => (
          <NextImage
            key={`trail-${index}-${imageSrc}`}
            src={imageSrc}
            alt={`Trail ${index + 1}`}
            width={150}
            height={150}
            className="content__img"
            style={{
              position: 'absolute',
              opacity: 0,
              pointerEvents: 'none',
              maxWidth: 'var(--img-maxwidth, 150px)',
              width: 'auto'
            }}
            priority={index < 3} // Prioritize first 3 images
            unoptimized={imageSrc.startsWith('http')}
          />
        ))}
      </div>
    </div>,
    document.body
  );
}
