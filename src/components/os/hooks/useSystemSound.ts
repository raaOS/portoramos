'use client';

import { useCallback, useRef } from 'react';

// Sound configuration types
interface ToneConfig {
  type: OscillatorType;
  frequency: { start: number; end: number };
  gain: { start: number; end: number };
  duration: number;
  ramp?: 'exponential' | 'linear';
  delay?: number;
}

// Named frequency constants for readability
const FREQUENCIES = {
  POP_START: 400,
  POP_END: 100,
  OPEN_START: 200,
  OPEN_END: 600,
  CLOSE_START: 600,
  CLOSE_END: 200,
  CHIME_A4: 440,
  CHIME_CS5: 554.37,
  CHIME_E5: 659.25,
  CHIME_A5: 880,
} as const;

export const useSystemSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      )();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, []);

  /**
   * Play a single tone with configurable oscillator and gain parameters.
   * Extracts the repeated init→oscillator→gain→connect→start→stop pattern.
   */
  const playTone = useCallback(
    (config: ToneConfig) => {
      initAudio();
      const ctx = audioContextRef.current;
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = ctx.currentTime + (config.delay ?? 0);
      const ramp = config.ramp ?? 'exponential';

      osc.type = config.type;
      osc.frequency.setValueAtTime(config.frequency.start, startTime);
      if (ramp === 'exponential') {
        osc.frequency.exponentialRampToValueAtTime(
          config.frequency.end,
          startTime + config.duration
        );
      }

      gain.gain.setValueAtTime(config.gain.start, startTime);
      if (ramp === 'linear') {
        gain.gain.linearRampToValueAtTime(config.gain.end, startTime + config.duration);
      } else {
        gain.gain.exponentialRampToValueAtTime(config.gain.end, startTime + config.duration);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + config.duration);
    },
    [initAudio]
  );

  const playPop = useCallback(() => {
    playTone({
      type: 'sine',
      frequency: { start: FREQUENCIES.POP_START, end: FREQUENCIES.POP_END },
      gain: { start: 0.1, end: 0.01 },
      duration: 0.1,
    });
  }, [playTone]);

  const playOpen = useCallback(() => {
    playTone({
      type: 'triangle',
      frequency: { start: FREQUENCIES.OPEN_START, end: FREQUENCIES.OPEN_END },
      gain: { start: 0.05, end: 0.001 },
      duration: 0.3,
      ramp: 'linear',
    });
  }, [playTone]);

  const playClose = useCallback(() => {
    playTone({
      type: 'triangle',
      frequency: { start: FREQUENCIES.CLOSE_START, end: FREQUENCIES.CLOSE_END },
      gain: { start: 0.05, end: 0.001 },
      duration: 0.2,
      ramp: 'linear',
    });
  }, [playTone]);

  const playChime = useCallback(() => {
    const chimeNotes: ToneConfig[] = [
      {
        type: 'sine',
        frequency: { start: FREQUENCIES.CHIME_A4, end: FREQUENCIES.CHIME_A4 },
        gain: { start: 0.001, end: 0.01 },
        duration: 1,
        delay: 0,
      },
      {
        type: 'sine',
        frequency: { start: FREQUENCIES.CHIME_CS5, end: FREQUENCIES.CHIME_CS5 },
        gain: { start: 0.001, end: 0.01 },
        duration: 1,
        delay: 0.1,
      },
      {
        type: 'sine',
        frequency: { start: FREQUENCIES.CHIME_E5, end: FREQUENCIES.CHIME_E5 },
        gain: { start: 0.001, end: 0.01 },
        duration: 1,
        delay: 0.2,
      },
      {
        type: 'sine',
        frequency: { start: FREQUENCIES.CHIME_A5, end: FREQUENCIES.CHIME_A5 },
        gain: { start: 0.001, end: 0.01 },
        duration: 1,
        delay: 0.3,
      },
    ];

    initAudio();
    const ctx = audioContextRef.current;
    if (!ctx) return;

    // Chime has special gain envelope: ramp up then down
    for (const note of chimeNotes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = ctx.currentTime + (note.delay ?? 0);

      osc.type = note.type;
      osc.frequency.setValueAtTime(note.frequency.start, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.05, startTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 1);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 1);
    }
  }, [initAudio]);

  return { playPop, playOpen, playClose, playChime };
};
