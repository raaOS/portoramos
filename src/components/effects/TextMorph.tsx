'use client';

import { useState, useEffect, useRef } from 'react';

interface TextMorphProps {
  texts: string[];
  descriptions: string[];
  className?: string;
  morphTime?: number;
  cooldownTime?: number;
  onDescriptionChange?: (description: string) => void;
}

// Helper for balanced 2-line split
const formatTextForTwoLines = (text: string) => {
  const words = text.split(' ');
  if (words.length <= 1) return text;

  // Calculate optimum split point (minimize difference in line lengths)
  let bestSplitIndex = 1;
  let minDiff = Infinity;

  for (let i = 1; i < words.length; i++) {
    const line1 = words.slice(0, i).join(' ');
    const line2 = words.slice(i).join(' ');
    const diff = Math.abs(line1.length - line2.length);

    if (diff < minDiff) {
      minDiff = diff;
      bestSplitIndex = i;
    }
  }

  const firstLine = words.slice(0, bestSplitIndex).join(' ');
  const secondLine = words.slice(bestSplitIndex).join(' ');
  return `${firstLine}<br>${secondLine}`;
};

export default function TextMorph({
  texts,
  descriptions,
  className = '',
  morphTime = 1,
  cooldownTime = 0.25,
  onDescriptionChange
}: TextMorphProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentDescription, setCurrentDescription] = useState(descriptions[0]);
  const text1Ref = useRef<HTMLSpanElement>(null);
  const text2Ref = useRef<HTMLSpanElement>(null);
  const animationRef = useRef<number>();
  const timeRef = useRef<Date>(new Date());
  const morphRef = useRef<number>(0);
  const cooldownRef = useRef<number>(cooldownTime);
  const textIndexRef = useRef<number>(texts.length - 1);

  useEffect(() => {
    if (texts.length === 0) return;

    // Initialize texts
    if (text1Ref.current && text2Ref.current) {
      text1Ref.current.innerHTML = formatTextForTwoLines(texts[textIndexRef.current % texts.length]);
      text2Ref.current.innerHTML = formatTextForTwoLines(texts[(textIndexRef.current + 1) % texts.length]);
    }

    function doMorph() {
      morphRef.current -= cooldownRef.current;
      cooldownRef.current = 0;

      let fraction = morphRef.current / morphTime;

      if (fraction > 1) {
        cooldownRef.current = cooldownTime;
        fraction = 1;
      }

      setMorph(fraction);
    }

    function setMorph(fraction: number) {
      if (!text1Ref.current || !text2Ref.current || !texts || texts.length === 0) return;

      try {
        // Smooth transition tanpa kedip
        const smoothFraction = Math.pow(fraction, 0.6);

        text2Ref.current.style.filter = `blur(${Math.min(8 / smoothFraction - 8, 100)}px)`;
        text2Ref.current.style.opacity = `${Math.pow(smoothFraction, 0.3) * 100}%`;

        const reverseFraction = 1 - smoothFraction;
        text1Ref.current.style.filter = `blur(${Math.min(8 / reverseFraction - 8, 100)}px)`;
        text1Ref.current.style.opacity = `${Math.pow(reverseFraction, 0.3) * 100}%`;

        const currentText = texts[textIndexRef.current % texts.length];
        const nextText = texts[(textIndexRef.current + 1) % texts.length];

        text1Ref.current.innerHTML = formatTextForTwoLines(currentText);
        text2Ref.current.innerHTML = formatTextForTwoLines(nextText);
      } catch (error) {
        console.error('TextMorph setMorph error:', error);
      }
    }

    function doCooldown() {
      if (!text1Ref.current || !text2Ref.current) return;

      try {
        morphRef.current = 0;

        // Smooth cooldown tanpa kedip
        text2Ref.current.style.filter = "blur(0px)";
        text2Ref.current.style.opacity = "100%";

        text1Ref.current.style.filter = "blur(0px)";
        text1Ref.current.style.opacity = "0%";

        const currentText = texts[textIndexRef.current % texts.length];
        const nextText = texts[(textIndexRef.current + 1) % texts.length];

        text1Ref.current.innerHTML = formatTextForTwoLines(currentText);
        text2Ref.current.innerHTML = formatTextForTwoLines(nextText);
      } catch (error) {
        console.error('TextMorph doCooldown error:', error);
      }
    }

    function animate() {
      animationRef.current = requestAnimationFrame(animate);

      try {
        let newTime = new Date();
        let shouldIncrementIndex = cooldownRef.current > 0;
        let dt = (newTime.getTime() - timeRef.current.getTime()) / 1000;
        timeRef.current = newTime;

        cooldownRef.current -= dt;

        if (cooldownRef.current <= 0) {
          if (shouldIncrementIndex) {
            textIndexRef.current++;
            setCurrentIndex(textIndexRef.current % texts.length);
            const newDescription = descriptions[textIndexRef.current % texts.length];
            setCurrentDescription(newDescription);
            onDescriptionChange?.(newDescription);
          }

          doMorph();
        } else {
          doCooldown();
        }
      } catch (error) {
        console.error('TextMorph animate error:', error);
      }
    }

    // Start animation
    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [texts, descriptions, morphTime, cooldownTime, onDescriptionChange]);

  return (
    <div className={`text-morph-container ${className}`}>
      {/* SVG Filter */}
      <svg id="filters" style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="threshold">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 255 -140"
            />
          </filter>
        </defs>
      </svg>

      {/* Morphing Text Container */}
      <div className="text-morph-text-container">
        <span ref={text1Ref} className="text-morph-text"></span>
        <span ref={text2Ref} className="text-morph-text"></span>
      </div>


      <style jsx>{`
        .text-morph-container {
          text-align: left;
          margin: 0;
          position: relative;
          min-height: 180px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: flex-start;
        }

        .text-morph-text-container {
          position: relative;
          width: 100%;
          min-width: 100%;
          height: 180px; /* Increased base height */
          margin: 0 auto;
          filter: url(#threshold) blur(0.6px);
          display: flex;
          align-items: center;
          justify-content: flex-start;
          overflow: visible; /* Allow text to flow out if needed */
          contain: layout style paint;
          flex-wrap: nowrap;
          padding: 0 2rem;
        }

        .text-morph-text {
          position: absolute;
          top: 50%;
          left: 0;
          transform: translateY(-50%);
          width: 100%;
          display: block;

          font-size: 75px;
          font-weight: 700;
          text-align: left;
          user-select: none;
          color: #000000;
          text-transform: uppercase;
          letter-spacing: -2px;
          line-height: 0.8;
          white-space: nowrap; /* Prevent accidental wrapping beyond <br> */
          word-wrap: normal;
          hyphens: none;
          transition: none;
          will-change: auto;
          max-width: 100%; /* Changed from 90% */
          overflow: visible; /* changed from hidden */
        }

        /* Force 2 lines for all text */
        .text-morph-text::before {
          content: '';
          display: block;
          width: 100%;
          height: 0;
        }

        .text-morph-text::after {
          content: '';
          display: block;
          width: 100%;
          height: 0;
        }

        /* Responsive - Semua 2 baris */
        @media (max-width: 1200px) {
          .text-morph-text {
            font-size: 60px; /* Reduced from 75px to prevent wrapping/clipping */
            letter-spacing: -2px;
            line-height: 1.1; /* Increased from 0.8 for better readability */
          }
          .text-morph-text-container {
            height: auto; /* Changed from fixed 150px */
            min-height: 180px; /* Ensure enough space */
            padding: 0 2rem;
            overflow: visible; /* Prevent clipping */
          }
        }
        
        @media (min-width: 1201px) {
             .text-morph-text-container {
                height: 180px; /* Increased from 150px */
                overflow: visible;
             }
             .text-morph-text {
                line-height: 1; /* Increased from 0.8 */
             }
        }


        @media (max-width: 768px) {
          .text-morph-text {
            font-size: 42px; /* Slightly reduced */
            letter-spacing: -1.1px;
            line-height: 1.1;
          }
          .text-morph-text-container {
            height: auto;
            min-height: 140px;
            padding: 0 1.5rem;
          }
        }

        @media (max-width: 480px) {
          .text-morph-text {
            font-size: 40px;
            letter-spacing: -0.8px;
            line-height: 0.84;
          }
          .text-morph-text-container {
            height: 120px;
            padding: 0 1rem;
          }
          
        }

        /* Extra small screens */
        @media (max-width: 360px) {
          .text-morph-text {
            font-size: 36px;
            letter-spacing: -0.5px;
            line-height: 0.85;
          }
          .text-morph-text-container {
            height: 110px;
            padding: 0 0.85rem;
          }
        }

        /* Very small screens */
        @media (max-width: 320px) {
          .text-morph-text {
            font-size: 34px;
            letter-spacing: -0.3px;
            line-height: 0.86;
          }
          .text-morph-text-container {
            height: 100px;
            padding: 0 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}
