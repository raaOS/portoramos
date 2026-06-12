// ═══════════════════════════════════════════════════════════════════
// SECTION MAP (InfiniteCanvasView.tsx — 578 lines)
// L1-22:    Imports, types, constants (camera limits, shader code)
// L23-200:  InfiniteCanvasView component — Canvas setup, camera config,
//           refs for WebGL context, orbital controls, render loop
// L201-400: Project cards rendering — Three.js meshes, hover effects,
//           custom shaders, position calculations
// L401-578: JSX return — Canvas wrapper, lights, camera, scene graph
// ═══════════════════════════════════════════════════════════════════
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import type { Project } from '@/types/projects';
import { getPreviewCoverUrl, isVideoUrl } from '@/utils/canvas-helpers';
import {
  CANVAS_CONSTANTS,
  assignProjectsToCells,
  buildCellPositions,
  computeVisualStyle,
  pruneAssignmentState,
  type CanvasItem,
  type Point3D,
} from './infiniteCanvasEngine';
import { useCanvasInput } from '@/hooks/canvas/useCanvasInput';
import { CanvasCard } from './CanvasCard';

type Props = {
  projects: Project[];
};

export default function InfiniteCanvasView({ projects }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Pre-calculate initial visible items for SSR support
  const initialItems = useMemo(() => {
    const camera = { x: 0, y: 0, z: 0 };
    const cellPositions = buildCellPositions(camera);
    const projectById = new Map(projects.map((project) => [project.id, project]));
    const nextState = assignProjectsToCells({
      cellPositions,
      projects,
      persistedAssignments: new Map(),
      insertionOrder: [],
      projectById,
    });
    return nextState.items;
  }, [projects]);

  const [renderedItems, setRenderedItems] = useState<CanvasItem[]>(initialItems);
  const renderedItemsRef = useRef<CanvasItem[]>(initialItems);

  // — Camera state —
  const cameraRef = useRef<Point3D>({ x: 0, y: 0, z: 0 });
  const velocityRef = useRef<Point3D>({ x: 0, y: 0, z: 0 });
  const targetCameraRef = useRef<Point3D>({ x: 0, y: 0, z: 0 });
  const scrollDeltaRef = useRef<Point3D>({ x: 0, y: 0, z: 0 });
  const previousCullCameraRef = useRef<Point3D>({ x: 0, y: 0, z: 0 });

  // — Atmospheric Depth Fog state —
  const fogRef = useRef<HTMLDivElement>(null);

  // — Magnetic hover & ambient float state —
  const mousePosRef = useRef({ x: 0, y: 0 });
  const floatPhasesRef = useRef<Map<string, number>>(new Map());
  const magneticStateRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const tiltStateRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const timeRef = useRef(0);

  // — Input state —
  const isDraggingRef = useRef(false);
  const animationFrameRef = useRef<number>(0);

  // Hook bindings for physics input (Mouse, touch, wheel)
  useCanvasInput({
    containerRef,
    targetCameraRef,
    velocityRef,
    scrollDeltaRef,
    isDraggingRef,
  });

  // — DOM node references —
  const cardNodesRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const videoNodesRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const visualStateRef = useRef<
    Map<string, { opacity: number; grayscale: number; hidden: boolean }>
  >(new Map());

  // — Mouse tracker for magnetic effect —
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mousePosRef.current = {
      x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
      y: ((e.clientY - rect.top) / rect.height) * 2 - 1,
    };
  }, []);

  // Stable ref callbacks — prevents CanvasCard memo() from re-rendering on parent state change
  const registerCardRef = useCallback((key: string, el: HTMLDivElement | null) => {
    if (el) cardNodesRef.current.set(key, el);
    else cardNodesRef.current.delete(key);
  }, []);
  const registerVideoRef = useCallback((key: string, el: HTMLVideoElement | null) => {
    if (el) videoNodesRef.current.set(key, el);
    else videoNodesRef.current.delete(key);
  }, []);

  // — Assignment & ordering state —
  const assignmentRef = useRef<Map<string, string>>(new Map());
  const insertionOrderRef = useRef<string[]>([]);
  const activeItemsRef = useRef<CanvasItem[]>([]);

  // — Batch removal state (BUG FIX #1 + #3) —
  const pendingRemovalsRef = useRef<Set<string>>(new Set());
  const removalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const projectById = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects]
  );
  const maxCachedAssignments = useMemo(
    () =>
      Math.max(
        CANVAS_CONSTANTS.maxActiveItems * 3,
        projects.length * CANVAS_CONSTANTS.maxCacheMultiplier
      ),
    [projects.length]
  );

  const syncVisibleItems = useCallback(() => {
    if (projects.length === 0) {
      activeItemsRef.current = [];
      setRenderedItems([]);
      return;
    }

    const cellPositions = buildCellPositions(cameraRef.current);
    const nextState = assignProjectsToCells({
      cellPositions,
      projects,
      persistedAssignments: assignmentRef.current,
      insertionOrder: insertionOrderRef.current,
      projectById,
    });

    const activeKeys = new Set(nextState.items.map((item) => item.key));
    const prunedState = pruneAssignmentState({
      assignments: nextState.assignments,
      insertionOrder: nextState.insertionOrder,
      activeKeys,
      maxEntries: maxCachedAssignments,
    });

    assignmentRef.current = prunedState.assignments;
    insertionOrderRef.current = prunedState.insertionOrder;

    activeItemsRef.current = nextState.items;

    const nextItems = nextState.items;
    setRenderedItems((prev) => {
      const prevKeys = new Set(prev.map((i) => i.key));
      const itemsToAdd = nextItems.filter((item) => !prevKeys.has(item.key));
      if (itemsToAdd.length === 0) return prev;
      const next = [...prev, ...itemsToAdd];
      renderedItemsRef.current = next;
      return next;
    });
  }, [maxCachedAssignments, projectById, projects]);

  const flushRemovals = useCallback(() => {
    const keysToRemove = pendingRemovalsRef.current;
    if (keysToRemove.size === 0) {
      removalTimerRef.current = null;
      return;
    }

    const removalSet = new Set(keysToRemove);
    pendingRemovalsRef.current = new Set();
    removalTimerRef.current = null;

    setRenderedItems((prev) => {
      const next = prev.filter((item) => !removalSet.has(item.key));
      renderedItemsRef.current = next;
      return next;
    });

    removalSet.forEach((key) => {
      visualStateRef.current.delete(key);
      cardNodesRef.current.delete(key);
      videoNodesRef.current.delete(key);
      floatPhasesRef.current.delete(key);
      magneticStateRef.current.delete(key);
      tiltStateRef.current.delete(key);
    });
  }, []);

  const updateDomNodes = useCallback(() => {
    const camera = cameraRef.current;
    const activeKeys = new Set(activeItemsRef.current.map((i) => i.key));
    const currentItems = renderedItemsRef.current;

    for (const item of currentItems) {
      const node = cardNodesRef.current.get(item.key);
      if (!node) continue;

      if (pendingRemovalsRef.current.has(item.key)) continue;

      const previousState = visualStateRef.current.get(item.key) ?? {
        opacity: 0,
        grayscale: 0,
        hidden: false,
      };
      const visualStyle = computeVisualStyle({
        item,
        camera,
        previousOpacity: previousState.opacity,
        previousGrayscale: previousState.grayscale,
      });

      const dz = item.z - camera.z;

      const isFarBehind = dz > CANVAS_CONSTANTS.cullingBehindThreshold;
      const isTooFar = item.dist > CANVAS_CONSTANTS.cullingDistanceThreshold;
      const isInactiveAndHidden =
        !activeKeys.has(item.key) && (visualStyle.hidden || visualStyle.opacity < 0.01);

      if (isFarBehind || isTooFar || isInactiveAndHidden) {
        node.style.visibility = 'hidden';
        node.style.display = 'none';
        node.style.willChange = 'auto';

        const videoNode = videoNodesRef.current.get(item.key);
        if (videoNode) {
          videoNode.pause();
          videoNode.removeAttribute('src');
          videoNode.load();
        }

        pendingRemovalsRef.current.add(item.key);
        continue;
      }

      visualStateRef.current.set(item.key, {
        opacity: visualStyle.opacity,
        grayscale: visualStyle.grayscale,
        hidden: visualStyle.hidden,
      });

      if (visualStyle.hidden) {
        if (node.style.visibility !== 'hidden') {
          node.style.visibility = 'hidden';
          node.style.opacity = '0';
          node.style.pointerEvents = 'none';
          node.style.willChange = 'auto';
        }
        const videoNode = videoNodesRef.current.get(item.key);
        if (videoNode && !videoNode.paused) {
          videoNode.pause();
        }
        continue;
      }

      // — Ambient float offset —
      if (!floatPhasesRef.current.has(item.key)) {
        floatPhasesRef.current.set(
          item.key,
          Math.sin(item.dist + item.x * 0.1 + item.y * 0.1) * Math.PI
        );
      }
      const floatPhase = floatPhasesRef.current.get(item.key)!;
      const floatY =
        Math.sin(timeRef.current * 0.001 * CANVAS_CONSTANTS.floatSpeed + floatPhase) *
        CANVAS_CONSTANTS.floatAmplitude;

      // — Magnetic hover offset —
      const dx = item.x - camera.x;
      const dy = item.y - camera.y;
      const scaleFactor =
        CANVAS_CONSTANTS.perspective / Math.max(1, CANVAS_CONSTANTS.perspective - dz);
      const virtualScreenX = dx * scaleFactor;
      const virtualScreenY = dy * scaleFactor;
      const mouseVX = mousePosRef.current.x * (CANVAS_CONSTANTS.screenWidth / 2);
      const mouseVY = mousePosRef.current.y * (CANVAS_CONSTANTS.screenHeight / 2);
      const screenDist = Math.sqrt(
        (virtualScreenX - mouseVX) ** 2 + (virtualScreenY - mouseVY) ** 2
      );
      let targetMX = 0,
        targetMY = 0;
      if (
        !isDraggingRef.current &&
        screenDist < CANVAS_CONSTANTS.magnetRadius &&
        screenDist > 0.01
      ) {
        const strength =
          (1 - screenDist / CANVAS_CONSTANTS.magnetRadius) ** 2 * CANVAS_CONSTANTS.magnetStrength;
        targetMX = ((mouseVX - virtualScreenX) / screenDist) * strength;
        targetMY = ((mouseVY - virtualScreenY) / screenDist) * strength;
      }
      const prevMag = magneticStateRef.current.get(item.key) ?? { x: 0, y: 0 };
      const smoothMX = prevMag.x + (targetMX - prevMag.x) * 0.12;
      const smoothMY = prevMag.y + (targetMY - prevMag.y) * 0.12;
      magneticStateRef.current.set(item.key, { x: smoothMX, y: smoothMY });

      // — Speed tilt —
      const targetTiltX = Math.max(
        -CANVAS_CONSTANTS.maxTilt,
        Math.min(CANVAS_CONSTANTS.maxTilt, -velocityRef.current.y * CANVAS_CONSTANTS.tiltFactor)
      );
      const targetTiltY = Math.max(
        -CANVAS_CONSTANTS.maxTilt,
        Math.min(CANVAS_CONSTANTS.maxTilt, -velocityRef.current.x * CANVAS_CONSTANTS.tiltFactor)
      );
      const prevTilt = tiltStateRef.current.get(item.key) ?? { x: 0, y: 0 };
      const smoothTiltX = prevTilt.x + (targetTiltX - prevTilt.x) * CANVAS_CONSTANTS.tiltSmoothing;
      const smoothTiltY = prevTilt.y + (targetTiltY - prevTilt.y) * CANVAS_CONSTANTS.tiltSmoothing;
      tiltStateRef.current.set(item.key, { x: smoothTiltX, y: smoothTiltY });

      if (node.style.display !== 'block') node.style.display = 'block';
      if (node.style.visibility !== 'visible') node.style.visibility = 'visible';
      if (node.style.pointerEvents !== 'auto') node.style.pointerEvents = 'auto';

      const nextOpacity = visualStyle.opacity.toFixed(3);
      if (node.style.opacity !== nextOpacity) node.style.opacity = nextOpacity;

      if (node.style.filter !== visualStyle.filter) node.style.filter = visualStyle.filter;
      if (node.style.zIndex !== visualStyle.zIndex) node.style.zIndex = visualStyle.zIndex;

      node.style.transform =
        visualStyle.transform +
        ` rotateX(${smoothTiltX.toFixed(1)}deg) rotateY(${smoothTiltY.toFixed(1)}deg) translate(${smoothMX.toFixed(1)}px, ${(smoothMY + floatY).toFixed(1)}px)`;

      const videoNode = videoNodesRef.current.get(item.key);
      if (videoNode) {
        // Only load and play video for cards within focus distance (< 1800) to optimize bandwidth, memory, and CPU
        const isNearFocus = item.dist < 1800;
        if (
          visualStyle.opacity > CANVAS_CONSTANTS.videoVisibilityOpacity &&
          activeKeys.has(item.key) &&
          isNearFocus
        ) {
          if (videoNode.paused) {
            if (!videoNode.getAttribute('src')) {
              videoNode.src = videoNode.dataset.src || getPreviewCoverUrl(item.project);
            }
            void videoNode.play().catch(() => undefined);
          }
        } else {
          if (!videoNode.paused) {
            videoNode.pause();
          }
          if (videoNode.getAttribute('src') && item.dist >= 1800) {
            videoNode.removeAttribute('src');
            videoNode.load();
          }
        }
      }
    }

    if (pendingRemovalsRef.current.size > 0 && !removalTimerRef.current) {
      removalTimerRef.current = setTimeout(flushRemovals, CANVAS_CONSTANTS.removalBatchInterval);
    }
  }, [flushRemovals]);

  useEffect(() => {
    if (projects.length === 0) return;

    let lastTime = performance.now();
    const loop = (currentTime: number) => {
      const deltaTime = Math.min(currentTime - lastTime, CANVAS_CONSTANTS.maxDeltaTime);
      const timeScale = deltaTime / CANVAS_CONSTANTS.targetFrameTime;
      lastTime = currentTime;

      timeRef.current = currentTime;

      velocityRef.current.x += scrollDeltaRef.current.x * CANVAS_CONSTANTS.scrollSensitivity;
      velocityRef.current.y += scrollDeltaRef.current.y * CANVAS_CONSTANTS.scrollSensitivity;
      velocityRef.current.z += scrollDeltaRef.current.z * CANVAS_CONSTANTS.scrollSensitivity;
      scrollDeltaRef.current = { x: 0, y: 0, z: 0 };

      velocityRef.current.x *= Math.pow(CANVAS_CONSTANTS.velocityDecay, timeScale);
      velocityRef.current.y *= Math.pow(CANVAS_CONSTANTS.velocityDecay, timeScale);
      velocityRef.current.z *= Math.pow(CANVAS_CONSTANTS.velocityDecay, timeScale);

      if (!isDraggingRef.current) {
        targetCameraRef.current.x += velocityRef.current.x * timeScale;
        targetCameraRef.current.y += velocityRef.current.y * timeScale;
        targetCameraRef.current.z += velocityRef.current.z * timeScale;
      } else {
        targetCameraRef.current.z += velocityRef.current.z * timeScale;
      }

      const lerpFactor = 1 - Math.pow(1 - CANVAS_CONSTANTS.velocityLerp, timeScale);
      cameraRef.current.x += (targetCameraRef.current.x - cameraRef.current.x) * lerpFactor;
      cameraRef.current.y += (targetCameraRef.current.y - cameraRef.current.y) * lerpFactor;
      cameraRef.current.z += (targetCameraRef.current.z - cameraRef.current.z) * lerpFactor;

      // — Atmospheric Depth Fog —
      if (fogRef.current) {
        const zDepth = cameraRef.current.z;
        const fogT = Math.min(1, Math.max(0, (-zDepth - 1500) / 5000));
        const clearSize = 70 - fogT * 40;
        const opacity = fogT * 0.45;
        const xOff = 50 + cameraRef.current.x * 0.0005;
        const yOff = 50 + cameraRef.current.y * 0.0005;
        fogRef.current.style.background = `radial-gradient(ellipse 70% 60% at ${xOff.toFixed(1)}% ${yOff.toFixed(1)}%, transparent ${clearSize.toFixed(0)}%, rgba(220,228,236,${opacity.toFixed(3)}) 100%)`;
      }

      const cullDistanceSq =
        (cameraRef.current.x - previousCullCameraRef.current.x) ** 2 +
        (cameraRef.current.y - previousCullCameraRef.current.y) ** 2 +
        (cameraRef.current.z - previousCullCameraRef.current.z) ** 2;

      if (cullDistanceSq > CANVAS_CONSTANTS.cameraSyncDistanceThreshold ** 2) {
        previousCullCameraRef.current = { ...cameraRef.current };
        syncVisibleItems();
      }

      updateDomNodes();
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    if (prefersReducedMotion) {
      requestAnimationFrame(() => {
        syncVisibleItems();
        updateDomNodes();
      });
      return;
    }

    animationFrameRef.current = requestAnimationFrame(loop);
    const initialSyncFrame = requestAnimationFrame(() => {
      syncVisibleItems();
    });

    return () => {
      cancelAnimationFrame(initialSyncFrame);
      cancelAnimationFrame(animationFrameRef.current);
      if (removalTimerRef.current) {
        clearTimeout(removalTimerRef.current);
        removalTimerRef.current = null;
      }
    };
  }, [projects.length, syncVisibleItems, updateDomNodes, prefersReducedMotion]);

  if (projects.length === 0) return null;

  let priorityCount = 0;

  return (
    <div
      ref={containerRef}
      data-canvas-viewport
      onPointerMove={handlePointerMove}
      className="relative z-10 h-full w-full cursor-grab select-none overflow-hidden bg-[#F0F0F0] active:cursor-grabbing"
      style={{
        touchAction: 'none',
        perspective: `${CANVAS_CONSTANTS.perspective}px`,
        perspectiveOrigin: '50% 50%',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {renderedItems.map((item) => {
          const coverUrl = getPreviewCoverUrl(item.project);
          const isVideo = isVideoUrl(coverUrl);
          const shouldPriority =
            !isVideo &&
            item.dist < CANVAS_CONSTANTS.priorityImageDistance &&
            priorityCount < CANVAS_CONSTANTS.maxPriorityImages;
          if (shouldPriority) priorityCount++;

          // Compute initial visual style for server-side rendering (SSR) at camera = { x: 0, y: 0, z: 0 }
          const dx = item.x;
          const dy = item.y;
          const dz = item.z;

          let targetOpacity = 1;
          let blur = 0;
          let targetGrayscale = 0;

          // Forward (Close-up) Fading
          if (dz > CANVAS_CONSTANTS.fadeCloseStart) {
            const t = Math.min(
              1,
              Math.max(0, (dz - CANVAS_CONSTANTS.fadeCloseStart) / CANVAS_CONSTANTS.fadeCloseRange)
            );
            targetOpacity = 1 - (1 - Math.pow(1 - t, 5)); // easeOutQuint
            blur = Math.min(
              12,
              Math.max(0, (dz - CANVAS_CONSTANTS.fadeCloseStart) / CANVAS_CONSTANTS.blurCloseRange)
            );
          }

          // Backward (Far) Fading & Grayscale
          if (dz < CANVAS_CONSTANTS.grayscaleStart) {
            targetGrayscale = Math.min(
              100,
              Math.max(
                0,
                ((CANVAS_CONSTANTS.grayscaleStart - dz) / CANVAS_CONSTANTS.grayscaleRange) * 100
              )
            );
          }

          if (dz < CANVAS_CONSTANTS.fadeFarStart) {
            const t = Math.min(
              1,
              Math.max(0, (dz - CANVAS_CONSTANTS.fadeFarStart) / CANVAS_CONSTANTS.fadeFarRange)
            );
            targetOpacity = 1 - (1 - Math.pow(1 - t, 5)); // easeOutQuint
            blur = Math.max(
              blur,
              Math.min(
                15,
                Math.max(0, (dz - CANVAS_CONSTANTS.fadeFarStart) / CANVAS_CONSTANTS.blurFarRange)
              )
            );
          }

          // Radial (Edge) Fading
          const scaleFactor =
            CANVAS_CONSTANTS.perspective / Math.max(1, CANVAS_CONSTANTS.perspective - dz);
          const normalizedX = (dx * scaleFactor) / CANVAS_CONSTANTS.screenWidth;
          const normalizedY = (dy * scaleFactor) / CANVAS_CONSTANTS.screenHeight;
          const radialDistance = Math.sqrt(normalizedX ** 2 + normalizedY ** 2);

          if (radialDistance > CANVAS_CONSTANTS.edgeFadeStart) {
            const t = Math.min(
              1,
              (radialDistance - CANVAS_CONSTANTS.edgeFadeStart) / CANVAS_CONSTANTS.edgeFadeRange
            );
            targetOpacity *= 1 - (1 - Math.pow(1 - t, 5)); // easeOutQuint
          }

          // Final Clipping
          if (dz > CANVAS_CONSTANTS.clipClose || dz < CANVAS_CONSTANTS.clipFar) {
            targetOpacity = 0;
          }

          const isHidden = targetOpacity <= CANVAS_CONSTANTS.minVisibleOpacity;
          const filterParts: string[] = [];

          if (blur > 0.5 && targetOpacity > 0.1) {
            filterParts.push(`blur(${Math.min(10, blur).toFixed(1)}px)`);
          }
          if (targetGrayscale > 1) {
            filterParts.push(`grayscale(${targetGrayscale.toFixed(0)}%)`);
          }

          const initialStyle: React.CSSProperties = {
            visibility: isHidden ? 'hidden' : 'visible',
            opacity: targetOpacity,
            transform: `translate3d(calc(-50% + ${dx.toFixed(2)}px), calc(-50% + ${dy.toFixed(2)}px), ${dz.toFixed(2)}px) scale(${item.scale})`,
            zIndex: Math.round(10000 + dz),
            filter: filterParts.join(' ') || 'none',
          };

          return (
            <CanvasCard
              key={item.key}
              item={item}
              isPriority={shouldPriority}
              registerCardRef={registerCardRef}
              registerVideoRef={registerVideoRef}
              initialStyle={initialStyle}
            />
          );
        })}
      </div>

      <div
        ref={fogRef}
        className="pointer-events-none absolute inset-0 z-[15]"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 70%, rgba(220,228,236,0) 100%)',
        }}
      />

      <div className="pointer-events-none absolute bottom-10 left-10 flex flex-col gap-2">
        <div className="text-[10px] uppercase tracking-[0.3em] text-black/20">
          Mode: Infinite Canvas
        </div>
        <div className="text-[10px] uppercase tracking-[0.3em] text-black/40">
          Drag to PAN / Scroll to ZOOM
        </div>
      </div>
    </div>
  );
}
