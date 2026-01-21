"use client";

import React, { useLayoutEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment, Float, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function CapModel(props: any) {
    const { scene } = useGLTF("/assets/3d/cap.glb");
    const meshRef = useRef<THREE.Group>(null);

    // Scroll Animation Logic
    useLayoutEffect(() => {
        if (!meshRef.current) return;

        // Create a timeline linked to the scroll trigger
        // The trigger is the main scrollable container (document body in this case)
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: document.body,
                start: "top top",
                end: "bottom bottom",
                scrub: 1, // Smooth scrubbing
            },
        });

        // Zigzag Animation Sequence
        // 1. Move Right
        // 1. Move Right & Rotate
        tl.to(meshRef.current.position, {
            x: 2,
            y: -1,
            z: 1,
            duration: 1
        })
            .to(meshRef.current.rotation, {
                y: Math.PI * 2, // Spin 360
                duration: 1
            }, "<") // Sync with previous

            // 2. Move Left & Rotate
            .to(meshRef.current.position, {
                x: -2,
                y: 0,
                z: 0,
                duration: 1
            })
            .to(meshRef.current.rotation, {
                y: Math.PI * 4, // Spin another 360
                duration: 1
            }, "<")

            // 3. Return Center
            .to(meshRef.current.position, {
                x: 0,
                y: -0.5,
                z: 0.5,
                duration: 1
            })
            .to(meshRef.current.rotation, {
                y: Math.PI * 6,
                duration: 1
            }, "<");

        return () => {
            tl.kill();
        };
    }, []);

    // Continuous subtle floating (layered on top of scroll movement)
    useFrame((state) => {
        if (meshRef.current) {
            // Only oscillate Y slightly for breathing effect
            // We let GSAP handle the heavy lifting of X/Y/Z position
            meshRef.current.position.y += Math.sin(state.clock.elapsedTime) * 0.002;
        }
    });

    return (
        <group ref={meshRef} {...props} dispose={null}>
            <primitive object={scene} scale={2} />
        </group>
    );
}

export default function CapModelViewer() {
    return (
        <div className="relative w-full">
            {/* SCROLLABLE AREA (Height provides scroll distance) */}
            <div className="h-[400vh] w-full bg-neutral-900">

                {/* STICKY CONTAINER (Keeps 3D View fixed while scrolling) */}
                <div className="sticky top-0 h-screen w-full overflow-hidden">

                    {/* Overlay Text */}
                    <div className="absolute top-10 left-10 pointer-events-none z-10">
                        <h1 className="text-white text-4xl font-bold tracking-tighter">
                            Scroll to Animate
                        </h1>
                        <p className="text-neutral-400">
                            GSAP + React Three Fiber
                        </p>
                    </div>

                    <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                        <ambientLight intensity={0.5} />
                        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
                        <pointLight position={[-10, -10, -10]} intensity={1} />
                        <Environment preset="studio" />

                        {/* Render Model directly (No Float wrapper to avoid conflict with GSAP) */}
                        <CapModel position={[0, -0.5, 0]} />

                        <ContactShadows
                            position={[0, -2, 0]}
                            opacity={0.5}
                            scale={10}
                            blur={2.5}
                            far={4}
                        />
                    </Canvas>
                </div>
            </div>
        </div>
    );
}

useGLTF.preload("/assets/3d/cap.glb");
