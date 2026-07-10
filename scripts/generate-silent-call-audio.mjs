import fs from "node:fs";
import path from "node:path";

const RATE = 22050;
const DURATION = 18;
const outDir = path.join(process.cwd(), "public", "artifacts");
fs.mkdirSync(outDir, { recursive: true });

let seed = 0x0314;
const noise = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 0xffffffff - 0.5;
};

const writeStereoWav = (filename, left, right) => {
  const frames = Math.min(left.length, right.length);
  const buffer = Buffer.alloc(44 + frames * 4);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(buffer.length - 8, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(2, 22);
  buffer.writeUInt32LE(RATE, 24);
  buffer.writeUInt32LE(RATE * 4, 28);
  buffer.writeUInt16LE(4, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(frames * 4, 40);
  for (let i = 0; i < frames; i += 1) {
    buffer.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(left[i]))), 44 + i * 4);
    buffer.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(right[i]))), 46 + i * 4);
  }
  fs.writeFileSync(path.join(outDir, filename), buffer);
};

const frames = Math.round(RATE * DURATION);
const left = new Array(frames);
const right = new Array(frames);
const recoveredLeft = new Array(frames);
const recoveredRight = new Array(frames);

for (let i = 0; i < frames; i += 1) {
  const t = i / RATE;
  const room =
    Math.sin(t * Math.PI * 2 * 60) * 250 +
    Math.sin(t * Math.PI * 2 * 119.8) * 90 +
    noise() * 115;
  const phraseEnvelope = [2.4, 5.1, 8.7, 12.2, 15.0].reduce((sum, start) => {
    const local = t - start;
    if (local < 0 || local > 1.65) return sum;
    return sum + Math.sin(Math.PI * Math.min(1, local / 0.18)) * Math.exp(-local * 0.72);
  }, 0);
  const hidden =
    (Math.sin(t * Math.PI * 2 * 173) * 0.45 +
      Math.sin(t * Math.PI * 2 * 281) * 0.3 +
      Math.sin(t * Math.PI * 2 * 613) * 0.12 +
      noise() * 0.32) *
    phraseEnvelope *
    780;
  left[i] = room + hidden;
  right[i] = room - hidden;
  const extracted = hidden * 3.2 + noise() * 65;
  recoveredLeft[i] = extracted;
  recoveredRight[i] = extracted * 0.94;
}

writeStereoWav("call-without-voice.wav", left, right);
writeStereoWav("call-without-voice-recovered.wav", recoveredLeft, recoveredRight);
console.log("Generated silent-call source and recovered channel-difference WAV files.");
