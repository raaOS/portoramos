import React from 'react';
import { motion } from 'motion/react';
import { Search, X, Music2, Play, Pause } from 'lucide-react';
import { MusicTrack } from '@/contexts/MusicPlayerContext';
import { getTrackArtwork } from './utils';

type SearchModeProps = {
  viewMode: 'init' | 'results' | 'player';
  searchQuery: string;
  isSearching: boolean;
  visibleTracks: MusicTrack[];
  currentTrack: MusicTrack | null;
  activeTrack: MusicTrack | null;
  isActiveTrackPlaying: boolean;
  activeProgress: number;
  titleText: string;
  artistText: string;
  activeArtwork: string | null;
  activeArtworkFailed: boolean;
  selectedTrackId: string | null;
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClearSearch: () => void;
  onTrackSelect: (track: MusicTrack, index: number) => void;
  onPrimaryToggle: () => void;
  onSetViewMode: (mode: 'init' | 'results' | 'player') => void;
  onSetSelectedTrackId: (id: string | null) => void;
  onSetThumbnailErrorTrackId: (id: string) => void;
};

export default function SearchMode({
  viewMode,
  searchQuery,
  isSearching,
  visibleTracks,
  currentTrack,
  activeTrack,
  isActiveTrackPlaying,
  activeProgress,
  titleText,
  artistText,
  activeArtwork,
  activeArtworkFailed,
  selectedTrackId,
  onSearchChange,
  onClearSearch,
  onTrackSelect,
  onPrimaryToggle,
  onSetViewMode,
  onSetSelectedTrackId,
  onSetThumbnailErrorTrackId,
}: SearchModeProps) {
  return (
    <motion.div
      key="search-mode"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="flex flex-col w-full h-full"
    >
      <div className="relative w-full shrink-0">
        <input
          type="text"
          placeholder="Cari lagu di YouTube..."
          value={searchQuery}
          onChange={onSearchChange}
          className="h-9 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-black/5 dark:bg-white/10 pl-9 pr-9 text-[11px] font-semibold text-black dark:text-white outline-none placeholder:text-black/45 dark:placeholder:text-white/45 focus:border-zinc-300 dark:focus:border-zinc-700 focus:bg-black/8 dark:focus:bg-white/15"
        />
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40 dark:text-white/45" />
        {(searchQuery || viewMode === 'results') && (
          <button
            type="button"
            onClick={onClearSearch}
            className="absolute right-3.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-black/55 hover:bg-black/5 dark:text-white/55 dark:hover:bg-white/15 transition"
            title="Clear"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {viewMode === 'init' && currentTrack && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            onSetSelectedTrackId(currentTrack?.id ?? activeTrack?.id ?? null);
            onSetViewMode('player');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSetSelectedTrackId(currentTrack?.id ?? activeTrack?.id ?? null);
              onSetViewMode('player');
            }
          }}
          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/8 dark:hover:bg-white/15 transition w-full text-left mt-2 shadow border border-black/5 dark:border-white/5 cursor-pointer relative overflow-hidden shrink-0 group animate-in fade-in slide-in-from-top-1 duration-200"
        >
          <motion.div
            layoutId="cover-container"
            className="w-9 h-9 bg-black/25 dark:bg-black/40 shrink-0 overflow-hidden rounded-none shadow"
          >
            {activeArtwork && !activeArtworkFailed ? (
              <img
                src={activeArtwork}
                alt=""
                onError={() => activeTrack?.id && onSetThumbnailErrorTrackId(activeTrack.id)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-zinc-200 dark:bg-zinc-950 text-zinc-500 dark:text-white/50">
                <Music2 className="h-4.5 w-4.5" />
              </div>
            )}
          </motion.div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[10.5px] font-bold text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {titleText}
            </div>
            <div className="truncate text-[8.5px] text-zinc-500 dark:text-white/50 font-semibold mt-0.5">
              {artistText}
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrimaryToggle();
            }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-zinc-900 dark:text-white transition active:scale-90"
          >
            {isActiveTrackPlaying ? (
              <Pause className="h-3 w-3 fill-current" />
            ) : (
              <Play className="ml-0.5 h-3 w-3 fill-current" />
            )}
          </button>
          <div className="absolute bottom-0 inset-x-0 h-[2.5px] bg-black/5 dark:bg-white/5">
            <motion.div
              className="h-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.6)]"
              animate={{ width: `${Math.round(activeProgress * 100)}%` }}
              transition={{ duration: 0.28 }}
            />
          </div>
        </div>
      )}

      {viewMode === 'results' && (
        <div
          data-lenis-prevent
          className="flex-1 overflow-y-auto pr-1 mt-3 space-y-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-black/15 dark:[&::-webkit-scrollbar-thumb]:bg-white/15 [&::-webkit-scrollbar-thumb]:rounded-full max-h-[305px]"
        >
          {visibleTracks.length > 0 ? (
            visibleTracks.map((track, index) => {
              const isTrackPlaying = currentTrack?.id === track.id;
              const trackArtwork = getTrackArtwork(track);

              return (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => onTrackSelect(track, index)}
                  className={`flex w-full items-center gap-3 p-2 rounded-xl text-left transition ${
                    isTrackPlaying ? 'bg-black/5 dark:bg-white/15' : 'hover:bg-black/5 dark:hover:bg-white/8'
                  }`}
                >
                  <motion.div
                    layoutId={selectedTrackId === track.id ? "cover-container" : undefined}
                    className="w-10 h-10 bg-black/20 shrink-0 overflow-hidden rounded-none shadow"
                  >
                    {trackArtwork ? (
                      <img src={trackArtwork} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-zinc-200 dark:bg-zinc-950 text-zinc-500 dark:text-white/50">
                        <Music2 className="h-4 w-4" />
                      </div>
                    )}
                  </motion.div>
                  <div className="min-w-0 flex-1">
                    <div
                      className={`truncate text-[11px] font-bold ${
                        isTrackPlaying ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-800 dark:text-zinc-100'
                      }`}
                    >
                      {track.title}
                    </div>
                    <div className="truncate text-[9px] text-zinc-500 dark:text-white/50 font-semibold mt-0.5">
                      {track.artist}
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="text-[10px] text-zinc-500 dark:text-white/40 text-center py-10">
              {isSearching ? 'Mencari lagu...' : 'Tidak ada lagu dalam antrean'}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
