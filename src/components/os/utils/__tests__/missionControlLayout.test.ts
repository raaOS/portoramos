import { describe, expect, it } from 'vitest';
import { computeMissionTargets, type MissionControlWindow } from '../missionControlLayout';

function createWindow(
  id: string,
  overrides: Partial<MissionControlWindow> = {}
): MissionControlWindow {
  return { id, isOpen: true, width: 800, height: 600, ...overrides };
}

describe('computeMissionTargets', () => {
  it('returns no targets when every window is closed or minimized', () => {
    const result = computeMissionTargets(
      [createWindow('closed', { isOpen: false }), createWindow('minimized', { isMinimized: true })],
      1440,
      900
    );

    expect(result.size).toBe(0);
  });

  it('preserves the existing single-window layout calculation', () => {
    const result = computeMissionTargets([createWindow('about')], 1440, 900);

    expect(result.get('about')).toEqual({
      x: 320,
      y: 132,
      width: 800,
      height: 600,
      scale: 0.65,
    });
  });

  it('uses default dimensions when a window has no saved size', () => {
    const result = computeMissionTargets(
      [createWindow('notes', { width: undefined, height: undefined })],
      1440,
      900
    );

    expect(result.get('notes')).toMatchObject({ width: 800, height: 600 });
  });

  it('creates targets only for visible windows', () => {
    const result = computeMissionTargets(
      [
        createWindow('about'),
        createWindow('contact'),
        createWindow('closed', { isOpen: false }),
        createWindow('minimized', { isMinimized: true }),
      ],
      1280,
      800
    );

    expect([...result.keys()]).toEqual(['about', 'contact']);
  });
});
