import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const baseUrl = (process.env.CHETESAI_BASE_URL || "https://www.chetesaifitness.com").replace(/\/$/, "");
const outputDirectory = path.resolve(process.argv[2] || "exports/chetesai-pinterest");
const imageDirectory = path.join(outputDirectory, "imagenes");

function csvValue(value) {
  const text = String(value ?? "").replace(/\r?\n/g, " ").trim();
  return `"${text.replaceAll('"', '""')}"`;
}

async function fetchChecked(url) {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response;
}

async function exportPin(pin) {
  const response = await fetchChecked(pin.imageUrl);
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("image/png")) throw new Error(`Formato inesperado para ${pin.code}: ${contentType}`);

  const filename = `${pin.code}_${pin.title.split(" | ")[0]}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 110) + ".png";

  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(path.join(imageDirectory, filename), bytes);
  return { ...pin, filename, sizeBytes: bytes.length };
}

async function runPool(items, concurrency, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const index = next++;
      results[index] = await worker(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run));
  return results;
}

await mkdir(imageDirectory, { recursive: true });
const catalogResponse = await fetchChecked(`${baseUrl}/api/pinterest/catalog`);
const catalog = await catalogResponse.json();
if (!catalog.ok || !Array.isArray(catalog.pins)) throw new Error("El catálogo Pinterest no tiene el formato esperado");
if (catalog.pins.length !== 137) throw new Error(`Se esperaban 137 ejercicios oficiales y se recibieron ${catalog.pins.length}`);

const exported = await runPool(catalog.pins, 6, exportPin);
const header = ["codigo", "archivo", "titulo", "descripcion", "url_destino", "url_imagen", "tablero_sugerido", "texto_alternativo"];
const rows = exported.map((pin) => [
  pin.code,
  pin.filename,
  pin.title,
  pin.description,
  pin.destinationUrl,
  pin.imageUrl,
  `Ejercicios · ${pin.group.replaceAll("_", " ")}`,
  `Guía visual Chetesaí del ejercicio ${pin.title.split(" | ")[0]}`,
]);
const csv = [header, ...rows].map((row) => row.map(csvValue).join(",")).join("\n") + "\n";

await writeFile(path.join(outputDirectory, "manifest_pinterest.csv"), `\uFEFF${csv}`, "utf8");
await writeFile(path.join(outputDirectory, "catalogo.json"), JSON.stringify({ generatedAt: new Date().toISOString(), baseUrl, count: exported.length, pins: exported }, null, 2) + "\n", "utf8");
await writeFile(
  path.join(outputDirectory, "LEEME.txt"),
  [
    "BIBLIOTECA PINTEREST · CHETESAÍ FITNESS+",
    "",
    "Contenido:",
    "- 137 imágenes PNG en formato vertical 1000 × 1500 px.",
    "- manifest_pinterest.csv con título, descripción, tablero sugerido y URL de destino.",
    "- catalogo.json como copia estructurada para automatizaciones.",
    "",
    "Cada imagen está asociada a la ficha pública del ejercicio correspondiente en chetesaifitness.com.",
    "No sustituye la valoración ni la prescripción individual de un profesional.",
    "",
  ].join("\n"),
  "utf8"
);

console.log(JSON.stringify({ ok: true, count: exported.length, outputDirectory }, null, 2));
