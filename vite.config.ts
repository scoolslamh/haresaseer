import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    }
  },

  optimizeDeps: {
    exclude: ['lucide-react'],
  },

  build: {
    chunkSizeWarningLimit: 1500,

    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          charts: ['html2canvas'], // 🔥 فصل المكتبات الثقيلة
        },
      },
    },
  },
});