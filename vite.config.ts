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
    allowedHosts: ['3bb2-39-46-170-15.ngrok-free.app', 'localhost', '.ngrok-free.app']
  },
})
