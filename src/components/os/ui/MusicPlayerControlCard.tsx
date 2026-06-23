'use client';

import React from 'react';
import { Pause, Play, SkipForward } from 'lucide-react';
import { useDictionary } from '@/contexts/LanguageContext';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';

export default function MusicPlayerControlCard() {
  const t = useDictionary();
  const { currentTrack, isPlaying, progress, toggle, next } = useMusicPlayer();

  return (
    <div className="rounded-xl border border-black/5 bg-white/50 p-3 dark:border-white/5 dark:bg-white/10">
      <div className="mb-3 flex items-center gap-3">
        <div
          className="relative h-9 w-9 shrink-0 rounded-full bg-zinc-950 flex items-center justify-center shadow-lg shadow-black/30 select-none overflow-hidden"
          style={{
            animation: 'spin 4s linear infinite',
            animationPlayState: isPlaying ? 'running' : 'paused',
          }}
        >
          {/* Vinyl Grooves (concentric lines) */}
          <div className="absolute inset-1 rounded-full border border-zinc-800/40" />
          <div className="absolute inset-2 rounded-full border border-zinc-900" />
          <div className="absolute inset-3.5 rounded-full border border-zinc-800/30" />
          {/* Center Label (emerald background to match theme) */}
          <div className="absolute h-3.5 w-3.5 rounded-full bg-emerald-500 flex items-center justify-center border border-zinc-950/20 shadow-inner">
            {/* Spindle hole */}
            <div className="h-1.2 w-1.2 rounded-full bg-zinc-950" />
          </div>
          {/* Vinyl reflections */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none mix-blend-overlay" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-bl from-transparent via-white/10 to-transparent pointer-events-none mix-blend-overlay" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-bold">{currentTrack ? currentTrack.title : t.music.title}</div>
          <div className="truncate text-[10px] text-gray-500 dark:text-gray-400">
            {currentTrack && isPlaying ? t.music.nowPlaying : t.music.idle}
          </div>
        </div>
        <button
          type="button"
          onClick={toggle}
          className="flex h-8 !min-h-0 w-8 !min-w-0 items-center justify-center rounded-full bg-black text-white transition-transform active:scale-95 dark:bg-white dark:text-black"
          aria-label={isPlaying ? t.common.pause : t.common.play}
        >
          {isPlaying ? (
            <Pause size={14} fill="currentColor" />
          ) : (
            <Play size={14} fill="currentColor" />
          )}
        </button>
        <button
          type="button"
          onClick={next}
          className="flex h-8 !min-h-0 w-8 !min-w-0 items-center justify-center rounded-full bg-black/5 text-black transition-colors hover:bg-black/10 dark:bg-white/10 dark:text-white"
          aria-label={t.common.next}
        >
          <SkipForward size={14} />
        </button>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-emerald-500 transition-[width] duration-500"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
    </div>
  );
}
