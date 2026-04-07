import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { resolveApiProxyTarget } from './src/lib/api/devProxy';
import path from 'node:path';

export default defineConfig({
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  },
  resolve: {
    alias: {
      '@habbit-runner/shared': path.resolve(__dirname, '../web/packages/shared/src/index.ts')
    }
  },
  server: {
    port: 5174,
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
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('dexie')) return 'vendor-dexie';
        }
      }
    }
  },
  plugins: [
    sveltekit(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw-custom.ts',
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
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}']
      }
    })
  ]
});
