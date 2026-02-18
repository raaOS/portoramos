"use client";

import React, { useRef, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/contexts/ToastContext";
import { Loader2, Play, Upload } from "lucide-react";

export default function SequenceGenerator() {
    const { showSuccess, showError } = useToast();
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState("Idle");

    const [removeBackground, setRemoveBackground] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setVideoFile(e.target.files[0]);
        }
    };

    const processVideo = async () => {
        if (!videoFile || !videoRef.current || !canvasRef.current) return;

        setIsProcessing(true);
        setStatus("Initializing Video...");
        setProgress(0);

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        // Load Video
        video.src = URL.createObjectURL(videoFile);
        await new Promise((resolve) => {
            video.onloadedmetadata = () => resolve(true);
        });

        // Configuration
        const fps = 24;
        const duration = video.duration;
        const totalFrames = Math.floor(duration * fps);
        const width = 1920; // Full HD for better quality
        const height = (video.videoHeight / video.videoWidth) * width;

        canvas.width = width;
        canvas.height = height;

        setStatus(`Processing ${totalFrames} frames at 1080p...`);

        const frames: Blob[] = [];

        // Frame Extraction Loop
        for (let i = 0; i < totalFrames; i++) {
            const time = i / fps;
            video.currentTime = time;

            // Wait for seek
            await new Promise((resolve) => {
                video.onseeked = () => resolve(true);
            });

            if (ctx) {
                // Clear previous frame to support transparency (Alpha Channel)
                ctx.clearRect(0, 0, width, height);
                ctx.drawImage(video, 0, 0, width, height);

                // --- CHROMA KEY LOGIC ---
                if (removeBackground) {
                    const frameData = ctx.getImageData(0, 0, width, height);
                    const data = frameData.data;

                    // Tolerance for "Black" (0-255)
                    const tolerance = 20;

                    for (let j = 0; j < data.length; j += 4) {
                        const r = data[j];
                        const g = data[j + 1];
                        const b = data[j + 2];

                        // If pixel is close to black, make it transparent
                        if (r < tolerance && g < tolerance && b < tolerance) {
                            data[j + 3] = 0; // Alpha = 0
                        }
                    }
                    ctx.putImageData(frameData, 0, 0);
                }
                // ------------------------

                // Convert to webp blob (High Quality)
                const blob = await new Promise<Blob | null>((resolve) =>
                    canvas.toBlob(resolve, "image/webp", 0.9)
                );

                if (blob) frames.push(blob);
            }

            setProgress(Math.round(((i + 1) / totalFrames) * 50)); // 0-50% for processing
        }

        setStatus(`Uploading ${frames.length} frames...`);

        // Upload in Batches to avoid Payload Too Large (413)
        const BATCH_SIZE = 50;
        const totalBatches = Math.ceil(frames.length / BATCH_SIZE);

        // We'll define a sequence name based on timestamp
        const sequenceName = `seq_${Date.now()}`;

        try {
            for (let i = 0; i < totalBatches; i++) {
                const start = i * BATCH_SIZE;
                const end = Math.min(start + BATCH_SIZE, frames.length);
                const chunk = frames.slice(start, end);

                const formData = new FormData();
                formData.append("sequenceName", sequenceName);

                chunk.forEach((blob, textIndex) => {
                    // Global index for correct filename
                    const globalIndex = start + textIndex;
                    const filename = `frame_${String(globalIndex).padStart(3, "0")}.webp`;
                    formData.append("files", blob, filename);
                });

                const res = await fetch("/api/upload/sequence", {
                    method: "POST",
                    body: formData,
                });

                if (!res.ok) throw new Error(`Batch ${i + 1} failed`);

                // Update progress during upload phase
                const uploadProgress = Math.round(((i + 1) / totalBatches) * 100);
                setStatus(`Uploading batch ${i + 1}/${totalBatches}...`);
                setProgress(uploadProgress);
            }

            showSuccess(`Success! Saved to: /assets/sequence/${sequenceName}`);
            setStatus("Completed!");
        } catch (error) {
            showError("Failed to upload sequence. Try shorter video?");
            console.error(error);
            setStatus("Error");
        } finally {
            setIsProcessing(false);
            setProgress(100);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-4">
                <label className="text-sm font-medium">1. Select Video File</label>
                <Input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    disabled={isProcessing}
                />
                {videoFile && (
                    <div className="flex items-center gap-4">
                        <p className="text-xs text-muted-foreground">
                            Selected: {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)} MB)
                        </p>

                        {/* Chroma Key Checkbox */}
                        <div className="flex items-center space-x-2 border p-2 rounded bg-secondary/20">
                            <input
                                type="checkbox"
                                id="chroma"
                                checked={removeBackground}
                                onChange={(e) => setRemoveBackground(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label
                                htmlFor="chroma"
                                className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                                Force Remove Black Background (Chroma Key)
                            </label>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid gap-4">
                <label className="text-sm font-medium">2. Process & Upload</label>
                <Button
                    onClick={processVideo}
                    disabled={!videoFile || isProcessing}
                    className="w-full sm:w-auto"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <Upload className="mr-2 h-4 w-4" />
                            Generate Sequence
                        </>
                    )}
                </Button>
            </div>

            {isProcessing && (
                <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                        <span>{status}</span>
                        <span>{progress}%</span>
                    </div>
                    {/* Custom Progress Bar since UI component missing */}
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Hidden processing elements */}
            <div className="hidden">
                <video ref={videoRef} playsInline muted />
                <canvas ref={canvasRef} />
            </div>
        </div>
    );
}
