import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'node:path';
import { academyApiPlugin } from './vite-plugins/academy-api.js';

export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode || 'development', __dirname, '');
  const env = { ...fileEnv, ...process.env };

  return {
    root: resolve(__dirname, 'academy-src'),
    base: './',
    publicDir: false,
    plugins: [
      academyApiPlugin({
        env,
        dataFile: resolve(__dirname, 'academy-data/courses.json')
      })
    ],
    build: {
      outDir: resolve(__dirname, 'dist/academy'),
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'academy-src/index.html'),
          admin: resolve(__dirname, 'academy-src/admin.html')
        }
      }
    },
    preview: {
      port: 4173,
      strictPort: true
    }
  };
});
