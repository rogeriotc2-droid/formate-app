import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Minimal SSR build used only to pre-render the public marketing/SEO pages to
// static HTML (see src/prerender-entry.tsx and scripts/prerender.mjs). It is
// intentionally separate from vite.config.ts so the PWA/service-worker and
// Replit dev plugins do not run during the SSR pass.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  build: {
    ssr: path.resolve(import.meta.dirname, "src/prerender-entry.tsx"),
    outDir: path.resolve(import.meta.dirname, "dist/ssr"),
    emptyOutDir: true,
  },
});
