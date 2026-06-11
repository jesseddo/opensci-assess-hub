#!/usr/bin/env node
/**
 * Regenerate Quick look HTML previews for every ingested unit manifest.
 *
 * Usage:
 *   node scripts/extract-all-previews.mjs
 *   node scripts/extract-all-previews.mjs src/data/ingested/unit-8.1.json
 */
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");
const ingestedDir = path.join(repoRoot, "src/data/ingested");
const previewsDir = path.join(repoRoot, "src/data/material-previews");
const previewScript = path.join(repoRoot, "scripts/extract-material-previews.py");

function manifestPaths() {
  const arg = process.argv[2];
  if (arg) {
    return [path.resolve(arg)];
  }

  return fs
    .readdirSync(ingestedDir)
    .filter((name) => /^unit-[\d.]+\.json$/.test(name))
    .map((name) => path.join(ingestedDir, name));
}

let processed = 0;

for (const manifestPath of manifestPaths()) {
  if (!fs.existsSync(manifestPath)) {
    console.warn(`Skipping missing manifest: ${manifestPath}`);
    continue;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const unitDir = manifest.ingestedFrom;

  if (!unitDir || !fs.existsSync(unitDir)) {
    console.warn(
      `Skipping ${path.basename(manifestPath)}: unit folder not found (${unitDir ?? "unset"})`,
    );
    continue;
  }

  const outJson = path.join(previewsDir, path.basename(manifestPath));
  execFileSync("python3", [previewScript, unitDir, manifestPath, outJson], {
    stdio: "inherit",
  });
  processed += 1;
}

if (processed === 0) {
  console.warn("No unit previews were generated.");
  process.exit(1);
}

console.log(`Generated previews for ${processed} unit(s).`);
