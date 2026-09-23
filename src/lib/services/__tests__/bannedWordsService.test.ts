import { describe, expect, it } from 'vitest';
import { containsBannedWord, findBannedWord, BANNED_WORDS_DEFAULTS } from '../bannedWordsService';

describe('bannedWordsService', () => {
  const defaultWords = [...BANNED_WORDS_DEFAULTS];

  it('allows benign phrases that contain substring collisions for short banned words (e.g. rtp)', () => {
    expect(containsBannedWord('expert programmer', defaultWords)).toBe(false);
    expect(containsBannedWord('art project', defaultWords)).toBe(false);
    expect(containsBannedWord('smart portfolio', defaultWords)).toBe(false);
    expect(containsBannedWord('short paragraph', defaultWords)).toBe(false);
    expect(containsBannedWord('support page', defaultWords)).toBe(false);
  });

  it('detects banned words when used directly or with spam patterns', () => {
    expect(containsBannedWord('situs rtp slot gacor', defaultWords)).toBe(true);
    expect(findBannedWord('situs rtp slot gacor', defaultWords)).toBe('slot');
    expect(containsBannedWord('main judol yuk', defaultWords)).toBe(true);
    expect(containsBannedWord('link maxwin terbaru', defaultWords)).toBe(true);
  });

  it('detects leet-speak variations for banned words', () => {
    expect(containsBannedWord('sl0t g4c0r', defaultWords)).toBe(true);
    expect(containsBannedWord('m4xw1n', defaultWords)).toBe(true);
  });
});
