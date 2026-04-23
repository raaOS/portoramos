import { m, useTransform, type MotionValue, useMotionValue } from 'motion/react';

interface LiquidFilterProps {
  id?: string;
  mouseX?: MotionValue<number>;
  scrollVelocity?: MotionValue<number>;
}

export default function LiquidFilter({ id = 'liquid-glass', mouseX, scrollVelocity }: LiquidFilterProps) {
  // Safe defaults
  const fallbackMouseX = useMotionValue(0);
  const fallbackVelocity = useMotionValue(0);
  const safeMouseX = mouseX ?? fallbackMouseX;
  const safeVelocity = scrollVelocity ?? fallbackVelocity;

  // 1. Mouse Interaction Logic (Reactive Ripple)
  const mouseRippleX = useTransform(safeMouseX, (val) => {
    if (val === Infinity) return 0;
    return Math.sin(val / 100) * 0.002;
  });

  const mouseRippleY = useTransform(safeMouseX, (val) => {
    if (val === Infinity) return 0;
    return Math.cos(val / 150) * 0.002;
  });

  // 2. Scroll Intensity Logic (Desir Halus / Shimmer)
  // Use scroll velocity to add a temporary turbulence 'shimmer'
  const scrollShimmer = useTransform(safeVelocity, (v) => {
    // Math.abs(v) because velocity can be negative (scrolling up)
    // We normalize scroll pixels-per-sec to a tiny, elegant frequency offset
    const intensity = Math.abs(v) / 200000;
    return Math.min(intensity, 0.004); 
  });

  // Combine both influences into the final frequency attributes
  const baseFreqX = useTransform([mouseRippleX, scrollShimmer], (latest) => 0.01 + Number(latest[0] ?? 0) + Number(latest[1] ?? 0));
  const baseFreqY = useTransform([mouseRippleY, scrollShimmer], (latest) => 0.008 + Number(latest[0] ?? 0) + Number(latest[1] ?? 0));

  // Combine into SVG frequency string format
  const baseFrequency = useTransform([baseFreqX, baseFreqY], (latest) => `${Number(latest[0] ?? 0)} ${Number(latest[1] ?? 0)}`);

  return (
    <svg className="pointer-events-none absolute h-0 w-0 overflow-hidden" aria-hidden="true">
      <defs>
        <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
          {/* feTurbulence reacts to BOTH movement and scroll */}
          <m.feTurbulence 
            type="fractalNoise"
            baseFrequency={baseFrequency} 
            numOctaves="1" 
            seed="5" 
            result="turbulence" 
          />
          
          <feComponentTransfer in="turbulence" result="mapped">
            <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
            <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
            <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
          </feComponentTransfer>

          <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />

          <feSpecularLighting 
            in="softMap" 
            surfaceScale="5" 
            specularConstant="1" 
            specularExponent="100" 
            lightingColor="white" 
            result="specLight"
          >
            <fePointLight x="-200" y="-200" z="300" />
          </feSpecularLighting>

          <feComposite 
            in="specLight" 
            operator="arithmetic" 
            k1="0" 
            k2="1" 
            k3="1" 
            k4="0" 
            result="litImage" 
          />

          <feDisplacementMap 
            in="SourceGraphic" 
            in2="softMap" 
            scale="150" 
            xChannelSelector="R" 
            yChannelSelector="G" 
          />
        </filter>
      </defs>
    </svg>
  );
}
