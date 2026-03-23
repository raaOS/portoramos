'use client';

import type { Project as DBProject } from '@/types/projects';
import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { isVideoLink } from '@/lib/images';
import { CONFIG } from './infinite-canvas/constants';
import { getVisiblePoints, Point } from './infinite-canvas/poisson';
import styles from './infinite-canvas/style.module.css';

// Type for processed media items
interface MediaItem {
  id: string;
  url: string;
  isVideo: boolean;
  width: number;
  height: number;
}

// Texture cache
const textureCache = new Map<string, THREE.Texture>();

function getTexture(url: string, isVideo: boolean = false): THREE.Texture | null {
  if (textureCache.has(url)) return textureCache.get(url)!;

  if (isVideo) {
    const video = document.createElement('video');
    video.src = url;
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.autoplay = true;

    video.play().catch(e => console.warn('Global Autoplay failed:', url, e));

    const tex = new THREE.VideoTexture(video);
    tex.minFilter = THREE.LinearFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    textureCache.set(url, tex);
    return tex;
  }

  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin('anonymous');
  const tex = loader.load(url);
  tex.minFilter = THREE.LinearFilter;
  textureCache.set(url, tex);
  return tex;
}

function srand(seed: number): number {
  return Math.abs(Math.sin(seed * 12.9898) * 43758.5453 % 1);
}

// Project Component
function Project({ point, mediaItems }: { point: Point; mediaItems: MediaItem[] }) {
  const groupRef = useRef<THREE.Group>(null);
  const shaderRef = useRef<any>(null);

  // Use a spatial hash formula with large primes to cycle through items evenly without clustering natively
  const hash = Math.abs(point.cx * 1000000007 + point.cy * 1000000009 + point.cz * 1000000021 + point.layerIdx * 1000000033);
  const mediaIdx = hash % mediaItems.length;

  const media = mediaItems[mediaIdx];
  const texture = useMemo(() => media ? getTexture(media.url, media.isVideo) : null, [media]);
  const { camera } = useThree();

  useEffect(() => {
    if (texture) texture.needsUpdate = true;
  }, [texture]);

  useFrame(() => {
    if (!groupRef.current) return;

    const dx = point.x - camera.position.x;
    const dy = point.y - camera.position.y;
    const dz = point.z - camera.position.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    let op = 0;
    if (dist < 1500) op = point.opacity;
    else if (dist < 2000) op = point.opacity * (1 - (dist - 1500) / 500);

    // Fade quickly if it passes behind camera
    if (dz > 0) {
      op *= Math.max(0, 1 - (dz / 100));
    }

    // Grayscale logic (Z distance based)
    const zDist = Math.abs(dz);
    let gray = 0;

    // Lapisan terdepan (jarak 0 - 1100) full color. Lapisan belakang (1100+) langsung 100% abu-abu.
    if (zDist > 1100) {
      gray = 1; // Instant 100% grayscale
    }

    if (shaderRef.current) {
      shaderRef.current.uniforms.grayscaleAmount.value = gray;
    }

    groupRef.current.children.forEach((child: any) => {
      if (child.material) {
        child.material.opacity = op;
      }
    });
    groupRef.current.visible = op > 0.02;
  });

  if (!texture || !media) return null;

  const aspect = media.width / media.height;
  const scaleX = point.scale * aspect;

  return (
    <group position={[point.x, point.y, point.z]} ref={groupRef}>
      {/* Main Image */}
      <mesh
        scale={[scaleX, point.scale, 1]}
        onClick={() => window.location.href = `/projects/${media.id}`}
        onPointerEnter={() => document.body.style.cursor = 'pointer'}
        onPointerLeave={() => document.body.style.cursor = 'grab'}
      >
        <planeGeometry />
        <meshBasicMaterial
          map={texture}
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          onBeforeCompile={(shader) => {
            shader.uniforms.grayscaleAmount = { value: 0 };
            shader.fragmentShader = `
              uniform float grayscaleAmount;
              ${shader.fragmentShader}
            `;
            shader.fragmentShader = shader.fragmentShader.replace(
              `#include <fog_fragment>`,
              `
               float gray = dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114));
               gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(gray), grayscaleAmount);
               #include <fog_fragment>
              `
            );
            shaderRef.current = shader;
          }}
        />
      </mesh>
    </group>
  );
}

