// Infinite Canvas - FINAL VERSION

export const CONFIG = {
  // Camera
  cameraZ: 80,
  minZoom: 30,
  maxZoom: 300,
  
  // Project sizing - BESAR
  size: {
    near: 35,  // Project dekat (besar)
    mid: 20,   // Project tengah
    far: 10,   // Project jauh (kecil)
  },
  
  // Z positions
  z: {
    near: 20,
    mid: -60,
    far: -180,
  },
  
  // Infinite generation
  density: 0.7,        // 70% area berisi project
  spacing: 150,        // Jarak antar project
  viewRadius: 1500,    // Radius generate (diperbesar agar bisa melihat abu-abu di kejauhan)
  
  // Fade
  fadeStart: 700,
  fadeEnd: 1000,
  
  // Movement
  dragSpeed: 0.12,
  zoomSpeed: 0.002,
  friction: 0.90,
};
