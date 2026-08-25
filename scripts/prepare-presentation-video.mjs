import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const chunksDirectory = path.join(root, ".video-publish");
const outputPath = path.join(root, "public", "brand", "chetesai-presentacion.mp4");

const chunkNames = (await readdir(chunksDirectory))
  .filter((name) => /^part\d+\.b64$/.test(name))
  .sort();

if (chunkNames.length === 0) {
  throw new Error("No se encontraron segmentos del vídeo de presentación.");
}

const chunks = await Promise.all(
  chunkNames.map((name) => readFile(path.join(chunksDirectory, name), "utf8")),
);
const encodedVideo = chunks.join("").replace(/\s/g, "");
const video = Buffer.from(encodedVideo, "base64");

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, video);

console.log(
  `Vídeo de presentación preparado: ${video.byteLength} bytes en ${chunkNames.length} segmentos.`,
);
