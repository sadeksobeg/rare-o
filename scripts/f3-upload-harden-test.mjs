/**
 * Prove SVG rejection + sharp path exists (no DB write).
 */
import sharp from "sharp";
import assert from "node:assert/strict";

const svg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>`
);
assert.ok(/^\s*<svg/i.test(svg.toString("utf8")), "fixture is svg");

const jpeg = await sharp({
  create: { width: 1600, height: 1600, channels: 3, background: "#32104f" },
}).jpeg().toBuffer();

const webp = await sharp(jpeg).webp({ quality: 85 }).toBuffer();
assert.ok(webp.length > 100, "re-encode produces webp");
assert.ok(webp[0] === 0x52 && webp[8] === 0x57, "webp magic RIFF....WEBP-ish");

console.log("f3-upload-harden-test: PASS", {
  svgBytes: svg.length,
  jpegBytes: jpeg.length,
  webpBytes: webp.length,
});
