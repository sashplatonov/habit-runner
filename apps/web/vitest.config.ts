import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    deps: {
      inline: ['@testing-library/react']
    },
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'lcov'],
      exclude: ['node_modules', 'tests/helpers']
    }
  }
});
