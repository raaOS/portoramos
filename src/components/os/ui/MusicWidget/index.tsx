'use client';

import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  closedPopoverWidth,
  getPopoverTransition,
  getPopoverExitTransition,
  getPopoverContentVariants,
} from './animations';
import MusicTrigger from './MusicTrigger';
import SearchMode from './SearchMode';
import PlayerMode from './PlayerMode';
import { useMusicWidgetState } from './hooks/useMusicWidgetState';
import { MusicWidgetPopoverBackdrop } from './MusicWidgetPopoverBackdrop';

export default function MusicPlayerWidget() {
  const prefersReducedMotion = useReducedMotion();
  const {
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
  } = useMusicWidgetState();

  const popoverTransition = getPopoverTransition(!!prefersReducedMotion);
  const popoverExitTransition = getPopoverExitTransition(!!prefersReducedMotion);
  const popoverContentVariants = getPopoverContentVariants(!!prefersReducedMotion);

  return (
    <div ref={rootRef} className="relative hidden sm:block">
      <MusicTrigger
        isOpen={isOpen}
        isPlaying={isPlaying}
        currentTrack={currentTrack}
        onToggle={(event) => {
          event.stopPropagation();
          if (isOpen) {
            closeWidget();
            return;
          }
          setIsOpen(true);
        }}
      />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="dialog"
            aria-label={t.music.nowPlaying}
            variants={{
              initial: {
                opacity: 0,
                width: prefersReducedMotion ? popoverSize.width : closedPopoverWidth,
                height: prefersReducedMotion ? popoverSize.height : closedPopoverWidth,
                filter: prefersReducedMotion ? 'blur(0px)' : 'blur(4px)',
                borderRadius: 20,
                pointerEvents: 'none',
              },
              animate: {
                opacity: 1,
                ...popoverSize,
                filter: 'blur(0px)',
                borderRadius: 20,
                pointerEvents: 'auto',
              },
              exit: {
                opacity: 0,
                width: prefersReducedMotion ? popoverSize.width : closedPopoverWidth,
                height: prefersReducedMotion ? popoverSize.height : closedPopoverWidth,
                filter: prefersReducedMotion ? 'blur(0px)' : 'blur(4px)',
                borderRadius: 20,
                pointerEvents: 'none',
                transition: popoverExitTransition,
              },
            }}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={popoverTransition}
            style={{
              transformOrigin: 'right top',
              willChange: 'opacity, filter, width, height, border-radius',
              backfaceVisibility: 'hidden',
              transform: 'translateZ(0)',
              WebkitFontSmoothing: 'antialiased',
            }}
            className="absolute right-0 top-full z-[1000] mt-2 overflow-hidden border border-zinc-200/50 bg-white/80 p-4 text-zinc-900 shadow-2xl shadow-black/15 backdrop-blur-2xl dark:border-zinc-800/50 dark:bg-zinc-950/80 dark:text-zinc-100 dark:shadow-black/40"
            onClick={(event) => event.stopPropagation()}
          >
            <motion.div
              animate={{ width: popoverSize.width, height: popoverSize.height }}
              transition={popoverTransition}
              className="absolute right-0 top-0 p-4"
            >
              <MusicWidgetPopoverBackdrop
                activeArtwork={activeArtwork}
                activeArtworkFailed={activeArtworkFailed}
                onArtworkError={() => activeTrack?.id && setThumbnailErrorTrackId(activeTrack.id)}
              />

              <motion.div
                className="relative flex h-full w-full flex-col"
                variants={popoverContentVariants}
              >
                <AnimatePresence mode="popLayout">
                  {viewMode !== 'player' ? (
                    <SearchMode
                      viewMode={viewMode}
                      searchQuery={searchQuery}
                      isSearching={isSearching}
                      visibleTracks={visibleTracks}
                      currentTrack={currentTrack}
                      activeTrack={activeTrack}
                      isActiveTrackPlaying={isActiveTrackPlaying}
                      activeProgress={activeProgress}
                      titleText={titleText}
                      artistText={artistText}
                      activeArtwork={activeArtwork}
                      activeArtworkFailed={activeArtworkFailed}
                      selectedTrackId={selectedTrackId}
                      onSearchChange={handleSearchChange}
                      onClearSearch={handleClearSearch}
                      onTrackSelect={handleTrackSelect}
                      onPrimaryToggle={handlePrimaryToggle}
                      onSetViewMode={setViewMode}
                      onSetSelectedTrackId={setSelectedTrackId}
                      onSetThumbnailErrorTrackId={setThumbnailErrorTrackId}
                    />
                  ) : (
                    <PlayerMode
                      currentTrack={currentTrack}
                      activeTrack={activeTrack}
                      direction={direction}
                      activeArtwork={activeArtwork}
                      activeArtworkFailed={activeArtworkFailed}
                      titleText={titleText}
                      artistText={artistText}
                      activeProgress={activeProgress}
                      position={position}
                      activeDuration={activeDuration}
                      isShuffling={isShuffling}
                      isLooping={isLooping}
                      isActiveTrackPlaying={isActiveTrackPlaying}
                      onSetViewMode={setViewMode}
                      onCloseWidget={closeWidget}
                      onSetThumbnailErrorTrackId={setThumbnailErrorTrackId}
                      onToggleShuffle={toggleShuffle}
                      onPrevious={handlePrevious}
                      onPrimaryToggle={handlePrimaryToggle}
                      onNext={handleNext}
                      onToggleLoop={toggleLoop}
                    />
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
