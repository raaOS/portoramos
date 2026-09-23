'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useDictionary } from '@/contexts/LanguageContext';
import { useMusicPlayer, MusicTrack } from '@/contexts/MusicPlayerContext';
import { getTrackArtwork as getTrackArtworkUtil } from '../utils';

type MusicSearchResponse = {
  results?: MusicTrack[];
};

export function useMusicWidgetState() {
  const t = useDictionary();
  const player = useMusicPlayer();
  const {
    tracks,
    currentTrack,
    isPlaying,
    position,
    duration,
    progress,
    toggle,
    next,
    previous,
    selectTrack,
    selectCustomTrack,
    isLooping,
    isShuffling,
    toggleLoop,
    toggleShuffle,
  } = player;

  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'init' | 'results' | 'player'>('init');
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [direction, setDirection] = useState<number>(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MusicTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [thumbnailErrorTrackId, setThumbnailErrorTrackId] = useState<string | null>(null);

  const trimmedSearchQuery = searchQuery.trim();
  const isSearchMode = trimmedSearchQuery.length > 0;
  const hasSearchResults = isSearchMode && searchResults.length > 0;
  const visibleTracks = isSearchMode ? searchResults : tracks;

  const activeIndex = useMemo(() => {
    if (visibleTracks.length === 0) return -1;
    const matchingIndex = currentTrack
      ? visibleTracks.findIndex((track) => track.id === currentTrack.id)
      : -1;
    return matchingIndex >= 0 ? matchingIndex : 0;
  }, [currentTrack, visibleTracks]);

  const activeTrack = activeIndex >= 0 ? visibleTracks[activeIndex] : currentTrack;
  const activeArtwork = getTrackArtworkUtil(activeTrack);
  const activeArtworkFailed = Boolean(activeTrack?.id && thumbnailErrorTrackId === activeTrack.id);
  const isActiveTrackPlaying = Boolean(
    isPlaying && activeTrack && currentTrack?.id === activeTrack.id
  );
  const activeProgress = activeTrack && currentTrack?.id === activeTrack.id ? progress : 0;
  const activeDuration =
    activeTrack && currentTrack?.id === activeTrack.id
      ? duration
      : activeTrack?.duration || duration;
  const titleText = activeTrack?.title || t.music.idle;
  const artistText = activeTrack?.artist || 'Ramos OS';

  const popoverSize = useMemo(
    () => ({
      width: viewMode === 'init' ? 300 : viewMode === 'results' ? 360 : 320,
      height: viewMode === 'init' ? (currentTrack ? 136 : 68) : 380,
    }),
    [currentTrack, viewMode]
  );

  const resetWidgetState = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setViewMode('init');
    setSelectedTrackId(null);
  }, []);

  const closeWidget = useCallback(() => {
    resetWidgetState();
    setIsOpen(false);
  }, [resetWidgetState]);

  useEffect(() => {
    if (!trimmedSearchQuery) return;

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/music/search?q=${encodeURIComponent(trimmedSearchQuery)}`);
        const data = (await res.json()) as MusicSearchResponse;
        if (data.results) {
          setSearchResults(data.results);
          setViewMode('results');
        } else {
          setSearchResults([]);
          setViewMode('results');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [trimmedSearchQuery]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        closeWidget();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [closeWidget]);

  const handleTrackSelect = useCallback(
    (track: MusicTrack, index: number) => {
      setSelectedTrackId(track.id);
      if (hasSearchResults && selectCustomTrack) {
        selectCustomTrack(track, searchResults);
      } else {
        selectTrack(index);
      }
      setViewMode('player');
    },
    [hasSearchResults, searchResults, selectCustomTrack, selectTrack]
  );

  const handlePrimaryToggle = useCallback(() => {
    if (
      hasSearchResults &&
      activeTrack &&
      currentTrack?.id !== activeTrack.id &&
      selectCustomTrack
    ) {
      selectCustomTrack(activeTrack, searchResults);
      return;
    }
    toggle();
  }, [activeTrack, currentTrack?.id, hasSearchResults, searchResults, selectCustomTrack, toggle]);

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchQuery(value);
    if (!value.trim()) {
      setViewMode('init');
      setSearchResults([]);
    }
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setViewMode('init');
  }, []);

  const handleNext = useCallback(() => {
    setDirection(1);
    next();
  }, [next]);

  const handlePrevious = useCallback(() => {
    setDirection(-1);
    previous();
  }, [previous]);

  return {
    t,
    rootRef,
    isOpen,
    setIsOpen,
    viewMode,
    setViewMode,
    selectedTrackId,
    setSelectedTrackId,
    direction,
    searchQuery,
    isSearching,
    visibleTracks,
    currentTrack,
    activeTrack,
    activeArtwork,
    activeArtworkFailed,
    setThumbnailErrorTrackId,
    isActiveTrackPlaying,
    isPlaying,
    activeProgress,
    position,
    activeDuration,
    titleText,
    artistText,
    popoverSize,
    isShuffling,
    isLooping,
    closeWidget,
    handleSearchChange,
    handleClearSearch,
    handleTrackSelect,
    handlePrimaryToggle,
    handleNext,
    handlePrevious,
    toggleShuffle,
    toggleLoop,
  };
}
