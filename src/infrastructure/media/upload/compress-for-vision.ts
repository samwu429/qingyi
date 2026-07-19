import sharp from "sharp";

// Shrink screenshots before Groq vision so request / fetch payloads stay under
// Groq's ~20MB ceiling (and free-tier practical limits). Long phone PNGs often
// exceed this even when the chat request only carries a public media URL.
// 识图前压缩截图，避免 Groq 请求/拉图超限；长截图 PNG 即便走外链也可能过大。

const MAX_EDGE = 1600;
const TARGET_BYTES = 1_200_000;
const MIN_QUALITY = 45;

export async function compressImageForVision(
  file: File,
  mime: string,
): Promise<{ file: File; mime: string }> {
  if (!mime.startsWith("image/") || mime === "image/svg+xml") {
    return { file, mime };
  }

  // Tiny files still get a dimension cap so OCR stays sharp without huge pixels.
  // 小文件也限制边长，避免超高分辨率浪费 token。
  const input = Buffer.from(await file.arrayBuffer());

  try {
    let quality = 82;
    let output = await encodeJpeg(input, quality);

    while (output.byteLength > TARGET_BYTES && quality > MIN_QUALITY) {
      quality -= 12;
      output = await encodeJpeg(input, quality);
    }

    if (
      output.byteLength >= file.size &&
      file.size <= TARGET_BYTES &&
      mime === "image/jpeg"
    ) {
      return { file, mime };
    }

    const name = file.name.replace(/\.[^.]+$/i, "") || "screenshot";
    const bytes = Uint8Array.from(output);
    return {
      file: new File([bytes], `${name}.jpg`, { type: "image/jpeg" }),
      mime: "image/jpeg",
    };
  } catch (error) {
    console.error("compressImageForVision failed, using original", error);
    return { file, mime };
  }
}

async function encodeJpeg(input: Buffer, quality: number): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();
}
