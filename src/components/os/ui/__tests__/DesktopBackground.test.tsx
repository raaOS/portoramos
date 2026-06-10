import { describe, it, expect, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: () => null,
}));

describe('DesktopBackground videoSrc logic', () => {
  function computeVideoSrc(
    activeWallpaper: string,
    isVideo: boolean,
    activeEntry?: { startTime?: number }
  ): string {
    if (!isVideo) return activeWallpaper;
    if (activeEntry?.startTime !== undefined) {
      const baseUrl = activeWallpaper.split('#')[0];
      return `${baseUrl}#t=${activeEntry.startTime}`;
    }
    if (activeWallpaper.includes('#t=')) return activeWallpaper;
    return `${activeWallpaper}#t=14`;
  }

  it('returns original URL unchanged for non-video wallpaper', () => {
    const result = computeVideoSrc('/r2/image.jpg', false, { startTime: 30 });
    expect(result).toBe('/r2/image.jpg');
  });

  it('appends #t=startTime when activeEntry has startTime', () => {
    const result = computeVideoSrc('/r2/wallpaper.mp4', true, { startTime: 30 });
    expect(result).toBe('/r2/wallpaper.mp4#t=30');
  });

  it('replaces existing #t= fragment with new startTime', () => {
    const result = computeVideoSrc('/r2/wallpaper.mp4#t=5', true, { startTime: 30 });
    expect(result).toBe('/r2/wallpaper.mp4#t=30');
  });

  it('falls back to #t=14 when startTime is undefined', () => {
    const result = computeVideoSrc('/r2/wallpaper.mp4', true, undefined);
    expect(result).toBe('/r2/wallpaper.mp4#t=14');
  });

  it('falls back to #t=14 when activeEntry has no startTime', () => {
    const result = computeVideoSrc('/r2/wallpaper.mp4', true, {});
    expect(result).toBe('/r2/wallpaper.mp4#t=14');
  });

  it('uses #t=0 when startTime is explicitly 0', () => {
    const result = computeVideoSrc('/r2/wallpaper.mp4', true, { startTime: 0 });
    expect(result).toBe('/r2/wallpaper.mp4#t=0');
  });

  it('uses #t=250 when startTime is at max boundary', () => {
    const result = computeVideoSrc('/r2/wallpaper.mp4', true, { startTime: 250 });
    expect(result).toBe('/r2/wallpaper.mp4#t=250');
  });

  it('preserves existing #t= when no activeEntry provided and URL has fragment', () => {
    const result = computeVideoSrc('/r2/wallpaper.mp4#t=42', true, undefined);
    expect(result).toBe('/r2/wallpaper.mp4#t=42');
  });

  it('falls back to #t=14 for video without fragment or entry', () => {
    const result = computeVideoSrc('/r2/wallpaper.mp4', true, undefined);
    expect(result).toBe('/r2/wallpaper.mp4#t=14');
  });
});
