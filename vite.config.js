import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [ tailwindcss(), react()],
  optimizeDeps: {
    include: ['react-big-calendar', 'moment'], // Pre-bundle these dependencies for faster builds
  },
  build: {
    rollupOptions: {
      external: [], // Ensure we're not externalizing anything unnecessary
    },
  },
})