// Scene
function Scene({ mediaItems }: { mediaItems: MediaItem[] }) {
  const { camera, gl } = useThree();
  const camPos = useRef({ x: 0, y: 0, z: CONFIG.cameraZ });
  const vel = useRef({ x: 0, y: 0, z: 0 });
  const dragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const [tick, setTick] = useState(0);

  // Get visible points
  const points = useMemo(() => {
    return getVisiblePoints(camPos.current.x, camPos.current.y, camPos.current.z);
  }, [tick]);

  // Input
  useEffect(() => {
    const c = gl.domElement;
    c.style.cursor = 'grab';

    const onDown = (e: MouseEvent) => {
      dragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      c.style.cursor = 'grabbing';
    };
    const onUp = () => { dragging.current = false; c.style.cursor = 'grab'; };
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      vel.current.x -= (e.clientX - lastMouse.current.x) * CONFIG.dragSpeed;
      vel.current.y += (e.clientY - lastMouse.current.y) * CONFIG.dragSpeed;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        vel.current.z += e.deltaY * CONFIG.dragSpeed * 3.0; // Doubled zoom speed (pinch)
      } else {
        vel.current.x += e.deltaX * CONFIG.dragSpeed * 1.5;
        // Fly backwards (out of tunnel) on scroll down
        vel.current.z += e.deltaY * CONFIG.dragSpeed * 1.0; // Doubled scroll speed (1.0 instead of 0.5)
      }
    };

    c.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mousemove', onMove);
    c.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      c.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mousemove', onMove);
      c.removeEventListener('wheel', onWheel);
    };
  }, [gl]);

  // Animation
  let frameCount = 0;
  useFrame(() => {
    camPos.current.x += vel.current.x;
    camPos.current.y += vel.current.y;
    camPos.current.z += vel.current.z;
    vel.current.x *= CONFIG.friction;
    vel.current.y *= CONFIG.friction;
    vel.current.z *= CONFIG.friction;

    camera.position.set(camPos.current.x, camPos.current.y, camPos.current.z);

    // Update setiap 10 frame
    frameCount++;
    if (frameCount % 10 === 0) {
      setTick(t => t + 1);
    }
    
    // Global video pause/play logic
    // We determine if any instance of a video is within the 1100m color zone.
    // If NO instances are close, we pause the underlying video to freeze the texture for performance and aesthetics.
    const activeVideos = new Set<string>();
    for (const p of points) {
      const hash = Math.abs(p.cx * 1000000007 + p.cy * 1000000009 + p.cz * 1000000021 + p.layerIdx * 1000000033);
      const mediaIdx = hash % mediaItems.length;
      const media = mediaItems[mediaIdx];
      
      if (media.isVideo) {
        const zDist = Math.abs(p.z - camera.position.z);
        if (zDist <= 1100) {
          activeVideos.add(media.url);
        }
      }
    }
    
    textureCache.forEach((tex, url) => {
      if (tex && tex.image && (tex.image as any).tagName === 'VIDEO') {
        const video = tex.image as HTMLVideoElement;
        
        if (activeVideos.has(url)) {
          // Play video if at least one instance is in the colorful zone
          if (video.paused) {
            video.play().catch(() => {});
          }
        } else {
          // Pause video (freeze it) if all instances are > 1100m away
          if (!video.paused) {
            video.pause();
          }
        }
      }
    });

  });

  return (
    <>
      {points.map(p => (
        <Project key={p.id} point={p} mediaItems={mediaItems} />
      ))}
    </>
  );
}

export default function InfiniteCanvas3D({ projects = [] }: { projects?: DBProject[] }) {
  // Compute mediaItems from passed in DB props
  const mediaItems = useMemo<MediaItem[]>(() => {
    if (!projects || projects.length === 0) return [];
    
    return projects.map((p) => ({
      id: p.slug,
      url: p.cover || '',
      isVideo: isVideoLink(p.cover || ''),
      width: p.coverWidth || 800,
      height: p.coverHeight || 600,
    }));
  }, [projects]);

  if (mediaItems.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#f4f4f5]">
        <p className="text-gray-500 font-bold tracking-widest uppercase text-xs">No media to display</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Canvas
        camera={{ position: [0, 0, CONFIG.cameraZ], fov: 55, near: 1, far: 3000 }}
        dpr={Math.min(window.devicePixelRatio, 2)}
        gl={{ antialias: true }}
        className={styles.canvas}
      >
        <color attach="background" args={['#f4f4f5']} />
        <fog attach="fog" args={['#f4f4f5', 1000, 2500]} />
        <Scene mediaItems={mediaItems} />
      </Canvas>
    </div>
  );
}
