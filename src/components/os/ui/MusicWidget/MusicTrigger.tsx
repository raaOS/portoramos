import React from 'react';
import { Music2, Pause } from 'lucide-react';
import { MusicTrack } from '@/contexts/MusicPlayerContext';
import { useDictionary } from '@/contexts/LanguageContext';

type MusicTriggerProps = {
  isOpen: boolean;
  isPlaying: boolean;
  currentTrack: MusicTrack | null;
  onToggle: (event: React.MouseEvent) => void;
};

export default function MusicTrigger({ isOpen, isPlaying, currentTrack, onToggle }: MusicTriggerProps) {
  const t = useDictionary();

  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex h-5 !min-h-0 !min-w-0 max-w-[8.5rem] items-center gap-1 rounded-full bg-black/5 px-1.5 text-[9px] font-semibold leading-none text-black/70 transition-colors hover:bg-black/10"
      aria-expanded={isOpen}
      aria-haspopup="dialog"
      title={t.music.nowPlaying}
    >
      {isPlaying ? (
        <Pause className="h-3 w-3 shrink-0 text-emerald-600" />
      ) : (
        <Music2 className="h-3 w-3 shrink-0" />
      )}
      <span className="hidden max-w-[5.75rem] truncate xl:inline">
        {isPlaying && currentTrack ? currentTrack.title : t.music.title}
      </span>
    </button>
  );
}
