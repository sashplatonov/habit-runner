import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin, type ResolvedConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { resolveApiProxyTarget } from './src/lib/api/devProxy';

const dirname = path.dirname(fileURLToPath(import.meta.url));

function prepareInjectManifestServiceWorker(rootDir: string): Plugin {
  let resolvedConfig: ResolvedConfig;

  return {
    name: 'habbit-runner:prepare-inject-manifest-sw',
    apply: 'build',
    enforce: 'pre',
    configResolved(config) {
      resolvedConfig = config;
    },
    closeBundle: {
      sequential: true,
      enforce: 'pre',
      async handler() {
        if (!resolvedConfig.build.ssr || process.env.SKIP_PWA === '1') {
          return;
        }

        const clientOutputDir = path.join(rootDir, '.svelte-kit/output/client');
        const serviceWorkerEntry = path.join(rootDir, 'src/sw-custom.ts');
        const serviceWorkerOutput = path.join(clientOutputDir, 'service-worker.js');
        const { build } = await import('esbuild');

        await mkdir(clientOutputDir, { recursive: true });
        await build({
          entryPoints: [serviceWorkerEntry],
          outfile: serviceWorkerOutput,
          bundle: true,
          format: 'esm',
          platform: 'browser',
          target: ['es2020'],
          logLevel: 'silent',
          define: {
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV === 'production' ? 'production' : 'development')
          }
        });
      }
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV === 'production' ? 'production' : 'development')
  },
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
    alias: {
      '@': path.resolve(dirname, 'src')
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
    sveltekit(),
    prepareInjectManifestServiceWorker(dirname),
    ...(process.env.SKIP_PWA === '1' ? [] : [
      SvelteKitPWA({
      strategies: 'injectManifest',
      srcDir: 'src',
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
      }
      })
    ])
  ]
});
