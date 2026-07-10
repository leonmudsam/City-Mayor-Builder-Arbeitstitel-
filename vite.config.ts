import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the app under /<repo-name>/, so the base path must match.
export default defineConfig({
  plugins: [react()],
  base: '/City-Mayor-Builder-Arbeitstitel-/',
  define: {
    __APP_VERSION__: JSON.stringify(process.env.GITHUB_SHA?.slice(0, 7) ?? 'dev'),
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
