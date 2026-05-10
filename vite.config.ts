import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', 'VITE_');
  
  return {
    // 👇 CRITICAL FOR CAPACITOR: Use relative paths for file:// loading
    base: './',
    
    plugins: [react(), tailwindcss()],
    
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      '__API_URL__': JSON.stringify(env.VITE_API_URL),
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
          target: env.VITE_API_URL,
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