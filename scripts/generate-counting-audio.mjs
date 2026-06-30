import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourcePath = path.join(
  root,
  "public",
  "artifacts",
  "counting-recovered.wav"
);
const outputPath = path.join(root, "public", "artifacts", "counting.wav");

const source = fs.readFileSync(sourcePath);
const sourceChannels = source.readUInt16LE(22);
const sourceRate = source.readUInt32LE(24);
const sourceBits = source.readUInt16LE(34);
const sourceDataSize = source.readUInt32LE(40);

if (sourceBits !== 16 || sourceChannels < 1) {
  throw new Error("counting-recovered.wav must be 16-bit PCM.");
}

const outputRate = 11025;
const outputChannels = 2;
const durationSeconds = 4 * 60 + 11;
const frameCount = outputRate * durationSeconds;
const output = Buffer.alloc(44 + frameCount * outputChannels * 2);

output.write("RIFF", 0);
output.writeUInt32LE(output.length - 8, 4);
output.write("WAVE", 8);
output.write("fmt ", 12);
output.writeUInt32LE(16, 16);
output.writeUInt16LE(1, 20);
output.writeUInt16LE(outputChannels, 22);
output.writeUInt32LE(outputRate, 24);
output.writeUInt32LE(outputRate * outputChannels * 2, 28);
output.writeUInt16LE(outputChannels * 2, 32);
output.writeUInt16LE(16, 34);
output.write("data", 36);
output.writeUInt32LE(frameCount * outputChannels * 2, 40);

let seed = 0x1141998;
const noise = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 0xffffffff - 0.5;
};

for (let frame = 0; frame < frameCount; frame += 1) {
  const time = frame / outputRate;
  const tide =
    Math.sin(time * Math.PI * 2 * 47) * 360 +
    Math.sin(time * Math.PI * 2 * 53.7) * 230 +
    Math.sin(time * Math.PI * 2 * 0.083) * 500;
  const hiss = noise() * 410;
  const pulse =
    Math.sin(time * Math.PI * 2 * 1.333) > 0.985
      ? Math.sin(time * Math.PI * 2 * 740) * 800
      : 0;
  const left = Math.max(-32768, Math.min(32767, tide + hiss + pulse));
  const right = Math.max(
    -32768,
    Math.min(32767, tide * 0.72 + hiss * 1.15 - pulse * 0.25)
  );
  output.writeInt16LE(Math.round(left), 44 + frame * 4);
  output.writeInt16LE(Math.round(right), 46 + frame * 4);
}

const sourceFrames = sourceDataSize / (sourceChannels * 2);
const sourceMono = [];
for (
  let sourceFrame = 0;
  sourceFrame < sourceFrames;
  sourceFrame += Math.max(1, Math.round(sourceRate / outputRate))
) {
  let total = 0;
  for (let channel = 0; channel < sourceChannels; channel += 1) {
    total += source.readInt16LE(
      44 + (sourceFrame * sourceChannels + channel) * 2
    );
  }
  sourceMono.push(total / sourceChannels);
}
sourceMono.reverse();

for (const startSecond of [38, 101, 164, 226]) {
  const startFrame = startSecond * outputRate;
  for (
    let index = 0;
    index < sourceMono.length && startFrame + index < frameCount;
    index += 1
  ) {
    const offset = 44 + (startFrame + index) * 4;
    const ambient = output.readInt16LE(offset);
    const mixed = Math.max(
      -32768,
      Math.min(32767, ambient * 0.45 + sourceMono[index] * 0.9)
    );
    output.writeInt16LE(Math.round(mixed), offset);
  }
}

fs.writeFileSync(outputPath, output);
console.log(
  `Generated ${path.relative(root, outputPath)}: ${durationSeconds}s, stereo, ${outputRate} Hz`
);
