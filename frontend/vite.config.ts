import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  preview: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 650,
    // Source maps are OFF in normal builds (they would publish the full
    // TypeScript source). A temporary, access-controlled debug deploy can opt
    // in with VITE_BUILD_SOURCEMAP=1. See docs/FRONTEND_DEBUG_ACCESS.md.
    sourcemap: process.env.VITE_BUILD_SOURCEMAP === '1',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('livekit')) return 'livekit';
          if (id.includes('recharts') || id.includes('/d3-')) return 'charts';
          if (id.includes('@radix-ui')) return 'radix-ui';
          if (id.includes('motion')) return 'motion';
          if (id.includes('/node_modules/react/') || id.includes('/node_modules/react-dom/') || id.includes('/node_modules/scheduler/')) return 'react-vendor';
          return 'vendor';
        },
      },
    },
  },
})
