/**
 * Converts loose photos into album WebP pairs (HD + thumbnail) under
 * images/photos/<album-id>/hd/ and .../thumbnail/, matching assets/js/photos.js
 * and the _hd / _thumbnail notes in assets/data/albums.json:
 *   HD:         2560px long side, WebP lossless
 *   Thumbnail:  960px long side, WebP quality 88
 *
 * Requires: npm install (see package.json for sharp)
 *
 * Usage:
 *   node scripts/import-album-photos.mjs <source-folder> <album-id>
 *
 * Example:
 *   node scripts/import-album-photos.mjs "C:\pics\fairbanks-dump" fairbanks
 *
 * New files are numbered ###.webp after the highest index already present in
 * either hd/ or thumbnail/ (starts at 001 for a new album).
 *
 * Optional flags:
 *   --dry-run   Print planned outputs only
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const jsonPath = path.join(root, "assets", "data", "albums.json");

const HD_LONG = 2560;
const THUMB_LONG = 960;
const THUMB_QUALITY = 88;

const IMAGE_EXT = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".tif",
  ".tiff",
  ".avif",
  ".heic",
  ".heif",
]);

function stripUnderscoreKeys(value) {
  if (value === null || typeof value !== "object") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(stripUnderscoreKeys);
  }
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (k.startsWith("_")) continue;
    out[k] = stripUnderscoreKeys(v);
  }
  return out;
}

function pad3(n) {
  return String(n).padStart(3, "0");
}

function parseArgs(argv) {
  const rest = argv.slice(2).filter((a) => a !== "--dry-run");
  const dryRun = argv.includes("--dry-run");
  if (rest.length < 2) {
    console.error(
      "Usage: node scripts/import-album-photos.mjs <source-folder> <album-id> [--dry-run]"
    );
    process.exit(1);
  }
  const sourceDir = path.resolve(rest[0]);
  const albumId = rest[1];
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/i.test(albumId)) {
    console.error(
      "album-id should be kebab-case letters/numbers/hyphens (e.g. fairbanks, laguna-seca)."
    );
    process.exit(1);
  }
  return { sourceDir, albumId: albumId.toLowerCase(), dryRun };
}

function listSourceImages(dir) {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    console.error("Source folder does not exist or is not a directory:", dir);
    process.exit(1);
  }
  const names = fs.readdirSync(dir);
  const files = names
    .filter((n) => {
      const ext = path.extname(n).toLowerCase();
      return IMAGE_EXT.has(ext) && fs.statSync(path.join(dir, n)).isFile();
    })
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  return files.map((n) => path.join(dir, n));
}

function maxExistingIndex(thumbDir, hdDir) {
  let max = 0;
  for (const dir of [thumbDir, hdDir]) {
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      const m = /^(\d{3})\.webp$/i.exec(name);
      if (m) {
        const n = parseInt(m[1], 10);
        if (n > max) max = n;
      }
    }
  }
  return max;
}

async function main() {
  const { sourceDir, albumId, dryRun } = parseArgs(process.argv);

  let thumbBase = "images/photos";
  if (fs.existsSync(jsonPath)) {
    try {
      const raw = fs.readFileSync(jsonPath, "utf8");
      const data = stripUnderscoreKeys(JSON.parse(raw));
      thumbBase = data.photoPaths?.thumbnailBase || thumbBase;
    } catch {
      // keep default
    }
  }

  const imagesRoot = path.join(root, thumbBase.replace(/\//g, path.sep));
  const albumRoot = path.join(imagesRoot, albumId);
  const thumbOutDir = path.join(albumRoot, "thumbnail");
  const hdOutDir = path.join(albumRoot, "hd");

  const inputs = listSourceImages(sourceDir);
  if (inputs.length === 0) {
    console.error("No supported images found in", sourceDir);
    process.exit(1);
  }

  let sharp;
  try {
    ({ default: sharp } = await import("sharp"));
  } catch (e) {
    console.error(
      'Could not load "sharp". From the repo root run: npm install\n',
      e.message || e
    );
    process.exit(1);
  }

  let next = maxExistingIndex(thumbOutDir, hdOutDir) + 1;

  if (!dryRun) {
    fs.mkdirSync(thumbOutDir, { recursive: true });
    fs.mkdirSync(hdOutDir, { recursive: true });
  }

  console.log(
    (dryRun ? "[dry-run] " : "") +
      "Album: " +
      albumId +
      " | " +
      inputs.length +
      " file(s) → " +
      path.relative(root, albumRoot) +
      " (starting at " +
      pad3(next) +
      ".webp)"
  );

  for (const inputPath of inputs) {
    const idx = pad3(next);
    const relThumb = path.join(thumbBase, albumId, "thumbnail", idx + ".webp");
    const relHd = path.join(thumbBase, albumId, "hd", idx + ".webp");
    const outThumb = path.join(thumbOutDir, idx + ".webp");
    const outHd = path.join(hdOutDir, idx + ".webp");

    console.log(" ", path.basename(inputPath), "→", relThumb, "+", relHd);

    if (dryRun) {
      next++;
      continue;
    }

    const resizeHd = {
      width: HD_LONG,
      height: HD_LONG,
      fit: "inside",
      withoutEnlargement: true,
    };
    const resizeThumb = {
      width: THUMB_LONG,
      height: THUMB_LONG,
      fit: "inside",
      withoutEnlargement: true,
    };

    await sharp(inputPath)
      .rotate()
      .resize(resizeHd)
      .webp({ lossless: true })
      .toFile(outHd);

    await sharp(inputPath)
      .rotate()
      .resize(resizeThumb)
      .webp({ quality: THUMB_QUALITY })
      .toFile(outThumb);

    next++;
  }

  console.log(
    "\nNext: add or update the album in assets/data/albums.json, then run:\n" +
      "  node scripts/generate-albums-manifest.mjs"
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
