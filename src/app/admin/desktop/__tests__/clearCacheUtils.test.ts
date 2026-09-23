import { describe, it, expect } from 'vitest';
import {
  createInitialCacheSteps,
  mapServerStatus,
  summarizeServerSteps,
  CACHE_STEP_DEFINITIONS,
  type ServerCacheStep,
} from '../helpers/clearCacheUtils';

describe('clearCacheUtils', () => {
  describe('createInitialCacheSteps', () => {
    it('creates steps matching definitions with pending status', () => {
      const steps = createInitialCacheSteps();
      expect(steps.length).toBe(CACHE_STEP_DEFINITIONS.length);
      expect(steps.every((s) => s.status === 'pending')).toBe(true);
      expect(steps[0].id).toBe('serverRequest');
    });
  });

  describe('mapServerStatus', () => {
    it('maps server step statuses correctly to ClearCacheStepStatus', () => {
      expect(mapServerStatus('cleared')).toBe('done');
      expect(mapServerStatus('skipped')).toBe('skipped');
      expect(mapServerStatus('error')).toBe('error');
      expect(mapServerStatus(undefined)).toBe('skipped');
    });
  });

  describe('summarizeServerSteps', () => {
    it('returns skipped for empty or undefined steps', () => {
      expect(summarizeServerSteps(undefined)).toEqual({
        status: 'skipped',
        detail: 'Tidak ada cache terdaftar di runtime ini.',
      });
      expect(summarizeServerSteps([])).toEqual({
        status: 'skipped',
        detail: 'Tidak ada cache terdaftar di runtime ini.',
      });
    });

    it('returns error if any step errored', () => {
      const steps: ServerCacheStep[] = [
        { name: 'Redis', status: 'cleared', detail: 'OK', entriesCleared: 5 },
        { name: 'Memory', status: 'error', detail: 'Out of memory' },
      ];
      expect(summarizeServerSteps(steps)).toEqual({
        status: 'error',
        detail: 'Memory: Out of memory',
      });
    });

    it('returns skipped if all steps are skipped', () => {
      const steps: ServerCacheStep[] = [
        { name: 'Edge', status: 'skipped', detail: 'No edge cache configured' },
      ];
      expect(summarizeServerSteps(steps)).toEqual({
        status: 'skipped',
        detail: 'Edge: No edge cache configured',
      });
    });

    it('returns done with total entries cleared on success', () => {
      const steps: ServerCacheStep[] = [
        { name: 'CacheA', status: 'cleared', detail: 'OK', entriesCleared: 10 },
        { name: 'CacheB', status: 'cleared', detail: 'OK', entriesCleared: 15 },
      ];
      expect(summarizeServerSteps(steps)).toEqual({
        status: 'done',
        detail: '25 entry dibersihkan dari 2 cache service.',
      });
    });
  });
});
