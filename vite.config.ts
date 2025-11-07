import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    strictPort: true,
    port: 5173, // Default Vite port
    // Allow access from any host including ngrok tunnels
    allowedHosts: ['localhost', '.ngrok-free.dev', '.ngrok-free.app', '.ngrok.io']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    },
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    target: 'es2015'
  },
  preview: {
    port: 5173,
    host: true
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  }
})
