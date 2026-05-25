import { Project } from '@/types/projects';
import { getVideoPosterSource, getVideoPreviewSource, isVideoSource } from '@/lib/mediaPreview';

/**
 * Deterministic 3D hash — produces a value in [0, 1).
 * Matches the implementation in infiniteCanvasEngine.ts for consistency.
 */
export function hash3D(x: number, y: number, z: number): number {
  const hash = Math.sin(x * 12.9898 + y * 78.233 + z * 45.123) * 43758.5453123;
  return hash - Math.floor(hash);
}

export function getCoverUrl(project: Project): string {
  return project.cover || '/og-image.png';
}

export function getPreviewCoverUrl(project: Project): string {
  return project.cover ? getVideoPreviewSource(project.cover) : '/og-image.png';
}

export function getCoverPosterUrl(project: Project): string | undefined {
  return getVideoPosterSource(project.cover);
}

export function isVideoUrl(url: string): boolean {
  return isVideoSource(url);
}

// Well-known large primes for spatial hashing (minimize collision in 3D grids)
const HASH_PRIME_X = 73856093;
const HASH_PRIME_Y = 19349663;
const HASH_PRIME_Z = 83492791;

/**
 * Deterministically maps a cell coordinate to a project index.
 */
export function cellToProjectIdx(
  gx: number,
  gy: number,
  gz: number,
  projectsLength: number
): number {
  if (projectsLength <= 0) return 0;
  // A robust 3D hash for better project distribution even with small lists
  const h1 = (gx * HASH_PRIME_X) ^ (gy * HASH_PRIME_Y) ^ (gz * HASH_PRIME_Z);
  const h2 = Math.sin(h1) * 10000;
  const deterministicOffset = Math.floor(Math.abs(Math.sin(gx + gy + gz) * 100));
  return Math.abs(Math.floor(h2) + deterministicOffset) % projectsLength;
}
