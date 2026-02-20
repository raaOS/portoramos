/**
 * Generate Retro OS Sound Effects as WAV files
 * Run: node scripts/generate-sounds.js
 */
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100; // Standard sample rate for better compatibility
const outputDir = path.join('public', 'sounds');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

/**
 * Generate a WAV file buffer from PCM samples
 */
function createWav(samples) {
    const numSamples = samples.length;
    const byteRate = SAMPLE_RATE * 2; // 16-bit mono
    const blockAlign = 2;
    const dataSize = numSamples * 2;
    const buffer = Buffer.alloc(44 + dataSize);

    // RIFF header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataSize, 4);
    buffer.write('WAVE', 8);

    // fmt chunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);       // chunk size
    buffer.writeUInt16LE(1, 20);        // PCM format
    buffer.writeUInt16LE(1, 22);        // mono
    buffer.writeUInt32LE(SAMPLE_RATE, 24);
    buffer.writeUInt32LE(byteRate, 28);
    buffer.writeUInt16LE(blockAlign, 32);
    buffer.writeUInt16LE(16, 34);       // bits per sample

    // data chunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);

    for (let i = 0; i < numSamples; i++) {
        const val = Math.max(-1, Math.min(1, samples[i]));
        // 16-bit signed PCM
        buffer.writeInt16LE(Math.round(val * 32767), 44 + i * 2);
    }

    return buffer;
}

/** Sine wave generator */
function sine(freq, t) {
    return Math.sin(2 * Math.PI * freq * t);
}

/** Envelope: attack-decay */
function envelope(t, duration, attack = 0.01, decay = 0.1) {
    if (t < attack) return t / attack;
    if (t > duration - decay) return (duration - t) / decay;
    return 1;
}

/** Generate samples for a given duration */
function genSamples(duration, fn) {
    // Ensure minimum duration of 0.1s for browser decoder stability
    const finalDuration = Math.max(duration, 0.1);
    const numSamples = Math.floor(SAMPLE_RATE * finalDuration);
    const samples = new Float64Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
        const t = i / SAMPLE_RATE;
        if (t > duration) {
            samples[i] = 0; // Pad with silence
        } else {
            samples[i] = fn(t, duration);
        }
    }
    return samples;
}

// ============ SOUND DEFINITIONS ============
const sounds = {
    'startup': () => {
        const duration = 1.2;
        return genSamples(duration, (t, dur) => {
            const env = envelope(t, dur, 0.005, 0.6);
            const s = sine(523.25, t) * 0.3 + sine(659.25, t) * 0.25 + sine(783.99, t) * 0.25 + sine(1046.5, t) * 0.15;
            return s * env * 0.7;
        });
    },
    'click': () => {
        const duration = 0.06;
        return genSamples(duration, (t, dur) => {
            const env = envelope(t, dur, 0.001, 0.04);
            const noise = (Math.random() * 2 - 1) * 0.3;
            const pop = sine(1800, t) * 0.6 * Math.exp(-t * 80);
            return (noise + pop) * env;
        });
    },
    'window-open': () => {
        const duration = 0.18;
        return genSamples(duration, (t, dur) => {
            const env = envelope(t, dur, 0.005, 0.06);
            // The following lines are syntactically incorrect and do not correspond to the existing code structure.
            // The current code does not use an ffmpeg command chain here.
            // .toFormat('wav')
            // .audioCodec('pcm_s16le')
            // .audioFrequency(44100)
            // .audioChannels(1)
            const freq = 600 + (t / dur) * 400;
            return sine(freq, t) * env * 0.5;
        });
    },
    'window-close': () => {
        const duration = 0.15;
        return genSamples(duration, (t, dur) => {
            const env = envelope(t, dur, 0.005, 0.05);
            const freq = 900 - (t / dur) * 400;
            return sine(freq, t) * env * 0.5;
        });
    },
    'error': () => {
        const duration = 0.4;
        return genSamples(duration, (t, dur) => {
            const env = envelope(t, dur, 0.005, 0.05);
            const beep1 = t < 0.15 ? sine(440, t) * 0.6 : 0;
            const beep2 = t > 0.2 && t < 0.38 ? sine(330, t) * 0.6 : 0;
            return (beep1 + beep2) * env;
        });
    },
    'notification': () => {
        const duration = 0.5;
        return genSamples(duration, (t, dur) => {
            const env = Math.exp(-t * 6);
            const s = sine(880, t) * 0.4 + sine(1760, t) * 0.2 + sine(2640, t) * 0.1;
            return s * env * 0.6;
        });
    },
    'drag': () => {
        const duration = 0.12;
        return genSamples(duration, (t, dur) => {
            const env = envelope(t, dur, 0.01, 0.05);
            const noise = (Math.random() * 2 - 1) * 0.15;
            const low = sine(200, t) * 0.3;
            return (noise + low) * env;
        });
    }
};

async function generateAll() {
    for (const [name, generator] of Object.entries(sounds)) {
        const wavPath = path.join(outputDir, `${name}.wav`);
        const samples = generator();
        const wav = createWav(samples);
        fs.writeFileSync(wavPath, wav);
        console.log(`✓ ${name}.wav (44100Hz, ${wav.length} bytes)`);

        // Also create a dummy .mp3 by copying (fallback)
        // Note: Real MP3 conversion failed on this environment, 
        // but since WAV works now, we just keep paths consistent.
        const mp3Path = path.join(outputDir, `${name}.mp3`);
        fs.copyFileSync(wavPath, mp3Path);
    }
}

generateAll().catch(console.error);
