import { describe, expect, it } from 'vitest';
import { resolveApiProxyTarget } from '@/lib/api/devProxy';

describe('resolveApiProxyTarget', () => {
  it('prefers explicit API target url', () => {
    expect(
      resolveApiProxyTarget('http://localhost:3100', 'http://localhost:3000')
    ).toBe('http://localhost:3100');
  });

  it('falls back to absolute VITE_API_BASE_URL', () => {
    expect(resolveApiProxyTarget(undefined, 'http://localhost:3000')).toBe(
      'http://localhost:3000'
    );
  });

  it('uses localhost:3000 when only relative /api base is configured', () => {
    expect(resolveApiProxyTarget(undefined, '/api')).toBe('http://localhost:3000');
  });
});
