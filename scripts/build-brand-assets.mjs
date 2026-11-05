/**
 * Build site logo + favicon from public/logo/pasteur-plus-*@2x.png
 * Run: node scripts/build-brand-assets.mjs
 */
import sharp from "sharp";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const LOGO_DIR = join(ROOT, "public", "logo");
const PUBLIC = join(ROOT, "public");
const SURFACE = { r: 245, g: 239, b: 235, alpha: 1 }; // #F5EFEB
const BRAND = { r: 0x6b, g: 0x8f, b: 0xef };
const DARK_THRESHOLD = 72;

async function knockOutDark(inputPath) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (Math.max(r, g, b) <= DARK_THRESHOLD) {
      data[i + 3] = 0;
    }
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).trim({ threshold: 80 });
}

/** White wordmark on black (pasteur-plus-3) — use opaque alpha, not RGB (file is heavily compressed). */
async function extractWhiteWordmark(inputPath) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const ALPHA_MIN = 250;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < ALPHA_MIN) {
      data[i + 3] = 0;
      continue;
    }
    data[i] = BRAND.r;
    data[i + 1] = BRAND.g;
    data[i + 2] = BRAND.b;
    data[i + 3] = 255;
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).trim({ threshold: 1 });
}

async function buildHorizontalLogo(markPath, wordPath) {
  const markPng = await (await knockOutDark(markPath)).png().toBuffer();
  const wordPng = await (await extractWhiteWordmark(wordPath)).png().toBuffer();

  const markMeta = await sharp(markPng).metadata();
  const wordHeight = Math.round((markMeta.height ?? 0) * 0.52);
  const wordResized = await sharp(wordPng)
    .resize({ height: wordHeight, withoutEnlargement: false })
    .png()
    .toBuffer();
  const wordMeta = await sharp(wordResized).metadata();

  const gap = Math.round((markMeta.height ?? 0) * 0.14);
  const width = (markMeta.width ?? 0) + gap + (wordMeta.width ?? 0);
  const height = Math.max(markMeta.height ?? 0, wordMeta.height ?? 0);

  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: markPng,
        left: 0,
        top: Math.round((height - (markMeta.height ?? 0)) / 2),
      },
      {
        input: wordResized,
        left: (markMeta.width ?? 0) + gap,
        top: Math.round((height - (wordMeta.height ?? 0)) / 2),
      },
    ])
    .png()
    .toBuffer();
}

async function compositeOnSurface(pngBuffer, width) {
  const resized = await sharp(pngBuffer)
    .resize({ width, withoutEnlargement: false })
    .png()
    .toBuffer();

  const meta = await sharp(resized).metadata();
  const pad = Math.round((meta.width ?? 0) * 0.06);
  const canvasW = (meta.width ?? 0) + pad * 2;
  const canvasH = (meta.height ?? 0) + pad * 2;

  return sharp({
    create: {
      width: canvasW,
      height: canvasH,
      channels: 4,
      background: SURFACE,
    },
  })
    .composite([{ input: resized, left: pad, top: pad }])
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();
}

async function squareIcon(pngBuffer, size) {
  const inner = Math.round(size * 0.72);
  const mark = await sharp(pngBuffer)
    .resize({
      width: inner,
      height: inner,
      fit: "inside",
      withoutEnlargement: false,
    })
    .png()
    .toBuffer();

  const markMeta = await sharp(mark).metadata();
  const left = Math.round((size - (markMeta.width ?? 0)) / 2);
  const top = Math.round((size - (markMeta.height ?? 0)) / 2);

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: SURFACE,
    },
  })
    .composite([{ input: mark, left, top }])
    .png()
    .toBuffer();
}

async function main() {
  const markSrc = join(LOGO_DIR, "pasteur-plus-1@2x.png");
  const wordSrc = join(LOGO_DIR, "pasteur-plus-3@2x.png");

  const horizontalPng = await buildHorizontalLogo(markSrc, wordSrc);
  const markPng = await (await knockOutDark(markSrc)).png().toBuffer();

  await sharp(horizontalPng).png().toFile(join(PUBLIC, "logo.png"));

  const logoJpg = await compositeOnSurface(horizontalPng, 1400);
  await sharp(logoJpg).toFile(join(PUBLIC, "logo.jpg"));
  await sharp(logoJpg).toFile(join(PUBLIC, "brand", "pasteur-plus-logo.jpg"));

  for (const size of [192, 512]) {
    const buf = await squareIcon(markPng, size);
    await sharp(buf).jpeg({ quality: 90 }).toFile(join(PUBLIC, `icon-${size}.jpg`));
    await sharp(buf).png().toFile(join(PUBLIC, `icon-${size}.png`));
  }

  const icon32 = await squareIcon(markPng, 32);
  await sharp(icon32).png().toFile(join(PUBLIC, "icon.png"));

  const icon32B64 = icon32.toString("base64");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" role="img" aria-label="Pasteur Plus">
  <image href="data:image/png;base64,${icon32B64}" width="32" height="32"/>
</svg>
`;
  writeFileSync(join(PUBLIC, "icon.svg"), svg, "utf8");

  console.log("Brand assets written to public/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
