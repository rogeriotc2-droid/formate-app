// Active PWA update checker.
//
// Vite-plugin-pwa with registerType:"autoUpdate" + skipWaiting + clientsClaim
// will take over as soon as a new SW is *discovered*. But mobile browsers can
// go hours without ever asking the registration to update, especially when
// the user opens the app from the home-screen icon (no navigation = no
// update probe).
//
// This module:
//   1. registers the SW via vite-plugin-pwa's virtual module
//   2. polls for a new SW every 60s while the tab is visible
//   3. when one is found and activates, reloads the page so the user
//      immediately sees the new UI — no manual "clear cache" dance.
import { registerSW } from "virtual:pwa-register";

const POLL_MS = 60_000;

export function setupPwa() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      // skipWaiting is on, so the new SW will take over right away — but
      // the current page is still using the old bundle. Reload to pick up
      // the new one.
      window.location.reload();
    },
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      const check = () => {
        if (document.visibilityState !== "visible") return;
        registration.update().catch(() => { /* offline / transient, ignore */ });
      };
      setInterval(check, POLL_MS);
      document.addEventListener("visibilitychange", check);
      window.addEventListener("focus", check);
    },
  });

  // Expose for debugging / manual trigger from devtools.
  (window as Window & { __formateUpdate?: () => Promise<void> }).__formateUpdate = () => updateSW(true);
}
