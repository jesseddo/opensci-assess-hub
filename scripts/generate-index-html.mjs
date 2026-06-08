#!/usr/bin/env node
// Generates dist/client/index.html for static hosting (Bolt/Netlify).
// TanStack Start SSR mode doesn't emit index.html — this fills that gap
// by reading the TanStack Start manifest produced by the build.
import { readFileSync, writeFileSync, readdirSync, copyFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const distServer = join(__dir, "../dist/server/assets");
const distClient = join(__dir, "../dist/client");

const manifestFile = readdirSync(distServer).find((f) =>
  f.startsWith("_tanstack-start-manifest_"),
);
if (!manifestFile) throw new Error("TanStack Start manifest not found in dist/server/assets/");
const manifestContent = readFileSync(join(distServer, manifestFile), "utf-8");

const scriptSrcMatch = manifestContent.match(/src:\s*"(\/assets\/[^"]+\.js)"/);
if (!scriptSrcMatch) throw new Error("Could not find entry script src in manifest");
const scriptSrc = scriptSrcMatch[1];

const preloadMatches = [...manifestContent.matchAll(/"(\/assets\/[^"]+\.js)"/g)];
const allAssets = [...new Set(preloadMatches.map((m) => m[1]))].filter(
  (a) => a !== scriptSrc,
);

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
console.log(`Generated dist/client/index.html`);
console.log(`  entry: ${scriptSrc}`);
console.log(`  css:   ${cssHref}`);

const redirectsSrc = join(__dir, "../public/_redirects");
const redirectsDst = join(distClient, "_redirects");
if (existsSync(redirectsSrc)) {
  copyFileSync(redirectsSrc, redirectsDst);
  console.log(`Copied _redirects to dist/client/_redirects`);
}
