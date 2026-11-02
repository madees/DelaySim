import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/DelaySim/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
