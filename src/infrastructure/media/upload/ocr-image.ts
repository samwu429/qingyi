import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { createWorker, PSM, type Worker } from "tesseract.js";

// Fast local OCR for admin screenshots. Tuned for Douyin-style metric UIs:
// smaller pixels, Chinese-only LSTM, sparse page segmentation.
// 后台截图快速 OCR：缩小像素、仅简体中文、稀疏版面模式，显著缩短识别时间。

/** Cap longest edge; stats screenshots stay readable well below 2k. */
const MAX_EDGE = 1280;
/** Hard cap total pixels (~0.9MP) so tall screenshots do not crawl. */
const MAX_PIXELS = 900_000;
const CACHE_PATH =
  process.env.TESS_CACHE_PATH || path.join(tmpdir(), "tesseract-cache");

let workerPromise: Promise<Worker> | null = null;

async function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      // chi_sim alone is much faster than chi_sim+eng; digits still OCR fine.
      // 只用简体中文比中英双语快很多，数字仍可识别。
      const worker = await createWorker("chi_sim", 1, {
        cachePath: CACHE_PATH,
      });
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SPARSE_TEXT,
      });
      return worker;
    })().catch((error) => {
      workerPromise = null;
      throw error;
    });
  }
  return workerPromise;
}

/** Preload language data / worker so the first real screenshot is faster. */
export async function warmOcrWorker(): Promise<void> {
  await getWorker();
}

async function prepareForOcr(file: File): Promise<Buffer> {
  const input = Buffer.from(await file.arrayBuffer());
  const meta = await sharp(input).rotate().metadata();
  let width = meta.width || MAX_EDGE;
  let height = meta.height || MAX_EDGE;

  const edgeScale = Math.min(1, MAX_EDGE / Math.max(width, height));
  width = Math.max(1, Math.round(width * edgeScale));
  height = Math.max(1, Math.round(height * edgeScale));

  const pixelScale = Math.min(
    1,
    Math.sqrt(MAX_PIXELS / Math.max(1, width * height)),
  );
  width = Math.max(1, Math.round(width * pixelScale));
  height = Math.max(1, Math.round(height * pixelScale));

  // JPEG is enough for UI text OCR and much cheaper than PNG encode/decode.
  // JPEG 足够识别界面文字，编码比 PNG 轻。
  return sharp(input)
    .rotate()
    .resize({ width, height, fit: "fill" })
    .grayscale()
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
}

export async function ocrImageToText(file: File): Promise<string> {
  const prepared = await prepareForOcr(file);
  const worker = await getWorker();
  const result = await worker.recognize(prepared);
  return (result.data.text || "")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
