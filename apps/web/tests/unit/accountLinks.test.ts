import { describe, expect, it } from 'vitest';
import { telegramMiniAppUrl } from '$lib/api/accountLinks';

describe('account links', () => {
  it('builds a pairing URL without persisting the token', () => {
    expect(telegramMiniAppUrl('secret-token')).toContain('startapp=secret-token');
  });
});
