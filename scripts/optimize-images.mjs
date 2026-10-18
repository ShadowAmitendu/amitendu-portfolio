#!/usr/bin/env node
/**
 * scripts/optimize-images.mjs
 *
 * Image optimization & renaming script for Eleventy + Decap CMS site.
 * Converts images to WebP at quality 80, applies EXIF rotation, strips metadata,
 * resizes per collection limits, renames to <collection>/<date>-<content-name>.webp,
 * and updates all references across project files.
 *
 * Usage:
 *   node scripts/optimize-images.mjs          # Dry run (default)
 *   node scripts/optimize-images.mjs --write  # Perform renames & rewrites
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import sharp from "sharp";

// Disable Sharp cache to prevent file locking on Windows
sharp.cache(false);

// Configuration Constants
const KEEP_ORIGINAL_NAME = false;

const SKIP_FILES = new Set([
  "header-banner.jpg",
  "og-card.jpg",
  "og-card.svg",
  "og-profile.jpg",
  "hi.gif",
]);

const NON_RASTER_EXTS = new Set([".heic", ".ico", ".svg"]);

const MAX_WIDTHS = {
  books: 700,
  movies: 700,
  games: 700,
  software: 160,
  friends: 240,
  authors: 480,
  gear: 1600,
  blog: 1600,
  portfolio: 1600,
  site: 1600,
};

const COLLECTION_PRIORITY = [
  "books",
  "movies",
  "games",
  "software",
  "friends",
  "gear",
  "blog",
  "portfolio",
  "authors",
  "site",
];

const rootDir = process.cwd();
const srcDir = path.join(rootDir, "src");
const imagesDir = path.join(srcDir, "images");
const manifestPath = path.join(rootDir, "scripts", "image-manifest.json");

const isWriteMode = process.argv.includes("--write");

/**
 * Format bytes into human-readable string (KB / MB)
 */
function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  if (Math.abs(bytes) < k) return `${bytes} B`;
  if (Math.abs(bytes) < k * k) return `${(bytes / k).toFixed(1)} KB`;
  return `${(bytes / (k * k)).toFixed(2)} MB`;
}

/**
 * Convert text into clean lowercase hyphen-separated ASCII slug
 */
function slugify(text, maxLen = 48) {
  if (!text) return "";
  let s = String(text)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (s.length > maxLen) {
    s = s.slice(0, maxLen).replace(/-+$/, "");
  }
  return s;
}

/**
 * Get file creation date from git first-commit, falling back to mtime
 */
function getGitCreationDate(filePath) {
  try {
    const rel = path.relative(rootDir, filePath).replace(/\\/g, "/");
    const out = execSync(
      `git log --diff-filter=A --format=%ad --date=short -1 -- "${rel}"`,
      {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "ignore"],
      }
    ).trim();
    if (out && /^\d{4}-\d{2}-\d{2}$/.test(out)) {
      return out;
    }
  } catch (e) {
    // Git log failed or untracked
  }

  try {
    const stat = fs.statSync(filePath);
    return stat.mtime.toISOString().slice(0, 10);
  } catch (e) {
    return new Date().toISOString().slice(0, 10);
  }
}

/**
 * Determine collection from file path
 */
function getCollectionFromPath(filePath) {
  const norm = filePath.replace(/\\/g, "/");
  if (norm.includes("/_data/books.json") || norm.includes("about-books") || norm.includes("/about/books")) return "books";
  if (norm.includes("/_data/movies.json") || norm.includes("about-movies") || norm.includes("/about/movies")) return "movies";
  if (norm.includes("/_data/games.json") || norm.includes("about-games") || norm.includes("/about/games")) return "games";
  if (norm.includes("/_data/software.json") || norm.includes("about-software") || norm.includes("/about/software")) return "software";
  if (norm.includes("/_data/friends.json") || norm.includes("about-friends") || norm.includes("/about/friends")) return "friends";
  if (norm.includes("/_data/gear.json") || norm.includes("about-gear") || norm.includes("/about/gear")) return "gear";
  if (norm.includes("/_data/anime.json") || norm.includes("about-anime") || norm.includes("/about/anime")) return "anime";
  if (norm.includes("/blog/") || norm.includes("blog.njk")) return "blog";
  if (norm.includes("/portfolio/") || norm.includes("portfolio.njk")) return "portfolio";
  if (norm.includes("/authors/")) return "authors";
  return "site";
}

