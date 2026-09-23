/**
 * Loads a third-party script/stylesheet once and caches the promise.
 *
 * Used by the Neshan map provider, which ships as a hosted SDK rather than an
 * npm package. Keeping it lazy means the SDK is only fetched when the map
 * actually mounts, and never at all when the OSM provider is selected.
 */

const pending = new Map<string, Promise<void>>();

export function loadScriptOnce(src: string, timeoutMs = 15_000): Promise<void> {
  const cached = pending.get(src);
  if (cached) return cached;

  const promise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-src="${src}"]`);
    if (existing?.dataset.loaded === 'true') {
      resolve();
      return;
    }

    const script = existing ?? document.createElement('script');
    const timer = window.setTimeout(() => reject(new Error(`Timed out loading ${src}`)), timeoutMs);

    script.addEventListener('load', () => {
      window.clearTimeout(timer);
      script.dataset.loaded = 'true';
      resolve();
    });
    script.addEventListener('error', () => {
      window.clearTimeout(timer);
      pending.delete(src);
      reject(new Error(`Failed to load ${src}`));
    });

    if (!existing) {
      script.src = src;
      script.async = true;
      script.dataset.src = src;
      document.head.appendChild(script);
    }
  });

  pending.set(src, promise);
  return promise;
}

export function loadStylesheetOnce(href: string): void {
  if (document.querySelector(`link[data-href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.dataset.href = href;
  document.head.appendChild(link);
}
