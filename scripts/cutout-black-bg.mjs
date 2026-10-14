/**
 * Cut solid/near-black studio backgrounds → transparent PNG.
 * Usage: node scripts/cutout-black-bg.mjs <src> <dest.png> [lumThreshold=28]
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcArg = process.argv[2];
const destArg = process.argv[3];
const lumMax = Number(process.argv[4] ?? 28);

if (!srcArg || !destArg) {
  console.error(
    "Usage: node scripts/cutout-black-bg.mjs <src> <dest.png> [lumThreshold]"
  );
  process.exit(1);
}

const SRC = path.isAbsolute(srcArg) ? srcArg : path.join(ROOT, srcArg);
const OUT = path.isAbsolute(destArg) ? destArg : path.join(ROOT, destArg);

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

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const maxc = Math.max(r, g, b);
    const minc = Math.min(r, g, b);
    const sat = maxc - minc;

    // Pure / near-black studio void
    const isBg = lum <= lumMax || (lum < lumMax + 14 && sat < 10 && maxc < 48);

    if (isBg) {
      data[i + 3] = 0;
    } else {
      // Soft fringe on very dark edge pixels
      if (lum < lumMax + 18 && sat < 16) {
        const t = Math.max(0, Math.min(1, (lum - lumMax) / 18));
        data[i + 3] = Math.round(t * 255);
      }
      const px = (i / channels) % width;
      const py = Math.floor(i / channels / width);
      if (data[i + 3] > 24) {
        if (px < minX) minX = px;
        if (py < minY) minY = py;
        if (px > maxX) maxX = px;
        if (py > maxY) maxY = py;
      }
    }
  }

  const pad = 6;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);

  await sharp(data, { raw: { width, height, channels } })
    .extract({
      left: minX,
      top: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    })
    .png()
    .toFile(OUT);

  console.log(
    JSON.stringify({
      out: path.relative(ROOT, OUT),
      crop: { minX, minY, w: maxX - minX + 1, h: maxY - minY + 1 },
      lumMax,
    })
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
