import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, X, Music2, SkipBack, Play, Pause, SkipForward, Shuffle, Repeat } from 'lucide-react';
import { MusicTrack } from '@/contexts/MusicPlayerContext';
import { formatTime } from './utils';
import { slideVariants } from './animations';
import { useDictionary } from '@/contexts/LanguageContext';

type PlayerModeProps = {
  currentTrack: MusicTrack | null;
  activeTrack: MusicTrack | null;
  direction: number;
  activeArtwork: string | null;
  activeArtworkFailed: boolean;
  titleText: string;
  artistText: string;
  activeProgress: number;
  position: number;
  activeDuration: number;
  isShuffling: boolean;
  isLooping: boolean;
  isActiveTrackPlaying: boolean;
  onSetViewMode: (mode: 'init' | 'results' | 'player') => void;
  onCloseWidget: () => void;
  onSetThumbnailErrorTrackId: (id: string) => void;
  onToggleShuffle: () => void;
  onPrevious: () => void;
  onPrimaryToggle: () => void;
  onNext: () => void;
  onToggleLoop: () => void;
};

export default function PlayerMode({
  currentTrack,
  activeTrack,
  direction,
  activeArtwork,
  activeArtworkFailed,
  titleText,
  artistText,
  activeProgress,
  position,
  activeDuration,
  isShuffling,
  isLooping,
  isActiveTrackPlaying,
  onSetViewMode,
  onCloseWidget,
  onSetThumbnailErrorTrackId,
  onToggleShuffle,
  onPrevious,
  onPrimaryToggle,
  onNext,
  onToggleLoop,
}: PlayerModeProps) {
  const t = useDictionary();

  return (
    <motion.div
      key="player-mode"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="flex flex-col w-full h-full"
    >
      <div className="flex items-center justify-between w-full pb-2 shrink-0">
        <button
          type="button"
          onClick={() => onSetViewMode('results')}
          className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition group"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Kembali</span>
        </button>
      </div>

      <div className="flex flex-col items-center justify-center w-full flex-1 mt-2 relative">
        <motion.div
          layoutId="cover-container"
          className="w-[160px] h-[160px] rounded-none overflow-hidden shadow-2xl border border-black/5 dark:border-white/10 relative shrink-0"
          style={{ perspective: 800 }}
        >
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentTrack?.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                y: { type: 'spring', stiffness: 220, damping: 24 },
                scale: { duration: 0.25 },
                opacity: { duration: 0.2 },
              }}
              style={{ transformStyle: 'preserve-3d' }}
              className="absolute inset-0 w-full h-full"
            >
              {activeArtwork && !activeArtworkFailed ? (
                <img
                  src={activeArtwork}
                  alt=""
                  onError={() => activeTrack?.id && onSetThumbnailErrorTrackId(activeTrack.id)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-zinc-200 dark:bg-zinc-950 text-zinc-500 dark:text-white/60">
                  <Music2 className="h-10 w-10" />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.25 }}
          className="w-full flex flex-col items-center mt-3 shrink-0"
        >
          <div className="text-center w-full px-2">
            <div
              className="text-[12.5px] font-black text-zinc-900 dark:text-white truncate max-w-[240px] mx-auto"
              title={titleText}
            >
              {titleText}
            </div>
            <div className="text-[10px] text-zinc-500 dark:text-white/50 font-bold truncate mt-0.5 max-w-[240px] mx-auto">
              {artistText}
            </div>
          </div>

          <div className="w-[240px] mt-2.5">
            <div className="h-[3px] bg-black/10 dark:bg-white/12 rounded-full overflow-hidden w-full cursor-pointer relative">
              <motion.div
                className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] rounded-full"
                animate={{ width: `${Math.round(activeProgress * 100)}%` }}
                transition={{ duration: 0.28 }}
              />
            </div>
            <div className="flex justify-between items-center text-[8.5px] text-zinc-500 dark:text-white/45 font-mono mt-1">
              <span>{formatTime(position)}</span>
              <span>{formatTime(activeDuration || 0)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-1.5 justify-center w-full">
            <button
              type="button"
              onClick={onToggleShuffle}
              className={`flex h-7 w-7 items-center justify-center rounded-full transition active:scale-90 ${
                isShuffling
                  ? 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300'
                  : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
              title="Shuffle"
            >
              <Shuffle className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onPrevious}
              className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/10 hover:text-zinc-950 dark:hover:text-white transition active:scale-90"
              title={t.common.previous}
            >
              <SkipBack className="h-4.5 w-4.5 fill-current" />
            </button>
            <button
              type="button"
              onClick={onPrimaryToggle}
              className="flex h-9.5 w-9.5 items-center justify-center rounded-full bg-black/5 dark:bg-white/12 border border-black/10 dark:border-white/20 text-zinc-900 dark:text-white hover:bg-black/10 dark:hover:bg-white/18 transition active:scale-90 shadow-md"
              title={isActiveTrackPlaying ? t.common.pause : t.common.play}
            >
              {isActiveTrackPlaying ? (
                <Pause className="h-4.5 w-4.5 fill-current" />
              ) : (
                <Play className="ml-0.5 h-4.5 w-4.5 fill-current" />
              )}
            </button>
            <button
              type="button"
              onClick={onNext}
              className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/10 hover:text-zinc-950 dark:hover:text-white transition active:scale-90"
              title={t.common.next}
            >
              <SkipForward className="h-4.5 w-4.5 fill-current" />
            </button>
            <button
              type="button"
              onClick={onToggleLoop}
              className={`flex h-7 w-7 items-center justify-center rounded-full transition active:scale-90 ${
                isLooping
                  ? 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300'
                  : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
              title="Loop"
            >
              <Repeat className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
