import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { createWorker, type Worker } from "tesseract.js";

// Local OCR for admin-assistant screenshots. Converts images to plain text on
// our server so Groq only receives text (avoids vision payload / size limits).
// 后台助手截图在本机 OCR 成文字再交给 Groq，避免视觉接口体积与外链拉图问题。

const MAX_EDGE = 2000;
const CACHE_PATH =
  process.env.TESS_CACHE_PATH || path.join(tmpdir(), "tesseract-cache");

let workerPromise: Promise<Worker> | null = null;

async function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = createWorker("chi_sim+eng", 1, {
      cachePath: CACHE_PATH,
    }).catch((error) => {
      workerPromise = null;
      throw error;
    });
  }
  return workerPromise;
}

async function prepareForOcr(file: File): Promise<Buffer> {
  const input = Buffer.from(await file.arrayBuffer());
  return sharp(input)
    .rotate()
    .resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .grayscale()
    .normalize()
    .png()
    .toBuffer();
}

export async function ocrImageToText(file: File): Promise<string> {
  const prepared = await prepareForOcr(file);
  const worker = await getWorker();
  const result = await worker.recognize(prepared);
  const text = (result.data.text || "")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text;
}
