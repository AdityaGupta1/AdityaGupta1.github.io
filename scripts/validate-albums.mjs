/**
 * Validates assets/data/albums.json structure and optional on-disk thumbnails.
 * Usage: node scripts/validate-albums.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const jsonPath = path.join(root, "assets", "data", "albums.json");

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

function warn(msg) {
  console.warn(msg);
}

const raw = fs.readFileSync(jsonPath, "utf8");
let data;
try {
  data = JSON.parse(raw);
} catch (e) {
  fail("Invalid JSON: " + e.message);
}

if (!data || typeof data !== "object") {
  fail("Root must be an object");
}

if (!Array.isArray(data.albums) || data.albums.length === 0) {
  fail("Missing or empty albums array");
}

if (!data.photoPaths || typeof data.photoPaths !== "object") {
  fail("Missing photoPaths object");
}

const thumbBase = data.photoPaths.thumbnailBase || "images/photos";
const hdBase = data.photoPaths.hdBase;
if (!hdBase || typeof hdBase !== "string") {
  fail("photoPaths.hdBase must be a non-empty string");
}

const featuredIds = Array.isArray(data.featuredIds) ? data.featuredIds : [];
const ids = new Set();

for (const album of data.albums) {
  if (!album.id || typeof album.id !== "string") {
    fail("Album missing string id: " + JSON.stringify(album));
  }
  if (ids.has(album.id)) {
    fail("Duplicate album id: " + album.id);
  }
  ids.add(album.id);

  if (!album.title || !album.date) {
    warn("Album " + album.id + ": missing title or date");
  }

  if (typeof album.cover !== "number" || !Number.isInteger(album.cover)) {
    fail("Album " + album.id + ": cover must be an integer");
  }

  if (!Array.isArray(album.images) || album.images.length === 0) {
    fail("Album " + album.id + ": images must be a non-empty array");
  }

  const imageFiles = new Set();
  for (const entry of album.images) {
    if (typeof entry !== "number" || !Number.isInteger(entry)) {
      fail(
        "Album " +
          album.id +
          ': each images[] entry must be an integer (filename index), got: ' +
          JSON.stringify(entry)
      );
    }
    imageFiles.add(entry);
  }

  if (!imageFiles.has(album.cover)) {
    warn(
      "Album " +
        album.id +
        ": cover index " +
        album.cover +
        " is not listed in images (may still be valid if intentional)"
    );
  }
}

for (const fid of featuredIds) {
  if (!ids.has(fid)) {
    fail("featuredIds references unknown album id: " + fid);
  }
}

const imagesRoot = path.join(root, thumbBase.replace(/\//g, path.sep));
if (fs.existsSync(imagesRoot)) {
  for (const album of data.albums) {
    const thumbDir = path.join(
      imagesRoot,
      album.id,
      "thumbnail"
    );
    if (!fs.existsSync(thumbDir)) {
      warn("Missing thumbnail dir: " + path.relative(root, thumbDir));
      continue;
    }
    const pad = (n) => String(n).padStart(3, "0");
    const coverName = pad(album.cover) + ".webp";
    const coverPath = path.join(thumbDir, coverName);
    if (!fs.existsSync(coverPath)) {
      warn("Missing cover file: " + path.relative(root, coverPath));
    }
    for (const file of album.images) {
      const fp = path.join(thumbDir, pad(file) + ".webp");
      if (!fs.existsSync(fp)) {
        warn("Missing thumbnail: " + path.relative(root, fp));
      }
    }
  }
} else {
  warn(
    "Skipping file checks (no local folder): " +
      path.relative(root, imagesRoot)
  );
}

console.log("albums.json OK:", path.relative(root, jsonPath));
console.log(
  "If you use local file:// preview, run: node scripts/sync-albums-manifest.mjs after editing JSON."
);
