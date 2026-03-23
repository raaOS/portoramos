// True Infinite - Grid based following camera

import { CONFIG } from './constants';

export interface Point {
  x: number;
  y: number;
  z: number;
  scale: number;
  opacity: number;
  seed: number;
  id: string;
  cx: number;
  cy: number;
  cz: number;
  layerIdx: number;
}

function random(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

// Generate points untuk satu cell (3D)
function generateCellPoints(cx: number, cy: number, cz: number): Point[] {
  const points: Point[] = [];
  const cellSize = 450; // Jarak dasar (mengimbangi count=1 agar tetap padat)
  // Mix coordinates to get a stable pseudo-random seed (using integer math)
  const baseSeed = (Math.abs(cx * 73856) ^ Math.abs(cy * 19349) ^ Math.abs(cz * 83492)) + 1;
  
  // Wajib 1 point per cell untuk MENCEGAH NUMPUK!
  const count = 1;
  
  for (let i = 0; i < count; i++) {
    const seed = baseSeed + i * 10;
    
    // Posisi dalam cell (Jitter dibatasi max 60% dari cell size agar tidak menabrak tetangga)
    const jitter = cellSize * 0.6;
    const x = cx * cellSize + (random(seed) - 0.5) * jitter;
    const y = cy * cellSize + (random(seed + 1) - 0.5) * jitter;
    const z = cz * cellSize + (random(seed + 2) - 0.5) * jitter;
    
    // Layer scale and opacity
    const scale = 80 + random(seed + 3) * 120; // Increased base and range for larger sizes
    const opacity = 1.0; // Fully solid initially
    
    points.push({
      id: `${cx}_${cy}_${cz}_${i}`,
      x, y, z, scale, opacity, seed,
      cx, cy, cz, layerIdx: i
    });
  }
  
  return points;
}

// Get all visible cells around camera
export function getVisiblePoints(camX: number, camY: number, camZ: number): Point[] {
  const points: Point[] = [];
  const cellSize = 450;
  
  // Calculate visible cell range using Math.round since we shifted points by -0.5
  const centerCx = Math.round(camX / cellSize);
  const centerCy = Math.round(camY / cellSize);
  const centerCz = Math.round(camZ / cellSize);
  
  // 5x5 in XY to guarantee we cover wide screen bounds at deep distances
  // Now covers approximately 1500 units radius, plenty for grayscale bounds
  for (let cx = centerCx - 3; cx <= centerCx + 3; cx++) {
    for (let cy = centerCy - 3; cy <= centerCy + 3; cy++) {
      // Z goes from centerCz - 5 (forward ~1500 units) to centerCz + 1 (slightly behind)
      for (let cz = centerCz - 5; cz <= centerCz + 1; cz++) {
        const cellPoints = generateCellPoints(cx, cy, cz);
        
        // Filter by distance
        for (const p of cellPoints) {
          const dx = p.x - camX;
          const dy = p.y - camY;
          const dz = p.z - camZ;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          
          if (dist < 2500) {
            points.push(p);
          }
        }
      }
    }
  }
  
  return points;
}
