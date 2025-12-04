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

    // Initialize texts with 2-line formatting
    if (text1Ref.current && text2Ref.current) {
      const formatTextForTwoLines = (text: string) => {
        const words = text.split(' ');
        // Selalu pecah menjadi 2 baris jika ada lebih dari 1 kata
        if (words.length <= 1) {
          return text;
        }
        const midPoint = Math.ceil(words.length / 2);
        const firstLine = words.slice(0, midPoint).join(' ');
        const secondLine = words.slice(midPoint).join(' ');
        return `${firstLine}<br>${secondLine}`;
      };
      
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
        
        // Force text to be 2 lines by adding line break
        const currentText = texts[textIndexRef.current % texts.length];
        const nextText = texts[(textIndexRef.current + 1) % texts.length];
        
        // Split text and add line break to force 2 lines
        const formatTextForTwoLines = (text: string) => {
          const words = text.split(' ');
          // Selalu pecah menjadi 2 baris jika ada lebih dari 1 kata
          if (words.length <= 1) {
            return text;
          }
          const midPoint = Math.ceil(words.length / 2);
          const firstLine = words.slice(0, midPoint).join(' ');
          const secondLine = words.slice(midPoint).join(' ');
          return `${firstLine}<br>${secondLine}`;
        };
        
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
        
        // Ensure text is formatted for 2 lines
        const currentText = texts[textIndexRef.current % texts.length];
        const nextText = texts[(textIndexRef.current + 1) % texts.length];
        
        const formatTextForTwoLines = (text: string) => {
          const words = text.split(' ');
          // Selalu pecah menjadi 2 baris jika ada lebih dari 1 kata
          if (words.length <= 1) {
            return text;
          }
          const midPoint = Math.ceil(words.length / 2);
          const firstLine = words.slice(0, midPoint).join(' ');
          const secondLine = words.slice(midPoint).join(' ');
          return `${firstLine}<br>${secondLine}`;
        };
        
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
          min-height: 150px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: flex-start;
        }

        .text-morph-text-container {
          position: relative;
          width: 100%;
          min-width: 100%;
          height: 150px;
          margin: 0 auto;
          filter: url(#threshold) blur(0.6px);
          display: flex;
          align-items: center;
          justify-content: flex-start;
          overflow: visible;
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
          font-family: 'Merriweather', serif;
          font-size: 75px;
          font-weight: 700;
          text-align: left;
          user-select: none;
          color: #000000;
          text-transform: uppercase;
          letter-spacing: -2px;
          line-height: 0.8;
          white-space: normal;
          word-wrap: break-word;
          hyphens: auto;
          transition: none;
          will-change: auto;
          max-width: 90%;
          overflow-wrap: break-word;
          word-break: break-word;
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
            font-size: 75px;
            letter-spacing: -2px;
            line-height: 0.8;
          }
          .text-morph-text-container {
            height: 150px;
            padding: 0 2rem;
          }
        }

        @media (max-width: 768px) {
          .text-morph-text {
            font-size: 48px;
            letter-spacing: -1.1px;
            line-height: 0.82;
          }
          .text-morph-text-container {
            height: 130px;
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
