/**
 * Extract transparent hero cutout from editorial/instrument-dark.jpg (#5).
 * Dark studio backdrop → alpha; keep the oud (+ subtle stand contact).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "public/brand/editorial/instrument-dark.jpg");
const OUT = path.join(ROOT, "public/brand/hero-oud-instrument.png");

async function main() {
  const { data, info } = await sharp(SRC)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  let minX = width,
    minY = height,
    maxX = 0,
    maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // Charcoal studio bg is cool/dark; keep warmer wood + lit face
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const maxc = Math.max(r, g, b);
      const minc = Math.min(r, g, b);
      const sat = maxc - minc;
      const isBg =
        lum < 42 ||
        (lum < 58 && sat < 18 && b >= g - 4) ||
        (lum < 70 && sat < 12 && Math.abs(r - g) < 8 && Math.abs(g - b) < 10);

      if (isBg) {
        data[i + 3] = 0;
      } else {
        // Soft edge: fade very dark fringe
        if (lum < 55 && sat < 22) {
          data[i + 3] = Math.min(255, Math.round(((lum - 30) / 25) * 255));
        }
        if (data[i + 3] > 20) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }
  }

  const pad = 8;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);
  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;

  await sharp(data, { raw: { width, height, channels } })
    .extract({ left: minX, top: minY, width: cropW, height: cropH })
    .png()
    .toFile(OUT);

  const stat = fs.statSync(OUT);
  console.log(
    JSON.stringify({
      out: OUT,
      crop: { minX, minY, cropW, cropH },
      bytes: stat.size,
    })
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
