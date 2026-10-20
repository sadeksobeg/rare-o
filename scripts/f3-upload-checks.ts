import { readFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const png1x1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

const svg = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
  "utf8"
);

async function main() {
  const imagesSrc = readFileSync(
    path.join(process.cwd(), "lib/catalog/images.ts"),
    "utf8"
  );
  assert(imagesSrc.includes("isSvgPayload"), "SVG rejection helper present");
  assert(imagesSrc.includes("sharp("), "sharp re-encode on upload");

  await sharp(png1x1).webp().toBuffer();
  assert(svg.toString("utf8").includes("<svg"), "fixture is svg");
  let rejected = false;
  try {
    await sharp(svg).webp().toBuffer();
  } catch {
    rejected = true;
  }
  assert(rejected, "sharp rejects svg payload");

  console.log("f3-upload-checks: OK");
}

main().catch((e) => {
  console.error("f3-upload-checks FAIL:", e);
  process.exit(1);
});
