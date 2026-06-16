'use client';

import type { Point3D } from '@/components/canvas/infiniteCanvasEngine';

const CAMERA_STORAGE_KEY = 'canvas_camera_position';
const TARGET_SLUG_KEY = 'canvas_target_slug';

export interface CameraState {
  position: Point3D;
  targetSlug?: string;
  targetKey?: string;
  timestamp: number;
}

export function saveCameraState(position: Point3D, targetSlug?: string, targetKey?: string): void {
  if (typeof window === 'undefined') return;

  const state: CameraState = {
    position,
    targetSlug,
    targetKey,
    timestamp: Date.now(),
  };

  try {
    sessionStorage.setItem(CAMERA_STORAGE_KEY, JSON.stringify(state));
    if (targetSlug) {
      sessionStorage.setItem(TARGET_SLUG_KEY, targetSlug);
    }
  } catch {
    // Ignore storage errors (private browsing, quota exceeded, etc.)
  }
}

export function getCameraState(): CameraState | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = sessionStorage.getItem(CAMERA_STORAGE_KEY);
    if (!stored) return null;

    const state: CameraState = JSON.parse(stored);

    // Expire after 30 minutes
    if (Date.now() - state.timestamp > 30 * 60 * 1000) {
      clearCameraState();
      return null;
    }

    return state;
  } catch {
    return null;
  }
}

export function getTargetSlug(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    return sessionStorage.getItem(TARGET_SLUG_KEY);
  } catch {
    return null;
  }
}

export function clearCameraState(): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem(CAMERA_STORAGE_KEY);
    sessionStorage.removeItem(TARGET_SLUG_KEY);
  } catch {
    // Ignore
  }
}

export function clearTargetSlug(): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem(TARGET_SLUG_KEY);
  } catch {
    // Ignore
  }
}
