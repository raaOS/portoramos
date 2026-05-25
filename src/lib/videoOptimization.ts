import 'server-only';
import { spawn } from 'child_process';

/**
 * Server-side video pipeline used by `/api/upload` whenever the file isn't
 * already client-compressed.
 *
 * Profiles map to the same `targetHeight` shape as the client `useFFmpeg`
 * hook so behavior is consistent across both ends.
 *   - 'standard' : 720p, CRF 24 (project media, etc.)
 *   - 'high'     : 1080p, CRF 20 (wallpapers — full-screen backgrounds need
 *                  the extra detail; 720p stretches visibly on 1080p+ panels).
 *
 * Performance optimization (B+C):
 *   - Preset diturunkan dari `slow` ke `fast`. Quality drop minimal (CRF
 *     tetap sama jadi target bitrate sama), encoding 3-5× lebih cepat.
 *   - Main + preview + poster di-spawn parallel via Promise.all (saat
 *     keduanya diminta). Cost wall-clock turun ke max(main, preview, poster).
 *   - `skipPreview: true` melewati preview encode (untuk wallpaper yang
 *     tidak butuh preview clip — cuma butuh main + poster).
 */
export type VideoOptimizationProfile = 'standard' | 'high';

const PREVIEW_SECONDS = 6;
const FFMPEG_BINARY =
  process.platform === 'win32'
    ? 'node_modules\\ffmpeg-static\\ffmpeg.exe'
    : 'node_modules/ffmpeg-static/ffmpeg';

interface ProfileSpec {
  targetHeight: number;
  crf: string;
  videoFilter: string;
  posterFilter: string;
}

function buildProfile(targetHeight: number, crf: string): ProfileSpec {
  // Match short edge to `targetHeight`, never upscale beyond source.
  const scale = `scale='if(gt(iw,ih),-2,min(${targetHeight},iw))':'if(gt(iw,ih),min(${targetHeight},ih),-2)'`;
  return {
    targetHeight,
    crf,
    videoFilter: `fps=30,${scale}`,
    posterFilter: scale,
  };
}

const PROFILES: Record<VideoOptimizationProfile, ProfileSpec> = {
  standard: buildProfile(720, '24'),
  high: buildProfile(1080, '20'),
};

export interface VideoOptimizationResult {
  buffer: Buffer;
  /** null kalau `skipPreview: true` di options. */
  previewBuffer: Buffer | null;
  posterBuffer: Buffer;
  originalSize: number;
  optimizedSize: number;
  /** 0 kalau `skipPreview: true`. */
  previewSize: number;
  posterSize: number;
}

interface VideoOptimizationOptions {
  allowOriginalPassthrough?: boolean;
  profile?: VideoOptimizationProfile;
  /** Skip 6s preview clip — hanya main + poster yang di-generate. */
  skipPreview?: boolean;
}

export async function optimizeVideoForPortfolio(
  inputBuffer: Buffer,
  options: VideoOptimizationOptions = {}
): Promise<VideoOptimizationResult> {
  const profile = PROFILES[options.profile ?? 'standard'];
  const skipPreview = options.skipPreview ?? false;

  // Parallelize 3 ffmpeg invocations. Mereka semua independent (input buffer
  // sama, output beda) jadi bisa run concurrent. Wall-clock turun jadi
  // max(main, preview, poster) instead of sum.
  // Catatan: ini menggandakan CPU usage selama upload. Aman karena ffmpeg
  // proses pendek dan upload concurrency biasanya 1.
  const tasks: Array<Promise<Buffer>> = [
    runFfmpegToBuffer(inputBuffer, [
      '-i',
      'pipe:0',
      '-vf',
      profile.videoFilter,
      '-c:v',
      'libx264',
      '-preset',
      'fast',
      '-tune',
      'film',
      '-crf',
      profile.crf,
      '-pix_fmt',
      'yuv420p',
      '-an',
      '-movflags',
      'frag_keyframe+empty_moov',
      '-f',
      'mp4',
      'pipe:1',
    ]),
  ];

  if (!skipPreview) {
    tasks.push(
      runFfmpegToBuffer(inputBuffer, [
        '-i',
        'pipe:0',
        '-t',
        String(PREVIEW_SECONDS),
        '-vf',
        profile.videoFilter,
        '-c:v',
        'libx264',
        '-preset',
        'fast',
        '-tune',
        'film',
        '-crf',
        profile.crf,
        '-pix_fmt',
        'yuv420p',
        '-an',
        '-movflags',
        'frag_keyframe+empty_moov',
        '-f',
        'mp4',
        'pipe:1',
      ])
    );
  }

  tasks.push(
    runFfmpegToBuffer(inputBuffer, [
      '-ss',
      '0.1',
      '-i',
      'pipe:0',
      '-frames:v',
      '1',
      '-vf',
      profile.posterFilter,
      '-q:v',
      '3',
      '-f',
      'image2pipe',
      '-vcodec',
      'mjpeg',
      'pipe:1',
    ])
  );

  const results = await Promise.all(tasks);
  const optimizedBuffer = results[0];
  const previewBuffer = skipPreview ? null : results[1];
  const posterBuffer = skipPreview ? results[1] : results[2];

  const allowOriginalPassthrough = options.allowOriginalPassthrough ?? true;
  const finalBuffer =
    allowOriginalPassthrough && optimizedBuffer.length >= inputBuffer.length
      ? inputBuffer
      : optimizedBuffer;

  return {
    buffer: finalBuffer,
    previewBuffer,
    posterBuffer,
    originalSize: inputBuffer.length,
    optimizedSize: finalBuffer.length,
    previewSize: previewBuffer?.length ?? 0,
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
