'use client';

import React, { useId } from 'react';
import { m } from 'motion/react';
import {
  useStartScreenBoot,
  zoomOutTransition,
  revealScaleTransition,
} from './start-screen/useStartScreenBoot';
import { RamosWordmarkSvg } from './start-screen/RamosWordmarkSvg';
import { ClickToEnterPrompt } from './start-screen/ClickToEnterPrompt';

interface StartScreenProps {
  onStart: () => void;
  isActive: boolean;
  onReady?: () => void;
  onReveal?: () => void;
}

const StartScreen = ({ onStart, isActive, onReady, onReveal }: StartScreenProps) => {
  const { screenState, handleClick } = useStartScreenBoot({
    onStart,
    onReady,
    onReveal,
  });

  const maskId = `hollow-o-mask-${useId().replace(/:/g, '')}`;

  if (!isActive || screenState === 'done') return null;

  const isZoomedOut = screenState !== 'idle';

  return (
    <m.div
      id="start-screen"
      data-testid="os-start-screen"
      data-boot-state={screenState}
      className="fixed inset-0 z-[999999] h-full w-full select-none overflow-hidden bg-transparent print:hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      onClick={screenState === 'ready' ? handleClick : undefined}
      style={{
        pointerEvents: screenState === 'glassReveal' ? 'none' : 'auto',
        cursor: screenState === 'ready' ? 'pointer' : 'default',
      }}
    >
      {/* SOLID BLACK BACKDROP */}
      <m.div
        className="absolute inset-0 z-[10000] bg-black"
        animate={{ opacity: screenState === 'glassReveal' ? 0 : 1 }}
        transition={{ duration: screenState === 'glassReveal' ? 0 : 0.5, ease: 'easeOut' }}
      />

      {/* REVEAL LAYER */}
      <m.div
        className="pointer-events-none absolute inset-0 z-[10002] overflow-hidden"
        initial={{ opacity: 1 }}
        animate={{
          scale: screenState === 'glassReveal' ? 100 : 1,
        }}
        transition={{
          scale:
            screenState === 'glassReveal'
              ? revealScaleTransition
              : { duration: 0 },
        }}
        style={{ transformOrigin: '50% 50%' }}
        data-boot-layer="reveal"
      >
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid slice"
          className="h-full w-full"
        >
          <defs>
            <mask id={maskId}>
              <rect x="0" y="0" width="100" height="100" fill="white" />
              <circle cx="50" cy="50" r="1.9" fill="black" />
            </mask>
          </defs>

          {/* Black sheet with portal hole */}
          <rect
            x="0"
            y="0"
            width="100"
            height="100"
            fill="#000000"
            mask={`url(#${maskId})`}
          />

          {/* Portal cover */}
          <m.circle
            cx="50"
            cy="50"
            r="1.9"
            fill="#000000"
            initial={{ opacity: 1 }}
            animate={{ opacity: screenState === 'glassReveal' ? 0 : 1 }}
            transition={{
              duration: screenState === 'glassReveal' ? 0.05 : 0.15,
              ease: 'easeOut',
            }}
          />

          {/* RAMOS OS WORDMARK */}
          <RamosWordmarkSvg
            isZoomedOut={isZoomedOut}
            zoomOutTransition={zoomOutTransition}
          />
        </svg>
      </m.div>

      {/* CLICK TO ENTER */}
      {screenState === 'ready' && <ClickToEnterPrompt />}
    </m.div>
  );
};

export default StartScreen;
