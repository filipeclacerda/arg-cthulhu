import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "public", "sounds");
fs.mkdirSync(outDir, { recursive: true });

const RATE = 22050;

const writeWav = (filename, samples, channels = 1) => {
  const buffer = Buffer.alloc(44 + samples.length * 2);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(buffer.length - 8, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(RATE, 24);
  buffer.writeUInt32LE(RATE * channels * 2, 28);
  buffer.writeUInt16LE(channels * 2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i += 1) {
    const clamped = Math.max(-32768, Math.min(32767, Math.round(samples[i])));
    buffer.writeInt16LE(clamped, 44 + i * 2);
  }
  fs.writeFileSync(path.join(outDir, filename), buffer);
  console.log(`Generated public/sounds/${filename}: ${(samples.length / RATE).toFixed(3)}s`);
};

const seconds = (s) => Math.round(RATE * s);

let seed = 0x2026;
const noise = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 0xffffffff - 0.5;
};

// click.wav — short percussive tick for window open/close.
{
  const length = seconds(0.045);
  const samples = new Array(length);
  for (let i = 0; i < length; i += 1) {
    const t = i / RATE;
    const envelope = Math.exp(-t * 140);
    samples[i] = (Math.sin(t * Math.PI * 2 * 1800) * 0.6 + noise() * 0.4) * 9000 * envelope;
  }
  writeWav("click.wav", samples);
}

// error.wav — two-tone descending buzz for rejected commands.
{
  const length = seconds(0.32);
  const samples = new Array(length);
  for (let i = 0; i < length; i += 1) {
    const t = i / RATE;
    const freq = t < 0.16 ? 300 : 220;
    const envelope = Math.exp(-((t % 0.16)) * 6) * 0.85;
    samples[i] = Math.sign(Math.sin(t * Math.PI * 2 * freq)) * 7000 * envelope;
  }
  writeWav("error.wav", samples);
}

// chime.wav — ascending two-note notification ding.
{
  const length = seconds(0.5);
  const samples = new Array(length);
  for (let i = 0; i < length; i += 1) {
    const t = i / RATE;
    const note = t < 0.18 ? 660 : 880;
    const envelope = Math.exp(-((t % 0.18)) * 5);
    samples[i] = Math.sin(t * Math.PI * 2 * note) * 8500 * envelope;
  }
  writeWav("chime.wav", samples);
}

// glitch.wav — harsh bitcrushed noise stutter for corruption escalation.
{
  const length = seconds(0.16);
  const samples = new Array(length);
  const step = 6;
  for (let i = 0; i < length; i += 1) {
    const quantized = Math.floor(i / step) * step;
    const t = quantized / RATE;
    const envelope = 1 - i / length;
    const tone = Math.sin(t * Math.PI * 2 * 220) * 0.5;
    samples[i] = (tone + noise()) * 9500 * envelope;
  }
  writeWav("glitch.wav", samples);
}

// ambient-hum.wav — low looping drone with faint static, stage 3+ atmosphere.
{
  const durationSeconds = 6;
  const length = seconds(durationSeconds);
  const samples = new Array(length);
  const fadeSamples = seconds(0.4);
  for (let i = 0; i < length; i += 1) {
    const t = i / RATE;
    const drone =
      Math.sin(t * Math.PI * 2 * 54) * 1400 +
      Math.sin(t * Math.PI * 2 * 81.5) * 600;
    const hiss = noise() * 260;
    let value = drone + hiss;
    if (i < fadeSamples) value *= i / fadeSamples;
    if (i > length - fadeSamples) value *= (length - i) / fadeSamples;
    samples[i] = value;
  }
  writeWav("ambient-hum.wav", samples);
}
