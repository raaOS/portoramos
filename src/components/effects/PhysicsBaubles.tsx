'use client';

import * as THREE from 'three';
import React, { useRef, useMemo, memo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, useGLTF } from '@react-three/drei';
import { EffectComposer, N8AO } from '@react-three/postprocessing';
import { BallCollider, Physics, RigidBody, CylinderCollider } from '@react-three/rapier';
import { usePerfMonitor } from './PerfMonitor';

// Match original App.js logic
THREE.ColorManagement.enabled = true;

const sphereGeometry = new THREE.SphereGeometry(1, 28, 28);
const baublesData = [...Array(50)].map(() => ({
    scale: [2, 2, 2.5, 2.5, 3][Math.floor(Math.random() * 5)]
}));

const GL_CONFIG = {
    alpha: true,
    stencil: false,
    depth: false,
    antialias: false
};

function Bauble({ scale, material, capMaterial }: { scale: number, material: THREE.Material, capMaterial: THREE.Material }) {
    const { nodes } = useGLTF("/cap.glb") as any;
    const api = useRef<any>();
    const vec = useMemo(() => new THREE.Vector3(), []);

    // Stable random initial position
    const initialPos = useMemo(() => {
        const r = THREE.MathUtils.randFloatSpread;
        return [r(20), r(20) - 5, r(20) - 10] as [number, number, number];
    }, []);

    useFrame((state, delta) => {
        delta = Math.min(0.1, delta);
        if (!api.current) return;
        const translation = api.current.translation();
        const forceScale = delta * (scale ** 3);
        vec.copy(translation).normalize();
        vec.x *= -50 * forceScale;
        vec.y *= -150 * forceScale;
        vec.z *= -50 * forceScale;
        api.current.applyImpulse(vec);
    });

    return (
        <RigidBody
            linearDamping={0.75}
            angularDamping={0.15}
            friction={0.2}
            position={initialPos}
            ref={api}
            colliders={false}
        >
            <BallCollider args={[scale]} />
            <CylinderCollider rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 1.2 * scale]} args={[0.15 * scale, 0.275 * scale]} />
            <mesh castShadow receiveShadow scale={scale} geometry={sphereGeometry} material={material} />
            <mesh castShadow scale={2.5 * scale} position={[0, 0, -1.8 * scale]} geometry={nodes.Mesh_1.geometry} material={capMaterial} />
        </RigidBody>
    );
}

function Pointer() {
    const ref = useRef<any>();
    const vec = useMemo(() => new THREE.Vector3(), []);

    const target = useMemo(() => new THREE.Vector3(), []);
    useFrame(({ mouse, viewport }) => {
        target.set((mouse.x * viewport.width) / 2, (mouse.y * viewport.height) / 2, 0);
        vec.lerp(target, 0.2);
        ref.current?.setNextKinematicTranslation(vec);
    });

    return (
        <RigidBody position={[100, 100, 100]} type="kinematicPosition" colliders={false} ref={ref}>
            <BallCollider args={[2]} />
        </RigidBody>
    );
}

const Scene = memo(({ ballColor, capColor, performanceLevel }: { ballColor?: string, capColor?: string, performanceLevel: 'high' | 'low' }) => {
    const baubleMaterial = useMemo(() => new THREE.MeshLambertMaterial({
        color: ballColor || "#FEDDD8",
        emissive: ballColor || "#ffbdae"
    }), [ballColor]);

    const capMat = useMemo(() => new THREE.MeshStandardMaterial({
        metalness: 0.75,
        roughness: 0.15,
        color: capColor || "#F6A77B",
        emissive: capColor || "#8b4513",
        envMapIntensity: 20
    }), [capColor]);

    return (
        <Suspense fallback={null}>
            <ambientLight intensity={1} />
            <spotLight position={[20, 20, 25]} penumbra={1} angle={0.2} color="white" castShadow={performanceLevel === 'high'} shadow-mapSize={[512, 512]} />
            <directionalLight position={[0, 5, -4]} intensity={4} />
            <directionalLight position={[0, -15, -0]} intensity={4} color={ballColor || "red"} />
            <Physics gravity={[0, 0, 0]}>
                <Pointer />
                {baublesData.map((props, i) => (
                    <Bauble
                        key={i}
                        {...props}
                        material={baubleMaterial}
                        capMaterial={capMat}
                    />
                ))}
            </Physics>
            <Environment files="/adamsbridge.hdr" />
            <Effects ballColor={ballColor} performanceLevel={performanceLevel} />
        </Suspense>
    );
});


function Effects({ ballColor, performanceLevel }: { ballColor?: string, performanceLevel: 'high' | 'low' }) {
    const gl = useThree((state) => state.gl);
    if (!gl || performanceLevel === 'low') return null; // Disable AO on low perf

    return (
        <EffectComposer enableNormalPass={false}>
            <N8AO color={ballColor || "red"} aoRadius={2} intensity={1.15} />
        </EffectComposer>
    );
}

Scene.displayName = 'Scene';

function Underlay({ textColor }: { textColor?: string }) {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
            <div className="text-center w-full flex flex-col justify-center items-center -mt-24 md:-mt-48">
                <h1
                    className="font-display text-[36vw] md:text-[32vw] lg:text-[31vw] leading-[0.9] tracking-normal font-bold select-none uppercase m-0 p-0 opacity-100"
                    style={{ color: textColor || 'black' }}
                >
                    PORTOFOLIO
                </h1>
            </div>
        </div>
    );
}

function Overlay() {
    return null;
}

interface PhysicsBaublesProps {
    hideText?: boolean;
    ballColor?: string;
    capColor?: string;
    textColor?: string;
}

export default function PhysicsBaubles({
    hideText = false,
    ballColor,
    capColor,
    textColor
}: PhysicsBaublesProps) {
    const [mounted, setMounted] = useState(false);
    const { dpr, performanceLevel, PerfMonitorComponent } = usePerfMonitor();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return (
        <div className="w-full h-full min-h-[500px] relative flex items-center justify-center overflow-hidden pointer-events-none" />
    );

    return (
        <div className="w-full h-screen min-h-[500px] relative pointer-events-none">
            {!hideText && <Underlay textColor={textColor} />}
            <Canvas
                shadows={performanceLevel === 'high'} // Disable shadows on low perf
                dpr={dpr}
                gl={GL_CONFIG}
                camera={{ position: [0, -10, 40], fov: 32.5, near: 1, far: 100 }}
                onCreated={(state) => {
                    state.gl.toneMapping = THREE.LinearToneMapping;
                    state.gl.toneMappingExposure = 1.5;
                }}
                className="absolute inset-0 z-10 pointer-events-auto"
            >
                <PerfMonitorComponent />
                <Scene ballColor={ballColor} capColor={capColor} performanceLevel={performanceLevel} />
            </Canvas>
            {!hideText && <Overlay />}
        </div>
    );
}
