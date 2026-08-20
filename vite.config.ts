import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  // Load VITE_* vars for the standard API config
  const viteEnv = loadEnv(mode, '.', 'VITE_');
  // Also load all other vars (including the non-VITE_ ones like APP_VERSION)
  // so we can expose them to the client via `define` below.
  const allEnv = loadEnv(mode, '.', '');
  const merged = { ...viteEnv, ...allEnv };

  return {
    // 👇 CRITICAL FOR CAPACITOR: Use relative paths for file:// loading
    base: './',

    plugins: [react(), tailwindcss()],

    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(merged.GEMINI_API_KEY),
      '__API_URL__': JSON.stringify(merged.VITE_API_URL),
      // App version baked into the build (read from APP_VERSION env var)
      '__APP_VERSION__': JSON.stringify(merged.APP_VERSION || '0.0.0'),
      // Optional: store / Play-Store URL opened from the "Update Required" modal
      '__APP_UPDATE_URL__': JSON.stringify(merged.APP_UPDATE_URL || ''),
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },

    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      // ⚠️ Proxy ONLY works in dev (npm run dev).
      // In APK, use __API_URL__ + full path for API calls.
      proxy: {
        '/api/v1': {
          target: merged.VITE_API_URL,
          changeOrigin: true,
        }
      }
    },

    // 👇 Ensure build output matches capacitor.config.ts webDir
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false, // Set true for debugging, false for production
    },

    // 👇 Optimize for mobile/Capacitor
    optimizeDeps: {
      esbuildOptions: {
        target: 'es2020',
      },
    },
  };
});