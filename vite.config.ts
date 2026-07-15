import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// v0.35 platform pivot: the target is a native desktop app (Tauri), with the
// browser kept only for development/testing. GitHub Pages is no longer a target,
// so the app is served from the ROOT origin in every mode — `base: '/'` works for
// the Vite dev server, `vite preview`, and Tauri's `tauri://localhost` webview
// alike. All asset URLs come from `import.meta.glob('?url')` and inherit this base
// automatically (nothing reads import.meta.env.BASE_URL), so one value covers all.
export default defineConfig({
  plugins: [react()],
  base: '/',
  define: {
    __APP_VERSION__: JSON.stringify(process.env.GITHUB_SHA?.slice(0, 7) ?? 'dev'),
  },
  // Fixed dev server so Tauri's `build.devUrl` (http://localhost:5173) always
  // matches; strictPort fails loudly instead of silently drifting to another port.
  server: {
    port: 5173,
    strictPort: true,
    host: '127.0.0.1',
  },
  // Don't wipe Vite's output — keeps the Rust/Tauri logs visible during `tauri dev`.
  clearScreen: false,
  build: {
    // WebView2 (Windows) / WKWebView (macOS) baseline; keeps output modern & small.
    target: ['es2021', 'chrome105', 'safari13'],
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
