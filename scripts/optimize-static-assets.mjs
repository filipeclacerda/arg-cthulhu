import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import ffmpegPath from "ffmpeg-static";
import { spawn } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "public");
const imageThreshold = 100 * 1024;

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(async (entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  }))).flat();
}

function transcodeAudio(input, output) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, ["-y", "-i", input, "-c:a", "libvorbis", "-q:a", "4", output], { stdio: "ignore" });
    child.on("error", reject);
    child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`ffmpeg exited with ${code}`)));
  });
}

const files = await walk(publicDir);
const images = files.filter((file) => file.endsWith(".png"));
const audio = files.filter((file) => file.endsWith(".wav"));
const sourceFiles = (await walk(root)).filter((file) => /\.(ts|tsx|scss|md)$/.test(file));
const imageReplacements = new Map();

for (const input of images) {
  const stat = await fs.stat(input);
  if (stat.size < imageThreshold) continue;
  const output = input.replace(/\.png$/, ".webp");
  await sharp(input).webp({ quality: 86, effort: 6 }).toFile(output);
  imageReplacements.set(`/${path.relative(publicDir, input).replaceAll(path.sep, "/")}`, `/${path.relative(publicDir, output).replaceAll(path.sep, "/")}`);
}

for (const sourceFile of sourceFiles) {
  let source = await fs.readFile(sourceFile, "utf8");
  for (const [from, to] of imageReplacements) source = source.replaceAll(from, to);
  await fs.writeFile(sourceFile, source);
}

for (const input of images) {
  if (imageReplacements.has(`/${path.relative(publicDir, input).replaceAll(path.sep, "/")}`)) await fs.rm(input);
}

for (const input of audio) {
  await transcodeAudio(input, input.replace(/\.wav$/, ".ogg"));
}

console.log(`Optimized ${imageReplacements.size} images and ${audio.length} audio files.`);
