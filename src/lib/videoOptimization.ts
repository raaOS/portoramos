import 'server-only';
import { spawn } from 'child_process';

/**
 * Server-side video pipeline used by `/api/upload` whenever the file isn't
 * already client-compressed.
 *
 * Profiles tuned untuk live wallpaper portfolio (motion graphics, particle,
 * CGI) — bukan live-action. Beda penting dengan setup lama:
 *   - Tidak pakai `-tune film` (yang bias ke film grain pattern).
 *   - Tidak pakai `fps=30` filter — preserve native source fps.
 *   - Bitrate cap eksplisit untuk anti-VBR-spike yang bikin browser
 *     stutter saat playback wallpaper di loop.
 *   - GOP 60 frame supaya loop seam tidak macroblocking.
 *   - `+faststart` agar moov atom di awal → browser start playback cepat.
 *
 *   - 'standard' : 720p,  CRF 24, 3 Mbps cap (project thumbnails / gallery)
 *   - 'high'     : 1440p, CRF 18, 8 Mbps cap (default wallpaper — sweet
 *                  spot 1080p s/d 24" QHD; 4K masih tajam)
 *   - 'ultra'    : 2160p, CRF 20, 18 Mbps cap (4K wallpaper)
 *
 * Performance optimization:
 *   - Preset `medium` (bukan `slow` atau `fast`). Trade-off encode
 *     ~2× dari fast, quality jauh lebih baik untuk motion graphics.
 *   - Main + preview + poster di-spawn parallel via Promise.all.
 *   - `skipPreview: true` melewati preview encode untuk wallpaper.
 */
export type VideoOptimizationProfile = 'standard' | 'high' | 'ultra';

const PREVIEW_SECONDS = 6;
const FFMPEG_BINARY =
  process.platform === 'win32'
    ? 'node_modules\\ffmpeg-static\\ffmpeg.exe'
    : 'node_modules/ffmpeg-static/ffmpeg';

interface ProfileSpec {
  targetHeight: number;
  crf: string;
  /** Bitrate cap (anti-VBR-spike). */
  maxrate: string;
  /** x264 convention: 2× maxrate. */
  bufsize: string;
  videoFilter: string;
  posterFilter: string;
}

function buildProfile(
  targetHeight: number,
  crf: string,
  maxrate: string,
  bufsize: string
): ProfileSpec {
  // Match short edge to `targetHeight`, never upscale beyond source.
  // Tidak pakai `fps=30` filter — preserve native source fps. Source
  // 60 fps (umum di motion graphics live wallpaper) yang di-paksa 30 fps
  // terasa judder. x264 efisien di any fps jadi tidak ada cost extra.
  const scale = `scale='if(gt(iw,ih),-2,min(${targetHeight},iw))':'if(gt(iw,ih),min(${targetHeight},ih),-2)'`;
  return {
    targetHeight,
    crf,
    maxrate,
    bufsize,
    videoFilter: scale,
    posterFilter: scale,
  };
}

const PROFILES: Record<VideoOptimizationProfile, ProfileSpec> = {
  standard: buildProfile(720, '24', '3M', '6M'),
  high: buildProfile(1440, '18', '8M', '16M'),
  ultra: buildProfile(2160, '20', '18M', '36M'),
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
  //
  // CATATAN flag `frag_keyframe+empty_moov`: kita output ke pipe (bukan
  // file disk yang bisa di-seek), jadi tidak bisa pakai `+faststart`.
  // fragmented MP4 yang moov-empty di awal sudah memberikan efek setara
  // (browser bisa start playback dari fragment pertama tanpa wait
  // seluruh file).
  const tasks: Array<Promise<Buffer>> = [
    runFfmpegToBuffer(inputBuffer, [
      '-i',
      'pipe:0',
      '-vf',
      profile.videoFilter,
      '-c:v',
      'libx264',
      // Preset `medium` — quality bump dari `fast` untuk motion graphics.
      '-preset',
      'medium',
      // TIDAK pakai `-tune film` (bias ke film grain pattern, salah untuk
      // motion graphics / particle / CGI yang umum di live wallpaper).
      '-crf',
      profile.crf,
      // Bitrate cap eksplisit — anti-VBR-spike yang bikin browser stutter.
      '-maxrate',
      profile.maxrate,
      '-bufsize',
      profile.bufsize,
      // GOP 60 frame supaya loop seam tidak macroblocking.
      '-g',
      '60',
      '-keyint_min',
      '60',
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
        'medium',
        '-crf',
        profile.crf,
        '-maxrate',
        profile.maxrate,
        '-bufsize',
        profile.bufsize,
        '-g',
        '60',
        '-keyint_min',
        '60',
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
