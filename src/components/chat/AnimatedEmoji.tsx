'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

// Map emoji ke unicode untuk Google Noto (100+ emoji)
const EMOJI_TO_UNICODE: Record<string, string> = {
  // Wajah & Emosi
  '😂': '1f602',
  '❤️': '2764',
  '🔥': '1f525',
  '👍': '1f44d',
  '😍': '1f60d',
  '🙏': '1f64f',
  '👏': '1f44f',
  '😭': '1f62d',
  '😘': '1f618',
  '🤔': '1f914',
  '🤨': '1f928',
  '😎': '1f60e',
  '🤡': '1f921',
  '👻': '1f47b',
  '💩': '1f4a9',
  '😀': '1f600',
  '😃': '1f603',
  '😄': '1f604',
  '😁': '1f601',
  '😆': '1f606',
  '🤣': '1f923',
  '😊': '1f60a',
  '😇': '1f607',
  '🙂': '1f642',
  '🙃': '1f643',
  '😉': '1f609',
  '😌': '1f60c',
  '🥰': '1f970',
  '😗': '1f617',
  '😙': '1f619',
  '😚': '1f61a',
  '😋': '1f60b',
  '😛': '1f61b',
  '😝': '1f61d',
  '😜': '1f61c',

  // Hewan
  '🐶': '1f436',
  '🐱': '1f431',
  '🐻': '1f43b',
  '🦊': '1f98a',
  '🐯': '1f42f',
  '🐼': '1f43c',
  '🦄': '1f984',
  '🐮': '1f42e',
  '🐷': '1f437',
  '🐍': '1f40d',
  '🐦': '1f426',
  '🦆': '1f986',

  // Makanan
  '🎉': '1f389',
  '🎂': '1f382',
  '🍕': '1f355',
  '🍔': '1f354',
  '☕': '2615',
  '🍺': '1f37a',
  '🍱': '1f371',
  '🍣': '1f363',
  '🍟': '1f35f',
  '🍧': '1f367',
  '🍪': '1f36a',
  '🍫': '1f36b',

  // Objek
  '🎵': '1f3b5',
  '💡': '1f4a1',
  '🎁': '1f381',
  '💯': '1f4af',
  '🚀': '1f680',
  '📢': '1f4e2',
  '🎮': '1f3ae',
  '📱': '1f4f1',
  '💻': '1f4bb',
  '💣': '1f4a3',
  '💎': '1f48e',
  '🔒': '1f512',
  '🔑': '1f511',
  '🔔': '1f514',
  '⏰': '23f0',

  // Tangan
  '👋': '1f44b',
  '✌️': '270c',
  '👌': '1f44c',
  '👐': '1f450',
  '🙌': '1f64c',
  '👊': '1f44a',
  '✋': '270b',
  '🤚': '1f91a',
  '🖐': '1f590',
  '🖕': '1f595',
  '👎': '1f44e',

  // Alam
  '☀️': '2600',
  '🌙': '1f319',
  '⭐': '2b50',
  '🌧️': '1f327',
  '⚡': '26a1',
  '🌈': '1f308',
  '🌊': '1f30a',
  '❄️': '2744',
  '☁️': '2601',
  '🌤': '1f324',
  '🌪': '1f32a',
};

interface AnimatedEmojiProps {
  emoji: string;
  className?: string;
}

