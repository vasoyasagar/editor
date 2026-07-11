import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/editor/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          milkdown: [
            '@milkdown/kit',
            '@milkdown/react',
            '@milkdown/plugin-listener',
            '@milkdown/plugin-history',
          ],
        },
      },
    },
  },
})
