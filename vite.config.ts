import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Task Pulse',
        short_name: 'Task Pulse',
        description: 'Daily task manager with groups, percent-complete, and voice input.',
        theme_color: '#3b82f6',
        background_color: '#f8fafc',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  build: {
    // The firebase chunk alone (auth+firestore) is ~615KB minified — that's
    // the SDK's real size, not a splitting problem; it's isolated into its
    // own chunk above so it caches independently of app code.
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      output: {
        // Firebase (auth+firestore) is the bulk of the bundle and changes far
        // less often than app code — split it out so it caches independently.
        manualChunks(id: string) {
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
            return 'firebase'
          }
          if (id.includes('node_modules/@dnd-kit')) {
            return 'dnd-kit'
          }
        },
      },
    },
  },
})
