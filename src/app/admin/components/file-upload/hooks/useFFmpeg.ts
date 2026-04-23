'use client';

import { useRef, useCallback } from 'react';
import type { FFmpeg } from '@ffmpeg/ffmpeg';

interface TrimOptions {
    start: number;
    end: number;
    crop?: { x: number; y: number; width: number; height: number } | null;
}

export function useFFmpeg(onStatusUpdate: (status: string) => void) {
    const ffmpegRef = useRef<FFmpeg | null>(null);

    const loadFFmpeg = useCallback(async (): Promise<FFmpeg> => {
        if (ffmpegRef.current) return ffmpegRef.current;
        onStatusUpdate('Loading Compression Core...');

        const { FFmpeg } = await import('@ffmpeg/ffmpeg');
        const { toBlobURL } = await import('@ffmpeg/util');

        const ffmpeg = new FFmpeg();
        try {
            const baseURL = window.location.origin + '/ffmpeg';
            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            });
        } catch {
            throw new Error('Compression engine failed to load.');
        }
        ffmpegRef.current = ffmpeg;
        return ffmpeg;
    }, [onStatusUpdate]);

    const compressVideo = useCallback(async (
        file: File,
        onProgress: (p: number) => void,
        trimOptions?: TrimOptions
    ): Promise<File> => {
        onStatusUpdate('Initializing Compressor...');
        const ffmpeg = await loadFFmpeg();
        onStatusUpdate('Compressing Video (Wait)...');

        const inputName = 'input.mp4';
        const outputName = 'output.mp4';
        const startTime = Date.now();

        const { fetchFile } = await import('@ffmpeg/util');
        await ffmpeg.writeFile(inputName, await fetchFile(file));

        ffmpeg.on('progress', ({ progress }: { progress: number }) => {
            const percent = Math.round(progress * 100);
            onProgress(percent);
            if (progress > 0) {
                const elapsed = (Date.now() - startTime) / 1000;
                const estimatedTotal = elapsed / progress;
                const remaining = Math.round(estimatedTotal - elapsed);
                onStatusUpdate(`Compressing Video (${percent}%) - ~${remaining}s remaining...`);
            } else {
                onStatusUpdate(`Compressing Video (${percent}%)...`);
            }
        });

        const ffmpegArgs: string[] = [];

        if (trimOptions) {
            ffmpegArgs.push('-ss', trimOptions.start.toString());
            ffmpegArgs.push('-to', trimOptions.end.toString());
        }

        ffmpegArgs.push('-i', inputName);

        const filters: string[] = [];

        if (trimOptions?.crop) {
            const { width, height, x, y } = trimOptions.crop;
            const w = Math.round(width / 2) * 2;
            const h = Math.round(height / 2) * 2;
            const px = Math.round(x / 2) * 2;
            const py = Math.round(y / 2) * 2;
            filters.push(`crop=${w}:${h}:${px}:${py}`);
        }

        filters.push("fps=30");
        filters.push("scale='if(gt(iw,ih),-2,720)':'if(gt(iw,ih),720,-2)'");
        ffmpegArgs.push('-vf', filters.join(','));

        ffmpegArgs.push('-c:v', 'libx264');
        ffmpegArgs.push('-crf', '24');
        ffmpegArgs.push('-preset', 'slow');
        ffmpegArgs.push('-pix_fmt', 'yuv420p');
        ffmpegArgs.push('-an');
        ffmpegArgs.push('-movflags', '+faststart');
        ffmpegArgs.push(outputName);

        await ffmpeg.exec(ffmpegArgs);

        const data = await ffmpeg.readFile(outputName);
        const blob = new Blob([data as BlobPart], { type: 'video/mp4' });
        const outputFileName = file.name.replace(/\.[^.]+$/, '') + '.mp4';
        return new File([blob], outputFileName, { type: 'video/mp4' });
    }, [loadFFmpeg, onStatusUpdate]);

    return { compressVideo };
}
