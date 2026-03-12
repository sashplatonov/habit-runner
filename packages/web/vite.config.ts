import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'
import { resolveApiProxyTarget } from './src/lib/api/devProxy'
import { shouldCacheAppShell } from './src/lib/pwa/runtimeCaching'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: resolveApiProxyTarget(
          process.env.API_TARGET_URL,
          process.env.VITE_API_BASE_URL
        ),
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return
          }

          if (id.includes('recharts')) {
            return 'vendor-recharts'
          }

          if (id.includes('/d3-') || id.includes('/d3/')) {
            return 'vendor-d3'
          }

          if (id.includes('dexie')) {
            return 'vendor-dexie'
          }
        }
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'Habbit Runner',
        short_name: 'HabitRunner',
        description: 'Offline-first habit tracking with sync',
        id: '/',
        start_url: '/',
        theme_color: '#080810',
        background_color: '#080810',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone'],
        orientation: 'portrait',
        lang: 'en',
        categories: ['productivity', 'lifestyle'],
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        navigateFallbackDenylist: [/^\/api\//],
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
            urlPattern: ({ request, url }) => shouldCacheAppShell(request, url),
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
