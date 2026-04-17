import path from 'node:path';
import { fileURLToPath } from 'node:url';
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html',
      strict: false
    }),
    alias: {
      '@': path.resolve(dirname, 'src')
    },
    serviceWorker: {
      register: false
    },
    prerender: {
      entries: ['*', '/sitemap.xml']
    }
  }
};

export default config;