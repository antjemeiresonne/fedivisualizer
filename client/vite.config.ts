import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      '/admin/login': 'http://localhost:3000',
      '/mentions': 'http://localhost:3000',
      '/webmention': 'http://localhost:3000',
      '/events': 'http://localhost:3000',
      '/health': 'http://localhost:3000',
      '/test-webmention': 'http://localhost:3000',
      '/rdf': 'http://localhost:3000',
      '/sparql': 'http://localhost:3000',
    }
  }
})
