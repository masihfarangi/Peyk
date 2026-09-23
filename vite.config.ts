import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// Relative base keeps the build portable: works on a sub-path host and inside
// a Capacitor WebView (where the app is served from file:// or capacitor://).
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { host: true, port: 5173 },
  build: {
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Leaflet is only needed once the map mounts, so it stays in its own
        // chunk and is fetched lazily with the map component.
        manualChunks: { leaflet: ['leaflet'] },
      },
    },
  },
});
