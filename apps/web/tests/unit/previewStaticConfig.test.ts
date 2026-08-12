import { describe, expect, it } from 'vitest';
import { buildPreviewProxyUrl, resolvePreviewApiTarget } from '../../scripts/preview-static-config.mjs';

describe('resolvePreviewApiTarget', () => {
  it('defaults localhost previews to the local backend', () => {
    expect(resolvePreviewApiTarget('127.0.0.1', '')).toBe('http://localhost:3000');
    expect(resolvePreviewApiTarget('localhost', undefined)).toBe('http://localhost:3000');
  });

  it('keeps explicit proxy targets', () => {
    expect(resolvePreviewApiTarget('127.0.0.1', 'https://api.example.com')).toBe('https://api.example.com');
  });

  it('does not force a proxy target for non-local hosts', () => {
    expect(resolvePreviewApiTarget('0.0.0.0', '')).toBe('');
    expect(resolvePreviewApiTarget('habit-runner.freeddns.org', '')).toBe('');
  });

  it('rewrites /api requests to backend-root paths', () => {
    expect(
      buildPreviewProxyUrl(
        '/api/auth/google/start?returnTo=http%3A%2F%2Flocalhost%3A5137',
        'http://localhost:3000'
      )
    ).toBe('http://localhost:3000/auth/google/start?returnTo=http%3A%2F%2Flocalhost%3A5137');

    expect(buildPreviewProxyUrl('/api', 'http://localhost:3000')).toBe('http://localhost:3000/');
  });
});
