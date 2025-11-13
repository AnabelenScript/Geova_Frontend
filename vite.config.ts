import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Chart library
          'recharts': ['recharts'],
          // Map libraries
          'leaflet': ['leaflet', 'react-leaflet'],
          // Other utilities
          'utils': ['axios', 'sweetalert2', 'react-transition-group'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
