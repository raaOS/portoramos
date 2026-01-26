"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface ScrollSequenceProps {
    frameCount?: number; // Total number of frames (e.g., 100)
    folderPath?: string; // Path to images (e.g., "/assets/sequence/")
    imagePrefix?: string; // Prefix (e.g., "frame_")
    imageSuffix?: string; // Suffix/Extension (e.g., ".webp")
    startTrigger?: string;
    endTrigger?: string;
    // fit: "cover" | "contain"
    fit?: "cover" | "contain";
    // If true, forces "contain" on mobile (<768px)
    mobileOptimize?: boolean;
}

export default function ScrollSequence({
    frameCount = 60,
    folderPath = "/assets/sequence-placeholder/",
    imagePrefix = "seq_",
    imageSuffix = ".jpg",
    fit = "cover",
    mobileOptimize = true
}: ScrollSequenceProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [imagesLoaded, setImagesLoaded] = useState(false);

    // Mobile Detection
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        if (!mobileOptimize) return;
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, [mobileOptimize]);

    const effectiveFit = isMobile ? "contain" : fit;

    // Store images in ref to avoid re-renders
    const imagesRef = useRef<HTMLImageElement[]>([]);
    const frameRef = useRef({ current: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d");
        if (!canvas || !context) return;

        // 2. RENDER FUNCTION
        const renderFrame = (index: number) => {
            // Safety check
            if (index < 0) index = 0;
            if (index >= frameCount) index = frameCount - 1;

            const img = imagesRef.current[index];
            if (!img || !img.complete || img.naturalWidth === 0) return;

            // Clear canvas
            context.clearRect(0, 0, canvas.width, canvas.height);

            // Fit logic
            const hRatio = canvas.width / img.width;
            const vRatio = canvas.height / img.height;

            let ratio;
            if (effectiveFit === "contain") {
                ratio = Math.min(hRatio, vRatio); // Contain (Whole image visible)
            } else {
                ratio = Math.max(hRatio, vRatio); // Cover (Zoom to fill)
            }

            const centerShift_x = (canvas.width - img.width * ratio) / 2;
            const centerShift_y = (canvas.height - img.height * ratio) / 2;

            context.drawImage(
                img,
                0, 0, img.width, img.height,
                centerShift_x, centerShift_y, img.width * ratio, img.height * ratio
            );
        };

        // 1. PRELOAD IMAGES
        let loadedCount = 0;
        const images: HTMLImageElement[] = [];

        const onImageLoad = () => {
            loadedCount++;
            setLoadingProgress(Math.round((loadedCount / frameCount) * 100));
            if (loadedCount >= frameCount) {
                setImagesLoaded(true);
                // Draw first frame immediately
                renderFrame(0);
            }
        };

        for (let i = 0; i < frameCount; i++) {
            const img = new Image();
            // Pad with zero (e.g. 001, 002) - Matches generator output (3 chars)
            const paddedIndex = String(i).padStart(3, "0");
            img.src = `${folderPath}${imagePrefix}${paddedIndex}${imageSuffix}`;
            img.onload = onImageLoad;
            img.onerror = onImageLoad; // Continue even if error to prevent blocking
            images.push(img);
        }

        imagesRef.current = images;

        // 3. SETUP SCROLLTRIGGER
        const anim = gsap.to(frameRef.current, {
            current: frameCount - 1,
            snap: "current",
            ease: "none",
            scrollTrigger: {
                trigger: containerRef.current,
                start: "top top",
                end: `+=${frameCount * 10}px`, // Reduced scroll distance (Faster animation)
                scrub: 0, // Instant scrubbing for responsiveness
                pin: true,
            },
            onUpdate: () => {
                renderFrame(Math.round(frameRef.current.current));
            }
        });


        // 4. HANDLE RESIZE
        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            renderFrame(Math.round(frameRef.current.current));
        };

        window.addEventListener("resize", handleResize);
        handleResize();

        return () => {
            anim.kill();
            // scrollTrigger is created inside the animation via the scrollTrigger object property.
            // When we kill the animation, GSAP usually handles the ScrollTrigger if it's attached directly,
            // but to be safe and explicit without killing others:
            if (anim.scrollTrigger) anim.scrollTrigger.kill();
            window.removeEventListener("resize", handleResize);
        };
    }, [frameCount, folderPath, imagePrefix, imageSuffix, effectiveFit]); // effectiveFit dependency ensures re-render on mode switch

    return (
        <div
            ref={containerRef}
            className="relative w-full bg-black overflow-hidden"
            // Height logic is handled by ScrollTrigger "pinning", but div itself needs min-h-screen
            style={{ minHeight: "100vh" }}
        >
            <canvas
                ref={canvasRef}
                className="block w-full h-full object-cover"
            />

            {!imagesLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-black z-50">
                    <div className="flex flex-col items-center gap-4">
                        <div className="text-white text-xl font-mono animate-pulse">
                            Loading Sequence... {loadingProgress}%
                        </div>
                        {/* Simple CSS Loader */}
                        <div className="h-1 w-64 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white transition-all duration-100 ease-linear"
                                style={{ width: `${loadingProgress}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
