/**
 * Generate Test WAV — Generator file WAV sintetis untuk testing.
 *
 * Membuat file WAV sine-wave sederhana yang digunakan sebagai input
 * test pada unit test dan script pemrosesan audio.
 *
 * @module scripts/utils/generate-test-wav
 */
const fs = require('fs');
const path = require('path');

// Parameters
const sampleRate = 44100;
const durationSeconds = 1;
const frequency = 440; // A4
const volume = 0.5;

const numSamples = sampleRate * durationSeconds;
const bytesPerSample = 2; // 16-bit
const numChannels = 1; // Mono
const blockAlign = numChannels * bytesPerSample;
const byteRate = sampleRate * blockAlign;
const dataSize = numSamples * blockAlign;
const fileSize = 36 + dataSize;

const buffer = Buffer.alloc(fileSize + 8);

// RIFF chunk descriptor
buffer.write('RIFF', 0);
buffer.writeUInt32LE(fileSize, 4);
buffer.write('WAVE', 8);

// fmt sub-chunk
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
buffer.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
buffer.writeUInt16LE(numChannels, 22);
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(byteRate, 28);
buffer.writeUInt16LE(blockAlign, 32);
buffer.writeUInt16LE(bytesPerSample * 8, 34); // BitsPerSample

// data sub-chunk
buffer.write('data', 36);
buffer.writeUInt32LE(dataSize, 40);

// Write data
for (let i = 0; i < numSamples; i++) {
  const t = i / sampleRate;
  const sample = volume * Math.sin(2 * Math.PI * frequency * t);
  // Convert -1.0..1.0 to -32768..32767
  const intSample = Math.max(-32768, Math.min(32767, sample * 32767));
  buffer.writeInt16LE(intSample, 44 + i * 2);
}

const outputPath = path.join(__dirname, '../../public/sounds/synthetic_test.wav');
fs.writeFileSync(outputPath, buffer);
console.log(`Generated synth WAV at ${outputPath}`);
