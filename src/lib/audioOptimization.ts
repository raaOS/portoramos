import 'server-only';
import { spawn } from 'child_process';

/**
 * Audio compression for portfolio sound effects (and any other small audio
 * uploads going through `/api/upload`).
 *
 * Pipeline shape mirrors `videoOptimization.ts` so behavior is consistent:
 *   - Streamed in/out via stdin/stdout (no temp disk files, Vercel-safe).
 *   - Uses the bundled `ffmpeg-static` binary that already ships with the repo.
 *
 * Encoder choice:
 *   - Output format: MP3 (libmp3lame) — universal browser support including
 *     older Safari versions. SFX of a few hundred KB are an acceptable tradeoff
 *     for not having to maintain multiple codec branches.
 *   - 128 kbps mono. SFX rarely benefit from stereo or higher bitrate; this is
 *     the sweet spot for noticeable size reduction with no audible artifacts.
 *
 * Passthrough rule:
 *   - If the encoded buffer ends up larger than the input (e.g. user already
 *     uploads a small low-bitrate MP3), keep the original bytes to avoid
 *     making things worse.
 */

const FFMPEG_BINARY =
  process.platform === 'win32'
    ? 'node_modules\\ffmpeg-static\\ffmpeg.exe'
    : 'node_modules/ffmpeg-static/ffmpeg';

const TARGET_BITRATE = '128k';
const TARGET_CHANNELS = '1'; // Mono
const TARGET_SAMPLE_RATE = '44100';

export interface AudioOptimizationResult {
  buffer: Buffer;
  contentType: string;
  extension: string;
  originalSize: number;
  optimizedSize: number;
}

interface AudioOptimizationOptions {
  /**
   * If true and the encoded MP3 ends up larger than the input, return the
   * original bytes instead. Default: true.
   */
  allowOriginalPassthrough?: boolean;
}

export async function optimizeAudioForPortfolio(
  inputBuffer: Buffer,
  inputContentType: string,
  options: AudioOptimizationOptions = {}
): Promise<AudioOptimizationResult> {
  const optimized = await runFfmpegToBuffer(inputBuffer, [
    '-i',
    'pipe:0',
    '-vn', // strip any video stream
    '-c:a',
    'libmp3lame',
    '-b:a',
    TARGET_BITRATE,
    '-ar',
    TARGET_SAMPLE_RATE,
    '-ac',
    TARGET_CHANNELS,
    '-f',
    'mp3',
    'pipe:1',
  ]);

  const allowOriginalPassthrough = options.allowOriginalPassthrough ?? true;

  if (allowOriginalPassthrough && optimized.length >= inputBuffer.length) {
    return {
      buffer: inputBuffer,
      contentType: inputContentType,
      extension: extFromContentType(inputContentType) || 'audio',
      originalSize: inputBuffer.length,
      optimizedSize: inputBuffer.length,
    };
  }

  return {
    buffer: optimized,
    contentType: 'audio/mpeg',
    extension: 'mp3',
    originalSize: inputBuffer.length,
    optimizedSize: optimized.length,
  };
}

function extFromContentType(type: string): string | null {
  switch (type) {
    case 'audio/mpeg':
    case 'audio/mp3':
      return 'mp3';
    case 'audio/wav':
    case 'audio/wave':
    case 'audio/x-wav':
      return 'wav';
    case 'audio/ogg':
      return 'ogg';
    case 'audio/webm':
      return 'webm';
    case 'audio/aac':
    case 'audio/mp4':
      return 'm4a';
    case 'audio/flac':
      return 'flac';
    default:
      return null;
  }
}

async function runFfmpegToBuffer(inputBuffer: Buffer, args: string[]): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const child = spawn(FFMPEG_BINARY, args, {
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stderr = '';
    const stdoutChunks: Buffer[] = [];

    child.stdout.on('data', (chunk: Buffer) => stdoutChunks.push(chunk));
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve(Buffer.concat(stdoutChunks));
        return;
      }
      reject(new Error(`FFmpeg audio pipeline failed with code ${code}: ${stderr.slice(-1200)}`));
    });

    child.stdin.end(inputBuffer);
  });
}
