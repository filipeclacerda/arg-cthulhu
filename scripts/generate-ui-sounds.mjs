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

const makeSeamless = (samples, crossfadeSeconds = 0.45) => {
  const width = Math.min(seconds(crossfadeSeconds), Math.floor(samples.length / 4));
  for (let i = 0; i < width; i += 1) {
    const mix = i / Math.max(1, width - 1);
    const tailIndex = samples.length - width + i;
    samples[tailIndex] = samples[tailIndex] * (1 - mix) + samples[i] * mix;
  }
  return samples;
};

const decayingTone = (time, start, frequency, decay, amplitude) => {
  if (time < start) return 0;
  const local = time - start;
  return Math.sin(local * Math.PI * 2 * frequency) * Math.exp(-local * decay) * amplitude;
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

// room-tone.wav — warm CRT/fluorescent room tone. Keep the first layer
// comfortable for long sessions: no persistent high-frequency carrier.
{
  const durationSeconds = 12;
  const length = seconds(durationSeconds);
  const samples = new Array(length);
  for (let i = 0; i < length; i += 1) {
    const t = i / RATE;
    const fluorescent = Math.sin(t * Math.PI * 2 * 60) * 360;
    const crtBody =
      Math.sin(t * Math.PI * 2 * 118) * 85 +
      Math.sin(t * Math.PI * 2 * 236) * 28;
    const air = Math.sin(t * Math.PI * 2 * 0.25) * 75 + noise() * 105;
    const relay =
      decayingTone(t, 3.42, 320, 18, 430) +
      decayingTone(t, 8.76, 280, 20, 360);
    samples[i] = fluorescent + crtBody + air + relay;
  }
  writeWav("room-tone.wav", makeSeamless(samples));
}

// room-tone-wet.wav — the same room, now carrying a low pipe resonance and
// three distant drops. Nothing is close enough to become a jump scare.
{
  const durationSeconds = 12;
  const length = seconds(durationSeconds);
  const samples = new Array(length);
  for (let i = 0; i < length; i += 1) {
    const t = i / RATE;
    const room =
      Math.sin(t * Math.PI * 2 * 60) * 320 +
      Math.sin(t * Math.PI * 2 * 42) * 360 +
      noise() * 110;
    const drops = [2.71, 6.43, 10.08].reduce(
      (sum, start) =>
        sum +
        decayingTone(t, start, 970, 18, 1250) +
        decayingTone(t, start, 183, 5.5, 520),
      0
    );
    samples[i] = room + drops;
  }
  writeWav("room-tone-wet.wav", makeSeamless(samples));
}

// ambient-hum.wav — stage 3. A beating electrical drone with one distant
// metallic strain, designed to sit below dialogue and interface sounds.
{
  const durationSeconds = 12;
  const length = seconds(durationSeconds);
  const samples = new Array(length);
  for (let i = 0; i < length; i += 1) {
    const t = i / RATE;
    const drone =
      Math.sin(t * Math.PI * 2 * 47) * 780 +
      Math.sin(t * Math.PI * 2 * 53) * 650 +
      Math.sin(t * Math.PI * 2 * 94) * 260;
    const modulation = 0.74 + Math.sin(t * Math.PI * 2 * 0.25) * 0.16;
    const metal = decayingTone(t, 7.18, 287, 1.35, 740);
    samples[i] = drone * modulation + metal + noise() * 135;
  }
  writeWav("ambient-hum.wav", makeSeamless(samples));
}

// ambient-void.wav — stage 4. The room tone has almost vanished; a sub-bass
// pulse and a thin carrier remain, as if the desktop is listening elsewhere.
{
  const durationSeconds = 16;
  const length = seconds(durationSeconds);
  const samples = new Array(length);
  for (let i = 0; i < length; i += 1) {
    const t = i / RATE;
    const sub =
      Math.sin(t * Math.PI * 2 * 31.25) * 820 +
      Math.sin(t * Math.PI * 2 * 62.5) * 190;
    const carrier = Math.sin(t * Math.PI * 2 * 2731) * 55;
    const breath = noise() * (65 + 45 * (1 + Math.sin(t * Math.PI * 2 * 0.125)));
    const rememberedChime = decayingTone(t, 11.4, 880, 1.8, 280);
    samples[i] = sub + carrier + breath + rememberedChime;
  }
  writeWav("ambient-void.wav", makeSeamless(samples, 0.7));
}

// disk-seek.wav — mechanical read head chatter for newly indexed material.
{
  const length = seconds(0.72);
  const samples = new Array(length).fill(0);
  const starts = [0.02, 0.08, 0.19, 0.27, 0.46, 0.52];
  for (let i = 0; i < length; i += 1) {
    const t = i / RATE;
    samples[i] = starts.reduce(
      (sum, start, index) =>
        sum + decayingTone(t, start, 780 + index * 91, 55, 2500),
      noise() * 70
    );
  }
  writeWav("disk-seek.wav", samples);
}

// wet-click.wav — one impossible drop with a resonance larger than the room.
{
  const length = seconds(1.25);
  const samples = new Array(length);
  for (let i = 0; i < length; i += 1) {
    const t = i / RATE;
    samples[i] =
      decayingTone(t, 0.04, 1260, 24, 4800) +
      decayingTone(t, 0.04, 96, 2.9, 1500) +
      noise() * Math.exp(-t * 12) * 420;
  }
  writeWav("wet-click.wav", samples);
}

// future-chime.wav — notification tones swell before the strike instead of
// decaying after it, keeping the familiar Windows gesture temporally wrong.
{
  const length = seconds(1.45);
  const samples = new Array(length);
  for (let i = 0; i < length; i += 1) {
    const t = i / RATE;
    const rise = Math.pow(Math.min(1, t / 1.18), 2.2);
    const cutoff = t > 1.24 ? Math.exp(-(t - 1.24) * 35) : 1;
    const tones =
      Math.sin(t * Math.PI * 2 * 660) * 0.55 +
      Math.sin(t * Math.PI * 2 * 880) * 0.35 +
      Math.sin(t * Math.PI * 2 * 440) * 0.18;
    samples[i] = tones * rise * cutoff * 5400;
  }
  writeWav("future-chime.wav", samples);
}
