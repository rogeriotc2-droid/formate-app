import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

const port = Number(process.env.PORT ?? "25469");
const basePath = process.env.BASE_PATH ?? "/";
const isReplit = process.env.REPL_ID !== undefined;

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss({ optimize: false }),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: { enabled: false },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        // Take over immediately when a new SW is installed, instead of waiting
        // for every Formate tab on the device to close. Without this, phones
        // can sit on stale JS bundles for days after a deploy — users see
        // "nothing changed" even after we publish, because the cached old
        // sidebar/UI is still being served.
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        navigateFallback: `${basePath}index.html`,
        // CRITICAL: deny any path served by a sibling artifact on the same
        // origin (api-server, reel, hero-loop). Without this, the safeiq
        // service worker hijacks navigation to /reel/, /hero-loop/, /api/*
        // and serves its own index.html — which then renders Wouter's 404
        // because those paths aren't in safeiq's router.
        navigateFallbackDenylist: [
          /^\/api(\/|$)/,
          /^\/reel(\/|$)/,
          /^\/hero-loop(\/|$)/,
          /^\/us(\/|$)/,
        ],
        runtimeCaching: [
          {
            // Cache app API data (NetworkFirst), but NEVER the auth endpoints
            // (/api/auth/**). Session verification (/api/auth/me) runs through
            // that path; if the SW ever serves a stale (signed-out) cached copy
            // — which NetworkFirst does whenever the network is slower than the
            // 5s timeout, common on mobile in the field — the app reads the user
            // as signed out and bounces them straight back to the login screen.
            // Auth traffic must always hit the network. The negative lookahead
            // excludes /api/auth so those requests skip the cache.
            urlPattern: /^\/api\/(?!auth(\/|$))/,
            handler: "NetworkFirst",
            options: { cacheName: "api-cache", networkTimeoutSeconds: 5, cacheableResponse: { statuses: [0, 200] } },
          },
        ],
      },
      manifest: {
        name: "Formate",
        short_name: "Formate",
        description: "Formate — safety plans in 30 seconds. Built for NZ & AU sub-contractors.",
        theme_color: "#0F172A",
        background_color: "#0F172A",
        display: "standalone",
        start_url: basePath,
        scope: basePath,
        icons: [
          { src: `${basePath}icon.svg`, sizes: "any", type: "image/svg+xml", purpose: "any maskable" },
        ],
      },
    }),
    ...(isReplit
      ? [
          await import("@replit/vite-plugin-runtime-error-modal").then((m) =>
            m.default(),
          ),
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    hmr: false,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
