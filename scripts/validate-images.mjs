/**
 * Validates all presentation image assets.
 *
 * Checks:
 *  - File exists for every path in lib/content/images.ts
 *  - No duplicate files (by MD5 hash)
 *  - Correct extension matches actual format (magic bytes)
 *  - No corrupted / zero-byte files
 *  - No unsupported formats
 *  - No PNG with JPEG internals (or vice versa)
 *
 * Usage: node scripts/validate-images.mjs
 */

import { readFileSync, statSync } from "node:fs";
import { resolve, join, relative } from "node:path";
import { createHash } from "node:crypto";

const PUBLIC_DIR = resolve(import.meta.dirname, "..", "public");

/** Walk images.ts to extract all image paths programmatically */
function extractImagePaths(obj, prefix = "") {
  const paths = [];
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string" && value.startsWith("/images/")) {
      paths.push({ key: prefix ? `${prefix}.${key}` : key, path: value });
    } else if (typeof value === "object" && value !== null) {
      paths.push(...extractImagePaths(value, prefix ? `${prefix}.${key}` : key));
    }
  }
  return paths;
}

// Dynamically import images.ts
const imagesModule = await import("../lib/content/images.ts");
const imagePaths = extractImagePaths(imagesModule.images);

console.log(`\n  Validating ${imagePaths.length} presentation images...\n`);

let errors = 0;
const hashes = new Map(); // hash -> [keys]

const SUPPORTED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
const JPEG_MAGIC = Buffer.from([0xff, 0xd8]);
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
const WEBP_MAGIC = Buffer.from([0x52, 0x49, 0x46, 0x46]); // RIFF

function detectFormat(buffer) {
  if (buffer.length < 4) return "unknown";
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return "jpeg";
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return "png";
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) return "webp";
  return "unknown";
}

for (const { key, path } of imagePaths) {
  const ext = path.split(".").pop()?.toLowerCase();
  // path is like "/images/homepage/hero.jpg" → resolve against PUBLIC_DIR
  const filePath = join(PUBLIC_DIR, path);

  // 1. File exists
  let stat;
  try {
    stat = statSync(filePath);
  } catch {
    console.error(`  FAIL [missing] ${key} → ${path}`);
    errors++;
    continue;
  }

  // 2. Not zero-byte
  if (stat.size === 0) {
    console.error(`  FAIL [zero-byte] ${key} → ${path}`);
    errors++;
    continue;
  }

  // 3. Supported extension
  if (!SUPPORTED_EXTENSIONS.has(`.${ext}`)) {
    console.error(`  FAIL [unsupported-ext] ${key} → ${path} (.${ext})`);
    errors++;
    continue;
  }

  // 4. Read and check format
  let buffer;
  try {
    buffer = readFileSync(filePath, { flag: "r" });
  } catch {
    console.error(`  FAIL [corrupt] ${key} → ${path} (cannot read file)`);
    errors++;
    continue;
  }

  // 5. Extension matches actual format
  const actualFormat = detectFormat(buffer);
  if (ext === "png" && actualFormat !== "png") {
    console.error(`  FAIL [mismatch] ${key} → ${path} (.${ext} extension but ${actualFormat} internals)`);
    errors++;
    continue;
  }
  if ((ext === "jpg" || ext === "jpeg") && actualFormat !== "jpeg") {
    console.error(`  FAIL [mismatch] ${key} → ${path} (.${ext} extension but ${actualFormat} internals)`);
    errors++;
    continue;
  }
  if (actualFormat === "unknown") {
    console.error(`  FAIL [unknown-format] ${key} → ${path} (unrecognised magic bytes)`);
    errors++;
    continue;
  }

  // 6. Duplicate check (same hash)
  const hash = createHash("md5").update(buffer).digest("hex");
  if (hashes.has(hash)) {
    const existing = hashes.get(hash);
    console.error(`  FAIL [duplicate] ${key} → ${path} (same content as ${existing})`);
    errors++;
    continue;
  }
  hashes.set(hash, key);

  console.log(`  OK  ${key}`);
}

console.log(`\n  ──────────────────────────────────────────`);
if (errors === 0) {
  console.log(`  PASS — All ${imagePaths.length} images valid.`);
  console.log(`  ──────────────────────────────────────────\n`);
  process.exit(0);
} else {
  console.error(`  FAIL — ${errors} error(s) found.`);
  console.error(`  ──────────────────────────────────────────\n`);
  process.exit(1);
}
