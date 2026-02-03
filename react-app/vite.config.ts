import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  },
})
