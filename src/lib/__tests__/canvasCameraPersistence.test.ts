import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearCameraState, getCameraState, saveCameraState } from '../canvasCameraPersistence';

afterEach(() => {
  clearCameraState();
  vi.useRealTimers();
});

describe('canvasCameraPersistence', () => {
  it('persists the exact canvas cell used by the shared element transition', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-14T00:00:00.000Z'));

    saveCameraState({ x: 10, y: -20, z: 30 }, 'project-a', '1_-2_3');

    expect(getCameraState()).toEqual({
      position: { x: 10, y: -20, z: 30 },
      targetSlug: 'project-a',
      targetKey: '1_-2_3',
      timestamp: Date.now(),
    });
  });

  it('clears the persisted transition target with the camera state', () => {
    saveCameraState({ x: 0, y: 0, z: 0 }, 'project-a', '0_0_0');

    clearCameraState();

    expect(getCameraState()).toBeNull();
    expect(sessionStorage.getItem('canvas_target_slug')).toBeNull();
  });
});