export default function AnimatedEmoji({ emoji, className = '' }: AnimatedEmojiProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [animationData, setAnimationData] = useState<Record<string, unknown> | null>(null);
  const [hasAnimation, setHasAnimation] = useState(false);
  const loadAttempted = useRef(false);

  const unicode = EMOJI_TO_UNICODE[emoji];

  useEffect(() => {
    // Hanya load animasi jika emoji ada di map dan sedang hover
    if (!unicode || !isHovered || loadAttempted.current) return;

    loadAttempted.current = true;

    const loadAnimation = async () => {
      try {
        const response = await fetch(
          `https://fonts.gstatic.com/s/e/notoemoji/latest/${unicode}/lottie.json`
        );
        if (response.ok) {
          const data = await response.json();
          setAnimationData(data);
          setHasAnimation(true);
        }
      } catch {
        // Gagal load = tidak ada animasi
        setHasAnimation(false);
      }
    };

    loadAnimation();
  }, [unicode, isHovered]);

  // Jika tidak ada unicode mapping atau tidak ada animasi, tampilkan static saja
  if (!unicode) {
    return <span className={className}>{emoji}</span>;
  }

  return (
    <span
      className={`inline-flex cursor-pointer select-none items-center justify-center ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '1.2em',
        height: '1.2em',
        position: 'relative',
        verticalAlign: 'middle',
        margin: '0 1px',
      }}
    >
      {/* Static Emoji (base layer) */}
      <span
        className="absolute inset-0 flex items-center justify-center"
        style={{
          opacity: isHovered && hasAnimation ? 0 : 1,
          transition: 'opacity 0.1s ease',
          fontSize: '1em',
          lineHeight: 1,
        }}
      >
        {emoji as string}
      </span>

      {/* Animated Lottie (overlay saat hover) */}
      {isHovered && hasAnimation && animationData && (
        <span
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: 'scale(1.3)', // Sedikit lebih besar agar terlihat
            zIndex: 10,
          }}
        >
          <Lottie
            animationData={animationData}
            loop={true}
            autoplay={true}
            style={{
              width: '100%',
              height: '100%',
            }}
          />
        </span>
      )}
    </span>
  );
}

// Helper untuk parse text dengan emoji
export function parseEmojiText(text: string): React.ReactNode[] {
  if (!text) return [];

  // Regex untuk match emoji Unicode
  const emojiRegex =
    /([\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}]|[\u{2B06}]|[\u{2B07}]|[\u{2B05}]|[\u{27A1}]|[\u{2194}-\u{2199}]|[\u{21AA}]|[\u{21A9}]|[\u{1F201}]|[\u{1F202}]|[\u{1F21A}]|[\u{1F232}]|[\u{1F251}]|[\u{1F3FB}-\u{1F3FF}]|[\u{2764}]|[\u{2763}]|[\u{1F970}]|[\u{1F9E1}]|[\u{1F90D}]|[\u{1F90E}]|[\u{1F90F}]|[\u{1F918}]|[\u{1F919}]|[\u{1F91A}]|[\u{1F91B}]|[\u{1F91C}]|[\u{1F91D}]|[\u{1F91E}]|[\u{1F91F}]|[\u{1F920}]|[\u{1F921}]|[\u{1F922}]|[\u{1F923}]|[\u{1F924}]|[\u{1F925}]|[\u{1F926}]|[\u{1F927}]|[\u{1F928}]|[\u{1F929}]|[\u{1F92A}]|[\u{1F92B}]|[\u{1F92C}]|[\u{1F92D}]|[\u{1F92E}]|[\u{1F92F}]|[\u{1F930}]|[\u{1F931}]|[\u{1F932}]|[\u{1F933}]|[\u{1F934}]|[\u{1F935}]|[\u{1F936}]|[\u{1F937}]|[\u{1F938}]|[\u{1F939}]|[\u{1F93A}]|[\u{1F93B}]|[\u{1F93C}]|[\u{1F93D}]|[\u{1F93E}]|[\u{1F940}]|[\u{1F941}]|[\u{1F942}]|[\u{1F943}]|[\u{1F944}]|[\u{1F945}]|[\u{1F947}]|[\u{1F948}]|[\u{1F949}]|[\u{1F94A}]|[\u{1F94B}]|[\u{1F94C}]|[\u{1F94D}]|[\u{1F94E}]|[\u{1F94F}]|[\u{1F950}]|[\u{1F951}]|[\u{1F952}]|[\u{1F953}]|[\u{1F954}]|[\u{1F955}]|[\u{1F956}]|[\u{1F957}]|[\u{1F958}]|[\u{1F959}]|[\u{1F95A}]|[\u{1F95B}]|[\u{1F95C}]|[\u{1F95D}]|[\u{1F95E}]|[\u{1F95F}]|[\u{1F960}]|[\u{1F961}]|[\u{1F962}]|[\u{1F963}]|[\u{1F964}]|[\u{1F965}]|[\u{1F966}]|[\u{1F967}]|[\u{1F968}]|[\u{1F969}]|[\u{1F96A}]|[\u{1F96B}]|[\u{1F96C}]|[\u{1F96D}]|[\u{1F96E}]|[\u{1F96F}]|[\u{1F970}]|[\u{1F971}]|[\u{1F972}]|[\u{1F973}]|[\u{1F974}]|[\u{1F975}]|[\u{1F976}]|[\u{1F977}]|[\u{1F978}]|[\u{1F979}]|[\u{1F97A}]|[\u{1F97B}]|[\u{1F97C}]|[\u{1F97D}]|[\u{1F97E}]|[\u{1F97F}]|[\u{1F980}]|[\u{1F981}]|[\u{1F982}]|[\u{1F983}]|[\u{1F984}]|[\u{1F985}]|[\u{1F986}]|[\u{1F987}]|[\u{1F988}]|[\u{1F989}]|[\u{1F98A}]|[\u{1F98B}]|[\u{1F98C}]|[\u{1F98D}]|[\u{1F98E}]|[\u{1F98F}]|[\u{1F990}]|[\u{1F991}]|[\u{1F992}]|[\u{1F993}]|[\u{1F994}]|[\u{1F995}]|[\u{1F996}]|[\u{1F997}]|[\u{1F998}]|[\u{1F999}]|[\u{1F99A}]|[\u{1F99B}]|[\u{1F99C}]|[\u{1F99D}]|[\u{1F99E}]|[\u{1F99F}]|[\u{1F9A0}]|[\u{1F9A1}]|[\u{1F9A2}]|[\u{1F9A3}]|[\u{1F9A4}]|[\u{1F9A5}]|[\u{1F9A6}]|[\u{1F9A7}]|[\u{1F9A8}]|[\u{1F9A9}]|[\u{1F9AA}]|[\u{1F9AB}]|[\u{1F9AC}]|[\u{1F9AD}]|[\u{1F9AE}]|[\u{1F9AF}]|[\u{1F9B0}]|[\u{1F9B1}]|[\u{1F9B2}]|[\u{1F9B3}]|[\u{1F9B4}]|[\u{1F9B5}]|[\u{1F9B6}]|[\u{1F9B7}]|[\u{1F9B8}]|[\u{1F9B9}]|[\u{1F9BA}]|[\u{1F9BB}]|[\u{1F9BC}]|[\u{1F9BD}]|[\u{1F9BE}]|[\u{1F9BF}]|[\u{1F9C0}]|[\u{1F9C1}]|[\u{1F9C2}]|[\u{1F9C3}]|[\u{1F9C4}]|[\u{1F9C5}]|[\u{1F9C6}]|[\u{1F9C7}]|[\u{1F9C8}]|[\u{1F9C9}]|[\u{1F9CA}]|[\u{1F9CB}]|[\u{1F9CC}]|[\u{1F9CD}]|[\u{1F9CE}]|[\u{1F9CF}]|[\u{1F9D0}]|[\u{1F9D1}]|[\u{1F9D2}]|[\u{1F9D3}]|[\u{1F9D4}]|[\u{1F9D5}]|[\u{1F9D6}]|[\u{1F9D7}]|[\u{1F9D8}]|[\u{1F9D9}]|[\u{1F9DA}]|[\u{1F9DB}]|[\u{1F9DC}]|[\u{1F9DD}]|[\u{1F9DE}]|[\u{1F9DF}]|[\u{1F9E0}]|[\u{1F9E1}]|[\u{1F9E2}]|[\u{1F9E3}]|[\u{1F9E4}]|[\u{1F9E5}]|[\u{1F9E6}]|[\u{1F9E7}]|[\u{1F9E8}]|[\u{1F9E9}]|[\u{1F9EA}]|[\u{1F9EB}]|[\u{1F9EC}]|[\u{1F9ED}]|[\u{1F9EE}]|[\u{1F9EF}]|[\u{1F9F0}]|[\u{1F9F1}]|[\u{1F9F2}]|[\u{1F9F3}]|[\u{1F9F4}]|[\u{1F9F5}]|[\u{1F9F6}]|[\u{1F9F7}]|[\u{1F9F8}]|[\u{1F9F9}]|[\u{1F9FA}]|[\u{1F9FB}]|[\u{1F9FC}]|[\u{1F9FD}]|[\u{1F9FE}]|[\u{1F9FF}]|[\u{1FA70}]|[\u{1FA71}]|[\u{1FA72}]|[\u{1FA73}]|[\u{1FA74}]|[\u{1FA75}]|[\u{1FA76}]|[\u{1FA77}]|[\u{1FA78}]|[\u{1FA79}]|[\u{1FA7A}]|[\u{1FA80}]|[\u{1FA81}]|[\u{1FA82}]|[\u{1FA83}]|[\u{1FA84}]|[\u{1FA85}]|[\u{1FA86}]|[\u{1FA90}]|[\u{1FA91}]|[\u{1FA92}]|[\u{1FA93}]|[\u{1FA94}]|[\u{1FA95}]|[\u{1FA96}]|[\u{1FA97}]|[\u{1FA98}]|[\u{1FA99}]|[\u{1FA9A}]|[\u{1FA9B}]|[\u{1FA9C}]|[\u{1FA9D}]|[\u{1FA9E}]|[\u{1FA9F}]|[\u{1FAA0}]|[\u{1FAA1}]|[\u{1FAA2}]|[\u{1FAA3}]|[\u{1FAA4}]|[\u{1FAA5}]|[\u{1FAA6}]|[\u{1FAA7}]|[\u{1FAA8}]|[\u{1FAA9}]|[\u{1FAAA}]|[\u{1FAAB}]|[\u{1FAAC}]|[\u{1FAAD}]|[\u{1FAAE}]|[\u{1FAAF}]|[\u{1FAB0}]|[\u{1FAB1}]|[\u{1FAB2}]|[\u{1FAB3}]|[\u{1FAB4}]|[\u{1FAB5}]|[\u{1FAB6}]|[\u{1FAB7}]|[\u{1FAB8}]|[\u{1FAB9}]|[\u{1FABA}]|[\u{1FABB}]|[\u{1FABC}]|[\u{1FABD}]|[\u{1FABE}]|[\u{1FABF}]|[\u{1FAC0}]|[\u{1FAC1}]|[\u{1FAC2}]|[\u{1FAC3}]|[\u{1FAC4}]|[\u{1FAC5}]|[\u{1FAC6}]|[\u{1FAC7}]|[\u{1FAC8}]|[\u{1FAC9}]|[\u{1FACA}]|[\u{1FACB}]|[\u{1FACC}]|[\u{1FACD}]|[\u{1FACE}]|[\u{1FACF}]|[\u{1FAD0}]|[\u{1FAD1}]|[\u{1FAD2}]|[\u{1FAD3}]|[\u{1FAD4}]|[\u{1FAD5}]|[\u{1FAD6}]|[\u{1FAD7}]|[\u{1FAD8}]|[\u{1FAD9}]|[\u{1FADA}]|[\u{1FADB}]|[\u{1FADC}]|[\u{1FADD}]|[\u{1FADE}]|[\u{1FADF}]|[\u{1FAE0}]|[\u{1FAE1}]|[\u{1FAE2}]|[\u{1FAE3}]|[\u{1FAE4}]|[\u{1FAE5}]|[\u{1FAE6}]|[\u{1FAE7}]|[\u{1FAE8}]|[\u{1FAE9}]|[\u{1FAF0}]|[\u{1FAF1}]|[\u{1FAF2}]|[\u{1FAF3}]|[\u{1FAF4}]|[\u{1FAF5}]|[\u{1FAF6}]|[\u{1FAF7}]|[\u{1FAF8}]|[\u{1FAF9}]|[\u{1FAFA}]|[\u{1FAFB}]|[\u{1FAFC}]|[\u{1FAFD}]|[\u{1FAFE}]|[\u{1FAFF}]|[\u{00A9}]|[\u{00AE}]|[\u{2122}]|[\u{3030}]|[\u{303D}])/gu;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = emojiRegex.exec(text)) !== null) {
    // Text sebelum emoji
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Emoji dengan animasi
    const emoji = match[1] as string;
    parts.push(<AnimatedEmoji key={`emoji-${match.index}`} emoji={emoji} />);

    lastIndex = match.index + match[0].length;
  }

  // Sisa text setelah emoji terakhir
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}
