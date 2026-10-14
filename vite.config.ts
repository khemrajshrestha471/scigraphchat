import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Relative base so the built site works regardless of where it ends up
  // published (a GitHub user/org page at the root, a project page in a
  // subpath, or a custom domain) without editing this file per-deployment.
  base: './',
  plugins: [tailwindcss()],
  build: {
    outDir: 'dist',
  },
});
