/**
 * Registers the service worker when the environment can actually use one.
 *
 * Skipped during `npm run dev` (Vite serves modules the SW would shadow) and
 * outside secure contexts. Inside a Capacitor WebView the app is served from a
 * custom scheme where registration may not be available — hence the guard, not
 * a crash.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD) return;
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  if (!window.isSecureContext) return;

  window.addEventListener('load', () => {
    const url = new URL('sw.js', document.baseURI).href;
    navigator.serviceWorker.register(url).catch(() => {
      // Offline support is an enhancement; the app runs fine without it.
    });
  });
}
