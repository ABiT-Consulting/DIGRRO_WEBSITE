import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  root: resolve(__dirname, 'academy-src'),
  base: './',
  publicDir: false,
  build: {
    outDir: resolve(__dirname, 'dist/academy'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'academy-src/index.html')
      }
    }
  }
});