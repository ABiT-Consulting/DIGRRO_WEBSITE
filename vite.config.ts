import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const devPort = Number(env.VITE_DEV_PORT || env.PORT) || 5173;
  const aiPort = Number(env.AI_SERVER_PORT) || 8787;

  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    server: {
      port: devPort,
      proxy: {
        '/api': `http://localhost:${aiPort}`,
      },
    },
  };
});
