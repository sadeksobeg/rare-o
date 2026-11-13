/**
 * Contact sheets: full-viewport shots scaled down (contain), no zoom crop.
 */
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "docs/shipping/s2b");
const CELL_W = 720;
const CELL_H = 480;
const PAD = 12;
const LABEL_H = 36;

const sheets = [
  {
    out: "s2b-contact-shipping.png",
    title: "/shipping",
    cells: [
      ["s2b-shipping-page-light-1440-ar.png", "light · 1440"],
      ["s2b-shipping-page-dark-1440-ar.png", "dark · 1440"],
      ["s2b-shipping-page-light-390-ar.png", "light · 390"],
      ["s2b-shipping-page-dark-390-ar.png", "dark · 390"],
    ],
  },
  {
    out: "s2b-contact-pdp.png",
    title: "PDP estimator",
    cells: [
      ["s2b-pdp-estimator-light-1440-ar.png", "light · 1440"],
      ["s2b-pdp-estimator-dark-1440-ar.png", "dark · 1440"],
      ["s2b-pdp-estimator-light-390-ar.png", "light · 390"],
      ["s2b-pdp-estimator-dark-390-ar.png", "dark · 390"],
    ],
  },
  {
    out: "s2b-contact-request.png",
    title: "/request DE",
    cells: [
      ["s2b-request-de-light-1440-ar.png", "light · 1440"],
      ["s2b-request-de-dark-1440-ar.png", "dark · 1440"],
      ["s2b-request-de-light-390-ar.png", "light · 390"],
      ["s2b-request-de-dark-390-ar.png", "dark · 390"],
    ],
  },
  {
    out: "s2b-contact-lb-inquiry.png",
    title: "LB inquiry",
    cells: [
      ["s2b-request-lb-inquiry-light-1440-ar.png", "light · 1440"],
      ["s2b-request-lb-inquiry-dark-1440-ar.png", "dark · 1440"],
      ["s2b-request-lb-inquiry-light-390-ar.png", "light · 390"],
      ["s2b-request-lb-inquiry-dark-390-ar.png", "dark · 390"],
    ],
  },
  {
    out: "s2b-contact-admin-sim.png",
    title: "Admin customer preview JO",
    cells: [
      ["s2b-sim-preview-jo-light-1440-ar.png", "light · 1440"],
      ["s2b-sim-preview-jo-dark-1440-ar.png", "dark · 1440"],
      ["s2b-sim-preview-jo-light-390-ar.png", "light · 390"],
      ["s2b-sim-preview-jo-dark-390-ar.png", "dark · 390"],
    ],
  },
];

async function cell(file, label) {
  const src = path.join(DIR, file);
  if (!fs.existsSync(src)) throw new Error(`missing ${file}`);
  const resized = await sharp(src)
    .resize(CELL_W, CELL_H, {
      fit: "contain",
      background: { r: 26, g: 21, b: 24, alpha: 1 },
      position: "top",
    })
    .png()
    .toBuffer();
  const svg = Buffer.from(
    `<svg width="${CELL_W}" height="${LABEL_H}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#111"/>
      <text x="12" y="24" fill="#f5efe6" font-size="15" font-family="Segoe UI, sans-serif">${label}</text>
    </svg>`
  );
  return sharp({
    create: {
      width: CELL_W,
      height: CELL_H + LABEL_H,
      channels: 3,
      background: "#111",
    },
  })
    .composite([
      { input: svg, top: 0, left: 0 },
      { input: resized, top: LABEL_H, left: 0 },
    ])
    .png()
    .toBuffer();
}

for (const sheet of sheets) {
  const bufs = [];
  for (const [file, label] of sheet.cells) {
    bufs.push(await cell(file, `${sheet.title} · ${label}`));
  }
  const tileH = CELL_H + LABEL_H;
  const W = CELL_W * 2 + PAD * 3;
  const H = tileH * 2 + PAD * 3;
  await sharp({
    create: { width: W, height: H, channels: 3, background: "#1a1518" },
  })
    .composite([
      { input: bufs[0], top: PAD, left: PAD },
      { input: bufs[1], top: PAD, left: PAD * 2 + CELL_W },
      { input: bufs[2], top: PAD * 2 + tileH, left: PAD },
      { input: bufs[3], top: PAD * 2 + tileH, left: PAD * 2 + CELL_W },
    ])
    .png()
    .toFile(path.join(DIR, sheet.out));
  console.log("wrote", sheet.out);
}
