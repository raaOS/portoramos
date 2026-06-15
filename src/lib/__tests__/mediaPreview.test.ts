import { describe, it, expect } from 'vitest';

import {
  getVideoPosterSource,
  getVideoPosterCandidates,
  getVideoPreviewSource,
  isVideoSource,
} from '../mediaPreview';

describe('mediaPreview', () => {
  describe('isVideoSource', () => {
    it('returns true for mp4/webm/mov extensions', () => {
      expect(isVideoSource('/r2/assets/wallpapers/foo.mp4')).toBe(true);
      expect(isVideoSource('/r2/assets/wallpapers/foo.webm')).toBe(true);
      expect(isVideoSource('/r2/assets/wallpapers/foo.mov')).toBe(true);
    });

    it('handles query strings and hash fragments', () => {
      expect(isVideoSource('/r2/assets/wallpapers/foo.mp4?v=2')).toBe(true);
      expect(isVideoSource('/r2/assets/wallpapers/foo.mp4#t=5')).toBe(true);
    });

    it('returns false for image extensions and empty input', () => {
      expect(isVideoSource('/r2/assets/wallpapers/foo.jpg')).toBe(false);
      expect(isVideoSource('/r2/assets/wallpapers/foo.webp')).toBe(false);
      expect(isVideoSource('')).toBe(false);
      expect(isVideoSource(null)).toBe(false);
      expect(isVideoSource(undefined)).toBe(false);
    });
  });

  describe('getVideoPosterSource', () => {
    it('returns the .jpg side-car path for an asset URL', () => {
      expect(getVideoPosterSource('/r2/assets/wallpapers/foo.mp4')).toBe(
        '/r2/assets/wallpapers/foo.jpg'
      );
    });

    it('preserves the suffix (query/hash) when transforming', () => {
      expect(getVideoPosterSource('/r2/assets/wallpapers/foo.mp4?v=2')).toBe(
        '/r2/assets/wallpapers/foo.jpg?v=2'
      );
    });

    it('returns undefined for non-video sources', () => {
      expect(getVideoPosterSource('/r2/assets/wallpapers/foo.jpg')).toBeUndefined();
      expect(getVideoPosterSource('')).toBeUndefined();
      expect(getVideoPosterSource(null)).toBeUndefined();
    });

    it('returns undefined for paths outside the assets prefix', () => {
      // Side-car convention only applies under assets/, so non-asset
      // URLs (e.g. external CDNs or /public files) shouldn't be
      // rewritten.
      expect(getVideoPosterSource('/static/foo.mp4')).toBeUndefined();
      expect(getVideoPosterSource('https://example.com/foo.mp4')).toBeUndefined();
    });
  });

  describe('getVideoPosterCandidates', () => {
    it('returns [.jpg, .webp] in that order for asset videos', () => {
      // Order matters: current pipeline writes .jpg, the era-transition
      // fallback is .webp. Consumers walk the list in priority order.
      expect(getVideoPosterCandidates('/r2/assets/wallpapers/foo.mp4')).toEqual([
        '/r2/assets/wallpapers/foo.jpg',
        '/r2/assets/wallpapers/foo.webp',
      ]);
    });

    it('preserves the suffix on every candidate', () => {
      expect(getVideoPosterCandidates('/r2/assets/wallpapers/foo.mp4?v=2')).toEqual([
        '/r2/assets/wallpapers/foo.jpg?v=2',
        '/r2/assets/wallpapers/foo.webp?v=2',
      ]);
    });

    it('returns an empty array for non-video or non-asset sources', () => {
      expect(getVideoPosterCandidates('/r2/assets/wallpapers/foo.jpg')).toEqual([]);
      expect(getVideoPosterCandidates('/static/foo.mp4')).toEqual([]);
      expect(getVideoPosterCandidates('')).toEqual([]);
      expect(getVideoPosterCandidates(null)).toEqual([]);
    });

    it('handles all supported video extensions', () => {
      // The file extension on the *video* drives detection; all
      // candidates always use the poster extensions (.jpg/.webp),
      // regardless of input video extension.
      for (const ext of ['mp4', 'webm', 'mov']) {
        const out = getVideoPosterCandidates(`/r2/assets/projects/clip.${ext}`);
        expect(out).toEqual(['/r2/assets/projects/clip.jpg', '/r2/assets/projects/clip.webp']);
      }
    });
  });

  describe('getVideoPreviewSource', () => {
    it('rewrites .mp4 to -preview.mp4 for asset videos', () => {
      expect(getVideoPreviewSource('/r2/assets/projects/foo.mp4')).toBe(
        '/r2/assets/projects/foo-preview.mp4'
      );
    });

    it('does not double-rewrite already-preview URLs', () => {
      const already = '/r2/assets/projects/foo-preview.mp4';
      expect(getVideoPreviewSource(already)).toBe(already);
    });

    it('returns the original src for non-video or non-asset URLs', () => {
      expect(getVideoPreviewSource('/r2/assets/projects/foo.jpg')).toBe(
        '/r2/assets/projects/foo.jpg'
      );
      expect(getVideoPreviewSource('/static/foo.mp4')).toBe('/static/foo.mp4');
      expect(getVideoPreviewSource('')).toBe('');
    });
  });
});
