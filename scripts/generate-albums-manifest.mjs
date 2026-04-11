/**
 * Writes assets/js/albums-manifest.js from assets/data/albums.json (one line).
 * When local thumbnails exist, reads WebP dimensions and sets each image's
 * orientation ("h" = landscape tile, "v" = portrait tile); square images use "h".
 *
 * Run after editing albums.json: node scripts/generate-albums-manifest.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const jsonPath = path.join(root, "assets", "data", "albums.json");
const outPath = path.join(root, "assets", "js", "albums-manifest.js");

/** Deep-clone JSON-like values, omitting object keys that start with "_". */
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

function readUInt24LE(buf, offset) {
  return buf[offset] | (buf[offset + 1] << 8) | (buf[offset + 2] << 16);
}

/**
 * Parse VP8 / VP8L / VP8X from a WebP file buffer (RIFF WEBP container).
 */
function readWebpDimensions(buf) {
  if (buf.length < 16) return null;
  if (buf.toString("ascii", 0, 4) !== "RIFF") return null;
  if (buf.toString("ascii", 8, 12) !== "WEBP") return null;

  let offset = 12;
  while (offset + 8 <= buf.length) {
    const id = buf.toString("ascii", offset, offset + 4);
    const chunkSize = buf.readUInt32LE(offset + 4);
    const payload = offset + 8;
    if (chunkSize < 0 || payload > buf.length) return null;
    const end = Math.min(buf.length, payload + chunkSize);

    if (id === "VP8X" && chunkSize >= 10) {
      const w = 1 + readUInt24LE(buf, payload + 4);
      const h = 1 + readUInt24LE(buf, payload + 7);
      if (w > 0 && h > 0) return { width: w, height: h };
    }

    if (id === "VP8 " && chunkSize >= 10) {
      const p = buf.subarray(payload, end);
      if (
        p.length >= 10 &&
        p[3] === 0x9d &&
        p[4] === 0x01 &&
        p[5] === 0x2a
      ) {
        const w = p.readUInt16LE(6) & 0x3fff;
        const h = p.readUInt16LE(8) & 0x3fff;
        if (w > 0 && h > 0) return { width: w, height: h };
      }
      if (p.length >= 10 && p[0] !== 0x2f) {
        const w = p.readUInt16LE(6) & 0x3fff;
        const h = p.readUInt16LE(8) & 0x3fff;
        if (w > 0 && h > 0) return { width: w, height: h };
      }
    }

    if (id === "VP8L" && chunkSize >= 5) {
      const p = buf.subarray(payload, end);
      if (p.length >= 5) {
        const w = 1 + (((p[2] & 0x3f) << 8) | p[1]);
        const h =
          1 +
          (((p[4] & 0xf) << 10) | (p[3] << 2) | ((p[2] & 0xc0) >> 6));
        if (w > 0 && h > 0) return { width: w, height: h };
      }
    }

    const padded = chunkSize + (chunkSize & 1);
    offset = payload + padded;
  }
  return null;
}

function orientationFromDimensions(width, height) {
  if (height > width) return "v";
  return "h";
}

function pad3(n) {
  return String(n).padStart(3, "0");
}

function parseImageEntry(entry) {
  if (typeof entry === "number" && Number.isInteger(entry)) {
    return { file: entry };
  }
  throw new Error(
    'Each images[] entry must be an integer filename index, got: ' +
      JSON.stringify(entry)
  );
}

function thumbnailPath(rootDir, thumbBase, albumId, fileIndex) {
  const rel = path.join(
    thumbBase.replace(/\//g, path.sep),
    albumId,
    "thumbnail",
    pad3(fileIndex) + ".webp"
  );
  return path.join(rootDir, rel);
}

function applyOrientationsFromThumbnails(data) {
  const thumbBase = data.photoPaths?.thumbnailBase || "images/photos";
  let detected = 0;
  let fallback = 0;
  let unreadable = 0;

  const out = JSON.parse(JSON.stringify(data));

  for (const album of out.albums) {
    if (!Array.isArray(album.images)) continue;

    album.images = album.images.map((entry, idx) => {
      const { file } = parseImageEntry(entry);
      const fp = thumbnailPath(root, thumbBase, album.id, file);

      if (fs.existsSync(fp)) {
        let dims;
        try {
          dims = readWebpDimensions(fs.readFileSync(fp));
        } catch {
          dims = null;
        }
        if (dims) {
          detected++;
          const o = orientationFromDimensions(dims.width, dims.height);
          return { file, orientation: o };
        }
        unreadable++;
        console.warn(
          "Album " +
            album.id +
            " image " +
            file +
            ": could not read WebP dimensions; defaulting orientation to \"h\"."
        );
      } else {
        fallback++;
        console.warn(
          "Album " +
            album.id +
            " entry #" +
            idx +
            " (file " +
            file +
            "): no local thumbnail; defaulting orientation to \"h\". Expected " +
            path.relative(root, fp)
        );
      }

      return { file, orientation: "h" };
    });
  }

  console.log(
    "Orientations: " +
      detected +
      " from pixels; " +
      fallback +
      " defaulted (missing thumbnail)" +
      (unreadable ? "; " + unreadable + " unreadable WebP" : "")
  );

  return out;
}

const raw = fs.readFileSync(jsonPath, "utf8");
const data = stripUnderscoreKeys(JSON.parse(raw));
const merged = applyOrientationsFromThumbnails(data);

const body =
  "window.__ALBUMS_MANIFEST__=" + JSON.stringify(merged) + ";\n";

fs.writeFileSync(outPath, body, "utf8");
console.log("Wrote", path.relative(root, outPath));
