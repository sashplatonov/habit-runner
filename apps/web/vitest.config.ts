import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sveltekit } from '@sveltejs/kit/vite';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [sveltekit()],
  resolve: {
    conditions: ['browser'],
    alias: {
      '@': path.resolve(dirname, 'src')
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'lcov'],
      exclude: ['.svelte-kit', 'node_modules', 'tests/helpers']
    }
  }
});
