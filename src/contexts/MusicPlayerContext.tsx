'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useOSMedia } from '@/components/os/context/OSSystemContext';

interface YouTubePlayer {
  unMute?: () => void;
  setVolume?: (volume: number) => void;
  loadVideoById: (videoId: string) => void;
  cueVideoById?: (videoId: string) => void;
  playVideo: () => void;
  pauseVideo?: () => void;
  getCurrentTime?: () => number;
  getDuration?: () => number;
  getVideoUrl?: () => string;
  destroy?: () => void;
}

interface YouTubePlayerEvent {
  target: YouTubePlayer;
  data?: number;
}

interface YouTubePlayerConfig {
  height: string;
  width: string;
  videoId: string;
  playerVars: Record<string, string | number>;
  events: {
    onReady: (event: YouTubePlayerEvent) => void;
    onStateChange: (event: YouTubePlayerEvent) => void;
  };
}

interface YouTubeIframeApi {
  Player: new (elementId: string, config: YouTubePlayerConfig) => YouTubePlayer;
}

declare global {
  interface Window {
    YT?: YouTubeIframeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  duration: number;
  src: string;
  thumbnail?: string;
  source?: 'local' | 'youtube';
}

interface MusicPlayerContextType {
  tracks: MusicTrack[];
  currentTrack: MusicTrack | null;
  currentIndex: number;
  isPlaying: boolean;
  position: number;
  duration: number;
  progress: number;
  playerVolume: number;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  selectTrack: (index: number) => void;
  setPlayerVolume: (volume: number) => void;
  selectCustomTrack?: (track: MusicTrack, queue?: MusicTrack[]) => void;
  isLooping: boolean;
  isShuffling: boolean;
  toggleLoop: () => void;
  toggleShuffle: () => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

function clampVolume(value: number) {
  return Math.max(0, Math.min(100, value));
}

export function MusicPlayerProvider({ children }: { children: React.ReactNode }) {
  const { volume: systemVolume } = useOSMedia();
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playerVolume, setPlayerVolumeState] = useState(60);
  const [isLooping, setIsLooping] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);
  const isLoopingRef = useRef(false);
  const isShufflingRef = useRef(false);
  const currentTrack = tracks[currentIndex] ?? null;

  const currentTrackRef = useRef<MusicTrack | null>(currentTrack);
  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  useEffect(() => {
    isLoopingRef.current = isLooping;
  }, [isLooping]);

  useEffect(() => {
    isShufflingRef.current = isShuffling;
  }, [isShuffling]);

  const nextRef = useRef<() => void>(() => {});
  const playRef = useRef<() => void>(() => {});

  // YouTube Player State
  const ytPlayerRef = useRef<YouTubePlayer | null>(null);
  const ytContainerId = 'hidden-youtube-player';

  const ensureAudio = useCallback(() => {
    if (typeof window === 'undefined') return null;

    if (!audioRef.current) {
      const audio = new Audio();
      audio.preload = 'metadata';
      audio.loop = isLoopingRef.current;
      audioRef.current = audio;
    }

    return audioRef.current;
  }, []);

  const ensureYoutube = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (ytPlayerRef.current) return;

    let container = document.getElementById(ytContainerId);
    if (!container) {
      container = document.createElement('div');
      container.id = ytContainerId;
      container.style.position = 'absolute';
      container.style.width = '200px';
      container.style.height = '200px';
      container.style.opacity = '0.01';
      container.style.pointerEvents = 'none';
      container.style.left = '-9999px';
      container.style.top = '0px';
      document.body.appendChild(container);
    }

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      if (ytPlayerRef.current) return;
      if (!window.YT?.Player) return;
      try {
        new window.YT.Player(ytContainerId, {
          height: '200',
          width: '200',
          videoId: '',
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            rel: 0,
            showinfo: 0,
            modestbranding: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event) => {
              ytPlayerRef.current = event.target;
              try {
                if (typeof event.target.unMute === 'function') {
                  event.target.unMute();
                }
                const combinedVolume = (systemVolume / 100) * (playerVolume / 100);
                if (typeof event.target.setVolume === 'function') {
                  event.target.setVolume(combinedVolume * 100);
                }
              } catch (e) {
                console.warn('Failed to set initial YT volume/unmute:', e);
              }
              
              const isYt = currentTrackRef.current && (currentTrackRef.current.src === 'youtube' || currentTrackRef.current.source === 'youtube');
              if (isPlayingRef.current && isYt && currentTrackRef.current) {
                event.target.loadVideoById(currentTrackRef.current.id);
                event.target.playVideo();
              }
            },
            onStateChange: (event) => {
              if (event.data === 1) {
                setIsPlaying(true);
              } else if (event.data === 2) {
                setIsPlaying(false);
              } else if (event.data === 0) {
                setIsPlaying(false);
                setTimeout(() => {
                  if (isLoopingRef.current) {
                    playRef.current();
                  } else {
                    nextRef.current();
                  }
                }, 500);
              }
            }
          }
        });
      } catch (err) {
        console.error('Failed to init YT player:', err);
      }
    };

    if (window.YT?.Player) {
      initPlayer();
    } else {
      const previousCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (previousCallback) previousCallback();
        initPlayer();
      };
    }
  }, [playerVolume, systemVolume]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Sync loop setting on active audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.loop = isLooping;
    }
  }, [isLooping]);

  // Local audio event listeners
  useEffect(() => {
    const audio = ensureAudio();
    if (!audio) return;

    const handleTimeUpdate = () => {
      const isYt = currentTrackRef.current && (currentTrackRef.current.src === 'youtube' || currentTrackRef.current.source === 'youtube');
      if (currentTrackRef.current && !isYt) setPosition(audio.currentTime || 0);
    };

    const handleLoadedMetadata = () => {
      const isYt = currentTrackRef.current && (currentTrackRef.current.src === 'youtube' || currentTrackRef.current.source === 'youtube');
      if (currentTrackRef.current && !isYt) {
        setDuration(Number.isFinite(audio.duration) ? audio.duration : currentTrackRef.current.duration);
      }
    };

    const handlePlay = () => {
      const isYt = currentTrackRef.current && (currentTrackRef.current.src === 'youtube' || currentTrackRef.current.source === 'youtube');
      if (!isYt) setIsPlaying(true);
    };

    const handlePause = () => {
      const isYt = currentTrackRef.current && (currentTrackRef.current.src === 'youtube' || currentTrackRef.current.source === 'youtube');
      if (!isYt) setIsPlaying(false);
    };

    const handleEnded = () => {
      const isYt = currentTrackRef.current && (currentTrackRef.current.src === 'youtube' || currentTrackRef.current.source === 'youtube');
      if (!isYt) {
        setIsPlaying(false);
        setTimeout(() => {
          if (isLoopingRef.current) {
            playRef.current();
          } else {
            nextRef.current();
          }
        }, 500);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [ensureAudio]);

  // YouTube audio duration/time updates
  useEffect(() => {
    const isYt = currentTrack && (currentTrack.src === 'youtube' || currentTrack.source === 'youtube');
    if (!isYt) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;
    if (isPlaying) {
      intervalId = setInterval(() => {
        if (
          ytPlayerRef.current &&
          typeof ytPlayerRef.current.getCurrentTime === 'function' &&
          typeof ytPlayerRef.current.getDuration === 'function'
        ) {
          try {
            const time = ytPlayerRef.current.getCurrentTime();
            const dur = ytPlayerRef.current.getDuration();
            setPosition(time || 0);
            if (dur > 0) {
              setDuration(dur);
            }
          } catch {}
        }
      }, 500);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPlaying, currentTrack]);

  // Set volumes
  useEffect(() => {
    const combinedVolume = (systemVolume / 100) * (playerVolume / 100);
    const audio = audioRef.current;
    if (audio) {
      audio.volume = combinedVolume;
    }
    if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
      try {
        ytPlayerRef.current.setVolume(combinedVolume * 100);
      } catch {}
    }
  }, [playerVolume, systemVolume]);

  const play = useCallback(() => {
    if (!currentTrack) return;
    const isYt = currentTrack.src === 'youtube' || currentTrack.source === 'youtube';
    if (isYt) {
      const audio = audioRef.current;
      audio?.pause();

      ensureYoutube();
      if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
        try {
          if (typeof ytPlayerRef.current.unMute === 'function') {
            ytPlayerRef.current.unMute();
          }
          const combinedVolume = (systemVolume / 100) * (playerVolume / 100);
          if (typeof ytPlayerRef.current.setVolume === 'function') {
            ytPlayerRef.current.setVolume(combinedVolume * 100);
          }
          const videoUrl = ytPlayerRef.current.getVideoUrl ? ytPlayerRef.current.getVideoUrl() : '';
          if (!videoUrl || !videoUrl.includes(currentTrack.id)) {
            ytPlayerRef.current.loadVideoById(currentTrack.id);
          } else {
            ytPlayerRef.current.playVideo();
          }
          setIsPlaying(true);
        } catch (e) {
          console.error(e);
        }
      } else {
        setIsPlaying(true);
      }
    } else {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
        try {
          ytPlayerRef.current.pauseVideo();
        } catch {}
      }

      const audio = ensureAudio();
      if (!audio) return;
      audio.loop = isLoopingRef.current;
      const absoluteSrc = window.location.origin + currentTrack.src;
      if (audio.src !== absoluteSrc && !audio.src.endsWith(currentTrack.src)) {
        audio.src = currentTrack.src;
      }
      void audio.play().catch(() => {
        setIsPlaying(false);
      });
    }
  }, [currentTrack, ensureAudio, ensureYoutube, playerVolume, systemVolume]);

  const pause = useCallback(() => {
    if (!currentTrack) return;
    const isYt = currentTrack.src === 'youtube' || currentTrack.source === 'youtube';
    if (isYt) {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
        try {
          ytPlayerRef.current.pauseVideo();
        } catch {}
      }
    } else {
      const audio = audioRef.current;
      audio?.pause();
    }
    setIsPlaying(false);
  }, [currentTrack]);

  const selectTrack = useCallback((index: number) => {
    if (tracks.length === 0) return;
    const nextIndex = ((index % tracks.length) + tracks.length) % tracks.length;
    const nextTrack = tracks[nextIndex];
    if (!nextTrack) return;
    const audio = audioRef.current;

    setPosition(0);
    setDuration(nextTrack.duration || 3);
    setCurrentIndex(nextIndex);

    if (audio) {
      audio.currentTime = 0;
    }

    const isYt = nextTrack.src === 'youtube' || nextTrack.source === 'youtube';
    if (isYt) {
      audio?.pause();
      ensureYoutube();
      if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
        try {
          if (typeof ytPlayerRef.current.unMute === 'function') {
            ytPlayerRef.current.unMute();
          }
          const combinedVolume = (systemVolume / 100) * (playerVolume / 100);
          if (typeof ytPlayerRef.current.setVolume === 'function') {
            ytPlayerRef.current.setVolume(combinedVolume * 100);
          }
          if (isPlayingRef.current) {
            ytPlayerRef.current.loadVideoById(nextTrack.id);
            ytPlayerRef.current.playVideo();
          } else if (typeof ytPlayerRef.current.cueVideoById === 'function') {
            ytPlayerRef.current.cueVideoById(nextTrack.id);
          }
        } catch {}
      }
    } else {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
        try {
          ytPlayerRef.current.pauseVideo();
        } catch {}
      }

      if (audio) {
        audio.src = nextTrack.src;
        audio.load();
        if (isPlayingRef.current) {
          void audio.play().catch(() => {
            setIsPlaying(false);
          });
        }
      }
    }
  }, [tracks, ensureYoutube, playerVolume, systemVolume]);

  const selectCustomTrack = useCallback((track: MusicTrack, queue?: MusicTrack[]) => {
    const incomingQueue = queue && queue.length > 0 ? queue : [track];
    const orderedQueue = incomingQueue.some((item) => item.id === track.id)
      ? incomingQueue
      : [track, ...incomingQueue];
    const shouldReplaceQueue = Boolean(queue?.length);
    const updatedTracks: MusicTrack[] = shouldReplaceQueue ? [] : [...tracks];
    let nextIndex = shouldReplaceQueue ? -1 : updatedTracks.findIndex((item) => item.id === track.id);

    for (const queuedTrack of orderedQueue) {
      const existingIndex = updatedTracks.findIndex((item) => item.id === queuedTrack.id);
      if (existingIndex === -1) {
        updatedTracks.push(queuedTrack);
        if (queuedTrack.id === track.id) {
          nextIndex = updatedTracks.length - 1;
        }
      } else if (queuedTrack.id === track.id) {
        nextIndex = existingIndex;
      }
    }

    if (nextIndex === -1) {
      updatedTracks.push(track);
      nextIndex = updatedTracks.length - 1;
    }

    setTracks(updatedTracks);
    setCurrentIndex(nextIndex);

    setPosition(0);
    setDuration(track.duration || 3);

    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = 0;
      audio.pause();
    }

    ensureYoutube();
    if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
      try {
        if (typeof ytPlayerRef.current.unMute === 'function') {
          ytPlayerRef.current.unMute();
        }
        const combinedVolume = (systemVolume / 100) * (playerVolume / 100);
        if (typeof ytPlayerRef.current.setVolume === 'function') {
          ytPlayerRef.current.setVolume(combinedVolume * 100);
        }
        ytPlayerRef.current.loadVideoById(track.id);
        ytPlayerRef.current.playVideo();
        setIsPlaying(true);
      } catch {}
    } else {
      setIsPlaying(true);
    }
  }, [tracks, ensureYoutube, playerVolume, systemVolume]);

  const next = useCallback(() => {
    if (tracks.length === 0) return;
    if (isShufflingRef.current) {
      if (tracks.length > 1) {
        let randomIndex = currentIndex;
        while (randomIndex === currentIndex) {
          randomIndex = Math.floor(Math.random() * tracks.length);
        }
        selectTrack(randomIndex);
      } else {
        selectTrack(currentIndex);
      }
    } else {
      selectTrack(currentIndex + 1);
    }
  }, [currentIndex, tracks, selectTrack]);

  const previous = useCallback(() => {
    if (tracks.length === 0) return;
    if (isShufflingRef.current) {
      if (tracks.length > 1) {
        let randomIndex = currentIndex;
        while (randomIndex === currentIndex) {
          randomIndex = Math.floor(Math.random() * tracks.length);
        }
        selectTrack(randomIndex);
      } else {
        selectTrack(currentIndex);
      }
    } else {
      selectTrack(currentIndex - 1);
    }
  }, [currentIndex, tracks, selectTrack]);

  useEffect(() => {
    nextRef.current = next;
  }, [next]);

  useEffect(() => {
    playRef.current = play;
  }, [play]);

  const toggle = useCallback(() => {
    if (isPlayingRef.current) {
      pause();
    } else {
      play();
    }
  }, [pause, play]);

  const setPlayerVolume = useCallback((volume: number) => {
    setPlayerVolumeState(clampVolume(volume));
  }, []);

  const toggleLoop = useCallback(() => {
    setIsLooping((prev) => !prev);
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffling((prev) => !prev);
  }, []);

  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.src = '';
      }
      audioRef.current = null;
      if (ytPlayerRef.current && typeof ytPlayerRef.current.destroy === 'function') {
        try {
          ytPlayerRef.current.destroy();
        } catch {}
      }
      ytPlayerRef.current = null;
    };
  }, []);

  const safeDuration = duration > 0 ? duration : (currentTrack?.duration || 0);
  const value = useMemo<MusicPlayerContextType>(
    () => ({
      tracks,
      currentTrack,
      currentIndex,
      isPlaying,
      position,
      duration: safeDuration,
      progress: safeDuration > 0 ? Math.min(position / safeDuration, 1) : 0,
      playerVolume,
      play,
      pause,
      toggle,
      next,
      previous,
      selectTrack,
      setPlayerVolume,
      selectCustomTrack,
      isLooping,
      isShuffling,
      toggleLoop,
      toggleShuffle,
    }),
    [
      tracks,
      currentTrack,
      currentIndex,
      isPlaying,
      position,
      safeDuration,
      playerVolume,
      play,
      pause,
      toggle,
      next,
      previous,
      selectTrack,
      setPlayerVolume,
      selectCustomTrack,
      isLooping,
      isShuffling,
      toggleLoop,
      toggleShuffle,
    ]
  );

  return <MusicPlayerContext.Provider value={value}>{children}</MusicPlayerContext.Provider>;
}

export function useMusicPlayer(): MusicPlayerContextType {
  const ctx = useContext(MusicPlayerContext);
  if (!ctx) throw new Error('useMusicPlayer must be used within MusicPlayerProvider');
  return ctx;
}
