import 'server-only';
import { spawn } from 'child_process';


const VIDEO_FILTER = "fps=30,scale='if(gt(iw,ih),-2,720)':'if(gt(iw,ih),720,-2)'";
const POSTER_FILTER = "scale='if(gt(iw,ih),-2,720)':'if(gt(iw,ih),720,-2)'";
const PREVIEW_SECONDS = 6;
const FFMPEG_BINARY = process.platform === 'win32'
  ? 'node_modules\\ffmpeg-static\\ffmpeg.exe'
  : 'node_modules/ffmpeg-static/ffmpeg';

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
  const optimizedBuffer = await runFfmpegToBuffer(inputBuffer, [
    '-i', 'pipe:0',
    '-vf', VIDEO_FILTER,
    '-c:v', 'libx264',
    '-preset', 'slow',
    '-crf', '24',
    '-pix_fmt', 'yuv420p',
    '-an',
    '-movflags', 'frag_keyframe+empty_moov',
    '-f', 'mp4',
    'pipe:1',
  ]);

  const previewBuffer = await runFfmpegToBuffer(inputBuffer, [
    '-i', 'pipe:0',
    '-t', String(PREVIEW_SECONDS),
    '-vf', VIDEO_FILTER,
    '-c:v', 'libx264',
    '-preset', 'slow',
    '-crf', '24',
    '-pix_fmt', 'yuv420p',
    '-an',
    '-movflags', 'frag_keyframe+empty_moov',
    '-f', 'mp4',
    'pipe:1',
  ]);

  const posterBuffer = await runFfmpegToBuffer(inputBuffer, [
    '-ss', '0.1',
    '-i', 'pipe:0',
    '-frames:v', '1',
    '-vf', POSTER_FILTER,
    '-q:v', '3',
    '-f', 'image2pipe',
    '-vcodec', 'mjpeg',
    'pipe:1',
  ]);

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
}

async function runFfmpegToBuffer(inputBuffer: Buffer, args: string[]): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const child = spawn(FFMPEG_BINARY, args, {
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stderr = '';
    const stdoutChunks: Buffer[] = [];

    child.stdout.on('data', (chunk: Buffer) => {
      stdoutChunks.push(chunk);
    });

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve(Buffer.concat(stdoutChunks));
        return;
      }

      reject(new Error(`FFmpeg failed with code ${code}: ${stderr.slice(-1200)}`));
    });

    child.stdin.end(inputBuffer);
  });
}
