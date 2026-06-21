import { defineConfig } from '@lovable.dev/vite-tanstack-config'

export default defineConfig({
  vite: {
    server: {
      proxy: {
        '/api': { target: 'http://localhost:8081', changeOrigin: true },
        '/uploads': { target: 'http://localhost:8081', changeOrigin: true },
      },
    },
  },
})
