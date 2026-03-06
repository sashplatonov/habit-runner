import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Habit Runner',
        short_name: 'HabitRunner',
        description: 'Offline-first habit tracking with sync',
        theme_color: '#080810',
        background_color: '#080810',
        display: 'standalone',
        icons: [
          {
            src: 'android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/sync\/pull/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'sync-pull',
              networkTimeoutSeconds: 5,
              backgroundSync: {
                name: 'sync-pull-queue',
                options: {
                  maxRetentionTime: 60
                }
              }
            }
          },
          {
            urlPattern: /^https?:\/\/.*\/sync\/push/,
            handler: 'NetworkOnly',
            options: {
              cacheName: 'sync-push'
            }
          },
          {
            urlPattern: /\/.*/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'app-shell',
              expiration: {
                maxEntries: 100
              }
            }
          }
        ]
      }
    })
  ]
})
