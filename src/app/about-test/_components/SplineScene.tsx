'use client'

import useSpline from '@splinetool/r3f-spline'
import { OrthographicCamera, Html } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect } from 'react'

function Scene({ ...props }) {
    const { nodes, materials } = useSpline('https://prod.spline.design/sE14LiWrblts8dEX/scene.splinecode')
    return (
        <>
            <color attach="background" args={['#9585c6']} />
            <group {...props} dispose={null}>
                <scene name="Scene 1">
                    <mesh
                        name="image.png"
                        geometry={nodes['image.png']?.geometry}
                        material={materials['image.png Material']}
                        castShadow
                        receiveShadow
                        position={[17.99, -259.89, 123.82]}
                        rotation={[-1.57, 0, 0]}
                    />
                    <pointLight
                        name="Point Light"
                        castShadow
                        intensity={1.92}
                        decay={0.1}
                        distance={4642}
                        shadow-mapSize-width={1024}
                        shadow-mapSize-height={1024}
                        shadow-camera-near={100}
                        shadow-camera-far={100000}
                        color="#f7b1fe"
                        position={[132.16, 2878.87, -3381]}
                    />
                    <group name="Laptop" position={[13.5, -192.09, 163.76]}>
                        <mesh
                            name="Laptop Logo"
                            geometry={nodes['Laptop Logo']?.geometry}
                            material={materials['Laptop Logo Material']}
                            castShadow
                            receiveShadow
                            position={[0, 0, 131.33]}
                            rotation={[0.44, 0, 0]}
                            scale={0.7}
                        />
                        <pointLight
                            name="Laptop light"
                            castShadow
                            intensity={1.29}
                            decay={0}
                            distance={2179}
                            shadow-mapSize-width={1024}
                            shadow-mapSize-height={1024}
                            shadow-camera-near={100}
                            shadow-camera-far={100000}
                            color="#0044fe"
                            position={[0.24, 1.08, -27.93]}
                        />
                        <mesh
                            name="Cube 3"
                            geometry={nodes['Cube 3']?.geometry}
                            material={materials.Laptop}
                            castShadow
                            receiveShadow
                            position={[0, 0, 114.12]}
                            rotation={[2.01, 0, 0]}
                        />
                        <mesh
                            name="Cube 2"
                            geometry={nodes['Cube 2']?.geometry}
                            material={materials.Laptop}
                            castShadow
                            receiveShadow
                            position={[0, -77.7, -56.84]}
                        />
                    </group>
                    <OrthographicCamera
                        name="Camera"
                        makeDefault={true}
                        zoom={0.35}
                        far={100000}
                        near={-100000}
                        up={[0, 1, 0]}
                        position={[-0.89, 404.11, 1129.03]}
                        rotation={[-0.14, -0.01, 0]}
                        scale={1}
                    />
                    <directionalLight
                        name="Filling light"
                        castShadow
                        intensity={0.52}
                        shadow-mapSize-width={1024}
                        shadow-mapSize-height={1024}
                        shadow-camera-near={-10000}
                        shadow-camera-far={100000}
                        shadow-camera-left={-1443.427}
                        shadow-camera-right={1443.427}
                        shadow-camera-top={1443.427}
                        shadow-camera-bottom={-1443.427}
                        position={[3703.81, 1517.35, 3474.7]}
                    />
                    <pointLight
                        name="Left light"
                        castShadow
                        intensity={0.52}
                        decay={2}
                        distance={10000}
                        shadow-mapSize-width={1024}
                        shadow-mapSize-height={1024}
                        shadow-camera-near={100}
                        shadow-camera-far={100000}
                        position={[-1354.01, 895.87, -391.48]}
                    />
                    <group name="Bodies" position={[20.12, -133.53, -404.99]}>
                        <mesh
                            name="Cube 17"
                            geometry={nodes['Cube 17']?.geometry}
                            material={materials.Body}
                            castShadow
                            receiveShadow
                            position={[587.58, 58.25, 35.79]}
                            scale={[0.85, 1, 0.6]}
                        />
                        <mesh
                            name="Cube 18"
                            geometry={nodes['Cube 18']?.geometry}
                            material={materials.Body}
                            castShadow
                            receiveShadow
                            position={[467.01, -220.79, 105.99]}
                            scale={[0.71, 1.89, 0.6]}
                        />
                        <mesh
                            name="Cube 8"
                            geometry={nodes['Cube 8']?.geometry}
                            material={materials.Body}
                            castShadow
                            receiveShadow
                            position={[540.41, -251.32, 187.49]}
                            rotation={[0, -0.29, 0]}
                            scale={[0.71, 1.66, 0.6]}
                        />
                        <mesh
                            name="Cube 9"
                            geometry={nodes['Cube 9']?.geometry}
                            material={materials.Body}
                            castShadow
                            receiveShadow
                            position={[-260.63, -157.13, 188.53]}
                            rotation={[0, 0.39, 0]}
                            scale={[0.71, 1.55, 0.6]}
                        />
                        <mesh
                            name="Cube 10"
                            geometry={nodes['Cube 10']?.geometry}
                            material={materials.Body}
                            castShadow
                            receiveShadow
                            position={[301.34, 165.46, 142.65]}
                            rotation={[0.16, 0, 0]}
                            scale={[0.71, 1, 0.6]}
                        />
                        <mesh
                            name="Cube 7"
                            geometry={nodes['Cube 7']?.geometry}
                            material={materials.Body}
                            castShadow
                            receiveShadow
                            position={[268.76, -112.58, 218.21]}
                            scale={[0.81, 1, 0.6]}
                        />
                        <mesh
                            name="Cube 19"
                            geometry={nodes['Cube 19']?.geometry}
                            material={materials.Body}
                            castShadow
                            receiveShadow
                            position={[-481.88, -244.15, 272.52]}
                            rotation={[0, 0.27, 0]}
                            scale={[0.69, 1.62, 0.6]}
                        />
                        <mesh
                            name="Cube 15"
                            geometry={nodes['Cube 15']?.geometry}
                            material={materials.Body}
                            castShadow
                            receiveShadow
                            position={[-702.36, -180.71, 206.64]}
                            rotation={[0, 0.45, 0]}
                            scale={[0.69, 1.61, 0.6]}
                        />
                        <mesh
                            name="Cube 14"
                            geometry={nodes['Cube 14']?.geometry}
                            material={materials.Body}
                            castShadow
                            receiveShadow
                            position={[-619.36, 76.07, 20.16]}
                            rotation={[0, 0.13, 0]}
                            scale={[0.69, 1, 0.6]}
                        />
                        <mesh
                            name="Cube 24"
                            geometry={nodes['Cube 24']?.geometry}
                            material={materials.Body}
                            castShadow
                            receiveShadow
                            position={[219.72, 337.22, -46.59]}
                            scale={[0.69, 1, 0.6]}
                        />
                        <mesh
                            name="Cube 23"
                            geometry={nodes['Cube 23']?.geometry}
                            material={materials.Body}
                            castShadow
                            receiveShadow
                            position={[404.65, 300.59, -78.6]}
                            scale={[0.69, 1, 0.6]}
                        />
                        <mesh
                            name="Cube 21"
                            geometry={nodes['Cube 21']?.geometry}
                            material={materials.Body}
                            castShadow
                            receiveShadow
                            position={[189.95, 381.05, -221.85]}
                            scale={[0.69, 1, 0.6]}
                        />
                        <mesh
                            name="Cube 22"
                            geometry={nodes['Cube 22']?.geometry}
                            material={materials.Body}
                            castShadow
                            receiveShadow
                            position={[-408.57, 232.33, -11.68]}
                            scale={[0.69, 1, 0.6]}
                        />
                        <mesh
                            name="Cube 20"
                            geometry={nodes['Cube 20']?.geometry}
                            material={materials.Body}
                            castShadow
                            receiveShadow
                            position={[-178.9, 410.51, -132.01]}
                            rotation={[0.2, 0, 0]}
                            scale={[0.69, 1, 0.6]}
                        />
                        <mesh
                            name="Cube 13"
                            geometry={nodes['Cube 13']?.geometry}
                            material={materials.Body}
                            castShadow
                            receiveShadow
                            position={[-391.32, 28.18, 142.45]}
                            scale={[0.69, 1.61, 0.6]}
                        />
                        <mesh
                            name="Cube 12"
                            geometry={nodes['Cube 12']?.geometry}
                            material={materials.Body}
                            castShadow
                            receiveShadow
                            position={[-60.7, 355.5, 22.26]}
                            rotation={[0.08, 0, 0]}
                            scale={[0.86, 1, 0.6]}
                        />
                        <mesh
                            name="Cube 11"
                            geometry={nodes['Cube 11']?.geometry}
                            material={materials.Body}
                            castShadow
                            receiveShadow
                            position={[-166.42, 65.98, 121.8]}
                            rotation={[0.15, 0, 0]}
                            scale={[0.69, 1, 0.6]}
                        />
                        <mesh
                            name="Cube 6"
                            geometry={nodes['Cube 6']?.geometry}
                            material={materials.Body}
                            castShadow
                            receiveShadow
                            position={[58.92, 128.45, 161.98]}
                            scale={[1, 1, 0.6]}
                        />
                        <mesh
                            name="Cube 5"
                            geometry={nodes['Cube 5']?.geometry}
                            material={materials.Body}
                            castShadow
                            receiveShadow
                            position={[-6.62, -49.55, 311.17]}
                            scale={[1, 1, 0.47]}
                        />
                    </group>
                    <group name="Heads" position={[39.26, 383.56, -275.57]}>
                        <group name="Head Teapot" position={[-610.35, -40.7, -32.92]}>
                            <mesh
                                name="Shape"
                                geometry={nodes.Shape.geometry}
                                material={materials.Eyebrows}
                                castShadow
                                receiveShadow
                                position={[24.09, 60.5, 65.42]}
                                rotation={[Math.PI, -0.55, -3.07]}
                                scale={[-1, 1, 1]}
                            />
                            <mesh
                                name="Shape1"
                                geometry={nodes.Shape1.geometry}
                                material={materials.Eyebrows}
                                castShadow
                                receiveShadow
                                position={[-54.63, 58.12, 54.24]}
                                rotation={[0, -0.42, 0.09]}
                            />
                            <mesh
                                name="Sphere 6"
                                geometry={nodes['Sphere 6']?.geometry}
                                material={materials.Pupils}
                                castShadow
                                receiveShadow
                                position={[-38.21, 21.41, 74.54]}
                                rotation={[-0.19, -0.34, -0.06]}
                                scale={[1.15, 1.15, 0.32]}
                            />
                            <mesh
                                name="Sphere 5"
                                geometry={nodes['Sphere 5']?.geometry}
                                material={materials['Sphere 5 Material']}
                                castShadow
                                receiveShadow
                                position={[-40.37, 21.41, 67.24]}
                                rotation={[-0.19, -0.34, -0.06]}
                                scale={[1.65, 1.65, 0.47]}
                            />
                            <mesh
                                name="Sphere 61"
                                geometry={nodes['Sphere 61']?.geometry}
                                material={materials.Pupils}
                                castShadow
                                receiveShadow
                                position={[38.15, 21.4, 74.43]}
                                rotation={[-0.17, 0.34, 0.06]}
                                scale={[1.15, 1.15, 0.32]}
                            />
                            <mesh
                                name="Sphere 3"
                                geometry={nodes['Sphere 3']?.geometry}
                                material={materials['Sphere 3 Material']}
                                castShadow
                                receiveShadow
                                position={[40, 21.41, 67.24]}
                                rotation={[-0.17, 0.34, 0.06]}
                                scale={[1.65, 1.65, 0.47]}
                            />
                            <mesh
                                name="Cylinder 2"
                                geometry={nodes['Cylinder 2']?.geometry}
                                material={materials.Head}
                                castShadow
                                receiveShadow
                                position={[-0.43, 4.21, -5.5]}
                                rotation={[0, 0, Math.PI / 2]}
                                scale={[0.97, 0.92, 0.56]}
                            />
                            <mesh
                                name="Cylinder"
                                geometry={nodes.Cylinder.geometry}
                                material={materials['Cylinder Material']}
                                castShadow
                                receiveShadow
                                position={[0, 12.46, 64.97]}
                                rotation={[2.79, 0, 0]}
                                scale={[0.97, 1.15, 1.15]}
                            />
                            <mesh
                                name="Sphere"
                                geometry={nodes.Sphere.geometry}
                                material={materials.Head}
                                castShadow
                                receiveShadow
                                position={[0, 0, -12.34]}
                            />
                        </group>
                        <group name="Group 4 Instance 9" position={[-713.22, -290.72, 172.79]}>
                            <group name="Group 2" visible={false} position={[0.6, 25.06, 79.34]}>
                                <mesh
                                    name="Ellipse 4"
                                    geometry={nodes['Ellipse 4']?.geometry}
                                    material={materials['Ellipse 4 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-48, 0.27, 2.34]}
                                />
                                <mesh
                                    name="Ellipse 2"
                                    geometry={nodes['Ellipse 2']?.geometry}
                                    material={materials['Ellipse 2 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[47.87, 0.27, 2.34]}
                                />
                                <mesh
                                    name="Shape 2"
                                    geometry={nodes['Shape 2']?.geometry}
                                    material={materials['Shape 2 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-17.02, 6.42, 0]}
                                />
                                <mesh
                                    name="Ellipse 3"
                                    geometry={nodes['Ellipse 3']?.geometry}
                                    material={materials['Ellipse 3 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[47.76, 0, 0]}
                                />
                                <mesh
                                    name="Ellipse 21"
                                    geometry={nodes['Ellipse 21']?.geometry}
                                    material={materials['Ellipse 21 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-48.68, 0, 0]}
                                />
                            </group>
                            <mesh
                                name="Shape2"
                                geometry={nodes.Shape2.geometry}
                                material={materials.Eyebrows}
                                castShadow
                                receiveShadow
                                position={[24.09, 60.5, 65.42]}
                                rotation={[Math.PI, -0.55, -3.07]}
                                scale={[-1, 1, 1]}
                            />
                            <mesh
                                name="Shape3"
                                geometry={nodes.Shape3.geometry}
                                material={materials.Eyebrows}
                                castShadow
                                receiveShadow
                                position={[-54.63, 58.12, 54.24]}
                                rotation={[0, -0.42, 0.09]}
                            />
                            <mesh
                                name="Sphere 62"
                                geometry={nodes['Sphere 62']?.geometry}
                                material={materials.Pupils}
                                castShadow
                                receiveShadow
                                position={[-38.21, 21.41, 74.54]}
                                rotation={[-0.19, -0.34, 3.08]}
                                scale={[1.15, 1.15, 0.32]}
                            />
                            <mesh
                                name="Sphere 51"
                                geometry={nodes['Sphere 51']?.geometry}
                                material={materials['Sphere 51 Material']}
                                castShadow
                                receiveShadow
                                position={[-40.37, 21.41, 67.24]}
                                rotation={[-0.19, -0.34, -0.06]}
                                scale={[1.65, 1.65, 0.47]}
                            />
                            <mesh
                                name="Sphere 63"
                                geometry={nodes['Sphere 63']?.geometry}
                                material={materials.Pupils}
                                castShadow
                                receiveShadow
                                position={[38.15, 21.4, 74.43]}
                                rotation={[-0.17, 0.34, -3.08]}
                                scale={[1.15, 1.15, 0.32]}
                            />
                            <mesh
                                name="Sphere 31"
                                geometry={nodes['Sphere 31']?.geometry}
                                material={materials['Sphere 31 Material']}
                                castShadow
                                receiveShadow
                                position={[40, 21.41, 67.24]}
                                rotation={[-0.17, 0.34, -3.08]}
                                scale={[1.65, 1.65, 0.47]}
                            />
                            <mesh
                                name="Cylinder 21"
                                geometry={nodes['Cylinder 21']?.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[-0.43, 4.21, -5.5]}
                                rotation={[0, 0, Math.PI / 2]}
                                scale={[0.97, 0.92, 0.56]}
                            />
                            <mesh
                                name="Cylinder1"
                                geometry={nodes.Cylinder1.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[0, 12.46, 64.97]}
                                rotation={[2.79, 0, 0]}
                                scale={[0.97, 1.15, 1.15]}
                            />
                            <mesh
                                name="Sphere1"
                                geometry={nodes.Sphere1.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[0, 0, -12.34]}
                            />
                        </group>
                        <group name="Group 4 Instance 8" position={[-391.41, -148.98, 95.86]}>
                            <group name="Group 21" visible={false} position={[0.6, 25.06, 79.34]}>
                                <mesh
                                    name="Ellipse 41"
                                    geometry={nodes['Ellipse 41']?.geometry}
                                    material={materials['Ellipse 41 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-48, 0.27, 2.34]}
                                />
                                <mesh
                                    name="Ellipse 22"
                                    geometry={nodes['Ellipse 22']?.geometry}
                                    material={materials['Ellipse 22 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[47.87, 0.27, 2.34]}
                                />
                                <mesh
                                    name="Shape 21"
                                    geometry={nodes['Shape 21']?.geometry}
                                    material={materials['Shape 21 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-17.02, 6.42, 0]}
                                />
                                <mesh
                                    name="Ellipse 31"
                                    geometry={nodes['Ellipse 31']?.geometry}
                                    material={materials['Ellipse 31 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[47.76, 0, 0]}
                                />
                                <mesh
                                    name="Ellipse 23"
                                    geometry={nodes['Ellipse 23']?.geometry}
                                    material={materials['Ellipse 23 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-48.68, 0, 0]}
                                />
                            </group>
                            <mesh
                                name="Shape4"
                                geometry={nodes.Shape4.geometry}
                                material={materials.Eyebrows}
                                castShadow
                                receiveShadow
                                position={[24.09, 60.5, 65.42]}
                                rotation={[Math.PI, -0.55, -3.07]}
                                scale={[-1, 1, 1]}
                            />
                            <mesh
                                name="Shape5"
                                geometry={nodes.Shape5.geometry}
                                material={materials.Eyebrows}
                                castShadow
                                receiveShadow
                                position={[-54.63, 58.12, 54.24]}
                                rotation={[0, -0.42, 0.09]}
                            />
                            <mesh
                                name="Sphere 64"
                                geometry={nodes['Sphere 64']?.geometry}
                                material={materials.Pupils}
                                castShadow
                                receiveShadow
                                position={[-38.21, 21.41, 74.54]}
                                rotation={[-0.19, -0.34, -0.06]}
                                scale={[0.72, 0.72, 0.32]}
                            />
                            <mesh
                                name="Sphere 52"
                                geometry={nodes['Sphere 52']?.geometry}
                                material={materials['Sphere 52 Material']}
                                visible={false}
                                castShadow
                                receiveShadow
                                position={[-40.37, 21.41, 67.24]}
                                rotation={[-0.19, -0.34, -0.06]}
                                scale={[1.65, 1.65, 0.47]}
                            />
                            <mesh
                                name="Sphere 65"
                                geometry={nodes['Sphere 65']?.geometry}
                                material={materials.Pupils}
                                castShadow
                                receiveShadow
                                position={[38.15, 21.4, 74.43]}
                                rotation={[-0.17, 0.34, 0.06]}
                                scale={[0.73, 0.73, 0.21]}
                            />
                            <mesh
                                name="Sphere 32"
                                geometry={nodes['Sphere 32']?.geometry}
                                material={materials['Sphere 32 Material']}
                                visible={false}
                                castShadow
                                receiveShadow
                                position={[40, 21.41, 67.24]}
                                rotation={[-0.17, 0.34, 0.06]}
                                scale={[1.65, 1.65, 0.47]}
                            />
                            <mesh
                                name="Cylinder 22"
                                geometry={nodes['Cylinder 22']?.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[-0.43, 4.21, -5.5]}
                                rotation={[0, 0, Math.PI / 2]}
                                scale={[0.97, 0.92, 0.56]}
                            />
                            <mesh
                                name="Cylinder2"
                                geometry={nodes.Cylinder2.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[0, 12.46, 64.97]}
                                rotation={[2.79, 0, 0]}
                                scale={[0.97, 1.15, 1.15]}
                            />
                            <mesh
                                name="Sphere2"
                                geometry={nodes.Sphere2.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[0, 0, -12.34]}
                            />
                        </group>
                        <group name="Group 4 Instance 7" position={[-79.84, 74.07, -36.73]}>
                            <group name="Group 22" visible={false} position={[0.6, 25.06, 79.34]}>
                                <mesh
                                    name="Ellipse 42"
                                    geometry={nodes['Ellipse 42']?.geometry}
                                    material={materials['Ellipse 42 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-48, 0.27, 2.34]}
                                />
                                <mesh
                                    name="Ellipse 24"
                                    geometry={nodes['Ellipse 24']?.geometry}
                                    material={materials['Ellipse 24 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[47.87, 0.27, 2.34]}
                                />
                                <mesh
                                    name="Shape 22"
                                    geometry={nodes['Shape 22']?.geometry}
                                    material={materials['Shape 22 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-17.02, 6.42, 0]}
                                />
                                <mesh
                                    name="Ellipse 32"
                                    geometry={nodes['Ellipse 32']?.geometry}
                                    material={materials['Ellipse 32 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[47.76, 0, 0]}
                                />
                                <mesh
                                    name="Ellipse 25"
                                    geometry={nodes['Ellipse 25']?.geometry}
                                    material={materials['Ellipse 25 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-48.68, 0, 0]}
                                />
                            </group>
                            <mesh
                                name="Shape6"
                                geometry={nodes.Shape6.geometry}
                                material={materials.Eyebrows}
                                castShadow
                                receiveShadow
                                position={[24.09, 60.5, 65.42]}
                                rotation={[Math.PI, -0.55, -3.07]}
                                scale={[-1, 1, 1]}
                            />
                            <mesh
                                name="Shape7"
                                geometry={nodes.Shape7.geometry}
                                material={materials.Eyebrows}
                                castShadow
                                receiveShadow
                                position={[-54.63, 58.12, 54.24]}
                                rotation={[0, -0.42, 0.09]}
                            />
                            <mesh
                                name="Sphere 66"
                                geometry={nodes['Sphere 66']?.geometry}
                                material={materials.Pupils}
                                castShadow
                                receiveShadow
                                position={[-38.21, 21.41, 74.54]}
                                rotation={[-0.19, -0.34, -0.06]}
                                scale={[1.15, 1.15, 0.32]}
                            />
                            <mesh
                                name="Sphere 53"
                                geometry={nodes['Sphere 53']?.geometry}
                                material={materials['Sphere 53 Material']}
                                castShadow
                                receiveShadow
                                position={[-40.37, 21.41, 67.24]}
                                rotation={[-0.19, -0.34, -0.06]}
                                scale={[1.65, 1.65, 0.47]}
                            />
                            <mesh
                                name="Sphere 67"
                                geometry={nodes['Sphere 67']?.geometry}
                                material={materials.Pupils}
                                castShadow
                                receiveShadow
                                position={[38.15, 21.4, 74.43]}
                                rotation={[-0.17, 0.34, 0.06]}
                                scale={[1.15, 1.15, 0.32]}
                            />
                            <mesh
                                name="Sphere 33"
                                geometry={nodes['Sphere 33']?.geometry}
                                material={materials['Sphere 33 Material']}
                                castShadow
                                receiveShadow
                                position={[40, 21.41, 67.24]}
                                rotation={[-0.17, 0.34, 0.06]}
                                scale={[1.65, 1.65, 0.47]}
                            />
                            <mesh
                                name="Cylinder 23"
                                geometry={nodes['Cylinder 23']?.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[-0.43, 4.21, -5.5]}
                                rotation={[0, 0, Math.PI / 2]}
                                scale={[0.97, 0.92, 0.56]}
                            />
                            <mesh
                                name="Cylinder3"
                                geometry={nodes.Cylinder3.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[0, 12.46, 64.97]}
                                rotation={[2.79, 0, 0]}
                                scale={[0.97, 1.15, 1.15]}
                            />
                            <mesh
                                name="Sphere3"
                                geometry={nodes.Sphere3.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[0, 0, -12.34]}
                            />
                        </group>
                        <group name="Group 4 Instance 5" position={[279.02, -96.67, 86.97]}>
                            <group name="Group 23" visible={false} position={[0.6, 25.06, 79.34]}>
                                <mesh
                                    name="Ellipse 43"
                                    geometry={nodes['Ellipse 43']?.geometry}
                                    material={materials['Ellipse 43 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-48, 0.27, 2.34]}
                                />
                                <mesh
                                    name="Ellipse 26"
                                    geometry={nodes['Ellipse 26']?.geometry}
                                    material={materials['Ellipse 26 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[47.87, 0.27, 2.34]}
                                />
                                <mesh
                                    name="Shape 23"
                                    geometry={nodes['Shape 23']?.geometry}
                                    material={materials['Shape 23 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-17.02, 6.42, 0]}
                                />
                                <mesh
                                    name="Ellipse 33"
                                    geometry={nodes['Ellipse 33']?.geometry}
                                    material={materials['Ellipse 33 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[47.76, 0, 0]}
                                />
                                <mesh
                                    name="Ellipse 27"
                                    geometry={nodes['Ellipse 27']?.geometry}
                                    material={materials['Ellipse 27 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-48.68, 0, 0]}
                                />
                            </group>
                            <mesh
                                name="Shape8"
                                geometry={nodes.Shape8.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[24.09, 60.5, 65.42]}
                                rotation={[Math.PI, -0.55, -3.07]}
                                scale={[-1, 1, 1]}
                            />
                            <mesh
                                name="Shape9"
                                geometry={nodes.Shape9.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[-54.63, 58.12, 54.24]}
                                rotation={[0, -0.42, 0.09]}
                            />
                            <mesh
                                name="Sphere 68"
                                geometry={nodes['Sphere 68']?.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[-38.21, 21.41, 74.54]}
                                rotation={[-0.19, -0.34, -0.06]}
                                scale={[1.15, 1.15, 0.32]}
                            />
                            <mesh
                                name="Sphere 54"
                                geometry={nodes['Sphere 54']?.geometry}
                                material={materials['Sphere 54 Material']}
                                castShadow
                                receiveShadow
                                position={[-40.37, 21.41, 67.24]}
                                rotation={[-0.19, -0.34, -0.06]}
                                scale={[1.65, 1.65, 0.47]}
                            />
                            <mesh
                                name="Sphere 69"
                                geometry={nodes['Sphere 69']?.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[38.15, 21.4, 74.43]}
                                rotation={[-0.17, 0.34, 0.06]}
                                scale={[1.15, 1.15, 0.32]}
                            />
                            <mesh
                                name="Sphere 34"
                                geometry={nodes['Sphere 34']?.geometry}
                                material={materials['Sphere 34 Material']}
                                castShadow
                                receiveShadow
                                position={[40, 21.41, 67.24]}
                                rotation={[-0.17, 0.34, 0.06]}
                                scale={[1.65, 1.65, 0.47]}
                            />
                            <mesh
                                name="Cylinder 24"
                                geometry={nodes['Cylinder 24']?.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[-0.43, 4.21, -5.5]}
                                rotation={[0, 0, Math.PI / 2]}
                                scale={[0.97, 0.92, 0.56]}
                            />
                            <mesh
                                name="Cylinder4"
                                geometry={nodes.Cylinder4.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[0, 12.46, 64.97]}
                                rotation={[2.79, 0, 0]}
                                scale={[0.97, 1.15, 1.15]}
                            />
                            <mesh
                                name="Sphere4"
                                geometry={nodes.Sphere4.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[0, 0, -12.34]}
                            />
                        </group>
                        <group name="Group 4 Instance 4" position={[39.78, -131.97, 233.29]}>
                            <group name="Group 24" visible={false} position={[0.6, 25.06, 79.34]}>
                                <mesh
                                    name="Ellipse 44"
                                    geometry={nodes['Ellipse 44']?.geometry}
                                    material={materials['Ellipse 44 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-48, 0.27, 2.34]}
                                />
                                <mesh
                                    name="Ellipse 28"
                                    geometry={nodes['Ellipse 28']?.geometry}
                                    material={materials['Ellipse 28 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[47.87, 0.27, 2.34]}
                                />
                                <mesh
                                    name="Shape 24"
                                    geometry={nodes['Shape 24']?.geometry}
                                    material={materials['Shape 24 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-17.02, 6.42, 0]}
                                />
                                <mesh
                                    name="Ellipse 34"
                                    geometry={nodes['Ellipse 34']?.geometry}
                                    material={materials['Ellipse 34 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[47.76, 0, 0]}
                                />
                                <mesh
                                    name="Ellipse 29"
                                    geometry={nodes['Ellipse 29']?.geometry}
                                    material={materials['Ellipse 29 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-48.68, 0, 0]}
                                />
                            </group>
                            <mesh
                                name="Shape10"
                                geometry={nodes.Shape10.geometry}
                                material={materials.Eyebrows}
                                castShadow
                                receiveShadow
                                position={[24.09, 60.5, 65.42]}
                                rotation={[Math.PI, -0.55, -3.07]}
                                scale={[-1, 1, 1]}
                            />
                            <mesh
                                name="Shape11"
                                geometry={nodes.Shape11.geometry}
                                material={materials.Eyebrows}
                                castShadow
                                receiveShadow
                                position={[-54.63, 58.12, 54.24]}
                                rotation={[0, -0.42, 0.09]}
                            />
                            <mesh
                                name="Sphere 610"
                                geometry={nodes['Sphere 610']?.geometry}
                                material={materials.Pupils}
                                castShadow
                                receiveShadow
                                position={[-38.21, 21.41, 74.54]}
                                rotation={[-0.19, -0.34, -0.06]}
                                scale={[1.15, 1.15, 0.32]}
                            />
                            <mesh
                                name="Sphere 55"
                                geometry={nodes['Sphere 55']?.geometry}
                                material={materials['Sphere 55 Material']}
                                castShadow
                                receiveShadow
                                position={[-40.37, 21.41, 67.24]}
                                rotation={[-0.19, -0.34, -0.06]}
                                scale={[1.65, 1.65, 0.47]}
                            />
                            <mesh
                                name="Sphere 611"
                                geometry={nodes['Sphere 611']?.geometry}
                                material={materials.Pupils}
                                castShadow
                                receiveShadow
                                position={[38.15, 21.4, 74.43]}
                                rotation={[-0.17, 0.34, 0.06]}
                                scale={[1.15, 1.15, 0.32]}
                            />
                            <mesh
                                name="Sphere 35"
                                geometry={nodes['Sphere 35']?.geometry}
                                material={materials['Sphere 35 Material']}
                                castShadow
                                receiveShadow
                                position={[40, 21.41, 67.24]}
                                rotation={[-0.17, 0.34, 0.06]}
                                scale={[1.65, 1.65, 0.47]}
                            />
                            <mesh
                                name="Cylinder 25"
                                geometry={nodes['Cylinder 25']?.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[-0.43, 4.21, -5.5]}
                                rotation={[0, 0, Math.PI / 2]}
                                scale={[0.97, 0.92, 0.56]}
                            />
                            <mesh
                                name="Cylinder5"
                                geometry={nodes.Cylinder5.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[0, 12.46, 64.97]}
                                rotation={[2.79, 0, 0]}
                                scale={[0.97, 1.15, 1.15]}
                            />
                            <mesh
                                name="Sphere5"
                                geometry={nodes.Sphere5.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[0, 0, -12.34]}
                            />
                        </group>
                        <group name="Group 4 Instance 21" position={[-846.12, -7.54, 21.01]}>
                            <group name="Group 25" visible={false} position={[0.6, 25.06, 79.34]}>
                                <mesh
                                    name="Ellipse 45"
                                    geometry={nodes['Ellipse 45']?.geometry}
                                    material={materials['Ellipse 45 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-48, 0.27, 2.34]}
                                />
                                <mesh
                                    name="Ellipse 210"
                                    geometry={nodes['Ellipse 210']?.geometry}
                                    material={materials['Ellipse 210 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[47.87, 0.27, 2.34]}
                                />
                                <mesh
                                    name="Shape 25"
                                    geometry={nodes['Shape 25']?.geometry}
                                    material={materials['Shape 25 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-17.02, 6.42, 0]}
                                />
                                <mesh
                                    name="Ellipse 35"
                                    geometry={nodes['Ellipse 35']?.geometry}
                                    material={materials['Ellipse 35 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[47.76, 0, 0]}
                                />
                                <mesh
                                    name="Ellipse 211"
                                    geometry={nodes['Ellipse 211']?.geometry}
                                    material={materials['Ellipse 211 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-48.68, 0, 0]}
                                />
                            </group>
                            <mesh
                                name="Shape12"
                                geometry={nodes.Shape12.geometry}
                                material={materials.Eyebrows}
                                castShadow
                                receiveShadow
                                position={[24.09, 60.5, 65.42]}
                                rotation={[Math.PI, -0.55, -3.07]}
                                scale={[-1, 1, 1]}
                            />
                            <mesh
                                name="Shape13"
                                geometry={nodes.Shape13.geometry}
                                material={materials.Eyebrows}
                                castShadow
                                receiveShadow
                                position={[-54.63, 58.12, 54.24]}
                                rotation={[0, -0.42, 0.09]}
                            />
                            <mesh
                                name="Sphere 612"
                                geometry={nodes['Sphere 612']?.geometry}
                                material={materials.Pupils}
                                castShadow
                                receiveShadow
                                position={[-38.21, 21.41, 74.54]}
                                rotation={[-0.19, -0.34, -0.06]}
                                scale={[1.15, 1.15, 0.32]}
                            />
                            <mesh
                                name="Sphere 56"
                                geometry={nodes['Sphere 56']?.geometry}
                                material={materials['Sphere 56 Material']}
                                castShadow
                                receiveShadow
                                position={[-40.37, 21.41, 67.24]}
                                rotation={[-0.19, -0.34, -0.06]}
                                scale={[1.65, 1.65, 0.47]}
                            />
                            <mesh
                                name="Sphere 613"
                                geometry={nodes['Sphere 613']?.geometry}
                                material={materials.Pupils}
                                castShadow
                                receiveShadow
                                position={[38.15, 21.4, 74.43]}
                                rotation={[-0.17, 0.34, 0.06]}
                                scale={[1.15, 1.15, 0.32]}
                            />
                            <mesh
                                name="Sphere 36"
                                geometry={nodes['Sphere 36']?.geometry}
                                material={materials['Sphere 36 Material']}
                                castShadow
                                receiveShadow
                                position={[40, 21.41, 67.24]}
                                rotation={[-0.17, 0.34, 0.06]}
                                scale={[1.65, 1.65, 0.47]}
                            />
                            <mesh
                                name="Cylinder 26"
                                geometry={nodes['Cylinder 26']?.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[-0.43, 4.21, -5.5]}
                                rotation={[0, 0, Math.PI / 2]}
                                scale={[0.97, 0.92, 0.56]}
                            />
                            <mesh
                                name="Cylinder6"
                                geometry={nodes.Cylinder6.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[0, 12.46, 64.97]}
                                rotation={[2.79, 0, 0]}
                                scale={[0.97, 1.15, 1.15]}
                            />
                            <mesh
                                name="Sphere6"
                                geometry={nodes.Sphere6.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[0, 0, -12.34]}
                            />
                        </group>
                        <group name="Group 4 Instance 20" position={[-679.79, 137.95, -177.58]}>
                            <group name="Group 26" visible={false} position={[0.6, 25.06, 79.34]}>
                                <mesh
                                    name="Ellipse 46"
                                    geometry={nodes['Ellipse 46']?.geometry}
                                    material={materials['Ellipse 46 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-48, 0.27, 2.34]}
                                />
                                <mesh
                                    name="Ellipse 212"
                                    geometry={nodes['Ellipse 212']?.geometry}
                                    material={materials['Ellipse 212 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[47.87, 0.27, 2.34]}
                                />
                                <mesh
                                    name="Shape 26"
                                    geometry={nodes['Shape 26']?.geometry}
                                    material={materials['Shape 26 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-17.02, 6.42, 0]}
                                />
                                <mesh
                                    name="Ellipse 36"
                                    geometry={nodes['Ellipse 36']?.geometry}
                                    material={materials['Ellipse 36 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[47.76, 0, 0]}
                                />
                                <mesh
                                    name="Ellipse 213"
                                    geometry={nodes['Ellipse 213']?.geometry}
                                    material={materials['Ellipse 213 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-48.68, 0, 0]}
                                />
                            </group>
                            <mesh
                                name="Shape14"
                                geometry={nodes.Shape14.geometry}
                                material={materials.Eyebrows}
                                castShadow
                                receiveShadow
                                position={[24.09, 60.5, 65.42]}
                                rotation={[Math.PI, -0.55, -3.07]}
                                scale={[-1, 1, 1]}
                            />
                            <mesh
                                name="Shape15"
                                geometry={nodes.Shape15.geometry}
                                material={materials.Eyebrows}
                                castShadow
                                receiveShadow
                                position={[-54.63, 58.12, 54.24]}
                                rotation={[0, -0.42, 0.09]}
                            />
                            <mesh
                                name="Sphere 614"
                                geometry={nodes['Sphere 614']?.geometry}
                                material={materials.Pupils}
                                castShadow
                                receiveShadow
                                position={[-38.21, 21.41, 74.54]}
                                rotation={[-0.19, -0.34, -0.06]}
                                scale={[1.15, 1.15, 0.32]}
                            />
                            <mesh
                                name="Sphere 57"
                                geometry={nodes['Sphere 57']?.geometry}
                                material={materials['Sphere 57 Material']}
                                castShadow
                                receiveShadow
                                position={[-40.37, 21.41, 67.24]}
                                rotation={[-0.19, -0.34, -0.06]}
                                scale={[1.65, 1.65, 0.47]}
                            />
                            <mesh
                                name="Sphere 615"
                                geometry={nodes['Sphere 615']?.geometry}
                                material={materials.Pupils}
                                castShadow
                                receiveShadow
                                position={[38.15, 21.4, 74.43]}
                                rotation={[-0.17, 0.34, 0.06]}
                                scale={[1.15, 1.15, 0.32]}
                            />
                            <mesh
                                name="Sphere 37"
                                geometry={nodes['Sphere 37']?.geometry}
                                material={materials['Sphere 37 Material']}
                                castShadow
                                receiveShadow
                                position={[40, 21.41, 67.24]}
                                rotation={[-0.17, 0.34, 0.06]}
                                scale={[1.65, 1.65, 0.47]}
                            />
                            <mesh
                                name="Cylinder 27"
                                geometry={nodes['Cylinder 27']?.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[-0.43, 4.21, -5.5]}
                                rotation={[0, 0, Math.PI / 2]}
                                scale={[0.97, 0.92, 0.56]}
                            />
                            <mesh
                                name="Cylinder7"
                                geometry={nodes.Cylinder7.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[0, 12.46, 64.97]}
                                rotation={[2.79, 0, 0]}
                                scale={[0.97, 1.15, 1.15]}
                            />
                            <mesh
                                name="Sphere7"
                                geometry={nodes.Sphere7.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[0, 0, -12.34]}
                            />
                        </group>
                        <group name="Group 4 Instance 19" position={[-161.85, 222.1, -196.43]}>
                            <group name="Group 27" visible={false} position={[0.6, 25.06, 79.34]}>
                                <mesh
                                    name="Ellipse 47"
                                    geometry={nodes['Ellipse 47']?.geometry}
                                    material={materials['Ellipse 47 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-48, 0.27, 2.34]}
                                />
                                <mesh
                                    name="Ellipse 214"
                                    geometry={nodes['Ellipse 214']?.geometry}
                                    material={materials['Ellipse 214 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[47.87, 0.27, 2.34]}
                                />
                                <mesh
                                    name="Shape 27"
                                    geometry={nodes['Shape 27']?.geometry}
                                    material={materials['Shape 27 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-17.02, 6.42, 0]}
                                />
                                <mesh
                                    name="Ellipse 37"
                                    geometry={nodes['Ellipse 37']?.geometry}
                                    material={materials['Ellipse 37 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[47.76, 0, 0]}
                                />
                                <mesh
                                    name="Ellipse 215"
                                    geometry={nodes['Ellipse 215']?.geometry}
                                    material={materials['Ellipse 215 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-48.68, 0, 0]}
                                />
                            </group>
                            <mesh
                                name="Shape16"
                                geometry={nodes.Shape16.geometry}
                                material={materials.Eyebrows}
                                castShadow
                                receiveShadow
                                position={[24.09, 60.5, 65.42]}
                                rotation={[Math.PI, -0.55, -3.07]}
                                scale={[-1, 1, 1]}
                            />
                            <mesh
                                name="Shape17"
                                geometry={nodes.Shape17.geometry}
                                material={materials.Eyebrows}
                                castShadow
                                receiveShadow
                                position={[-54.63, 58.12, 54.24]}
                                rotation={[0, -0.42, 0.09]}
                            />
                            <mesh
                                name="Sphere 616"
                                geometry={nodes['Sphere 616']?.geometry}
                                material={materials.Pupils}
                                castShadow
                                receiveShadow
                                position={[-38.21, 21.41, 74.54]}
                                rotation={[-0.19, -0.34, -0.06]}
                                scale={[1.15, 1.15, 0.32]}
                            />
                            <mesh
                                name="Sphere 58"
                                geometry={nodes['Sphere 58']?.geometry}
                                material={materials['Sphere 58 Material']}
                                castShadow
                                receiveShadow
                                position={[-40.37, 21.41, 67.24]}
                                rotation={[-0.19, -0.34, -0.06]}
                                scale={[1.65, 1.65, 0.47]}
                            />
                            <mesh
                                name="Sphere 617"
                                geometry={nodes['Sphere 617']?.geometry}
                                material={materials.Pupils}
                                castShadow
                                receiveShadow
                                position={[38.15, 21.4, 74.43]}
                                rotation={[-0.17, 0.34, 0.06]}
                                scale={[1.15, 1.15, 0.32]}
                            />
                            <mesh
                                name="Sphere 38"
                                geometry={nodes['Sphere 38']?.geometry}
                                material={materials['Sphere 38 Material']}
                                castShadow
                                receiveShadow
                                position={[40, 21.41, 67.24]}
                                rotation={[-0.17, 0.34, 0.06]}
                                scale={[1.65, 1.65, 0.47]}
                            />
                            <mesh
                                name="Cylinder 28"
                                geometry={nodes['Cylinder 28']?.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[-0.43, 4.21, -5.5]}
                                rotation={[0, 0, Math.PI / 2]}
                                scale={[0.97, 0.92, 0.56]}
                            />
                            <mesh
                                name="Cylinder8"
                                geometry={nodes.Cylinder8.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[0, 12.46, 64.97]}
                                rotation={[2.79, 0, 0]}
                                scale={[0.97, 1.15, 1.15]}
                            />
                            <mesh
                                name="Sphere8"
                                geometry={nodes.Sphere8.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[0, 0, -12.34]}
                            />
                        </group>
                        <group name="Group 4 Instance 18" position={[-426.63, 137.95, -137.81]}>
                            <group name="Group 28" visible={false} position={[0.6, 25.06, 79.34]}>
                                <mesh
                                    name="Ellipse 48"
                                    geometry={nodes['Ellipse 48']?.geometry}
                                    material={materials['Ellipse 48 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-48, 0.27, 2.34]}
                                />
                                <mesh
                                    name="Ellipse 216"
                                    geometry={nodes['Ellipse 216']?.geometry}
                                    material={materials['Ellipse 216 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[47.87, 0.27, 2.34]}
                                />
                                <mesh
                                    name="Shape 28"
                                    geometry={nodes['Shape 28']?.geometry}
                                    material={materials['Shape 28 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-17.02, 6.42, 0]}
                                />
                                <mesh
                                    name="Ellipse 38"
                                    geometry={nodes['Ellipse 38']?.geometry}
                                    material={materials['Ellipse 38 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[47.76, 0, 0]}
                                />
                                <mesh
                                    name="Ellipse 217"
                                    geometry={nodes['Ellipse 217']?.geometry}
                                    material={materials['Ellipse 217 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-48.68, 0, 0]}
                                />
                            </group>
                            <mesh
                                name="Shape18"
                                geometry={nodes.Shape18.geometry}
                                material={materials.Eyebrows}
                                castShadow
                                receiveShadow
                                position={[24.09, 60.5, 65.42]}
                                rotation={[Math.PI, -0.55, -3.07]}
                                scale={[-1, 1, 1]}
                            />
                            <mesh
                                name="Shape19"
                                geometry={nodes.Shape19.geometry}
                                material={materials.Eyebrows}
                                castShadow
                                receiveShadow
                                position={[-54.63, 58.12, 54.24]}
                                rotation={[0, -0.42, 0.09]}
                            />
                            <mesh
                                name="Sphere 618"
                                geometry={nodes['Sphere 618']?.geometry}
                                material={materials.Pupils}
                                castShadow
                                receiveShadow
                                position={[-38.21, 21.41, 74.54]}
                                rotation={[-0.19, -0.34, -0.06]}
                                scale={[1.15, 1.15, 0.32]}
                            />
                            <mesh
                                name="Sphere 59"
                                geometry={nodes['Sphere 59']?.geometry}
                                material={materials['Sphere 59 Material']}
                                castShadow
                                receiveShadow
                                position={[-40.37, 21.41, 67.24]}
                                rotation={[-0.19, -0.34, -0.06]}
                                scale={[1.65, 1.65, 0.47]}
                            />
                            <mesh
                                name="Sphere 619"
                                geometry={nodes['Sphere 619']?.geometry}
                                material={materials.Pupils}
                                castShadow
                                receiveShadow
                                position={[38.15, 21.4, 74.43]}
                                rotation={[-0.17, 0.34, 0.06]}
                                scale={[1.15, 1.15, 0.32]}
                            />
                            <mesh
                                name="Sphere 39"
                                geometry={nodes['Sphere 39']?.geometry}
                                material={materials['Sphere 39 Material']}
                                castShadow
                                receiveShadow
                                position={[40, 21.41, 67.24]}
                                rotation={[-0.17, 0.34, 0.06]}
                                scale={[1.65, 1.65, 0.47]}
                            />
                            <mesh
                                name="Cylinder 29"
                                geometry={nodes['Cylinder 29']?.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[-0.43, 4.21, -5.5]}
                                rotation={[0, 0, Math.PI / 2]}
                                scale={[0.97, 0.92, 0.56]}
                            />
                            <mesh
                                name="Cylinder9"
                                geometry={nodes.Cylinder9.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[0, 12.46, 64.97]}
                                rotation={[2.79, 0, 0]}
                                scale={[0.97, 1.15, 1.15]}
                            />
                            <mesh
                                name="Sphere9"
                                geometry={nodes.Sphere9.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[0, 0, -12.34]}
                            />
                        </group>
                        <group name="Group 4 Instance 17" position={[-364.57, -189.98, -100.95]}>
                            <group name="Group 29" visible={false} position={[0.6, 25.06, 79.34]}>
                                <mesh
                                    name="Ellipse 49"
                                    geometry={nodes['Ellipse 49']?.geometry}
                                    material={materials['Ellipse 49 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-48, 0.27, 2.34]}
                                />
                                <mesh
                                    name="Ellipse 218"
                                    geometry={nodes['Ellipse 218']?.geometry}
                                    material={materials['Ellipse 218 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[47.87, 0.27, 2.34]}
                                />
                                <mesh
                                    name="Shape 29"
                                    geometry={nodes['Shape 29']?.geometry}
                                    material={materials['Shape 29 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-17.02, 6.42, 0]}
                                />
                                <mesh
                                    name="Ellipse 39"
                                    geometry={nodes['Ellipse 39']?.geometry}
                                    material={materials['Ellipse 39 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[47.76, 0, 0]}
                                />
                                <mesh
                                    name="Ellipse 219"
                                    geometry={nodes['Ellipse 219']?.geometry}
                                    material={materials['Ellipse 219 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-48.68, 0, 0]}
                                />
                            </group>
                            <mesh
                                name="Shape20"
                                geometry={nodes.Shape20.geometry}
                                material={materials.Eyebrows}
                                castShadow
                                receiveShadow
                                position={[24.09, 60.5, 65.42]}
                                rotation={[Math.PI, -0.55, -3.07]}
                                scale={[-1, 1, 1]}
                            />
                            <mesh
                                name="Shape21"
                                geometry={nodes.Shape21.geometry}
                                material={materials.Eyebrows}
                                castShadow
                                receiveShadow
                                position={[-54.63, 58.12, 54.24]}
                                rotation={[0, -0.42, 0.09]}
                            />
                            <mesh
                                name="Sphere 620"
                                geometry={nodes['Sphere 620']?.geometry}
                                material={materials.Pupils}
                                castShadow
                                receiveShadow
                                position={[-38.21, 21.41, 74.54]}
                                rotation={[-0.19, -0.34, -0.06]}
                                scale={[1.15, 1.15, 0.32]}
                            />
                            <mesh
                                name="Sphere 510"
                                geometry={nodes['Sphere 510']?.geometry}
                                material={materials['Sphere 510 Material']}
                                castShadow
                                receiveShadow
                                position={[-40.37, 21.41, 67.24]}
                                rotation={[-0.19, -0.34, -0.06]}
                                scale={[1.65, 1.65, 0.47]}
                            />
                            <mesh
                                name="Sphere 621"
                                geometry={nodes['Sphere 621']?.geometry}
                                material={materials.Pupils}
                                castShadow
                                receiveShadow
                                position={[38.15, 21.4, 74.43]}
                                rotation={[-0.17, 0.34, 0.06]}
                                scale={[1.15, 1.15, 0.32]}
                            />
                            <mesh
                                name="Sphere 310"
                                geometry={nodes['Sphere 310']?.geometry}
                                material={materials['Sphere 310 Material']}
                                castShadow
                                receiveShadow
                                position={[40, 21.41, 67.24]}
                                rotation={[-0.17, 0.34, 0.06]}
                                scale={[1.65, 1.65, 0.47]}
                            />
                            <mesh
                                name="Cylinder 210"
                                geometry={nodes['Cylinder 210']?.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[-0.43, 4.21, -5.5]}
                                rotation={[0, 0, Math.PI / 2]}
                                scale={[0.97, 0.92, 0.56]}
                            />
                            <mesh
                                name="Cylinder10"
                                geometry={nodes.Cylinder10.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[0, 12.46, 64.97]}
                                rotation={[2.79, 0, 0]}
                                scale={[0.97, 1.15, 1.15]}
                            />
                            <mesh
                                name="Sphere10"
                                geometry={nodes.Sphere10.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[0, 0, -12.34]}
                            />
                        </group>
                        <group name="Group 4 Instance 16" position={[-525.04, -20.91, -263.81]}>
                            <group name="Group 210" visible={false} position={[0.6, 25.06, 79.34]}>
                                <mesh
                                    name="Ellipse 410"
                                    geometry={nodes['Ellipse 410']?.geometry}
                                    material={materials['Ellipse 410 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-48, 0.27, 2.34]}
                                />
                                <mesh
                                    name="Ellipse 220"
                                    geometry={nodes['Ellipse 220']?.geometry}
                                    material={materials['Ellipse 220 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[47.87, 0.27, 2.34]}
                                />
                                <mesh
                                    name="Shape 210"
                                    geometry={nodes['Shape 210']?.geometry}
                                    material={materials['Shape 210 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-17.02, 6.42, 0]}
                                />
                                <mesh
                                    name="Ellipse 310"
                                    geometry={nodes['Ellipse 310']?.geometry}
                                    material={materials['Ellipse 310 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[47.76, 0, 0]}
                                />
                                <mesh
                                    name="Ellipse 221"
                                    geometry={nodes['Ellipse 221']?.geometry}
                                    material={materials['Ellipse 221 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-48.68, 0, 0]}
                                />
                            </group>
                            <mesh
                                name="Shape22"
                                geometry={nodes.Shape22.geometry}
                                material={materials.Eyebrows}
                                castShadow
                                receiveShadow
                                position={[24.09, 60.5, 65.42]}
                                rotation={[Math.PI, -0.55, -3.07]}
                                scale={[-1, 1, 1]}
                            />
                            <mesh
                                name="Shape23"
                                geometry={nodes.Shape23.geometry}
                                material={materials.Eyebrows}
                                castShadow
                                receiveShadow
                                position={[-54.63, 58.12, 54.24]}
                                rotation={[0, -0.42, 0.09]}
                            />
                            <mesh
                                name="Sphere 622"
                                geometry={nodes['Sphere 622']?.geometry}
                                material={materials.Pupils}
                                castShadow
                                receiveShadow
                                position={[-38.21, 21.41, 74.54]}
                                rotation={[-0.19, -0.34, -0.06]}
                                scale={[1.15, 1.15, 0.32]}
                            />
                            <mesh
                                name="Sphere 511"
                                geometry={nodes['Sphere 511']?.geometry}
                                material={materials['Sphere 511 Material']}
                                castShadow
                                receiveShadow
                                position={[-40.37, 21.41, 67.24]}
                                rotation={[-0.19, -0.34, -0.06]}
                                scale={[1.65, 1.65, 0.47]}
                            />
                            <mesh
                                name="Sphere 623"
                                geometry={nodes['Sphere 623']?.geometry}
                                material={materials.Pupils}
                                castShadow
                                receiveShadow
                                position={[38.15, 21.4, 74.43]}
                                rotation={[-0.17, 0.34, 0.06]}
                                scale={[1.15, 1.15, 0.32]}
                            />
                            <mesh
                                name="Sphere 311"
                                geometry={nodes['Sphere 311']?.geometry}
                                material={materials['Sphere 311 Material']}
                                castShadow
                                receiveShadow
                                position={[40, 21.41, 67.24]}
                                rotation={[-0.17, 0.34, 0.06]}
                                scale={[1.65, 1.65, 0.47]}
                            />
                            <mesh
                                name="Cylinder 211"
                                geometry={nodes['Cylinder 211']?.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[-0.43, 4.21, -5.5]}
                                rotation={[0, 0, Math.PI / 2]}
                                scale={[0.97, 0.92, 0.56]}
                            />
                            <mesh
                                name="Cylinder11"
                                geometry={nodes.Cylinder11.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[0, 12.46, 64.97]}
                                rotation={[2.79, 0, 0]}
                                scale={[0.97, 1.15, 1.15]}
                            />
                            <mesh
                                name="Sphere11"
                                geometry={nodes.Sphere11.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[0, 0, -12.34]}
                            />
                        </group>
                        <group name="Group 4 Instance 15" position={[-839.99, -214.65, -299.89]}>
                            <group name="Group 211" visible={false} position={[0.6, 25.06, 79.34]}>
                                <mesh
                                    name="Ellipse 411"
                                    geometry={nodes['Ellipse 411']?.geometry}
                                    material={materials['Ellipse 411 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-48, 0.27, 2.34]}
                                />
                                <mesh
                                    name="Ellipse 222"
                                    geometry={nodes['Ellipse 222']?.geometry}
                                    material={materials['Ellipse 222 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[47.87, 0.27, 2.34]}
                                />
                                <mesh
                                    name="Shape 211"
                                    geometry={nodes['Shape 211']?.geometry}
                                    material={materials['Shape 211 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-17.02, 6.42, 0]}
                                />
                                <mesh
                                    name="Ellipse 311"
                                    geometry={nodes['Ellipse 311']?.geometry}
                                    material={materials['Ellipse 311 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[47.76, 0, 0]}
                                />
                                <mesh
                                    name="Ellipse 223"
                                    geometry={nodes['Ellipse 223']?.geometry}
                                    material={materials['Ellipse 223 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-48.68, 0, 0]}
                                />
                            </group>
                            <mesh
                                name="Shape24"
                                geometry={nodes.Shape24.geometry}
                                material={materials.Eyebrows}
                                castShadow
                                receiveShadow
                                position={[24.09, 60.5, 65.42]}
                                rotation={[Math.PI, -0.55, -3.07]}
                                scale={[-1, 1, 1]}
                            />
                            <mesh
                                name="Shape25"
                                geometry={nodes.Shape25.geometry}
                                material={materials.Eyebrows}
                                castShadow
                                receiveShadow
                                position={[-54.63, 58.12, 54.24]}
                                rotation={[0, -0.42, 0.09]}
                            />
                            <mesh
                                name="Sphere 624"
                                geometry={nodes['Sphere 624']?.geometry}
                                material={materials.Pupils}
                                castShadow
                                receiveShadow
                                position={[-38.21, 21.41, 74.54]}
                                rotation={[-0.19, -0.34, -0.06]}
                                scale={[1.15, 1.15, 0.32]}
                            />
                            <mesh
                                name="Sphere 512"
                                geometry={nodes['Sphere 512']?.geometry}
                                material={materials['Sphere 512 Material']}
                                castShadow
                                receiveShadow
                                position={[-40.37, 21.41, 67.24]}
                                rotation={[-0.19, -0.34, -0.06]}
                                scale={[1.65, 1.65, 0.47]}
                            />
                            <mesh
                                name="Sphere 625"
                                geometry={nodes['Sphere 625']?.geometry}
                                material={materials.Pupils}
                                castShadow
                                receiveShadow
                                position={[38.15, 21.4, 74.43]}
                                rotation={[-0.17, 0.34, 0.06]}
                                scale={[1.15, 1.15, 0.32]}
                            />
                            <mesh
                                name="Sphere 312"
                                geometry={nodes['Sphere 312']?.geometry}
                                material={materials['Sphere 312 Material']}
                                castShadow
                                receiveShadow
                                position={[40, 21.41, 67.24]}
                                rotation={[-0.17, 0.34, 0.06]}
                                scale={[1.65, 1.65, 0.47]}
                            />
                            <mesh
                                name="Cylinder 212"
                                geometry={nodes['Cylinder 212']?.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[-0.43, 4.21, -5.5]}
                                rotation={[0, 0, Math.PI / 2]}
                                scale={[0.97, 0.92, 0.56]}
                            />
                            <mesh
                                name="Cylinder12"
                                geometry={nodes.Cylinder12.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[0, 12.46, 64.97]}
                                rotation={[2.79, 0, 0]}
                                scale={[0.97, 1.15, 1.15]}
                            />
                            <mesh
                                name="Sphere12"
                                geometry={nodes.Sphere12.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[0, 0, -12.34]}
                            />
                        </group>
                        <group name="Group 4 Instance 14" position={[-216.79, -381.87, -270.36]}>
                            <group name="Group 212" visible={false} position={[0.6, 25.06, 79.34]}>
                                <mesh
                                    name="Ellipse 412"
                                    geometry={nodes['Ellipse 412']?.geometry}
                                    material={materials['Ellipse 412 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-48, 0.27, 2.34]}
                                />
                                <mesh
                                    name="Ellipse 224"
                                    geometry={nodes['Ellipse 224']?.geometry}
                                    material={materials['Ellipse 224 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[47.87, 0.27, 2.34]}
                                />
                                <mesh
                                    name="Shape 212"
                                    geometry={nodes['Shape 212']?.geometry}
                                    material={materials['Shape 212 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-17.02, 6.42, 0]}
                                />
                                <mesh
                                    name="Ellipse 312"
                                    geometry={nodes['Ellipse 312']?.geometry}
                                    material={materials['Ellipse 312 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[47.76, 0, 0]}
                                />
                                <mesh
                                    name="Ellipse 225"
                                    geometry={nodes['Ellipse 225']?.geometry}
                                    material={materials['Ellipse 225 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-48.68, 0, 0]}
                                />
                            </group>
                            <mesh
                                name="Shape26"
                                geometry={nodes.Shape26.geometry}
                                material={materials.Eyebrows}
                                castShadow
                                receiveShadow
                                position={[24.09, 60.5, 65.42]}
                                rotation={[Math.PI, -0.55, -3.07]}
                                scale={[-1, 1, 1]}
                            />
                            <mesh
                                name="Shape27"
                                geometry={nodes.Shape27.geometry}
                                material={materials.Eyebrows}
                                castShadow
                                receiveShadow
                                position={[-54.63, 58.12, 54.24]}
                                rotation={[0, -0.42, 0.09]}
                            />
                            <mesh
                                name="Sphere 626"
                                geometry={nodes['Sphere 626']?.geometry}
                                material={materials.Pupils}
                                castShadow
                                receiveShadow
                                position={[-38.21, 21.41, 74.54]}
                                rotation={[-0.19, -0.34, -0.06]}
                                scale={[1.15, 1.15, 0.32]}
                            />
                            <mesh
                                name="Sphere 513"
                                geometry={nodes['Sphere 513']?.geometry}
                                material={materials['Sphere 513 Material']}
                                castShadow
                                receiveShadow
                                position={[-40.37, 21.41, 67.24]}
                                rotation={[-0.19, -0.34, -0.06]}
                                scale={[1.65, 1.65, 0.47]}
                            />
                            <mesh
                                name="Sphere 627"
                                geometry={nodes['Sphere 627']?.geometry}
                                material={materials.Pupils}
                                castShadow
                                receiveShadow
                                position={[38.15, 21.4, 74.43]}
                                rotation={[-0.17, 0.34, 0.06]}
                                scale={[1.15, 1.15, 0.32]}
                            />
                            <mesh
                                name="Sphere 313"
                                geometry={nodes['Sphere 313']?.geometry}
                                material={materials['Sphere 313 Material']}
                                castShadow
                                receiveShadow
                                position={[40, 21.41, 67.24]}
                                rotation={[-0.17, 0.34, 0.06]}
                                scale={[1.65, 1.65, 0.47]}
                            />
                            <mesh
                                name="Cylinder 213"
                                geometry={nodes['Cylinder 213']?.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[-0.43, 4.21, -5.5]}
                                rotation={[0, 0, Math.PI / 2]}
                                scale={[0.97, 0.92, 0.56]}
                            />
                            <mesh
                                name="Cylinder13"
                                geometry={nodes.Cylinder13.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[0, 12.46, 64.97]}
                                rotation={[2.79, 0, 0]}
                                scale={[0.97, 1.15, 1.15]}
                            />
                            <mesh
                                name="Sphere13"
                                geometry={nodes.Sphere13.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[0, 0, -12.34]}
                            />
                        </group>
                        <group name="Group 4 Instance 3" position={[561.42, 60.03, 143.23]}>
                            <group name="Group 213" visible={false} position={[0.6, 25.06, 79.34]}>
                                <mesh
                                    name="Ellipse 413"
                                    geometry={nodes['Ellipse 413']?.geometry}
                                    material={materials['Ellipse 413 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-48, 0.27, 2.34]}
                                />
                                <mesh
                                    name="Ellipse 226"
                                    geometry={nodes['Ellipse 226']?.geometry}
                                    material={materials['Ellipse 226 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[47.87, 0.27, 2.34]}
                                />
                                <mesh
                                    name="Shape 213"
                                    geometry={nodes['Shape 213']?.geometry}
                                    material={materials['Shape 213 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-17.02, 6.42, 0]}
                                />
                                <mesh
                                    name="Ellipse 314"
                                    geometry={nodes['Ellipse 314']?.geometry}
                                    material={materials['Ellipse 314 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[47.76, 0, 0]}
                                />
                                <mesh
                                    name="Ellipse 227"
                                    geometry={nodes['Ellipse 227']?.geometry}
                                    material={materials['Ellipse 227 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-48.68, 0, 0]}
                                />
                            </group>
                            <mesh
                                name="Shape28"
                                geometry={nodes.Shape28.geometry}
                                material={materials.Eyebrows}
                                castShadow
                                receiveShadow
                                position={[24.09, 60.5, 65.42]}
                                rotation={[Math.PI, -0.55, -3.07]}
                                scale={[-1, 1, 1]}
                            />
                            <mesh
                                name="Shape29"
                                geometry={nodes.Shape29.geometry}
                                material={materials.Eyebrows}
                                castShadow
                                receiveShadow
                                position={[-54.63, 58.12, 54.24]}
                                rotation={[0, -0.42, 0.09]}
                            />
                            <mesh
                                name="Sphere 628"
                                geometry={nodes['Sphere 628']?.geometry}
                                material={materials.Pupils}
                                castShadow
                                receiveShadow
                                position={[-38.21, 21.41, 74.54]}
                                rotation={[-0.19, -0.34, -0.06]}
                                scale={[1.15, 1.15, 0.32]}
                            />
                            <mesh
                                name="Sphere 514"
                                geometry={nodes['Sphere 514']?.geometry}
                                material={materials['Sphere 514 Material']}
                                castShadow
                                receiveShadow
                                position={[-40.37, 21.41, 67.24]}
                                rotation={[-0.19, -0.34, -0.06]}
                                scale={[1.65, 1.65, 0.47]}
                            />
                            <mesh
                                name="Sphere 629"
                                geometry={nodes['Sphere 629']?.geometry}
                                material={materials.Pupils}
                                castShadow
                                receiveShadow
                                position={[38.15, 21.4, 74.43]}
                                rotation={[-0.17, 0.34, 0.06]}
                                scale={[1.15, 1.15, 0.32]}
                            />
                            <mesh
                                name="Sphere 315"
                                geometry={nodes['Sphere 315']?.geometry}
                                material={materials['Sphere 315 Material']}
                                castShadow
                                receiveShadow
                                position={[40, 21.41, 67.24]}
                                rotation={[-0.17, 0.34, 0.06]}
                                scale={[1.65, 1.65, 0.47]}
                            />
                            <mesh
                                name="Cylinder 214"
                                geometry={nodes['Cylinder 214']?.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[-0.43, 4.21, -5.5]}
                                rotation={[0, 0, Math.PI / 2]}
                                scale={[0.97, 0.92, 0.56]}
                            />
                            <mesh
                                name="Cylinder14"
                                geometry={nodes.Cylinder14.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[0, 12.46, 64.97]}
                                rotation={[2.79, 0, 0]}
                                scale={[0.97, 1.15, 1.15]}
                            />
                            <mesh
                                name="Sphere14"
                                geometry={nodes.Sphere14.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[0, 0, -12.34]}
                            />
                        </group>
                        <group name="Group 4 Instance 2" position={[571.7, 437.93, 201.21]}>
                            <group name="Group 214" visible={false} position={[0.6, 25.06, 79.34]}>
                                <mesh
                                    name="Ellipse 414"
                                    geometry={nodes['Ellipse 414']?.geometry}
                                    material={materials['Ellipse 414 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-48, 0.27, 2.34]}
                                />
                                <mesh
                                    name="Ellipse 228"
                                    geometry={nodes['Ellipse 228']?.geometry}
                                    material={materials['Ellipse 228 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[47.87, 0.27, 2.34]}
                                />
                                <mesh
                                    name="Shape 214"
                                    geometry={nodes['Shape 214']?.geometry}
                                    material={materials['Shape 214 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-17.02, 6.42, 0]}
                                />
                                <mesh
                                    name="Ellipse 315"
                                    geometry={nodes['Ellipse 315']?.geometry}
                                    material={materials['Ellipse 315 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[47.76, 0, 0]}
                                />
                                <mesh
                                    name="Ellipse 229"
                                    geometry={nodes['Ellipse 229']?.geometry}
                                    material={materials['Ellipse 229 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-48.68, 0, 0]}
                                />
                            </group>
                            <mesh
                                name="Shape30"
                                geometry={nodes.Shape30.geometry}
                                material={materials.Eyebrows}
                                castShadow
                                receiveShadow
                                position={[24.09, 60.5, 65.42]}
                                rotation={[Math.PI, -0.55, -3.07]}
                                scale={[-1, 1, 1]}
                            />
                            <mesh
                                name="Shape31"
                                geometry={nodes.Shape31.geometry}
                                material={materials.Eyebrows}
                                castShadow
                                receiveShadow
                                position={[-54.63, 58.12, 54.24]}
                                rotation={[0, -0.42, 0.09]}
                            />
                            <mesh
                                name="Sphere 630"
                                geometry={nodes['Sphere 630']?.geometry}
                                material={materials.Pupils}
                                castShadow
                                receiveShadow
                                position={[-38.21, 21.41, 74.54]}
                                rotation={[-0.19, -0.34, -0.06]}
                                scale={[1.15, 1.15, 0.32]}
                            />
                            <mesh
                                name="Sphere 515"
                                geometry={nodes['Sphere 515']?.geometry}
                                material={materials['Sphere 515 Material']}
                                castShadow
                                receiveShadow
                                position={[-40.37, 21.41, 67.24]}
                                rotation={[-0.19, -0.34, -0.06]}
                                scale={[1.65, 1.65, 0.47]}
                            />
                            <mesh
                                name="Sphere 631"
                                geometry={nodes['Sphere 631']?.geometry}
                                material={materials.Pupils}
                                castShadow
                                receiveShadow
                                position={[38.15, 21.4, 74.43]}
                                rotation={[-0.17, 0.34, 0.06]}
                                scale={[1.15, 1.15, 0.32]}
                            />
                            <mesh
                                name="Sphere 316"
                                geometry={nodes['Sphere 316']?.geometry}
                                material={materials['Sphere 316 Material']}
                                castShadow
                                receiveShadow
                                position={[40, 21.41, 67.24]}
                                rotation={[-0.17, 0.34, 0.06]}
                                scale={[1.65, 1.65, 0.47]}
                            />
                            <mesh
                                name="Cylinder 215"
                                geometry={nodes['Cylinder 215']?.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[-0.43, 4.21, -5.5]}
                                rotation={[0, 0, Math.PI / 2]}
                                scale={[0.97, 0.92, 0.56]}
                            />
                            <mesh
                                name="Cylinder15"
                                geometry={nodes.Cylinder15.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[0, 12.46, 64.97]}
                                rotation={[2.79, 0, 0]}
                                scale={[0.97, 1.15, 1.15]}
                            />
                            <mesh
                                name="Sphere15"
                                geometry={nodes.Sphere15.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[0, 0, -12.34]}
                            />
                        </group>
                        <group name="Group 4 Instance 22" position={[-161.85, 222.1, -196.43]}>
                            <group name="Group 215" visible={false} position={[0.6, 25.06, 79.34]}>
                                <mesh
                                    name="Ellipse 415"
                                    geometry={nodes['Ellipse 415']?.geometry}
                                    material={materials['Ellipse 415 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-48, 0.27, 2.34]}
                                />
                                <mesh
                                    name="Ellipse 230"
                                    geometry={nodes['Ellipse 230']?.geometry}
                                    material={materials['Ellipse 230 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[47.87, 0.27, 2.34]}
                                />
                                <mesh
                                    name="Shape 215"
                                    geometry={nodes['Shape 215']?.geometry}
                                    material={materials['Shape 215 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-17.02, 6.42, 0]}
                                />
                                <mesh
                                    name="Ellipse 316"
                                    geometry={nodes['Ellipse 316']?.geometry}
                                    material={materials['Ellipse 316 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[47.76, 0, 0]}
                                />
                                <mesh
                                    name="Ellipse 231"
                                    geometry={nodes['Ellipse 231']?.geometry}
                                    material={materials['Ellipse 231 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-48.68, 0, 0]}
                                />
                            </group>
                            <mesh
                                name="Shape32"
                                geometry={nodes.Shape32.geometry}
                                material={materials.Eyebrows}
                                castShadow
                                receiveShadow
                                position={[24.09, 60.5, 65.42]}
                                rotation={[Math.PI, -0.55, -3.07]}
                                scale={[-1, 1, 1]}
                            />
                            <mesh
                                name="Shape33"
                                geometry={nodes.Shape33.geometry}
                                material={materials.Eyebrows}
                                castShadow
                                receiveShadow
                                position={[-54.63, 58.12, 54.24]}
                                rotation={[0, -0.42, 0.09]}
                            />
                            <mesh
                                name="Sphere 632"
                                geometry={nodes['Sphere 632']?.geometry}
                                material={materials.Pupils}
                                castShadow
                                receiveShadow
                                position={[-38.21, 21.41, 74.54]}
                                rotation={[-0.19, -0.34, -0.06]}
                                scale={[1.15, 1.15, 0.32]}
                            />
                            <mesh
                                name="Sphere 516"
                                geometry={nodes['Sphere 516']?.geometry}
                                material={materials['Sphere 516 Material']}
                                castShadow
                                receiveShadow
                                position={[-40.37, 21.41, 67.24]}
                                rotation={[-0.19, -0.34, -0.06]}
                                scale={[1.65, 1.65, 0.47]}
                            />
                            <mesh
                                name="Sphere 633"
                                geometry={nodes['Sphere 633']?.geometry}
                                material={materials.Pupils}
                                castShadow
                                receiveShadow
                                position={[38.15, 21.4, 74.43]}
                                rotation={[-0.17, 0.34, 0.06]}
                                scale={[1.15, 1.15, 0.32]}
                            />
                            <mesh
                                name="Sphere 317"
                                geometry={nodes['Sphere 317']?.geometry}
                                material={materials['Sphere 317 Material']}
                                castShadow
                                receiveShadow
                                position={[40, 21.41, 67.24]}
                                rotation={[-0.17, 0.34, 0.06]}
                                scale={[1.65, 1.65, 0.47]}
                            />
                            <mesh
                                name="Cylinder 216"
                                geometry={nodes['Cylinder 216']?.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[-0.43, 4.21, -5.5]}
                                rotation={[0, 0, Math.PI / 2]}
                                scale={[0.97, 0.92, 0.56]}
                            />
                            <mesh
                                name="Cylinder16"
                                geometry={nodes.Cylinder16.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[0, 12.46, 64.97]}
                                rotation={[2.79, 0, 0]}
                                scale={[0.97, 1.15, 1.15]}
                            />
                            <mesh
                                name="Sphere16"
                                geometry={nodes.Sphere16.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[0, 0, -12.34]}
                            />
                        </group>
                        <group name="Group 4 Instance 1" position={[-216.79, -381.87, -270.36]}>
                            <group name="Group 216" visible={false} position={[0.6, 25.06, 79.34]}>
                                <mesh
                                    name="Ellipse 416"
                                    geometry={nodes['Ellipse 416']?.geometry}
                                    material={materials['Ellipse 416 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-48, 0.27, 2.34]}
                                />
                                <mesh
                                    name="Ellipse 232"
                                    geometry={nodes['Ellipse 232']?.geometry}
                                    material={materials['Ellipse 232 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[47.87, 0.27, 2.34]}
                                />
                                <mesh
                                    name="Shape 216"
                                    geometry={nodes['Shape 216']?.geometry}
                                    material={materials['Shape 216 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-17.02, 6.42, 0]}
                                />
                                <mesh
                                    name="Ellipse 317"
                                    geometry={nodes['Ellipse 317']?.geometry}
                                    material={materials['Ellipse 317 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[47.76, 0, 0]}
                                />
                                <mesh
                                    name="Ellipse 233"
                                    geometry={nodes['Ellipse 233']?.geometry}
                                    material={materials['Ellipse 233 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-48.68, 0, 0]}
                                />
                            </group>
                            <mesh
                                name="Shape34"
                                geometry={nodes.Shape34.geometry}
                                material={materials.Eyebrows}
                                castShadow
                                receiveShadow
                                position={[24.09, 60.5, 65.42]}
                                rotation={[Math.PI, -0.55, -3.07]}
                                scale={[-1, 1, 1]}
                            />
                            <mesh
                                name="Shape35"
                                geometry={nodes.Shape35.geometry}
                                material={materials.Eyebrows}
                                castShadow
                                receiveShadow
                                position={[-54.63, 58.12, 54.24]}
                                rotation={[0, -0.42, 0.09]}
                            />
                            <mesh
                                name="Sphere 634"
                                geometry={nodes['Sphere 634']?.geometry}
                                material={materials.Pupils}
                                castShadow
                                receiveShadow
                                position={[-38.21, 21.41, 74.54]}
                                rotation={[-0.19, -0.34, -0.06]}
                                scale={[1.15, 1.15, 0.32]}
                            />
                            <mesh
                                name="Sphere 517"
                                geometry={nodes['Sphere 517']?.geometry}
                                material={materials['Sphere 517 Material']}
                                castShadow
                                receiveShadow
                                position={[-40.37, 21.41, 67.24]}
                                rotation={[-0.19, -0.34, -0.06]}
                                scale={[1.65, 1.65, 0.47]}
                            />
                            <mesh
                                name="Sphere 635"
                                geometry={nodes['Sphere 635']?.geometry}
                                material={materials.Pupils}
                                castShadow
                                receiveShadow
                                position={[38.15, 21.4, 74.43]}
                                rotation={[-0.17, 0.34, 0.06]}
                                scale={[1.15, 1.15, 0.32]}
                            />
                            <mesh
                                name="Sphere 318"
                                geometry={nodes['Sphere 318']?.geometry}
                                material={materials['Sphere 318 Material']}
                                castShadow
                                receiveShadow
                                position={[40, 21.41, 67.24]}
                                rotation={[-0.17, 0.34, 0.06]}
                                scale={[1.65, 1.65, 0.47]}
                            />
                            <mesh
                                name="Cylinder 217"
                                geometry={nodes['Cylinder 217']?.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[-0.43, 4.21, -5.5]}
                                rotation={[0, 0, Math.PI / 2]}
                                scale={[0.97, 0.92, 0.56]}
                            />
                            <mesh
                                name="Cylinder17"
                                geometry={nodes.Cylinder17.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[0, 12.46, 64.97]}
                                rotation={[2.79, 0, 0]}
                                scale={[0.97, 1.15, 1.15]}
                            />
                            <mesh
                                name="Sphere17"
                                geometry={nodes.Sphere17.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[0, 0, -12.34]}
                            />
                        </group>
                        <group name="Group 4" position={[-388.94, -20.91, -263.81]}>
                            <group name="Group 217" visible={false} position={[0.6, 25.06, 79.34]}>
                                <mesh
                                    name="Ellipse 417"
                                    geometry={nodes['Ellipse 417']?.geometry}
                                    material={materials['Ellipse 417 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-48, 0.27, 2.34]}
                                />
                                <mesh
                                    name="Ellipse 234"
                                    geometry={nodes['Ellipse 234']?.geometry}
                                    material={materials['Ellipse 234 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[47.87, 0.27, 2.34]}
                                />
                                <mesh
                                    name="Shape 217"
                                    geometry={nodes['Shape 217']?.geometry}
                                    material={materials['Shape 217 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-17.02, 6.42, 0]}
                                />
                                <mesh
                                    name="Ellipse 318"
                                    geometry={nodes['Ellipse 318']?.geometry}
                                    material={materials['Ellipse 318 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[47.76, 0, 0]}
                                />
                                <mesh
                                    name="Ellipse 235"
                                    geometry={nodes['Ellipse 235']?.geometry}
                                    material={materials['Ellipse 235 Material']}
                                    castShadow
                                    receiveShadow
                                    position={[-48.68, 0, 0]}
                                />
                            </group>
                            <mesh
                                name="Shape36"
                                geometry={nodes.Shape36.geometry}
                                material={materials.Eyebrows}
                                castShadow
                                receiveShadow
                                position={[24.09, 60.5, 65.42]}
                                rotation={[Math.PI, -0.55, -3.07]}
                                scale={[-1, 1, 1]}
                            />
                            <mesh
                                name="Shape37"
                                geometry={nodes.Shape37.geometry}
                                material={materials.Eyebrows}
                                castShadow
                                receiveShadow
                                position={[-54.63, 58.12, 54.24]}
                                rotation={[0, -0.42, 0.09]}
                            />
                            <mesh
                                name="Sphere 636"
                                geometry={nodes['Sphere 636']?.geometry}
                                material={materials.Pupils}
                                castShadow
                                receiveShadow
                                position={[-38.21, 21.41, 74.54]}
                                rotation={[-0.19, -0.34, -0.06]}
                                scale={[1.15, 1.15, 0.32]}
                            />
                            <mesh
                                name="Sphere 518"
                                geometry={nodes['Sphere 518']?.geometry}
                                material={materials['Sphere 518 Material']}
                                castShadow
                                receiveShadow
                                position={[-40.37, 21.41, 67.24]}
                                rotation={[-0.19, -0.34, -0.06]}
                                scale={[1.65, 1.65, 0.47]}
                            />
                            <mesh
                                name="Sphere 637"
                                geometry={nodes['Sphere 637']?.geometry}
                                material={materials.Pupils}
                                castShadow
                                receiveShadow
                                position={[38.15, 21.4, 74.43]}
                                rotation={[-0.17, 0.34, 0.06]}
                                scale={[1.15, 1.15, 0.32]}
                            />
                            <mesh
                                name="Sphere 319"
                                geometry={nodes['Sphere 319']?.geometry}
                                material={materials['Sphere 319 Material']}
                                castShadow
                                receiveShadow
                                position={[40, 21.41, 67.24]}
                                rotation={[-0.17, 0.34, 0.06]}
                                scale={[1.65, 1.65, 0.47]}
                            />
                            <mesh
                                name="Cylinder 218"
                                geometry={nodes['Cylinder 218']?.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[-0.43, 4.21, -5.5]}
                                rotation={[0, 0, Math.PI / 2]}
                                scale={[0.97, 0.92, 0.56]}
                            />
                            <mesh
                                name="Cylinder18"
                                geometry={nodes.Cylinder18.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[0, 12.46, 64.97]}
                                rotation={[2.79, 0, 0]}
                                scale={[0.97, 1.15, 1.15]}
                            />
                            <mesh
                                name="Sphere18"
                                geometry={nodes.Sphere18.geometry}
                                material={materials['']}
                                castShadow
                                receiveShadow
                                position={[0, 0, -12.34]}
                            />
                        </group>
                    </group>
                    <mesh
                        name="Table"
                        geometry={nodes.Table.geometry}
                        material={materials['Table Material']}
                        castShadow
                        receiveShadow
                        position={[13.5, -289.61, 8114.4]}
                        scale={[0.72, 1, 1]}
                    />
                    <OrthographicCamera name="1" makeDefault={false} far={10000} near={-50000} />
                    <hemisphereLight name="Default Ambient Light" intensity={0.5} color="#d3a8cb" />
                </scene>
            </group>
        </>
    )
}

export default function SplineSceneWrapper() {
    return (
        <div className='w-full h-full relative'>
            <Canvas shadows flat linear style={{ pointerEvents: 'none' }}>
                <Suspense fallback={
                    <Html center>
                        <div className="w-full whitespace-nowrap text-white/20">Loading 3D Scene...</div>
                    </Html>
                }>
                    <Scene />
                </Suspense>
            </Canvas>
        </div>
    )
}
