import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Post-build step: take the SSR-rendered marketing pages and write a static
// index.html for each route, with its own <title>, description, canonical and
// Open Graph tags + the real page body baked in. This is what Google reads.
// Output is directory-style (dist/public/<route>/index.html) so it never
// collides with the printable templates served at /<name>.html.

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const distPublic = resolve(root, "dist/public");
const ssrEntry = resolve(root, "dist/ssr/prerender-entry.js");

const { ROUTES, renderRoute } = await import(pathToFileURL(ssrEntry).href);

const SITE = "https://formate.co.nz";
const template = readFileSync(resolve(distPublic, "index.html"), "utf8");

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Replace and fail loudly. The whole point of this script is correct SEO tags;
// a silently-missed replacement (e.g. if index.html formatting changes) would
// regress indexing without any visible error. So every replacement must match.
function replaceOrThrow(html, pattern, replacement, label, route) {
  if (!pattern.test(html)) {
    throw new Error(
      `prerender: could not find "${label}" in template for ${route.path}. ` +
        `index.html may have changed — update scripts/prerender.mjs.`,
    );
  }
  return html.replace(pattern, replacement);
}

function buildHtml(route, appHtml) {
  const url = `${SITE}${route.path}`;
  const t = esc(route.title);
  const d = esc(route.description);
  let html = template;
  html = replaceOrThrow(html, /<title>[\s\S]*?<\/title>/, `<title>${t}</title>`, "title", route);
  html = replaceOrThrow(html, /<meta name="description"[^>]*>/, `<meta name="description" content="${d}" />`, "description", route);
  html = replaceOrThrow(html, /<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${url}" />`, "canonical", route);
  html = replaceOrThrow(html, /<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${url}" />`, "og:url", route);
  html = replaceOrThrow(html, /<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${t}" />`, "og:title", route);
  html = replaceOrThrow(html, /<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${d}" />`, "og:description", route);
  html = replaceOrThrow(html, /<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${t}" />`, "twitter:title", route);
  html = replaceOrThrow(html, /<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${d}" />`, "twitter:description", route);
  html = replaceOrThrow(html, /<div id="root"><\/div>/, `<div id="root">${appHtml}</div>`, "root mount", route);
  return html;
}

let count = 0;
for (const route of ROUTES) {
  const appHtml = renderRoute(route);
  const html = buildHtml(route, appHtml);
  const outPath = resolve(distPublic, route.path.replace(/^\//, ""), "index.html");
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, html);
  count++;
  console.log(`prerendered ${route.path} -> ${outPath} (${html.length} bytes)`);
}
console.log(`Done. Pre-rendered ${count} pages.`);
