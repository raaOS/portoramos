/**
 * Generate Retro OS Sound Effects as WAV files
 * Run: node scripts/generate-sounds.js
 */
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 22050;
const outputDir = path.join(__dirname, '..', 'public', 'sounds');

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
    buffer.writeUInt16LE(blockAlign, 30);
    buffer.writeUInt16LE(16, 32);       // bits per sample

    // data chunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);

    for (let i = 0; i < numSamples; i++) {
        const val = Math.max(-1, Math.min(1, samples[i]));
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
    const numSamples = Math.floor(SAMPLE_RATE * duration);
    const samples = new Float64Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
        const t = i / SAMPLE_RATE;
        samples[i] = fn(t, duration);
    }
    return samples;
}

// ============ SOUND DEFINITIONS ============

// 1. STARTUP - Classic Mac-like boot chime (chord)
function generateStartup() {
    const duration = 1.2;
    return genSamples(duration, (t, dur) => {
        const env = envelope(t, dur, 0.005, 0.6);
        // C major chord: C4 + E4 + G4 + C5
        const s = sine(523.25, t) * 0.3 + sine(659.25, t) * 0.25 + sine(783.99, t) * 0.25 + sine(1046.5, t) * 0.15;
        return s * env * 0.7;
    });
}

// 2. CLICK - Short percussive click
function generateClick() {
    const duration = 0.06;
    return genSamples(duration, (t, dur) => {
        const env = envelope(t, dur, 0.001, 0.04);
        // White noise burst + high freq pop
        const noise = (Math.random() * 2 - 1) * 0.3;
        const pop = sine(1800, t) * 0.6 * Math.exp(-t * 80);
        return (noise + pop) * env;
    });
}

// 3. WINDOW-OPEN - Short ascending two-tone
function generateWindowOpen() {
    const duration = 0.18;
    return genSamples(duration, (t, dur) => {
        const env = envelope(t, dur, 0.005, 0.06);
        // Sweep from 600Hz to 900Hz
        const freq = 600 + (t / dur) * 400;
        return sine(freq, t) * env * 0.5;
    });
}

// 4. WINDOW-CLOSE - Short descending tone
function generateWindowClose() {
    const duration = 0.15;
    return genSamples(duration, (t, dur) => {
        const env = envelope(t, dur, 0.005, 0.05);
        // Sweep from 900Hz down to 500Hz
        const freq = 900 - (t / dur) * 400;
        return sine(freq, t) * env * 0.5;
    });
}

// 5. ERROR - Classic two-beep error
function generateError() {
    const duration = 0.4;
    return genSamples(duration, (t, dur) => {
        const env = envelope(t, dur, 0.005, 0.05);
        // Two quick beeps
        const beep1 = t < 0.15 ? sine(440, t) * 0.6 : 0;
        const beep2 = t > 0.2 && t < 0.38 ? sine(330, t) * 0.6 : 0;
        return (beep1 + beep2) * env;
    });
}

// 6. NOTIFICATION - Pleasant ding
function generateNotification() {
    const duration = 0.5;
    return genSamples(duration, (t, dur) => {
        const env = Math.exp(-t * 6); // exponential decay
        // Bell-like: fundamental + harmonics
        const s = sine(880, t) * 0.4 + sine(1760, t) * 0.2 + sine(2640, t) * 0.1;
        return s * env * 0.6;
    });
}

// 7. DRAG - Short low woosh
function generateDrag() {
    const duration = 0.12;
    return genSamples(duration, (t, dur) => {
        const env = envelope(t, dur, 0.01, 0.05);
        // Low rumble
        const noise = (Math.random() * 2 - 1) * 0.15;
        const low = sine(200, t) * 0.3;
        return (noise + low) * env;
    });
}

// ============ GENERATE ALL ============
const sounds = {
    'startup': generateStartup,
    'click': generateClick,
    'window-open': generateWindowOpen,
    'window-close': generateWindowClose,
    'error': generateError,
    'notification': generateNotification,
    'drag': generateDrag,
};

for (const [name, generator] of Object.entries(sounds)) {
    const samples = generator();
    const wav = createWav(samples);
    const filePath = path.join(outputDir, `${name}.wav`);
    fs.writeFileSync(filePath, wav);
    const sizeKB = (wav.length / 1024).toFixed(1);
    console.log(`✓ ${name}.wav (${sizeKB} KB)`);
}

console.log(`\nAll sounds saved to: ${outputDir}`);
