import 'server-only';
import { spawn } from 'child_process';
import { randomUUID } from 'crypto';
import { tmpdir } from 'os';
import path from 'path';
import { promises as fs } from 'fs';


const VIDEO_FILTER = "fps=30,scale='if(gt(iw,ih),-2,720)':'if(gt(iw,ih),720,-2)'";
const POSTER_FILTER = "scale='if(gt(iw,ih),-2,720)':'if(gt(iw,ih),720,-2)'";
const PREVIEW_SECONDS = 6;

export interface VideoOptimizationResult {
  buffer: Buffer;
  previewBuffer: Buffer;
  posterBuffer: Buffer;
  originalSize: number;
  optimizedSize: number;
  previewSize: number;
  posterSize: number;
}

interface VideoOptimizationOptions {
  allowOriginalPassthrough?: boolean;
}

export async function optimizeVideoForPortfolio(
  inputBuffer: Buffer,
  options: VideoOptimizationOptions = {}
): Promise<VideoOptimizationResult> {
  const workDir = path.join(tmpdir(), `portfolio-video-${randomUUID()}`);
  const inputPath = path.join(workDir, 'input');
  const optimizedPath = path.join(workDir, 'optimized.mp4');
  const previewPath = path.join(workDir, 'preview.mp4');
  const posterPath = path.join(workDir, 'poster.jpg');

  await fs.mkdir(workDir, { recursive: true });

  try {
    await fs.writeFile(inputPath, inputBuffer);

    await runFfmpeg([
      '-y',
      '-i', inputPath,
      '-vf', VIDEO_FILTER,
      '-c:v', 'libx264',
      '-preset', 'slow',
      '-crf', '24',
      '-pix_fmt', 'yuv420p',
      '-an',
      '-movflags', '+faststart',
      optimizedPath,
    ]);

    await runFfmpeg([
      '-y',
      '-i', inputPath,
      '-t', String(PREVIEW_SECONDS),
      '-vf', VIDEO_FILTER,
      '-c:v', 'libx264',
      '-preset', 'slow',
      '-crf', '24',
      '-pix_fmt', 'yuv420p',
      '-an',
      '-movflags', '+faststart',
      previewPath,
    ]);

    await runFfmpeg([
      '-y',
      '-ss', '0.1',
      '-i', inputPath,
      '-frames:v', '1',
      '-vf', POSTER_FILTER,
      '-q:v', '3',
      posterPath,
    ]);

    const optimizedBuffer = await fs.readFile(optimizedPath);
    const previewBuffer = await fs.readFile(previewPath);
    const posterBuffer = await fs.readFile(posterPath);

    const allowOriginalPassthrough = options.allowOriginalPassthrough ?? true;
    const finalBuffer = allowOriginalPassthrough && optimizedBuffer.length >= inputBuffer.length
      ? inputBuffer
      : optimizedBuffer;

    return {
      buffer: finalBuffer,
      previewBuffer,
      posterBuffer,
      originalSize: inputBuffer.length,
      optimizedSize: finalBuffer.length,
      previewSize: previewBuffer.length,
      posterSize: posterBuffer.length,
    };
  } finally {
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

async function runFfmpeg(args: string[]): Promise<void> {
  const ffmpegPath = await resolveFfmpegPath();

  await new Promise<void>((resolve, reject) => {
    const child = spawn(ffmpegPath, args, { windowsHide: true });
    let stderr = '';


    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`FFmpeg failed with code ${code}: ${stderr.slice(-1200)}`));
    });
  });
}

async function resolveFfmpegPath(): Promise<string> {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;

  try {
    // Dynamic requirement to isolate from build tracing
    const { createRequire } = await import('module');
    const requireLocal = createRequire(import.meta.url);
    const ffmpegPath = requireLocal('ffmpeg-static') as string | null;
    if (ffmpegPath) return ffmpegPath;
  } catch {
    // Fallback to global ffmpeg in PATH
  }

  return 'ffmpeg';
}