/**
 * Recursively find files in directory, ignoring excluded folders
 */
function walkDirectory(dir, callback) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name === "images" ||
        entry.name === "node_modules" ||
        entry.name === "_site" ||
        entry.name === "public" ||
        entry.name === "scratch"
      ) {
        continue;
      }
      walkDirectory(full, callback);
    } else if (entry.isFile()) {
      callback(full);
    }
  }
}

// Ensure images directory exists
if (!fs.existsSync(imagesDir)) {
  console.error(`Images directory does not exist at ${imagesDir}`);
  process.exit(1);
}

// Find all image files directly inside src/images
const allImageFiles = fs
  .readdirSync(imagesDir, { withFileTypes: true })
  .filter((d) => d.isFile())
  .map((d) => d.name);

// Map of image filename -> list of usages
const usageMap = new Map();
for (const img of allImageFiles) {
  usageMap.set(img, []);
}

// Regex to identify image references in text
// Uses lookbehind and lookahead to avoid matching partial names and external URLs
const IMG_REF_REGEX =
  /(?<![a-zA-Z0-9_.-])\/images\/([A-Za-z0-9_.\-~%]+?\.(?:webp|avif|png|jpg|jpeg|gif|svg|ico|heic))(?=["'`)\s,?;\]]|$)/gi;

// Scan JSON files
function scanJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(content);
    const col = getCollectionFromPath(filePath);

    function walk(obj, parentTitle = "") {
      if (!obj || typeof obj !== "object") return;

      const currentTitle =
        obj.title ||
        obj.name ||
        obj.caption ||
        obj.alt ||
        obj.profileAlt ||
        obj.badgeAlt ||
        obj.imageAlt ||
        obj.iconAlt ||
        obj.heading ||
        parentTitle;

      if (Array.isArray(obj)) {
        for (const item of obj) {
          walk(item, currentTitle);
        }
        return;
      }

      for (const [key, val] of Object.entries(obj)) {
        if (typeof val === "string") {
          const match = val.match(/^\/?images\/([^/?#\s]+\.[a-zA-Z0-9]+)$/);
          if (match) {
            const imgName = path.basename(match[1]);
            if (usageMap.has(imgName)) {
              usageMap.get(imgName).push({
                file: path.relative(rootDir, filePath).replace(/\\/g, "/"),
                collection: col,
                title: typeof currentTitle === "string" ? currentTitle : "",
              });
            }
          }
        } else if (typeof val === "object" && val !== null) {
          walk(val, currentTitle);
        }
      }
    }

    walk(data, data.title || data.heading || "");
  } catch (err) {
    console.error(`[optimize-images] Error scanning JSON ${filePath}:`, err.message);
  }
}

// Scan Markdown files
function scanMarkdownFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const col = getCollectionFromPath(filePath);

  let fmTitle = "";
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (fmMatch) {
    const nameMatch = fmMatch[1].match(/^name:\s*["']?(.*?)["']?$/m);
    const titleMatch = fmMatch[1].match(/^title:\s*["']?(.*?)["']?$/m);
    if (col === "authors" && nameMatch) {
      fmTitle = nameMatch[1].trim();
    } else if (titleMatch && titleMatch[1].trim() !== "Author Profile") {
      fmTitle = titleMatch[1].trim();
    } else if (nameMatch) {
      fmTitle = nameMatch[1].trim();
    } else if (titleMatch) {
      fmTitle = titleMatch[1].trim();
    }
  }

  let m;
  IMG_REF_REGEX.lastIndex = 0;
  while ((m = IMG_REF_REGEX.exec(content)) !== null) {
    const imgName = path.basename(m[1]);
    if (usageMap.has(imgName)) {
      usageMap.get(imgName).push({
        file: path.relative(rootDir, filePath).replace(/\\/g, "/"),
        collection: col,
        title: fmTitle,
      });
    }
  }
}

// Scan other templates, markup, config, styles
function scanOtherFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const col = getCollectionFromPath(filePath);

  let m;
  IMG_REF_REGEX.lastIndex = 0;
  while ((m = IMG_REF_REGEX.exec(content)) !== null) {
    const imgName = path.basename(m[1]);
    if (usageMap.has(imgName)) {
      usageMap.get(imgName).push({
        file: path.relative(rootDir, filePath).replace(/\\/g, "/"),
        collection: col,
        title: "",
      });
    }
  }
}

// Scan all project source files
const scannedFiles = [];
walkDirectory(srcDir, (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  scannedFiles.push(filePath);
  if (ext === ".json") scanJsonFile(filePath);
  else if (ext === ".md") scanMarkdownFile(filePath);
  else if ([".njk", ".yml", ".yaml", ".html", ".css"].includes(ext)) {
    scanOtherFile(filePath);
  }
});

// Classify files and plan renames
const plannedRenames = [];
const skippedFiles = [];
const nonRasterFiles = [];
const unreferencedFiles = [];

const assignedTargetPaths = new Set();

for (const imgName of allImageFiles) {
  const ext = path.extname(imgName).toLowerCase();
  const baseNoExt = path.basename(imgName, ext);
  const srcPath = path.join(imagesDir, imgName);

  // 1. Skip files that already start with YYYY-MM-DD- (idempotent)
  if (baseNoExt.match(/^\d{4}-\d{2}-\d{2}-/)) {
    skippedFiles.push({ name: imgName, reason: "Already formatted (YYYY-MM-DD-)" });
    continue;
  }

  // 2. Skip fixed-path files
  if (SKIP_FILES.has(imgName)) {
    skippedFiles.push({ name: imgName, reason: "Fixed-path file in SKIP_FILES" });
    continue;
  }

  // 3. Report non-raster files
  if (NON_RASTER_EXTS.has(ext)) {
    nonRasterFiles.push(imgName);
    continue;
  }

  const usages = usageMap.get(imgName) || [];

  // 4. Leave unreferenced images untouched
  if (usages.length === 0) {
    unreferencedFiles.push(imgName);
    continue;
  }

  // Determine collection based on priority
  let chosenCollection = "site";
  for (const prio of COLLECTION_PRIORITY) {
    if (usages.some((u) => u.collection === prio)) {
      chosenCollection = prio;
      break;
    }
  }

  // Determine content name from nearest title/name/caption/alt
  let chosenTitle = "";
  const matchingColUsages = usages.filter((u) => u.collection === chosenCollection && u.title);
  if (matchingColUsages.length > 0) {
    chosenTitle = matchingColUsages[0].title;
  } else {
    const anyTitle = usages.find((u) => u.title);
    if (anyTitle) chosenTitle = anyTitle.title;
  }

  let contentSlug = slugify(chosenTitle, 48);
  if (!contentSlug) {
    contentSlug = slugify(baseNoExt, 48);
  }

  if (KEEP_ORIGINAL_NAME) {
    const origSlug = slugify(baseNoExt, 24);
    if (origSlug && contentSlug !== origSlug) {
      contentSlug = `${contentSlug}-${origSlug}`;
    }
  }

  const date = getGitCreationDate(srcPath);

  // Formulate target name and resolve collisions with -2, -3, etc.
  let targetName = `${date}-${chosenCollection}-${contentSlug}.webp`;
  let targetRel = `src/images/${targetName}`;
  let targetPath = path.join(imagesDir, targetName);

  let counter = 2;
  while (assignedTargetPaths.has(targetPath.toLowerCase())) {
    targetName = `${date}-${chosenCollection}-${contentSlug}-${counter}.webp`;
    targetRel = `src/images/${targetName}`;
    targetPath = path.join(imagesDir, targetName);
    counter++;
  }
  assignedTargetPaths.add(targetPath.toLowerCase());

  plannedRenames.push({
    oldName: imgName,
    oldPath: srcPath,
    oldRef: `/images/${imgName}`,
    newName: targetName,
    newRel: targetRel,
    newPath: targetPath,
    newRef: `/images/${targetName}`,
    collection: chosenCollection,
    date,
    title: chosenTitle || "(from filename)",
  });
}

/**
 * Execute optimization process
 */
async function run() {
  console.log(`\n======================================================`);
  console.log(` Image Optimization & Renaming (${isWriteMode ? "WRITE MODE" : "DRY RUN"})`);
  console.log(`======================================================\n`);

  console.log(`Total image files in src/images: ${allImageFiles.length}`);
  console.log(`Planned renames:                ${plannedRenames.length}`);
  console.log(`Skipped (fixed / formatted):    ${skippedFiles.length}`);
  console.log(`Non-raster (unconverted):       ${nonRasterFiles.length}`);
  console.log(`Unreferenced (untouched):       ${unreferencedFiles.length}`);

  let totalBeforeBytes = 0;
  let totalAfterBytes = 0;
  const processedItems = [];

  console.log(`\nProcessing and calculating sizes with Sharp...`);

  for (let i = 0; i < plannedRenames.length; i++) {
    const item = plannedRenames[i];
    const beforeStat = fs.statSync(item.oldPath);
    const beforeBytes = beforeStat.size;
    totalBeforeBytes += beforeBytes;

    const maxWidth = MAX_WIDTHS[item.collection] || 1600;

    try {
      // Configure Sharp pipeline: rotate (EXIF orientation), strip metadata, resize, WebP quality 80
      const isGif = path.extname(item.oldName).toLowerCase() === ".gif";
      const inputBuffer = fs.readFileSync(item.oldPath);
      let pipeline = sharp(inputBuffer, { animated: isGif });

      pipeline = pipeline
        .rotate()
        .resize({ width: maxWidth, withoutEnlargement: true })
        .webp({ quality: 80 });

      if (isWriteMode) {
        // Ensure destination folder exists
        const destFolder = path.dirname(item.newPath);
        if (!fs.existsSync(destFolder)) {
          fs.mkdirSync(destFolder, { recursive: true });
        }

        // Write optimized WebP
        await pipeline.toFile(item.newPath);
        const afterStat = fs.statSync(item.newPath);
        const afterBytes = afterStat.size;
        totalAfterBytes += afterBytes;

        // Delete old image file
        fs.unlinkSync(item.oldPath);

        processedItems.push({
          old: `src/images/${item.oldName}`,
          new: item.newRel,
          beforeBytes,
          afterBytes,
          savedBytes: beforeBytes - afterBytes,
        });
      } else {
        // Dry run: render buffer in memory to obtain exact compressed size
        const outBuffer = await pipeline.toBuffer();
        const afterBytes = outBuffer.length;
        totalAfterBytes += afterBytes;

        processedItems.push({
          old: item.oldName,
          new: item.newRel,
          beforeBytes,
          afterBytes,
          savedBytes: beforeBytes - afterBytes,
        });
      }
    } catch (err) {
      console.error(`[Error] Failed processing ${item.oldName}:`, err.message);
      totalAfterBytes += beforeBytes; // fallback count
    }
  }

  // If in write mode, rewrite references across all source files in one pass
  if (isWriteMode) {
    console.log(`\nRewriting image references across source files...`);
    let modifiedFilesCount = 0;

    // Sort planned renames by oldName length descending so substrings don't conflict
    const sortedReplacements = [...plannedRenames].sort(
      (a, b) => b.oldName.length - a.oldName.length
    );

    for (const file of scannedFiles) {
      let content = fs.readFileSync(file, "utf8");
      let changed = false;

      for (const r of sortedReplacements) {
        // Match /images/<oldName> or images/<oldName> with boundaries
        const escapedOld = r.oldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const pattern = new RegExp(
          `(?<![a-zA-Z0-9_.-])(\\/?)images\\/${escapedOld}(?=["'\`)\\s,?;]|$)`,
          "g"
        );

        if (pattern.test(content)) {
          pattern.lastIndex = 0;
          content = content.replace(pattern, (match, prefix) => {
            changed = true;
            return `${prefix}images/${r.newName}`;
          });
        }
      }

      if (changed) {
        fs.writeFileSync(file, content, "utf8");
        modifiedFilesCount++;
      }
    }

    console.log(`Updated references across ${modifiedFilesCount} files.`);

    // Append to scripts/image-manifest.json
    let manifest = [];
    if (fs.existsSync(manifestPath)) {
      try {
        manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
      } catch (e) {
        manifest = [];
      }
    }
    manifest.push(...processedItems);
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
    console.log(`Appended ${processedItems.length} entries to ${path.relative(rootDir, manifestPath)}`);
  }

  // Print results
  console.log(`\n=== Optimization Results ===\n`);
  console.table(
    processedItems.map((item) => ({
      Old: item.old,
      New: item.new,
      "Before": formatBytes(item.beforeBytes),
      "After": formatBytes(item.afterBytes),
      "Saved": formatBytes(item.savedBytes),
      "% Saved": `${((item.savedBytes / item.beforeBytes) * 100).toFixed(1)}%`,
    }))
  );

  const totalSavedBytes = totalBeforeBytes - totalAfterBytes;
  const pctSaved = totalBeforeBytes > 0 ? (totalSavedBytes / totalBeforeBytes) * 100 : 0;

  console.log(`\n======================================================`);
  console.log(` SUMMARY STATISTICS`);
  console.log(`======================================================`);
  console.log(`Total Size Before: ${formatBytes(totalBeforeBytes)} (${(totalBeforeBytes / (1024 * 1024)).toFixed(2)} MB)`);
  console.log(`Total Size After:  ${formatBytes(totalAfterBytes)} (${(totalAfterBytes / (1024 * 1024)).toFixed(2)} MB)`);
  console.log(`Total Saved:       ${formatBytes(totalSavedBytes)} (${(totalSavedBytes / (1024 * 1024)).toFixed(2)} MB)`);
  console.log(`Overall Savings:   ${pctSaved.toFixed(1)}%`);
  console.log(`======================================================\n`);

  if (unreferencedFiles.length > 0) {
    console.log(`Unreferenced Images (Untouched, ${unreferencedFiles.length} files):`);
    for (const f of unreferencedFiles) {
      console.log(`  - ${f}`);
    }
    console.log();
  }

  if (nonRasterFiles.length > 0) {
    console.log(`Non-Raster Files (Reported only, ${nonRasterFiles.length} files):`);
    for (const f of nonRasterFiles) {
      console.log(`  - ${f}`);
    }
    console.log();
  }

  if (skippedFiles.length > 0) {
    console.log(`Skipped Files (${skippedFiles.length} files):`);
    for (const f of skippedFiles) {
      console.log(`  - ${f.name} (${f.reason})`);
    }
    console.log();
  }

  if (!isWriteMode) {
    console.log(`>> DRY RUN COMPLETE. No files were modified or renamed.`);
    console.log(`>> To apply these changes, run with: npm run images:write\n`);
  } else {
    console.log(`>> WRITE COMPLETE. All images optimized and references updated successfully.\n`);
  }
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
