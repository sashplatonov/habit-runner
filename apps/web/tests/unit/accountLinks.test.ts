import { describe, expect, it } from 'vitest';
import { telegramMiniAppUrl } from '$lib/api/accountLinks';

describe('account links', () => {
  it('builds a pairing URL without persisting the token', () => {
    expect(telegramMiniAppUrl('secret-token')).toContain('startapp=secret-token');
  });

  it('uses the website root when no Mini App URL is configured', () => {
    expect(telegramMiniAppUrl('pairing-token')).toBe('/?startapp=pairing-token');
  });
});
