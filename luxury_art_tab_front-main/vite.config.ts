import { defineConfig } from '@lovable.dev/vite-tanstack-config'

export default defineConfig({
  vite: {
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': { target: 'http://localhost:8081', changeOrigin: true },
        '/uploads': { target: 'http://localhost:8081', changeOrigin: true },
        '/ws': { target: 'http://localhost:8081', changeOrigin: true, ws: true },
      },
    },
  },
})
