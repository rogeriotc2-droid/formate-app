// Production static server for the Formate (safeiq) frontend.
//
// Why this exists: Replit's `serve = "static"` mode cannot set Cache-Control or
// apply gzip/brotli compression. PageSpeed flagged both ("Cache TTL: None" on
// JS/CSS and "no text compression"). This tiny Node server (built-ins only — no
// dependencies, nothing to bundle) serves dist/public with:
//   • brotli/gzip compression for text assets (JS/CSS/HTML/SVG/JSON/XML/TXT)
//   • long-lived immutable caching for hashed /assets/* files
//   • no-cache on HTML so new deploys are picked up immediately
//   • Range support for the marketing video
//   • the same routing the old artifact.toml rewrites did: prerendered SEO
//     pages (directory-style <route>/index.html), printable *.html at root,
//     and an SPA fallback to index.html for everything else.

import { createServer } from "node:http";
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import {
  brotliCompressSync,
  constants as zlibConstants,
  gzipSync,
} from "node:zlib";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, "..", "dist", "public");
const PORT = Number(process.env.PORT) || 25469;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

const COMPRESSIBLE = new Set([
  "text/html; charset=utf-8",
  "text/javascript; charset=utf-8",
  "text/css; charset=utf-8",
  "application/json; charset=utf-8",
  "application/manifest+json; charset=utf-8",
  "image/svg+xml",
  "application/xml; charset=utf-8",
  "text/plain; charset=utf-8",
]);

// Cache of compressed text payloads: `${filePath}:${enc}` -> { buf, mtimeMs }.
const compCache = new Map();

function resolveFile(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    decoded = pathname;
  }
  const safe = normalize(decoded);

  // 1. Exact file (assets, root *.html, images, robots.txt, sitemap.xml, ...).
  const exact = join(ROOT, safe);
  if (exact.startsWith(ROOT) && existsSync(exact) && statSync(exact).isFile()) {
    return exact;
  }

  // 2. Directory index — prerendered SEO routes like /free-sssp-template and
  //    /guides/what-is-an-sssp resolve to <route>/index.html.
  const clean = safe.replace(/\/+$/, "");
  const dirIndex = join(ROOT, clean, "index.html");
  if (
    dirIndex.startsWith(ROOT) &&
    existsSync(dirIndex) &&
    statSync(dirIndex).isFile()
  ) {
    return dirIndex;
  }

  // 3. SPA fallback — client-routed app pages (/dashboard, /sites, ...).
  return join(ROOT, "index.html");
}

function cacheControlFor(filePath, contentType) {
  const rel = filePath.slice(ROOT.length).replace(/\\/g, "/");
  // Hashed build assets never change content under the same name.
  if (rel.startsWith("/assets/")) return "public, max-age=31536000, immutable";
  // HTML must revalidate so a new deploy is served immediately.
  if (contentType.startsWith("text/html")) return "no-cache";
  // Images, fonts, manifest, video, robots, sitemap, etc.
  return "public, max-age=86400";
}

function pickEncoding(accept = "") {
  if (/(^|[,\s])br($|[,\s;])/.test(accept)) return "br";
  if (/(^|[,\s])gzip($|[,\s;])/.test(accept)) return "gzip";
  return null;
}

function getCompressed(filePath, mtimeMs, enc) {
  const key = `${filePath}:${enc}`;
  const hit = compCache.get(key);
  if (hit && hit.mtimeMs === mtimeMs) return hit.buf;
  const raw = readFileSync(filePath);
  const buf =
    enc === "br"
      ? brotliCompressSync(raw, {
          params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 11 },
        })
      : gzipSync(raw, { level: 9 });
  compCache.set(key, { buf, mtimeMs });
  return buf;
}

const server = createServer((req, res) => {
  try {
    const method = req.method || "GET";
    if (method !== "GET" && method !== "HEAD") {
      res.statusCode = 405;
      res.setHeader("Allow", "GET, HEAD");
      res.end("Method Not Allowed");
      return;
    }

    const pathname = (req.url || "/").split("?")[0];
    const filePath = resolveFile(pathname);
    const stat = statSync(filePath);
    const ext = extname(filePath).toLowerCase();
    const contentType = MIME[ext] || "application/octet-stream";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", cacheControlFor(filePath, contentType));
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Vary", "Accept-Encoding");

    // Text assets: compress (brotli/gzip) and cache the compressed payload.
    if (COMPRESSIBLE.has(contentType)) {
      const enc = pickEncoding(req.headers["accept-encoding"]);
      const body = enc
        ? getCompressed(filePath, stat.mtimeMs, enc)
        : readFileSync(filePath);
      if (enc) res.setHeader("Content-Encoding", enc);
      res.setHeader("Content-Length", body.length);
      if (method === "HEAD") {
        res.end();
        return;
      }
      res.end(body);
      return;
    }

    // Binary assets: stream from disk, honouring Range requests (video seeking).
    const total = stat.size;
    const range = req.headers["range"];
    if (range) {
      const match = /bytes=(\d*)-(\d*)/.exec(range);
      if (match) {
        let start = match[1] ? parseInt(match[1], 10) : 0;
        let end = match[2] ? parseInt(match[2], 10) : total - 1;
        if (Number.isNaN(start)) start = 0;
        if (Number.isNaN(end) || end >= total) end = total - 1;
        if (start > end || start >= total) {
          res.statusCode = 416;
          res.setHeader("Content-Range", `bytes */${total}`);
          res.end();
          return;
        }
        res.statusCode = 206;
        res.setHeader("Content-Range", `bytes ${start}-${end}/${total}`);
        res.setHeader("Accept-Ranges", "bytes");
        res.setHeader("Content-Length", end - start + 1);
        if (method === "HEAD") {
          res.end();
          return;
        }
        createReadStream(filePath, { start, end }).pipe(res);
        return;
      }
    }

    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Content-Length", total);
    if (method === "HEAD") {
      res.end();
      return;
    }
    createReadStream(filePath).pipe(res);
  } catch {
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Formate static server listening on :${PORT} (root: ${ROOT})`);
});
