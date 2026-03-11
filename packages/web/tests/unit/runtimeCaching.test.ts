import { describe, expect, it } from 'vitest';
import { shouldCacheAppShell } from '@/lib/pwa/runtimeCaching';

describe('shouldCacheAppShell', () => {
  it('caches same-origin navigation requests', () => {
    expect(
      shouldCacheAppShell(
        { mode: 'navigate' },
        { origin: 'http://localhost:5137', pathname: '/stats' }
      )
    ).toBe(true);
  });

  it('does not cache API routes', () => {
    expect(
      shouldCacheAppShell(
        { mode: 'navigate' },
        { origin: 'http://localhost:5137', pathname: '/api/auth/google/start' }
      )
    ).toBe(false);
  });

  it('does not cache non-navigation requests', () => {
    expect(
      shouldCacheAppShell(
        { mode: 'cors' },
        { origin: 'http://localhost:5137', pathname: '/manifest.webmanifest' }
      )
    ).toBe(false);
  });
});
