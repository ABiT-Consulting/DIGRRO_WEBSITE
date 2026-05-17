import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
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
      react(),
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
          admin: resolve(__dirname, 'academy-src/admin.html'),
          resetPassword: resolve(__dirname, 'academy-src/reset-password.html')
        },
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('three')) return 'vendor-three';
            if (id.includes('framer-motion')) return 'vendor-motion';
            if (id.includes('gsap') || id.includes('lenis')) return 'vendor-scroll';
            if (id.includes('react')) return 'vendor-react';
            return 'vendor';
          }
        }
      }
    },
    server: {
      hmr: false
    },
    preview: {
      port: 4173,
      strictPort: true
    }
  };
});
