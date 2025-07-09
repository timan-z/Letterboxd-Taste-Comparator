// NOTE: + REMEMBER: Use Vite Proxy during Development but NOT during Production (need to transition to something else then).
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8080' // <-- This is where I'm going to host my GO server.
    }
  }

})
