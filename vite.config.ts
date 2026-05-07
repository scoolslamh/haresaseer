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
    chunkSizeWarningLimit: 1000,

    rollupOptions: {
      output: {
        manualChunks(id) {
          // مكتبات React الأساسية في chunk منفصل
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          // Supabase في chunk منفصل
          if (id.includes('@supabase')) {
            return 'vendor-supabase';
          }
          // مكتبات التصدير الثقيلة تُحمَّل عند الحاجة فقط
          if (id.includes('xlsx') || id.includes('jspdf') || id.includes('jsPDF')) {
            return 'vendor-export';
          }
          // lucide icons في chunk منفصل
          if (id.includes('lucide-react')) {
            return 'vendor-icons';
          }
        }
      },
    },
  },
});
