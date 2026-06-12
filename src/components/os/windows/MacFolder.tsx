import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useReducedMotion } from 'motion/react';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

// Helper to darken hex color
const darkenColor = (hex: string, percent: number) => {
  let color = hex.startsWith('#') ? hex.slice(1) : hex;
  if (color.length === 3) {
    color = color
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = parseInt(color, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.max(0, Math.min(255, Math.floor(r * (1 - percent))));
  g = Math.max(0, Math.min(255, Math.floor(g * (1 - percent))));
  b = Math.max(0, Math.min(255, Math.floor(b * (1 - percent))));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
};

interface FolderProps {
  color?: string;
  size?: number;
  items?: React.ReactNode[];
  className?: string;
  label?: string;
  subLabel?: string;
  onClick?: () => void;
  count?: number;
  isStatic?: boolean;
  open?: boolean;
}

const MacFolder = ({
  color = '#3B82F6',
  size = 1.2,
  items = [],
  className = '',
  label,
  subLabel,
  onClick,
  count,
  isStatic = false,
  open: externalOpen,
}: FolderProps) => {
  const maxItems = 3;
  const papers = items.length > 0 ? items.slice(0, maxItems) : Array(3).fill(null);

  while (papers.length < maxItems) {
    papers.push(null);
  }

  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const [paperOffsets, setPaperOffsets] = useState(
    Array.from({ length: maxItems }, () => ({ x: 0, y: 0 }))
  );

  const [logoAnimationData, setLogoAnimationData] = useState<unknown>(null);
  const prefersReducedMotion = useReducedMotion();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lottieRef = useRef<any>(null);

  useEffect(() => {
    const instance = lottieRef.current;
    return () => {
      instance?.destroy?.();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadLogoAnimation = async () => {
      try {
        const response = await fetch('/lottie/mata.json', {
          signal: controller.signal,
        });
        if (!response.ok) return;

        const data = await response.json();
        setLogoAnimationData(data);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    };

    loadLogoAnimation();

    return () => controller.abort();
  }, []);

  const folderBackColor = darkenColor(color, 0.08);
  const paper1 = darkenColor('#ffffff', 0.1);
  const paper2 = darkenColor('#ffffff', 0.05);
  const paper3 = '#ffffff';

  const handleClick = () => {
    if (!isStatic && externalOpen === undefined) {
      setInternalOpen((prev) => {
        const next = !prev;
        // Reset offsets when closing to avoid stale transform carry-over.
        if (!next) {
          setPaperOffsets(Array.from({ length: maxItems }, () => ({ x: 0, y: 0 })));
        }
        return next;
      });
    }
    // Only trigger parent navigation if folder is already open or we want valid click action
    // But aligning with React Bits, usually click toggles open.
    // If we want double click or specific logic:
    if (onClick) onClick();
  };

  const handlePaperMouseMove = (e: React.MouseEvent, index: number) => {
    if (!isOpen) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const offsetX = (e.clientX - centerX) * 0.15;
    const offsetY = (e.clientY - centerY) * 0.15;
    setPaperOffsets((prev) => {
      const newOffsets = [...prev];
      newOffsets[index] = { x: offsetX, y: offsetY };
      return newOffsets;
    });
  };

  const handlePaperMouseLeave = (e: React.MouseEvent, index: number) => {
    setPaperOffsets((prev) => {
      const newOffsets = [...prev];
      newOffsets[index] = { x: 0, y: 0 };
      return newOffsets;
    });
  };

  const folderStyle = {
    '--folder-color': color,
    '--folder-back-color': folderBackColor,
    '--paper-1': paper1,
    '--paper-2': paper2,
    '--paper-3': paper3,
  } as React.CSSProperties;

  const scaleStyle = { transform: `scale(${size})` };

  const getOpenTransform = (index: number) => {
    if (index === 0) return 'translate(-120%, -70%) rotate(-15deg)';
    if (index === 1) return 'translate(10%, -70%) rotate(15deg)';
    if (index === 2) return 'translate(-50%, -100%) rotate(5deg)';
    return '';
  };

  return (
    <div className={`flex flex-col items-center gap-6 ${className}`}>
      <div style={scaleStyle} className="mt-4">
        {/* Stable Wrapper (Group) - The static hit area */}
        <div className="group relative cursor-pointer" onClick={handleClick}>
          {/* Visual Folder Component - Moves on group hover */}
          <div
            className="relative transition-transform duration-300 ease-in-out"
            style={{
              ...folderStyle,
              transform: isOpen ? 'translateY(10px)' : undefined,
            }}
          >
            <div
              className="rounded-tl-0 relative h-[80px] w-[100px] rounded-bl-[10px] rounded-br-[10px] rounded-tr-[10px]"
              style={{ backgroundColor: folderBackColor }}
            >
              <span
                className="rounded-bl-0 rounded-br-0 absolute bottom-[98%] left-0 z-0 h-[10px] w-[30px] rounded-tl-[5px] rounded-tr-[5px]"
                style={{ backgroundColor: folderBackColor }}
              ></span>

              {/* BADGE COUNT */}
              {count !== undefined && count > 0 && (
                <div
                  className={`absolute -right-2 -top-4 z-50 flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full border-2 border-white bg-red-500 text-[13px] font-black text-white shadow-md transition-opacity duration-300 ${isOpen ? 'opacity-0' : 'opacity-100 delay-300'}`}
                >
                  {count}
                </div>
              )}

              {papers.map((item, i) => {
                let sizeClasses = '';
                if (i === 0) sizeClasses = isOpen ? 'w-[70%] h-[80%]' : 'w-[70%] h-[80%]';
                if (i === 1) sizeClasses = isOpen ? 'w-[80%] h-[80%]' : 'w-[80%] h-[70%]';
                if (i === 2) sizeClasses = isOpen ? 'w-[90%] h-[80%]' : 'w-[90%] h-[60%]';

                const transformStyle = isOpen
                  ? `${getOpenTransform(i)} translate(${paperOffsets[i].x}px, ${paperOffsets[i].y}px)`
                  : undefined;

                return (
                  <div
                    key={i}
                    onMouseMove={(e) => handlePaperMouseMove(e, i)}
                    onMouseLeave={(e) => handlePaperMouseLeave(e, i)}
                    className={`absolute bottom-[10%] left-1/2 z-20 transition-transform duration-300 ease-in-out ${
                      !isOpen
                        ? '-translate-x-1/2 translate-y-[10%] transform group-hover:translate-y-0'
                        : ''
                    } ${sizeClasses}`}
                    style={{
                      ...(!isOpen ? {} : { transform: transformStyle }),
                      backgroundColor: i === 0 ? paper1 : i === 1 ? paper2 : paper3,
                      borderRadius: '10px',
                    }}
                  >
                    {item}
                  </div>
                );
              })}
              <div
                className={`absolute z-30 h-full w-full origin-bottom transition-transform duration-300 ease-in-out ${
                  !isOpen ? 'group-hover:[transform:skew(15deg)_scaleY(0.6)]' : ''
                }`}
                style={{
                  backgroundColor: color,
                  borderRadius: '5px 10px 10px 10px',
                  ...(isOpen && { transform: 'skew(15deg) scaleY(0.6)' }),
                }}
              ></div>
              <div
                className={`absolute z-30 h-full w-full origin-bottom transition-transform duration-300 ease-in-out ${
                  !isOpen ? 'group-hover:[transform:skew(-15deg)_scaleY(0.6)]' : ''
                }`}
                style={{
                  backgroundColor: color,
                  borderRadius: '5px 10px 10px 10px',
                  ...(isOpen && { transform: 'skew(-15deg) scaleY(0.6)' }),
                }}
              >
                {/* Lottie Eye on Front Cover - Centered inside the cover flap to inherit 3D skew & scaling */}
                {!!logoAnimationData && (
                  <div
                    className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300 ease-in-out ${
                      isOpen ? 'opacity-0' : 'opacity-100'
                    }`}
                  >
                    <Lottie
                      lottieRef={lottieRef}
                      animationData={logoAnimationData}
                      loop={!prefersReducedMotion}
                      autoplay={!prefersReducedMotion}
                      rendererSettings={{ preserveAspectRatio: 'xMidYMid meet' }}
                      style={{ width: 90, height: 90 }}
                      aria-hidden="true"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* LABELS */}
        {label && (
          <div className="pointer-events-none z-30 mt-2 flex h-14 w-24 select-none flex-col items-center justify-start">
            <h3 className="pointer-events-none line-clamp-2 w-full break-words text-center text-[11px] font-semibold leading-tight text-neutral-800 transition-colors">
              {label}
            </h3>
            {subLabel && (
              <p className="pointer-events-none mt-0.5 whitespace-nowrap text-[9px] font-medium text-neutral-500">
                {subLabel}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MacFolder;
