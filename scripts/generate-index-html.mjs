#!/usr/bin/env node
// Generates index.html for static hosting (Bolt/Netlify).
// TanStack Start SSR mode doesn't emit index.html — this fills that gap
// by reading the TanStack Start manifest produced by the build.
import { readFileSync, writeFileSync, readdirSync, copyFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, "..");

// Nitro builds place the manifest at dist/server/_tanstack-start-manifest_*.mjs
// Non-nitro builds place it at dist/server/assets/_tanstack-start-manifest_*.js
// In non-sandbox nitro builds, it's at .output/server/_tanstack-start-manifest_*.mjs
const candidates = [
  join(root, "dist/server/assets"),
  join(root, "dist/server"),
  join(root, ".output/server"),
];

let manifestContent = null;
for (const dir of candidates) {
  if (!existsSync(dir)) continue;
  const file = readdirSync(dir).find((f) => f.startsWith("_tanstack-start-manifest_"));
  if (file) {
    manifestContent = readFileSync(join(dir, file), "utf-8");
    break;
  }
}
if (!manifestContent) throw new Error("TanStack Start manifest not found");

const scriptSrcMatch = manifestContent.match(/src:\s*"(\/assets\/[^"]+\.js)"/);
if (!scriptSrcMatch) throw new Error("Could not find entry script src in manifest");
const scriptSrc = scriptSrcMatch[1];

const preloadMatches = [...manifestContent.matchAll(/"(\/assets\/[^"]+\.js)"/g)];
const allAssets = [...new Set(preloadMatches.map((m) => m[1]))].filter(
  (a) => a !== scriptSrc,
);

// Find the public/client output directory (nitro uses .output/public, normal uses dist/client)
const publicDirCandidates = [
  join(root, "dist/client"),
  join(root, ".output/public"),
];
const distClient = publicDirCandidates.find(
  (d) => existsSync(d) && existsSync(join(d, "assets")),
);
if (!distClient) throw new Error("Could not find client output directory with assets");

const clientAssets = readdirSync(join(distClient, "assets"));
const cssFile = clientAssets.find((f) => f.endsWith(".css"));
const cssHref = cssFile ? `/assets/${cssFile}` : null;

const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Assessment Library — eddo</title>
    <meta name="description" content="An assessment library for OpenSciEd, organizing resources by grade, unit, and lesson for easy access." />
${cssHref ? `    <link rel="stylesheet" href="${cssHref}" />` : ""}
${allAssets.map((a) => `    <link rel="modulepreload" href="${a}" />`).join("\n")}
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" />
  </head>
  <body>
    <script type="module" src="${scriptSrc}"></script>
  </body>
</html>
`;

writeFileSync(join(distClient, "index.html"), html);
console.log(`Generated ${distClient}/index.html`);
console.log(`  entry: ${scriptSrc}`);
console.log(`  css:   ${cssHref}`);

const redirectsSrc = join(root, "public/_redirects");
const redirectsDst = join(distClient, "_redirects");
if (existsSync(redirectsSrc)) {
  copyFileSync(redirectsSrc, redirectsDst);
  console.log(`Copied _redirects to ${distClient}/_redirects`);
}
