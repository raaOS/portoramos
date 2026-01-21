'use client';

import * as THREE from 'three';
import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
    Text3D,
    MeshTransmissionMaterial,
    Environment,
    Float,
    Center,
    ContactShadows
} from '@react-three/drei';
import { easing } from 'maath';

function Rig() {
    const { camera, mouse } = useThree();
    useFrame((state, delta) => {
        // Smoothly move camera based on mouse
        easing.damp3(
            state.camera.position,
            [state.pointer.x * 2, state.pointer.y * 2, 5],
            0.25,
            delta
        );
        state.camera.lookAt(0, 0, 0);
    });
    return null;
}

function Scene({ text = "PORTOFOLIO" }: { text?: string }) {
    const config = {
        backside: true,
        samples: 16,
        resolution: 1024,
        transmission: 1,
        roughness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0,
        thickness: 0.5,
        backsideThickness: 0.5,
        ior: 1.5,
        chromaticAberration: 0.05,
        anisotropy: 0.1,
        distortion: 0.1,
        distortionScale: 0.5,
        temporalDistortion: 0.1,
        attenuationDistance: 0.5,
        attenuationColor: '#ffffff',
        color: '#ffffff',
    };

    return (
        <>
            <Environment preset="city" />
            <Center top>
                <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                    <Text3D
                        font="https://raw.githubusercontent.com/mrdoob/three.js/master/examples/fonts/helvetiker_bold.typeface.json"
                        size={0.8}
                        height={0.2}
                        curveSegments={12}
                        bevelEnabled
                        bevelThickness={0.02}
                        bevelSize={0.02}
                        bevelOffset={0}
                        bevelSegments={5}
                    >
                        {text}
                        <MeshTransmissionMaterial {...config} />
                    </Text3D>
                </Float>
            </Center>

            <ContactShadows
                position={[0, -1.5, 0]}
                opacity={0.4}
                scale={20}
                blur={2}
                far={4.5}
            />
        </>
    );
}

export default function GlassText({ text }: { text?: string }) {
    return (
        <div className="w-full h-full min-h-[500px] bg-transparent">
            <Canvas
                shadows
                camera={{ position: [0, 0, 5], fov: 35 }}
                dpr={[1, 2]} // Performance optimization: cap resolution
            >
                <color attach="background" args={['#0a0a0a']} />
                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
                <pointLight position={[-10, -10, -10]} />

                <Scene text={text} />
                <Rig />
            </Canvas>
        </div>
    );
}
