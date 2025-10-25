// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true, // Listen on all addresses
    proxy: {
      // Optional: Proxy API requests during development
      '/api': {
        target: 'http://localhost:4001',
        changeOrigin: true,
      },
      '/send-email': {
        target: 'http://localhost:4001',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true, // Enable source maps for debugging
  },
  define: {
    // Global constant replacements
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  }
})