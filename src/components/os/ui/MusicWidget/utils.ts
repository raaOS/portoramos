import { MusicTrack } from '@/contexts/MusicPlayerContext';

export function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
}

export function getTrackArtwork(track: MusicTrack | null) {
  if (!track) return null;
  return track.thumbnail || (track.source === 'youtube' ? `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg` : null);
}
