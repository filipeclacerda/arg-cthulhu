import fs from "node:fs";
import path from "node:path";

// voicemail-to-em.wav — the human reward that follows the counting.wav set
// piece. No real voice: tape/line hiss, two answering-machine beeps, noise
// modulated to suggest muffled (unintelligible) speech, one faster-modulated
// stretch that reads as a laugh, and four seconds of plain room tone at the
// end for "[4 SECONDS OF LINE NOISE]". Deliberately mundane — this is the
// warm beat, not a horror cue.

const root = process.cwd();
const outPath = path.join(root, "public", "artifacts", "voicemail-to-em.wav");

const RATE = 22050;
const seconds = (s) => Math.round(RATE * s);

let seed = 0x17421998;
const noise = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 0xffffffff - 0.5;
};

// Band-limited hiss: sum a few detuned noise taps through a slow leaky
// integrator so it reads as tape/line hiss rather than white static.
let lp = 0;
const lineHiss = (amplitude) => {
  lp += (noise() - lp) * 0.35;
  return lp * amplitude;
};

const beep = (time, start, freq = 1400, dur = 0.14, amplitude = 5200) => {
  if (time < start || time > start + dur) return 0;
  const local = time - start;
  const envelope = Math.sin((local / dur) * Math.PI);
  return Math.sin(local * Math.PI * 2 * freq) * envelope * amplitude;
};

// Muffled, unintelligible "speech": noise passed through a wandering
// amplitude envelope with word/phrase-like pauses. No tonal content, so it
// never resolves into anything a player could try to transcribe.
const mutteredSpeech = (time, start, end, amplitude = 1600) => {
  if (time < start || time > end) return 0;
  const local = time - start;
  const syllable = Math.max(0, Math.sin(local * Math.PI * 2 * 3.1)) ** 2;
  const phrase = 0.55 + 0.45 * Math.sin(local * Math.PI * 2 * 0.42);
  const pause = local % 2.6 > 2.15 ? 0.08 : 1; // brief breath between phrases
  return noise() * syllable * phrase * pause * amplitude;
};

// A laugh reads, procedurally, as noise with a fast, decaying tremolo —
// quicker and more irregular than the speech modulation above.
const laughLike = (time, start, end, amplitude = 1900) => {
  if (time < start || time > end) return 0;
  const local = time - start;
  const tremolo = Math.max(0, Math.sin(local * Math.PI * 2 * 7.5));
  const decay = 1 - local / (end - start);
  return noise() * tremolo * decay * amplitude;
};

const totalSeconds = 17;
const roomToneStart = totalSeconds - 4; // final 4s: plain, unmodulated tone
const length = seconds(totalSeconds);
const samples = new Array(length);

for (let i = 0; i < length; i += 1) {
  const t = i / RATE;
  let sample = lineHiss(420);

  sample += beep(t, 0.15, 1400, 0.14, 5200);
  sample += beep(t, 0.42, 1400, 0.14, 5200);

  if (t < roomToneStart) {
    sample += mutteredSpeech(t, 0.9, 6.4, 1500);
    sample += mutteredSpeech(t, 6.9, 10.6, 1500);
    sample += laughLike(t, 10.6, 12.1, 2000);
    sample += mutteredSpeech(t, 12.3, roomToneStart, 1300);
  }
  // Past roomToneStart: hiss only — the "[4 SECONDS OF LINE NOISE]" beat.

  samples[i] = sample;
}

const buffer = Buffer.alloc(44 + samples.length * 2);
buffer.write("RIFF", 0);
buffer.writeUInt32LE(buffer.length - 8, 4);
buffer.write("WAVE", 8);
buffer.write("fmt ", 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20);
buffer.writeUInt16LE(1, 22);
buffer.writeUInt32LE(RATE, 24);
buffer.writeUInt32LE(RATE * 2, 28);
buffer.writeUInt16LE(2, 32);
buffer.writeUInt16LE(16, 34);
buffer.write("data", 36);
buffer.writeUInt32LE(samples.length * 2, 40);
for (let i = 0; i < samples.length; i += 1) {
  const clamped = Math.max(-32768, Math.min(32767, Math.round(samples[i])));
  buffer.writeInt16LE(clamped, 44 + i * 2);
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, buffer);
console.log(
  `Generated ${path.relative(root, outPath)}: ${totalSeconds.toFixed(1)}s, mono, ${RATE} Hz`
);
